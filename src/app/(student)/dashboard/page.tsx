// src/app/(student)/dashboard/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface ExamCard {
    id: string;
    title: string;
    description: string | null;
    durationMins: number;
    questionCount: number;
    attempt: {
        id: string;
        status: string;
        score: number | null;
        startedAt: string;
    } | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [exams, setExams] = useState<ExamCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch("/api/exam/list");
            const data = await res.json();
            if (res.ok) setExams(data.exams);
        } catch {
            toast.error("Failed to load exams");
        } finally {
            setLoading(false);
        }
    };

    const handleStartExam = async (examId: string) => {
        try {
            const res = await fetch("/api/exam/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ examId }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Could not start exam");
                return;
            }

            router.push(`/exam/${data.attempt.id}`);
        } catch {
            toast.error("Something went wrong");
        }
    };

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    const getStatusBadge = (attempt: ExamCard["attempt"]) => {
        if (!attempt) return null;
        const styles: Record<string, string> = {
            IN_PROGRESS: "bg-blue-900/40 text-blue-400 border-blue-700",
            SUBMITTED: "bg-green-900/40 text-green-400 border-green-700",
            TERMINATED: "bg-red-900/40 text-red-400 border-red-700",
        };
        const labels: Record<string, string> = {
            IN_PROGRESS: "In Progress",
            SUBMITTED: "Submitted",
            TERMINATED: "Terminated",
        };
        return (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium
                        ${styles[attempt.status] || ""}`}>
                {labels[attempt.status] || attempt.status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center
                            justify-center">
                            <svg className="w-4 h-4 text-white" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0
                     0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02
                     12.02 0 003 9c0 5.591 3.824 10.29 9 11.622
                     5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052
                     -.382-3.016z" />
                            </svg>
                        </div>
                        <span className="font-semibold text-white">Exam Portal</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                            {user?.name || "Student"}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        Welcome back, {user?.name?.split(" ")[0] || "Student"}
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Select an exam below to begin.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-900 border border-gray-800
                                      rounded-xl p-6 animate-pulse h-48" />
                        ))}
                    </div>
                ) : exams.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        No active exams available.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {exams.map((exam) => (
                            <div key={exam.id}
                                className="bg-gray-900 border border-gray-800 rounded-xl p-6
                           hover:border-gray-600 transition-colors">
                                {/* Top row */}
                                <div className="flex items-start justify-between mb-3">
                                    <h2 className="font-semibold text-white text-lg leading-snug
                                 flex-1 pr-4">
                                        {exam.title}
                                    </h2>
                                    {getStatusBadge(exam.attempt)}
                                </div>

                                {/* Description */}
                                {exam.description && (
                                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                                        {exam.description}
                                    </p>
                                )}

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-5">
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {exam.durationMins} mins
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none"
                                            viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2
                           0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002
                           2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0
                           012 2" />
                                        </svg>
                                        {exam.questionCount} questions
                                    </span>
                                    {exam.attempt?.score !== null &&
                                        exam.attempt?.score !== undefined && (
                                            <span className="flex items-center gap-1 text-green-400">
                                                Score: {exam.attempt.score}%
                                            </span>
                                        )}
                                </div>

                                {/* Action button */}
                                {!exam.attempt && (
                                    <button
                                        onClick={() => handleStartExam(exam.id)}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white
                               font-medium py-2.5 rounded-lg text-sm transition-colors"
                                    >
                                        Start Exam
                                    </button>
                                )}
                                {exam.attempt?.status === "IN_PROGRESS" && (
                                    <button
                                        onClick={() => router.push(`/exam/${exam.attempt!.id}`)}
                                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white
                               font-medium py-2.5 rounded-lg text-sm transition-colors"
                                    >
                                        Resume Exam
                                    </button>
                                )}
                                {exam.attempt?.status === "SUBMITTED" && (
                                    <div className="w-full bg-gray-800 text-gray-400 font-medium
                                  py-2.5 rounded-lg text-sm text-center">
                                        Submitted ✓
                                    </div>
                                )}
                                {exam.attempt?.status === "TERMINATED" && (
                                    <div className="w-full bg-red-950 text-red-400 font-medium
                                  py-2.5 rounded-lg text-sm text-center">
                                        Terminated
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}