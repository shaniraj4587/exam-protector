// src/components/exam/PreFlight.tsx

"use client";

import { useState } from "react";
import { useWebcam } from "@/hooks/useWebcam";

interface PreFlightProps {
    examTitle: string;
    durationMins: number;
    questionCount: number;
    onReady: () => void;
}

type CheckStatus = "pending" | "pass" | "fail";

export function PreFlight({
    examTitle,
    durationMins,
    questionCount,
    onReady,
}: PreFlightProps) {
    const { videoRef, isReady: camReady, error: camError, requestCamera } =
        useWebcam();

    const [checks, setChecks] = useState<Record<string, CheckStatus>>({
        camera: "pending",
        browser: "pending",
        fullscreen: "pending",
    });

    const updateCheck = (key: string, status: CheckStatus) => {
        setChecks((prev) => ({ ...prev, [key]: status }));
    };

    const runChecks = async () => {
        // Browser check
        const isChrome =
            /Chrome/.test(navigator.userAgent) ||
            /Edg/.test(navigator.userAgent);
        updateCheck("browser", isChrome ? "pass" : "fail");

        // Camera check
        await requestCamera();
        updateCheck("camera", camReady || !camError ? "pass" : "fail");

        // Fullscreen check
        updateCheck(
            "fullscreen",
            document.fullscreenEnabled ? "pass" : "fail"
        );
    };

    const allPassed = Object.values(checks).every((s) => s === "pass");
    const anyFailed = Object.values(checks).some((s) => s === "fail");
    const notStarted = Object.values(checks).every((s) => s === "pending");

    const CheckRow = ({
        label,
        status,
        failMsg,
    }: {
        label: string;
        status: CheckStatus;
        failMsg: string;
    }) => (
        <div className="flex items-center justify-between py-3
                    border-b border-gray-800 last:border-0">
            <div>
                <p className="text-sm text-white font-medium">{label}</p>
                {status === "fail" && (
                    <p className="text-xs text-red-400 mt-0.5">{failMsg}</p>
                )}
            </div>
            <div>
                {status === "pending" && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                )}
                {status === "pass" && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center
                          justify-center">
                        <svg className="w-3 h-3 text-white" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
                {status === "fail" && (
                    <div className="w-5 h-5 rounded-full bg-red-500 flex items-center
                          justify-center text-white text-xs font-bold">
                        ✕
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 flex items-center
                    justify-center p-4">
            <div className="w-full max-w-lg">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">{examTitle}</h1>
                    <div className="flex items-center justify-center gap-6
                          text-sm text-gray-400 mt-2">
                        <span>⏱ {durationMins} minutes</span>
                        <span>📝 {questionCount} questions</span>
                    </div>
                </div>

                {/* Rules */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl
                        p-5 mb-5">
                    <h2 className="text-sm font-semibold text-gray-300 mb-3">
                        Exam Rules
                    </h2>
                    <ul className="space-y-2 text-xs text-gray-400">
                        {[
                            "Keep your face visible in the webcam at all times",
                            "Do not switch tabs or minimize the window",
                            "The exam must remain in fullscreen mode",
                            "No phones or additional persons allowed in frame",
                            "Copy/paste and right-click are disabled",
                            "Your screen activity is being monitored by AI",
                        ].map((rule, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-red-400 mt-0.5">•</span>
                                {rule}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* System Checks */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl
                        p-5 mb-5">
                    <h2 className="text-sm font-semibold text-gray-300 mb-2">
                        System Checks
                    </h2>

                    <CheckRow
                        label="Camera Access"
                        status={checks.camera}
                        failMsg="Please allow camera access to proceed"
                    />
                    <CheckRow
                        label="Browser Compatibility"
                        status={checks.browser}
                        failMsg="Use Chrome or Edge for best experience"
                    />
                    <CheckRow
                        label="Fullscreen Support"
                        status={checks.fullscreen}
                        failMsg="Your browser does not support fullscreen"
                    />

                    {/* Camera preview */}
                    {checks.camera === "pass" && (
                        <div className="mt-4 flex justify-center">
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-40 h-32 rounded-lg object-cover
                           border border-gray-700"
                            />
                        </div>
                    )}
                </div>

                {/* Buttons */}
                {notStarted && (
                    <button
                        onClick={runChecks}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white
                       font-semibold py-3 rounded-xl transition-colors"
                    >
                        Run System Checks
                    </button>
                )}

                {!notStarted && !allPassed && (
                    <button
                        onClick={runChecks}
                        className="w-full bg-gray-700 hover:bg-gray-600 text-white
                       font-medium py-3 rounded-xl transition-colors"
                    >
                        Re-run Checks
                    </button>
                )}

                {allPassed && (
                    <button
                        onClick={onReady}
                        className="w-full bg-green-600 hover:bg-green-500 text-white
                       font-semibold py-3 rounded-xl transition-colors"
                    >
                        All Checks Passed — Start Exam →
                    </button>
                )}

                {anyFailed && (
                    <p className="text-center text-xs text-red-400 mt-3">
                        Fix the issues above before proceeding.
                    </p>
                )}
            </div>
        </div>
    );
}