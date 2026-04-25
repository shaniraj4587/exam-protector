// src/hooks/monitors/useFullscreenMonitor.ts

"use client";

import { useEffect, useRef, useCallback } from "react";
import { ViolationEvent } from "@/types";

interface UseFullscreenMonitorProps {
  enabled: boolean;
  onViolation: (type: ViolationEvent, metadata: Record<string, unknown>) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function useFullscreenMonitor({
  enabled,
  onViolation,
  onFullscreenChange,
}: UseFullscreenMonitorProps) {
  const onViolationRef = useRef(onViolation);
  const onChangeRef = useRef(onFullscreenChange);
  const isFirstMount = useRef(true);

  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onChangeRef.current = onFullscreenChange; }, [onFullscreenChange]);

  // ── Enter fullscreen ─────────────────────────────────
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (err) {
      console.warn("[FULLSCREEN] Could not enter fullscreen:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      onChangeRef.current?.(isFullscreen);

      // Skip violation on first mount (initial enter)
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }

      if (!isFullscreen) {
        onViolationRef.current("FULLSCREEN_EXIT", {
          timestamp: new Date().toISOString(),
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
        });
      }
    };

    // Block escape key from exiting fullscreen context
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
      }
      // Block F11
      if (e.key === "F11") {
        e.preventDefault();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled]);

  return { enterFullscreen };
}