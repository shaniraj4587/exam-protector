// src/components/exam/ExamNavBar.tsx

"use client";

interface ExamNavBarProps {
    currentIndex: number;
    total: number;
    answers: Record<string, string>;
    questionIds: string[];
    onNavigate: (index: number) => void;
}

export function ExamNavBar({
    currentIndex,
    total,
    answers,
    questionIds,
    onNavigate,
}: ExamNavBarProps) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">
                Question Navigator
            </p>
            <div className="flex flex-wrap gap-2">
                {Array.from({ length: total }).map((_, i) => {
                    const qId = questionIds[i];
                    const isAnswered = !!answers[qId];
                    const isCurrent = i === currentIndex;

                    return (
                        <button
                            key={i}
                            onClick={() => onNavigate(i)}
                            className={`w-9 h-9 rounded-lg text-sm font-semibold
                          transition-all duration-150
                          ${isCurrent
                                    ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900"
                                    : isAnswered
                                        ? "bg-green-700/50 text-green-300 border border-green-700"
                                        : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-500"
                                }`}
                        >
                            {i + 1}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-600" /> Current
                </span>
                <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-green-700/50 border border-green-700" />
                    Answered
                </span>
                <span className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-gray-800 border border-gray-700" />
                    Unanswered
                </span>
            </div>
        </div>
    );
}