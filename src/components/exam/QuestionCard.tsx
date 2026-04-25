// src/components/exam/QuestionCard.tsx

"use client";

import { ExamQuestion } from "@/types";

interface QuestionCardProps {
    question: ExamQuestion;
    selectedAnswer: string | undefined;
    onAnswer: (answer: string) => void;
    index: number;
    total: number;
}

export function QuestionCard({
    question,
    selectedAnswer,
    onAnswer,
    index,
    total,
}: QuestionCardProps) {
    const options = question.options as string[];

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8">

            {/* Question number */}
            <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question {index + 1} of {total}
                </span>
                {selectedAnswer && (
                    <span className="text-xs text-green-400 font-medium">
                        ✓ Answered
                    </span>
                )}
            </div>

            {/* Question text */}
            <h2 className="text-white text-lg font-medium leading-relaxed mb-7">
                {question.text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
                {options.map((option, i) => {
                    const isSelected = selectedAnswer === option;
                    const letter = String.fromCharCode(65 + i); // A, B, C, D

                    return (
                        <button
                            key={i}
                            onClick={() => onAnswer(option)}
                            className={`w-full flex items-center gap-4 px-5 py-4
                          rounded-xl border text-left transition-all
                          duration-150 group
                          ${isSelected
                                    ? "bg-blue-600/20 border-blue-500 text-white"
                                    : "bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-800"
                                }`}
                        >
                            {/* Letter badge */}
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center
                               justify-center text-sm font-semibold transition-colors
                               ${isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 text-gray-400 group-hover:bg-gray-600"
                                }`}>
                                {letter}
                            </div>

                            <span className="text-sm font-medium">{option}</span>

                            {/* Check mark */}
                            {isSelected && (
                                <div className="ml-auto">
                                    <svg className="w-5 h-5 text-blue-400" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}