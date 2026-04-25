// src/hooks/monitors/useTabMonitor.ts

"use client";

import { useEffect, useRef } from "react";
import { ViolationEvent } from "@/types";

interface UseTabMonitorProps {
  enabled: boolean;
  onViolation: (type: ViolationEvent, metadata: Record<string, unknown>) => void;
}

export function useTabMonitor({ enabled, onViolation }: UseTabMonitorProps) {
  const onViolationRef = useRef(onViolation);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  useEffect(() => {
    if (!enabled) return;

    // ── Visibility API ───────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        onViolationRef.current("TAB_SWITCH", {
          visibilityState: document.visibilityState,
          timestamp: new Date().toISOString(),
          method: "visibilitychange",
        });
      }
    };

    // ── Window blur (clicking outside browser) ───────────
    const handleBlur = () => {
      onViolationRef.current("TAB_SWITCH", {
        timestamp: new Date().toISOString(),
        method: "window_blur",
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled]);
}