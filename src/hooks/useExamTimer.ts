// src/hooks/useExamTimer.ts

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useExamStore } from "@/store/examStore";

interface UseExamTimerProps {
  onTimeout: () => void;
  onTick?: (remaining: number) => void;
}

export function useExamTimer({ onTimeout, onTick }: UseExamTimerProps) {
  const { timeRemainingS, timerActive, tickTimer } = useExamStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  const onTickRef = useRef(onTick);

  // Keep refs updated
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  useEffect(() => {
    if (!timerActive) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const { timeRemainingS: current } = useExamStore.getState();

      if (current <= 0) {
        clearInterval(intervalRef.current!);
        onTimeoutRef.current();
        return;
      }

      tickTimer();
      onTickRef.current?.(current - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, tickTimer]);

  const formatTime = useCallback((seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const isWarning = timeRemainingS <= 300 && timeRemainingS > 60;  // last 5 mins
  const isDanger  = timeRemainingS <= 60;                           // last 1 min

  return {
    timeRemainingS,
    formatted: formatTime(timeRemainingS),
    isWarning,
    isDanger,
  };
}
