// src/components/exam/PreFlight.tsx

"use client";

import { useState, useCallback, useRef } from "react";
import { useWebcamContext } from "@/context/WebcamContext";

interface PreFlightProps {
    examTitle: string;
    durationMins: number;
    questionCount: number;
    onReady: () => void;
}

type CheckStatus = "pending" | "pass" | "fail";

export function PreFlight({
    examTitle,
    durationMins,
    questionCount,
    onReady,
}: PreFlightProps) {
    const { videoRef, isReady: camReady, error: camError, requestCamera, attachStream } =
        useWebcamContext();

    const [checks, setChecks] = useState<Record<string, CheckStatus>>({
        camera: "pending",
        browser: "pending",
        fullscreen: "pending",
    });
    const [running, setRunning] = useState(false);

    const updateCheck = (key: string, status: CheckStatus) =>
        setChecks((prev) => ({ ...prev, [key]: status }));

    // Callback ref so stream attaches as soon as <video> mounts
    const videoCallbackRef = useCallback(
        (el: HTMLVideoElement | null) => {
            if (!el) return;
            (videoRef as React.MutableRefObject<HTMLVideoElement>).current = el;
            attachStream(el);
        },
        [videoRef, attachStream]
    );

    const runChecks = async () => {
        setRunning(true);

        // ── 1. Browser check ────────────────────────────────
        const isChrome =
            /Chrome/.test(navigator.userAgent) ||
            /Edg/.test(navigator.userAgent);
        updateCheck("browser", isChrome ? "pass" : "fail");

        // ── 2. Fullscreen check ──────────────────────────────
        updateCheck("fullscreen", document.fullscreenEnabled ? "pass" : "fail");

        // ── 3. Camera check ──────────────────────────────────
        try {
            // Directly request getUserMedia here so we know exactly
            // when the permission is granted
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user",
                },
                audio: false,
            });

            // Call context requestCamera so the stream is stored in context
            await requestCamera();

            // Attach to preview video directly
            const video = videoRef.current;
            if (video) {
                video.srcObject = stream;
                await video.play().catch(() => { });
            }

            updateCheck("camera", "pass");
        } catch (err) {
            console.error("[PREFLIGHT CAMERA]", err);
            updateCheck("camera", "fail");
        } finally {
            setRunning(false);
        }
    };

    const allPassed = Object.values(checks).every((s) => s === "pass");
    const anyFailed = Object.values(checks).some((s) => s === "fail");
    const notStarted = Object.values(checks).every((s) => s === "pending");

    const CheckRow = ({
        label,
        status,
        failMsg,
    }: {
        label: string;
        status: CheckStatus;
        failMsg: string;
    }) => (
        <div className="flex items-center justify-between py-3
                    border-b border-gray-800 last:border-0">
            <div>
                <p className="text-sm text-white font-medium">{label}</p>
                {status === "fail" && (
                    <p className="text-xs text-red-400 mt-0.5">{failMsg}</p>
                )}
            </div>
            <div>
                {status === "pending" && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                )}
                {status === "pass" && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center
                          justify-center">
                        <svg className="w-3 h-3 text-white" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
                {status === "fail" && (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center
                          justify-center text-white text-xs font-bold">
                        ✕
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 flex items-center
                    justify-center p-4">
            <div className="w-full max-w-lg">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">{examTitle}</h1>
                    <div className="flex items-center justify-center gap-6
                          text-sm text-gray-400 mt-2">
                        <span>⏱ {durationMins} minutes</span>
                        <span>📝 {questionCount} questions</span>
                    </div>
                </div>

                {/* Rules */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl
                        p-5 mb-5">
                    <h2 className="text-sm font-semibold text-gray-300 mb-3">
                        Exam Rules
                    </h2>
                    <ul className="space-y-2 text-xs text-gray-400">
                        {[
                            "Keep your face visible in the webcam at all times",
                            "Do not switch tabs or minimize the window",
                            "The exam must remain in fullscreen mode",
                            "No phones or additional persons allowed in frame",
                            "Copy/paste and right-click are disabled",
                            "Your screen activity is monitored by AI",
                        ].map((rule, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                {rule}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* System Checks */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl
                        p-5 mb-5">
                    <h2 className="text-sm font-semibold text-gray-300 mb-2">
                        System Checks
                    </h2>

                    <CheckRow
                        label="Camera Access"
                        status={checks.camera}
                        failMsg="Click 'Re-run Checks' and allow camera when browser asks"
                    />
                    <CheckRow
                        label="Browser Compat"
                        status={checks.browser}
                        failMsg="Use Chrome or Edge for best experience"
                    />
                    <CheckRow
                        label="Fullscreen Support"
                        status={checks.fullscreen}
                        failMsg="Your browser does not support fullscreen"
                    />

                    {/* Camera preview — only shown after pass */}
                    {checks.camera === "pass" && (
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <video
                                ref={videoCallbackRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-48 h-36 rounded-lg object-cover
                           border border-green-700 bg-gray-800"
                            />
                            <p className="text-xs text-green-400">
                                ✓ Camera feed confirmed
                            </p>
                        </div>
                    )}
                </div>

                {/* Buttons */}
                {notStarted && (
                    <button
                        onClick={runChecks}
                        disabled={running}
                        className="w-full bg-blue-600 hover:bg-blue-500
                       disabled:bg-blue-800 disabled:cursor-not-allowed
                       text-white font-semibold py-3 rounded-xl
                       transition-colors"
                    >
                        {running ? "Checking…" : "Run System Checks"}
                    </button>
                )}

                {!notStarted && !allPassed && (
                    <button
                        onClick={runChecks}
                        disabled={running}
                        className="w-full bg-gray-700 hover:bg-gray-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-medium py-3 rounded-xl
                       transition-colors"
                    >
                        {running ? "Checking…" : "Re-run Checks"}
                    </button>
                )}

                {allPassed && (
                    <button
                        onClick={onReady}
                        className="w-full bg-green-600 hover:bg-green-500 text-white
                       font-semibold py-3 rounded-xl transition-colors"
                    >
                        All Checks Passed — Start Exam →
                    </button>
                )}

                {anyFailed && !running && (
                    <p className="text-center text-xs text-red-400 mt-3">
                        Fix the issues above and click Re-run Checks.
                    </p>
                )}

                {/* Camera permission tip */}
                {checks.camera === "fail" && (
                    <div className="mt-4 bg-yellow-900/20 border border-yellow-700
                          rounded-xl p-4 text-xs text-yellow-300">
                        <p className="font-semibold mb-1">📷 How to allow camera:</p>
                        <ol className="list-decimal list-inside space-y-1 text-yellow-400">
                            <li>Click the 🔒 lock icon in your browser address bar</li>
                            <li>Find "Camera" and set it to "Allow"</li>
                            <li>Refresh the page and try again</li>
                        </ol>
                    </div>
                )}
            </div>
        </div>
    );
}