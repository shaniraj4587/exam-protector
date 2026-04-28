// src/context/WebcamContext.tsx

"use client";

import {
    createContext,
    useContext,
    useRef,
    useState,
    useCallback,
    useEffect,
    RefObject,
} from "react";

interface WebcamContextType {
    videoRef: RefObject<HTMLVideoElement>;
    streamRef: React.MutableRefObject<MediaStream | null>;
    isReady: boolean;
    error: string | null;
    requestCamera: () => Promise<void>;
    stopCamera: () => void;
    attachStream: (el: HTMLVideoElement) => void;
}

const WebcamContext = createContext<WebcamContextType | null>(null);

export function WebcamProvider({ children }: { children: React.ReactNode }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Attach stored stream to any video element ─────────
    const attachStream = useCallback((el: HTMLVideoElement) => {
        if (!streamRef.current) {
            console.warn("[WEBCAM] attachStream called but no stream stored");
            return;
        }
        console.log("[WEBCAM] Attaching stream to video element");
        el.srcObject = streamRef.current;
        el.onloadedmetadata = () => {
            el.play()
                .then(() => {
                    setIsReady(true);
                    console.log("[WEBCAM] Video playing —",
                        el.videoWidth, "x", el.videoHeight);
                })
                .catch(console.error);
        };
        // Already has metadata
        if (el.readyState >= 2) {
            el.play().then(() => setIsReady(true)).catch(console.error);
        }
    }, []);

    // ── Re-attach whenever the video element remounts ─────
    useEffect(() => {
        if (videoRef.current && streamRef.current) {
            attachStream(videoRef.current);
        }
    });

    // ── Request camera permission + store stream ──────────
    const requestCamera = useCallback(async () => {
        // Already have stream — just re-attach
        if (streamRef.current?.active) {
            console.log("[WEBCAM] Stream already active, re-attaching");
            if (videoRef.current) attachStream(videoRef.current);
            setIsReady(true);
            return;
        }

        setError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: "user",
                },
                audio: false,
            });

            streamRef.current = stream;
            console.log("[WEBCAM] Got stream:", stream.id);

            if (videoRef.current) {
                attachStream(videoRef.current);
            } else {
                // Will attach via useEffect when video mounts
                setIsReady(true);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Camera access denied";
            console.error("[WEBCAM ERROR]", msg);
            setError(msg);
        }
    }, [attachStream]);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setIsReady(false);
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    return (
        <WebcamContext.Provider
            value={{
                videoRef,
                streamRef,
                isReady,
                error,
                requestCamera,
                stopCamera,
                attachStream,
            }}
        >
            {children}
        </WebcamContext.Provider>
    );
}

export function useWebcamContext() {
    const ctx = useContext(WebcamContext);
    if (!ctx) throw new Error("useWebcamContext must be inside WebcamProvider");
    return ctx;
}