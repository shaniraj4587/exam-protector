// src/components/proctor/WebcamPreview.tsx

"use client";

import { useEffect } from "react";
import { useWebcam } from "@/hooks/useWebcam";

interface WebcamPreviewProps {
    onReady: (videoRef: React.RefObject<HTMLVideoElement | null>) => void;
    onError: (error: string) => void;
}

export function WebcamPreview({ onReady, onError }: WebcamPreviewProps) {
    const { videoRef, isReady, error, requestCamera } = useWebcam();

    useEffect(() => {
        requestCamera();
    }, []);

    useEffect(() => {
        if (isReady) onReady(videoRef);
    }, [isReady]);

    useEffect(() => {
        if (error) onError(error);
    }, [error]);

    return (
        <div className="relative">
            {/* Live video feed */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-36 h-28 rounded-lg object-cover border-2 border-gray-700"
            />

            {/* Overlay when not ready */}
            {!isReady && (
                <div className="absolute inset-0 bg-gray-900 rounded-lg flex items-center justify-center">
                    {error ? (
                        <span className="text-red-400 text-xs text-center px-2">{error}</span>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-gray-400 text-xs">Camera loading…</span>
                        </div>
                    )}
                </div>
            )}

            {/* Green dot indicator */}
            {isReady && (
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>
            )}
        </div>
    );
}