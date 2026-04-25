// src/app/(student)/exam/[attemptId]/page.tsx

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useExamStore } from "@/store/examStore";
import { useExamTimer } from "@/hooks/useExamTimer";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useProctor } from "@/hooks/useProctor";
import { useBrowserMonitor } from "@/hooks/monitors/useBrowserMonitor";
import { useViolation } from "@/hooks/useViolation";
import { useWebcam } from "@/hooks/useWebcam";
import { PreFlight } from "@/components/exam/PreFlight";
import { QuestionCard } from "@/components/exam/QuestionCard";
import { ExamNavBar } from "@/components/exam/ExamNavBar";
import { TerminatedScreen } from "@/components/exam/TerminatedScreen";
import { ViolationCounter } from "@/components/proctor/ViolationCounter";
import { ViolationAlert } from "@/components/proctor/ViolationAlert";
import { NetworkBanner } from "@/components/proctor/NetworkBanner";
import { FullscreenPrompt } from "@/components/proctor/FullscreenPrompt";
import { AIStatusBadge } from "@/components/proctor/AIStatusBadge";
import { ViolationEvent } from "@/types";
import toast from "react-hot-toast";

const MAX_VIOLATIONS = 5;

type Phase = "preflight" | "fullscreen" | "exam" | "submitted" | "terminated";

export default function ExamPage() {
    const params = useParams();
    const router = useRouter();
    const attemptId = params.attemptId as string;

    const [phase, setPhase] = useState<Phase>("preflight");
    const [examMeta, setExamMeta] = useState<{
        title: string; durationMins: number; questionCount: number;
    } | null>(null);
    const [lastViolation, setLastViolation] = useState<ViolationEvent | null>(null);
    const [isOnline, setIsOnline] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const {
        questions, answers, currentIndex, status, violationCount,
        setAnswer, setCurrentIndex, setStatus, initExam,
    } = useExamStore();

    // ── Webcam ───────────────────────────────────────────
    const { videoRef, isReady: camReady, requestCamera } = useWebcam();

    // ── Auto-save ────────────────────────────────────────
    const { saveNow } = useAutoSave();

    // ── Submit handler ───────────────────────────────────
    const submitExam = useCallback(async (reason = "MANUAL") => {
        const store = useExamStore.getState();
        try {
            await fetch("/api/exam/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attemptId,
                    answers: store.answers,
                    reason,
                }),
            });
        } catch {
            console.error("Submit failed");
        }
    }, [attemptId]);

    // ── Terminate handler ─────────────────────────────────
    const terminateExam = useCallback(async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        setPhase("terminated");
    }, []);

    // ── Violation reporter ────────────────────────────────
    const { reportViolation } = useViolation({
        onAutoSubmit: async () => {
            await submitExam("AUTO_SUBMIT");
            setPhase("submitted");
        },
        onTerminate: terminateExam,
    });

    const handleViolation = useCallback(
        (type: ViolationEvent, metadata: Record<string, unknown>) => {
            setLastViolation(type);
            reportViolation(type, metadata);
        },
        [reportViolation]
    );

    // ── AI Proctor ────────────────────────────────────────
    const proctorEnabled = phase === "exam" && camReady;
    const {
        isLoading: aiLoading,
        isReady: aiReady,
        isRunning: aiRunning,
        error: aiError,
    } = useProctor({
        videoRef: videoRef as React.RefObject<HTMLVideoElement>,
        enabled: proctorEnabled,
        onViolation: handleViolation,
    });

    // ── Browser Monitor ───────────────────────────────────
    const { enterFullscreen } = useBrowserMonitor({
        enabled: phase === "exam",
        onViolation: handleViolation,
        onNetworkChange: setIsOnline,
        onFullscreenChange: (fs) => {
            setIsFullscreen(fs);
            if (!fs && phase === "exam") setPhase("fullscreen");
        },
    });

    // ── Timer ─────────────────────────────────────────────
    const { formatted, isWarning, isDanger } = useExamTimer({
        onTimeout: async () => {
            toast("⏱ Time's up! Submitting your exam...", { duration: 3000 });
            await submitExam("TIMEOUT");
            setPhase("submitted");
        },
    });

    // ── Load exam data ────────────────────────────────────
    useEffect(() => {
        const loadExam = async () => {
            try {
                const res = await fetch("/api/exam/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ examId: attemptId }),
                });

                // If already have attempt, fetch directly
                const attemptRes = await fetch(`/api/exam/attempt/${attemptId}`);
                if (!attemptRes.ok) {
                    // Fallback: get from store or redirect
                    router.push("/dashboard");
                    return;
                }

                const data = await attemptRes.json();
                setExamMeta({
                    title: data.exam.title,
                    durationMins: data.exam.durationMins,
                    questionCount: data.questions.length,
                });
                initExam(data.attempt, data.questions, data.exam.title);
            } catch {
                router.push("/dashboard");
            }
        };

        loadExam();
    }, [attemptId]);

    // ── Phase handlers ────────────────────────────────────
    const handlePreflightReady = async () => {
        await requestCamera();
        setPhase("fullscreen");
    };

    const handleEnterFullscreen = async () => {
        await enterFullscreen();
        setIsFullscreen(true);
        setPhase("exam");
    };

    // ── Submit manually ───────────────────────────────────
    const handleManualSubmit = async () => {
        const unanswered = questions.filter((q) => !answers[q.id]).length;
        if (unanswered > 0) {
            const confirmed = window.confirm(
                `You have ${unanswered} unanswered question(s). Submit anyway?`
            );
            if (!confirmed) return;
        }
        await saveNow();
        await submitExam("MANUAL");
        setPhase("submitted");
    };

    // ── Render based on phase ─────────────────────────────
    if (phase === "terminated") return <TerminatedScreen reason="violations" />;
    if (phase === "submitted") {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center
                      justify-center p-4">
                <div className="bg-gray-900 border border-green-700 rounded-2xl
                        p-10 max-w-md w-full text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Exam Submitted
                    </h1>
                    <p className="text-gray-400 text-sm mb-8">
                        Your answers have been recorded successfully.
                    </p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="w-full bg-green-600 hover:bg-green-500 text-white
                       font-medium py-3 rounded-xl transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (phase === "preflight" && examMeta) {
        return (
            <PreFlight
                examTitle={examMeta.title}
                durationMins={examMeta.durationMins}
                questionCount={examMeta.questionCount}
                onReady={handlePreflightReady}
            />
        );
    }

    if (phase === "fullscreen") {
        return <FullscreenPrompt onEnter={handleEnterFullscreen} />;
    }

    if (!examMeta || questions.length === 0) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center
                      justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-blue-400
                          border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400 text-sm">Loading exam…</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const answeredCount = Object.keys(answers).length;

    return (
        <>
            <NetworkBanner isOnline={isOnline} />
            <ViolationAlert
                type={lastViolation}
                count={violationCount}
                onDismiss={() => setLastViolation(null)}
            />

            <div className="min-h-screen bg-gray-950 flex flex-col">

                {/* ── Top Bar ─────────────────────────────── */}
                <header className="bg-gray-900 border-b border-gray-800 px-5
                           py-3 flex items-center justify-between
                           shrink-0">
                    {/* Left: title */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm font-semibold text-white truncate">
                            {examMeta.title}
                        </h1>
                        <p className="text-xs text-gray-500">
                            {answeredCount}/{questions.length} answered
                        </p>
                    </div>

                    {/* Center: timer */}
                    <div className={`text-2xl font-mono font-bold tabular-nums
                           ${isDanger
                            ? "text-red-400 animate-pulse"
                            : isWarning
                                ? "text-yellow-400"
                                : "text-white"
                        }`}>
                        {formatted}
                    </div>

                    {/* Right: proctor controls */}
                    <div className="flex-1 flex items-center justify-end gap-3">
                        <AIStatusBadge
                            isLoading={aiLoading}
                            isReady={aiReady}
                            isRunning={aiRunning}
                            error={aiError}
                        />
                        <ViolationCounter
                            count={violationCount}
                            max={MAX_VIOLATIONS}
                        />
                    </div>
                </header>

                {/* ── Body ────────────────────────────────── */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Main exam area */}
                    <main className="flex-1 overflow-y-auto p-5 md:p-8">
                        <QuestionCard
                            question={currentQuestion}
                            selectedAnswer={answers[currentQuestion.id]}
                            onAnswer={(ans) => setAnswer(currentQuestion.id, ans)}
                            index={currentIndex}
                            total={questions.length}
                        />

                        {/* Prev / Next */}
                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                disabled={currentIndex === 0}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-800
                           hover:bg-gray-700 disabled:opacity-40
                           disabled:cursor-not-allowed text-white text-sm
                           font-medium rounded-lg transition-colors"
                            >
                                ← Previous
                            </button>

                            {currentIndex < questions.length - 1 ? (
                                <button
                                    onClick={() =>
                                        setCurrentIndex(
                                            Math.min(questions.length - 1, currentIndex + 1)
                                        )
                                    }
                                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600
                             hover:bg-blue-500 text-white text-sm font-medium
                             rounded-lg transition-colors"
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    onClick={handleManualSubmit}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600
                             hover:bg-green-500 text-white text-sm font-medium
                             rounded-lg transition-colors"
                                >
                                    Submit Exam ✓
                                </button>
                            )}
                        </div>
                    </main>

                    {/* Right sidebar */}
                    <aside className="w-64 shrink-0 border-l border-gray-800
                            p-4 flex flex-col gap-4 overflow-y-auto lg:flex">
                        {/* Webcam */}
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider
                            font-medium mb-2">
                                Webcam Feed
                            </p>
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full aspect-video rounded-lg object-cover
                           border border-gray-700 bg-gray-800"
                            />
                        </div>

                        {/* Navigator */}
                        <ExamNavBar
                            currentIndex={currentIndex}
                            total={questions.length}
                            answers={answers}
                            questionIds={questions.map((q) => q.id)}
                            onNavigate={setCurrentIndex}
                        />

                        {/* Submit button in sidebar */}
                        <button
                            onClick={handleManualSubmit}
                            className="w-full bg-green-700 hover:bg-green-600 text-white
                         text-sm font-medium py-2.5 rounded-lg
                         transition-colors mt-auto"
                        >
                            Submit Exam
                        </button>
                    </aside>
                </div>
            </div>
        </>
    );
}