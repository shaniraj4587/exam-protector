// src/hooks/useBrowserMonitor.ts

"use client";

import { useCallback } from "react";
import { useTabMonitor }        from "./useTabMonitor";
import { useFullscreenMonitor } from "./useFullscreenMonitor";
import { useDevToolsMonitor }   from "./useDevToolsMonitor";
import { useClipboardMonitor }  from "./useClipboardMonitor";
import { useNetworkMonitor }    from "./useNetworkMonitor";
import { ViolationEvent }       from "@/types";

interface UseBrowserMonitorProps {
  enabled: boolean;
  onViolation: (type: ViolationEvent, metadata: Record<string, unknown>) => void;
  onNetworkChange?: (isOnline: boolean) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function useBrowserMonitor({
  enabled,
  onViolation,
  onNetworkChange,
  onFullscreenChange,
}: UseBrowserMonitorProps) {

  const handleViolation = useCallback(
    (type: ViolationEvent, metadata: Record<string, unknown>) => {
      onViolation(type, metadata);
    },
    [onViolation]
  );

  useTabMonitor({
    enabled,
    onViolation: handleViolation,
  });

  const { enterFullscreen } = useFullscreenMonitor({
    enabled,
    onViolation: handleViolation,
    onFullscreenChange,
  });

  useDevToolsMonitor({
    enabled,
    onViolation: handleViolation,
  });

  useClipboardMonitor({
    enabled,
    onViolation: handleViolation,
  });

  const { isOnline } = useNetworkMonitor({
    enabled,
    onViolation: handleViolation,
    onStatusChange: onNetworkChange,
  });

  return {
    isOnline,
    enterFullscreen,
  };
}