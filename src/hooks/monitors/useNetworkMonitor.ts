// src/hooks/monitors/useNetworkMonitor.ts

"use client";

import { useEffect, useRef, useState } from "react";
import { ViolationEvent } from "@/types";

interface UseNetworkMonitorProps {
  enabled: boolean;
  onViolation: (type: ViolationEvent, metadata: Record<string, unknown>) => void;
  onStatusChange?: (isOnline: boolean) => void;
}

export function useNetworkMonitor({
  enabled,
  onViolation,
  onStatusChange,
}: UseNetworkMonitorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const onViolationRef = useRef(onViolation);
  const onStatusRef = useRef(onStatusChange);
  const offlineTimeRef = useRef<number | null>(null);

  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { onStatusRef.current = onStatusChange; }, [onStatusChange]);

  useEffect(() => {
    if (!enabled) return;

    const handleOffline = () => {
      offlineTimeRef.current = Date.now();
      setIsOnline(false);
      onStatusRef.current?.(false);

      onViolationRef.current("NETWORK_LOSS", {
        timestamp: new Date().toISOString(),
        event: "offline",
      });
    };

    const handleOnline = () => {
      const offlineDuration = offlineTimeRef.current
        ? Math.round((Date.now() - offlineTimeRef.current) / 1000)
        : 0;

      offlineTimeRef.current = null;
      setIsOnline(true);
      onStatusRef.current?.(true);

      // Only log violation if offline more than 3 seconds
      if (offlineDuration > 3) {
        onViolationRef.current("NETWORK_LOSS", {
          timestamp: new Date().toISOString(),
          event: "reconnected",
          offlineDurationSeconds: offlineDuration,
        });
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online",  handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online",  handleOnline);
    };
  }, [enabled]);

  return { isOnline };
}