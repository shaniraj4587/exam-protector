// src/components/exam/TerminatedScreen.tsx

"use client";

import { useRouter } from "next/navigation";

interface TerminatedScreenProps {
    reason: "violations" | "timeout" | "admin";
}

const MESSAGES = {
    violations: {
        title: "Exam Terminated",
        subtitle: "Your exam was terminated due to repeated policy violations.",
        icon: "🔴",
        color: "border-red-700",
    },
    timeout: {
        title: "Time Expired",
        subtitle: "Your exam was automatically submitted when time ran out.",
        icon: "⏱️",
        color: "border-yellow-700",
    },
    admin: {
        title: "Exam Ended",
        subtitle: "Your exam attempt was ended by an administrator.",
        icon: "🛑",
        color: "border-orange-700",
    },
};

export function TerminatedScreen({ reason }: TerminatedScreenProps) {
    const router = useRouter();
    const info = MESSAGES[reason];

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className={`bg-gray-900 border-2 ${info.color} rounded-2xl
                       p-10 max-w-md w-full text-center shadow-2xl`}>
                <div className="text-6xl mb-5">{info.icon}</div>

                <h1 className="text-2xl font-bold text-white mb-2">{info.title}</h1>
                <p className="text-gray-400 text-sm mb-8">{info.subtitle}</p>

                <div className="space-y-3">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white
                       font-medium py-2.5 rounded-lg transition-colors text-sm"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}