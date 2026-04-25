// src/components/proctor/FullscreenPrompt.tsx

"use client";

interface FullscreenPromptProps {
    onEnter: () => void;
}

export function FullscreenPrompt({ onEnter }: FullscreenPromptProps) {
    return (
        <div className="fixed inset-0 z-9999 bg-gray-950 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-yellow-600 rounded-2xl p-8
                      max-w-md w-full text-center shadow-2xl">

                <div className="inline-flex items-center justify-center w-16 h-16
                        bg-yellow-500/10 border border-yellow-600 rounded-full mb-5">
                    <svg className="w-8 h-8 text-yellow-400" fill="none"
                        viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5
                 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-white mb-2">
                    Fullscreen Required
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                    This exam must be taken in fullscreen mode. Exiting fullscreen
                    will be recorded as a violation.
                </p>

                <button
                    onClick={onEnter}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900
                     font-semibold py-3 rounded-lg transition-colors"
                >
                    Enter Fullscreen & Begin
                </button>
            </div>
        </div>
    );
}