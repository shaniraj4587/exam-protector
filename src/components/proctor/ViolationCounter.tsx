// src/components/proctor/ViolationCounter.tsx

"use client";

interface ViolationCounterProps {
    count: number;
    max: number;
}

export function ViolationCounter({ count, max }: ViolationCounterProps) {
    const percentage = Math.min((count / max) * 100, 100);

    const getColor = () => {
        if (count === 0) return "bg-green-500";
        if (count === 1) return "bg-yellow-500";
        if (count <= 3) return "bg-orange-500";
        return "bg-red-500";
    };

    const getTextColor = () => {
        if (count === 0) return "text-green-400";
        if (count === 1) return "text-yellow-400";
        if (count <= 3) return "text-orange-400";
        return "text-red-400";
    };

    return (
        <div className="flex flex-col gap-1 min-w-30">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Violations</span>
                <span className={`text-xs font-bold ${getTextColor()}`}>
                    {count}/{max}
                </span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Dots */}
            <div className="flex gap-1">
                {Array.from({ length: max }).map((_, i) => (
                    <div
                        key={i}
                        className={`flex-1 h-1 rounded-full transition-colors duration-300 ${i < count ? getColor() : "bg-gray-700"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}