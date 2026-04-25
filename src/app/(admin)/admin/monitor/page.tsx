// src/app/(admin)/admin/monitor/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface LiveAttempt {
    id: string;
    status: string;
    violationCount: number;
    startedAt: string;
    user: { id: string; name: string; email: string };
    exam: { id: string; title: string; maxViolations: number };
    _count: { logs: number };
}

export default function MonitorPage() {
    const [attempts, setAttempts] = useState<LiveAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "IN_PROGRESS" | "TERMINATED">("IN_PROGRESS");

    useEffect(() => {
        fetchCandidates();
        const interval = setInterval(fetchCandidates, 10000); // refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchCandidates = async () => {
        try {
            const res = await fetch("/api/admin/candidates");
            const data = await res.json();
            setAttempts(data.attempts || []);
        } finally {
            setLoading(false);
        }
    };

    const handleTerminate = async (attemptId: string, name: string) => {
        if (!confirm(`Terminate exam for ${name}?`)) return;
        try {
            const res = await fetch("/api/admin/terminate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ attemptId }),
            });
            if (res.ok) {
                toast.success(`Terminated ${name}'s exam`);
                fetchCandidates();
            } else {
                toast.error("Failed to terminate");
            }
        } catch {
            toast.error("Network error");
        }
    };

    const filtered = attempts.filter((a) =>
        filter === "ALL" ? true : a.status === filter
    );

    const getViolationColor = (count: number, max: number) => {
        const ratio = count / max;
        if (ratio >= 0.8) return "text-red-400";
        if (ratio >= 0.5) return "text-orange-400";
        if (ratio >= 0.2) return "text-yellow-400";
        return "text-green-400";
    };

    const getElapsed = (startedAt: string) => {
        const ms = Date.now() - new Date(startedAt).getTime();
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Live Monitor</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Auto-refreshes every 10 seconds
                    </p>
                </div>

                {/* Filter tabs */}
                <div className="flex bg-gray-900 border border-gray-800
                        rounded-lg p-1 gap-1">
                    {(["ALL", "IN_PROGRESS", "TERMINATED"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium
                          transition-colors
                          ${filter === f
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:text-white"
                                }`}
                        >
                            {f === "IN_PROGRESS" ? "Live" : f === "ALL" ? "All" : "Terminated"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Live count banner */}
            {filter === "IN_PROGRESS" && (
                <div className="bg-blue-900/20 border border-blue-800 rounded-xl
                        px-5 py-3 mb-6 flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-300 text-sm font-medium">
                        {filtered.length} candidate{filtered.length !== 1 ? "s" : ""} currently taking exams
                    </span>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-900 border border-gray-800
                                    rounded-xl h-16 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    No candidates found.
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl
                        overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-800">
                            <tr>
                                {["Candidate", "Exam", "Status", "Violations",
                                    "Elapsed", "Logs", "Action"].map((h) => (
                                        <th key={h}
                                            className="px-5 py-3.5 text-left text-xs font-semibold
                                 text-gray-400 uppercase tracking-wider">
                                            {h}
                                        </th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filtered.map((attempt) => (
                                <tr key={attempt.id}
                                    className="hover:bg-gray-800/40 transition-colors">
                                    {/* Candidate */}
                                    <td className="px-5 py-4">
                                        <p className="text-white font-medium">
                                            {attempt.user.name}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {attempt.user.email}
                                        </p>
                                    </td>

                                    {/* Exam */}
                                    <td className="px-5 py-4">
                                        <p className="text-gray-300 text-sm truncate max-w-45">
                                            {attempt.exam.title}
                                        </p>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs
                                      font-medium border
                                      ${attempt.status === "IN_PROGRESS"
                                                ? "bg-blue-900/40 text-blue-400 border-blue-700"
                                                : attempt.status === "SUBMITTED"
                                                    ? "bg-green-900/40 text-green-400 border-green-700"
                                                    : "bg-red-900/40 text-red-400 border-red-700"
                                            }`}>
                                            {attempt.status === "IN_PROGRESS"
                                                ? "🟢 Live"
                                                : attempt.status === "SUBMITTED"
                                                    ? "✅ Submitted"
                                                    : "🔴 Terminated"}
                                        </span>
                                    </td>

                                    {/* Violations */}
                                    <td className="px-5 py-4">
                                        <span className={`font-bold text-base
                                      ${getViolationColor(
                                            attempt.violationCount,
                                            attempt.exam.maxViolations
                                        )}`}>
                                            {attempt.violationCount}
                                        </span>
                                        <span className="text-gray-600 text-xs">
                                            /{attempt.exam.maxViolations}
                                        </span>
                                    </td>

                                    {/* Elapsed */}
                                    <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                                        {getElapsed(attempt.startedAt)}
                                    </td>

                                    {/* Log count */}
                                    <td className="px-5 py-4">
                                        <Link
                                            href={`/admin/logs?attemptId=${attempt.id}`}
                                            className="text-xs text-blue-400 hover:text-blue-300"
                                        >
                                            {attempt._count.logs} logs →
                                        </Link>
                                    </td>

                  {/* Terminate */ }
                                < td className = "px-5 py-4" >
                                {
                                    attempt.status === "IN_PROGRESS" && (
                                        <button
                                            onClick={() =>
                                                handleTerminate(attempt.id, attempt.user.name)
                                            }
                                            className="px-3 py-1.5 bg-red-900/40 hover:bg-red-800
                                   border border-red-700 text-red-400
                                   hover:text-red-300 text-xs font-medium
                                   rounded-lg transition-colors"
                                        >
                                            Terminate
                                        </button>
                                    )
                                }
                  </td>
                    </tr>
              ))}
                </tbody>
          </table>
        </div >
      )
}
    </div >
  );
}