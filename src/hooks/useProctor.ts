// src/hooks/useProctor.ts

"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { loadModels, areModelsReady } from "@/lib/modelLoader";
import { runDetection } from "@/lib/detectionEngine";
import { DetectionResult, ProctorState } from "@/types/proctor";
import { ViolationEvent } from "@/types";

// Detection runs every 2 seconds (per SRS)
const DETECTION_INTERVAL_MS = 2000;

// Debounce: same violation must not fire again within this window
const DEBOUNCE_MS = 5000;

interface UseProctorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  enabled: boolean;
  onViolation: (type: ViolationEvent, metadata: Record<string, unknown>) => void;
}

export function useProctor({
  videoRef,
  enabled,
  onViolation,
}: UseProctorProps) {
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

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  // ── Load models on mount ─────────────────────────────
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
      } catch {
        setState((s) => ({
          ...s,
          isLoading: false,
          error: "Failed to load AI models. Please refresh.",
        }));
      }
    };

    init();
  }, [enabled]);

  // ── Detection loop ───────────────────────────────────
  const startDetection = useCallback(() => {
    if (intervalRef.current) return;

    setState((s) => ({ ...s, isRunning: true }));

    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || !areModelsReady()) return;

      try {
        const results: DetectionResult[] = await runDetection(video);

        if (results.length > 0) {
          const now = Date.now();

          for (const result of results) {
            const lastFired = lastFiredRef.current[result.type] ?? 0;

            // Debounce: skip if fired recently
            if (now - lastFired < DEBOUNCE_MS) continue;

            lastFiredRef.current[result.type] = now;
            setState((s) => ({ ...s, lastDetection: result }));
            onViolationRef.current(result.type, {
              ...result.metadata,
              confidence: result.confidence,
            });
          }
        }
      } catch (error) {
        console.error("[DETECTION LOOP ERROR]", error);
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

  // Auto-start when ready + enabled
  useEffect(() => {
    if (state.isReady && enabled) {
      startDetection();
    } else {
      stopDetection();
    }
    return stopDetection;
  }, [state.isReady, enabled]);

  return {
    ...state,
    startDetection,
    stopDetection,
  };
}