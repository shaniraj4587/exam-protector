// src/app/(admin)/admin/logs/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VIOLATION_LABELS } from "@/lib/violations";
import { ViolationEvent } from "@/types";

interface LogRow {
    id: string;
    type: ViolationEvent;
    createdAt: string;
    metadata: Record<string, unknown>;
    attempt: {
        id: string;
        user: { name: string; email: string };
        exam: { title: string };
    };
}

export default function LogsPage() {
    const searchParams = useSearchParams();
    const [logs, setLogs] = useState<LogRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const attemptId = searchParams.get("attemptId") || "";
    const examId = searchParams.get("examId") || "";

    useEffect(() => {
        fetchLogs();
    }, [page, attemptId]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "50",
                ...(attemptId ? { attemptId } : {}),
            });
            const res = await fetch(`/api/admin/logs?${params}`);
            const data = await res.json();
            setLogs(data.logs || []);
            setTotal(data.total || 0);
        } finally {
            setLoading(false);
        }
    };

    const getTypeStyle = (type: ViolationEvent) => {
        const styles: Partial<Record<ViolationEvent, string>> = {
            MULTIPLE_PERSONS: "bg-red-900/40 text-red-400 border-red-700",
            PHONE_DETECTED: "bg-red-900/40 text-red-400 border-red-700",
            DEVTOOLS_OPEN: "bg-orange-900/40 text-orange-400 border-orange-700",
            TAB_SWITCH: "bg-yellow-900/40 text-yellow-400 border-yellow-700",
            FULLSCREEN_EXIT: "bg-yellow-900/40 text-yellow-400 border-yellow-700",
            FACE_ABSENT: "bg-purple-900/40 text-purple-400 border-purple-700",
            CLIPBOARD_ATTEMPT: "bg-blue-900/40 text-blue-400 border-blue-700",
            NETWORK_LOSS: "bg-gray-800 text-gray-400 border-gray-600",
        };
        return styles[type] || "bg-gray-800 text-gray-400 border-gray-600";
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleString("en-IN", {
            dateStyle: "medium", timeStyle: "medium",
        });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white">Violation Logs</h1>
                <p className="text-gray-400 text-sm mt-1">
                    {total} total logs
                    {attemptId && " (filtered by attempt)"}
                </p>
            </div>

            {/* Logs table */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-gray-900 border border-gray-800
                                    rounded-lg h-14 animate-pulse" />
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    No violation logs found.
                </div>
            ) : (
                <>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl
                          overflow-hidden mb-6">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-800">
                                <tr>
                                    {["Time", "Type", "Candidate", "Exam", "Metadata"].map(
                                        (h) => (
                                            <th key={h}
                                                className="px-5 py-3.5 text-left text-xs font-semibold
                                     text-gray-400 uppercase tracking-wider">
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {logs.map((log) => (
                                    <tr key={log.id}
                                        className="hover:bg-gray-800/40 transition-colors">
                                        {/* Time */}
                                        <td className="px-5 py-3.5 text-gray-400 text-xs
                                   font-mono whitespace-nowrap">
                                            {formatTime(log.createdAt)}
                                        </td>

                                        {/* Type */}
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs
                                        font-medium border
                                        ${getTypeStyle(log.type)}`}>
                                                {VIOLATION_LABELS[log.type] || log.type}
                                            </span>
                                        </td>

                                        {/* Candidate */}
                                        <td className="px-5 py-3.5">
                                            <p className="text-white text-sm font-medium">
                                                {log.attempt.user.name}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {log.attempt.user.email}
                                            </p>
                                        </td>

                                        {/* Exam */}
                                        <td className="px-5 py-3.5 text-gray-300 text-sm
                                   max-w-40 truncate">
                                            {log.attempt.exam.title}
                                        </td>

                                        {/* Metadata */}
                                        <td className="px-5 py-3.5">
                                            <details className="cursor-pointer">
                                                <summary className="text-xs text-blue-400
                                            hover:text-blue-300 list-none">
                                                    View details
                                                </summary>
                                                <pre className="mt-2 bg-gray-800 rounded p-2 text-xs
                                        text-gray-400 max-w-xs overflow-x-auto">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </details>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {total > 50 && (
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                                Showing {(page - 1) * 50 + 1}–
                                {Math.min(page * 50, total)} of {total}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700
                             disabled:opacity-40 disabled:cursor-not-allowed
                             text-white text-xs rounded-lg transition-colors"
                                >
                                    ← Prev
                                </button>
                                <button
                                    disabled={page * 50 >= total}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700
                             disabled:opacity-40 disabled:cursor-not-allowed
                             text-white text-xs rounded-lg transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}