// src/components/proctor/AIStatusBadge.tsx

"use client";

interface AIStatusBadgeProps {
    isLoading: boolean;
    isReady: boolean;
    isRunning: boolean;
    error: string | null;
}

export function AIStatusBadge({
    isLoading,
    isReady,
    isRunning,
    error,
}: AIStatusBadgeProps) {
    if (error) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-900/40 
                      border border-red-700 rounded-full text-xs text-red-400">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                AI Error
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-900/40
                      border border-yellow-700 rounded-full text-xs text-yellow-400">
                <div className="w-3 h-3 border border-yellow-400 border-t-transparent 
                        rounded-full animate-spin" />
                Loading AI…
            </div>
        );
    }

    if (isRunning) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900/40
                      border border-green-700 rounded-full text-xs text-green-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AI Monitoring
            </div>
        );
    }

    if (isReady) {
        return (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-900/40
                      border border-blue-700 rounded-full text-xs text-blue-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                AI Ready
            </div>
        );
    }

    return null;
}