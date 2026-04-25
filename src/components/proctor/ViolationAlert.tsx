// src/components/proctor/ViolationAlert.tsx

"use client";

import { useEffect, useState } from "react";
import { ViolationEvent } from "@/types";
import { VIOLATION_LABELS } from "@/lib/violations";

interface ViolationAlertProps {
    type: ViolationEvent | null;
    count: number;
    onDismiss: () => void;
}

export function ViolationAlert({
    type,
    count,
    onDismiss,
}: ViolationAlertProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (type) {
            setVisible(true);
            const t = setTimeout(() => {
                setVisible(false);
                onDismiss();
            }, 4000);
            return () => clearTimeout(t);
        }
    }, [type]);

    if (!visible || !type) return null;

    const isSevere = count >= 3;

    return (
        <div
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-9998
                  flex items-start gap-3 px-5 py-4 rounded-xl shadow-2xl
                  border max-w-sm w-full animate-bounce-once
                  ${isSevere
                    ? "bg-red-950 border-red-600"
                    : "bg-yellow-950 border-yellow-600"
                }`}
        >
            {/* Icon */}
            <div className={`text-xl mt-0.5 ${isSevere ? "text-red-400" : "text-yellow-400"}`}>
                {isSevere ? "🚨" : "⚠️"}
            </div>

            {/* Content */}
            <div className="flex-1">
                <p className={`text-sm font-semibold ${isSevere ? "text-red-300" : "text-yellow-300"}`}>
                    {isSevere ? "Severe Violation Detected" : "Violation Detected"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                    {VIOLATION_LABELS[type]}
                </p>
                <p className={`text-xs mt-1 font-medium ${isSevere ? "text-red-400" : "text-yellow-400"}`}>
                    Violation count: {count}
                </p>
            </div>

            {/* Dismiss */}
            <button
                onClick={() => { setVisible(false); onDismiss(); }}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none"
            >
                ×
            </button>
        </div>
    );
}