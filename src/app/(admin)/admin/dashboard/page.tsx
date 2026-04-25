// src/app/(admin)/admin/dashboard/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Stats {
    totalExams: number;
    activeExams: number;
    liveAttempts: number;
    totalAttempts: number;
    terminatedToday: number;
    violationsToday: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const [examsRes, candidatesRes] = await Promise.all([
                fetch("/api/admin/exams"),
                fetch("/api/admin/candidates"),
            ]);
            const examsData = await examsRes.json();
            const candidatesData = await candidatesRes.json();

            const exams = examsData.exams || [];
            const attempts = candidatesData.attempts || [];

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            setStats({
                totalExams: exams.length,
                activeExams: exams.filter((e: { isActive: boolean }) => e.isActive).length,
                liveAttempts: attempts.filter((a: { status: string }) => a.status === "IN_PROGRESS").length,
                totalAttempts: attempts.length,
                terminatedToday: attempts.filter((a: { status: string; terminatedAt: string | null }) =>
                    a.status === "TERMINATED" &&
                    a.terminatedAt &&
                    new Date(a.terminatedAt) >= today
                ).length,
                violationsToday: 0, // extended in logs step
            });
        } catch {
            console.error("Failed to fetch stats");
        }
    };

    const StatCard = ({
        label, value, icon, color,
    }: {
        label: string; value: number; icon: string; color: string;
    }) => (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase
                        tracking-wider mb-1">
                        {label}
                    </p>
                    <p className={`text-3xl font-bold ${color}`}>
                        {value ?? "—"}
                    </p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-1">
                    System overview — refreshes every 15 seconds
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                <StatCard label="Total Exams" value={stats?.totalExams ?? 0} icon="📝" color="text-white" />
                <StatCard label="Active Exams" value={stats?.activeExams ?? 0} icon="✅" color="text-green-400" />
                <StatCard label="Live Candidates" value={stats?.liveAttempts ?? 0} icon="👤" color="text-blue-400" />
                <StatCard label="Total Attempts" value={stats?.totalAttempts ?? 0} icon="📊" color="text-white" />
                <StatCard label="Terminated Today" value={stats?.terminatedToday ?? 0} icon="🔴" color="text-red-400" />
                <StatCard label="Violations Today" value={stats?.violationsToday ?? 0} icon="⚠️" color="text-yellow-400" />
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Manage Exams", href: "/admin/exams", desc: "Create, edit and activate exams", icon: "📝" },
                    { label: "Live Monitor", href: "/admin/monitor", desc: "Watch active candidates in real-time", icon: "👁️" },
                    { label: "Violation Logs", href: "/admin/logs", desc: "Review all recorded violations", icon: "📋" },
                ].map((card) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="bg-gray-900 border border-gray-800 rounded-xl p-5
                   hover:border-gray-600 transition-colors group"
                    >
                        <div className="text-2xl mb-3">{card.icon}</div>
                        <h3 className="text-white font-semibold text-sm mb-1
                       group-hover:text-blue-400 transition-colors">
                            {card.label}
                        </h3>
                        <p className="text-gray-500 text-xs">{card.desc}</p>
                    </Link>
        ))}
        </div>
    </div >
  );
}