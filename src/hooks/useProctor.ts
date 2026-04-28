// src/hooks/useProctor.ts

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { loadModels, areModelsReady } from "@/lib/modelLoader";
import { runDetection } from "@/lib/detectionEngine";
import { DetectionResult, ProctorState } from "@/types/proctor";
import { ViolationEvent } from "@/types";

const DETECTION_INTERVAL_MS = 2000;
const DEBOUNCE_MS = 5000;

interface UseProctorProps {
    videoRef: React.RefObject<HTMLVideoElement>;
    enabled: boolean;
    onViolation: (type: ViolationEvent, metadata: Record<string, unknown>) => void;
}

export function useProctor({ videoRef, enabled, onViolation }: UseProctorProps) {
    const [state, setState] = useState<ProctorState>({
        isLoading: false,
        isReady: false,
        isRunning: false,
        lastDetection: null,
        error: null,
    });

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastFiredRef = useRef<Partial<Record<ViolationEvent, number>>>({});
    const onViolationRef = useRef(onViolation);

    useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

    // ── Load models ──────────────────────────────────────
    useEffect(() => {
        if (!enabled) return;

        const init = async () => {
            if (areModelsReady()) {
                setState((s) => ({ ...s, isReady: true }));
                return;
            }
            setState((s) => ({ ...s, isLoading: true, error: null }));
            try {
                await loadModels();
                setState((s) => ({ ...s, isLoading: false, isReady: true }));
                console.log("[PROCTOR] Models ready");
            } catch (e) {
                setState((s) => ({
                    ...s,
                    isLoading: false,
                    error: "Failed to load AI models",
                }));
                console.error("[PROCTOR] Load error", e);
            }
        };

        init();
    }, [enabled]);

    // ── Detection loop ───────────────────────────────────
    const startDetection = useCallback(() => {
        if (intervalRef.current) return;
        setState((s) => ({ ...s, isRunning: true }));
        console.log("[PROCTOR] Detection loop started");

        intervalRef.current = setInterval(async () => {
            const video = videoRef.current;

            // Guard: video must be playing with real dimensions
            if (
                !video ||
                video.paused ||
                video.ended ||
                video.readyState < 3 ||           // HAVE_FUTURE_DATA
                video.videoWidth === 0 ||
                video.videoHeight === 0
            ) {
                console.warn("[PROCTOR] Video not ready — skipping frame",
                    video?.readyState, video?.videoWidth, video?.videoHeight
                );
                return;
            }

            if (!areModelsReady()) {
                console.warn("[PROCTOR] Models not ready — skipping frame");
                return;
            }

            try {
                console.log("[PROCTOR] Running detection on frame",
                    video.videoWidth, "x", video.videoHeight
                );
                const results: DetectionResult[] = await runDetection(video);
                console.log("[PROCTOR] Results:", results);

                const now = Date.now();
                for (const result of results) {
                    const lastFired = lastFiredRef.current[result.type] ?? 0;
                    if (now - lastFired < DEBOUNCE_MS) continue;
                    lastFiredRef.current[result.type] = now;
                    setState((s) => ({ ...s, lastDetection: result }));
                    onViolationRef.current(result.type, {
                        ...result.metadata,
                        confidence: result.confidence,
                    });
                }
            } catch (err) {
                console.error("[PROCTOR] Detection error", err);
            }
        }, DETECTION_INTERVAL_MS);
    }, [videoRef]);

    const stopDetection = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setState((s) => ({ ...s, isRunning: false }));
    }, []);

    // ── Auto start when models ready ──────────────────────
    useEffect(() => {
        if (state.isReady && enabled) {
            startDetection();
        } else {
            stopDetection();
        }
        return stopDetection;
    }, [state.isReady, enabled, startDetection, stopDetection]);

    return { ...state, startDetection, stopDetection };
}