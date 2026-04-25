// src/hooks/monitors/useClipboardMonitor.ts

"use client";

import { useEffect, useRef } from "react";
import { ViolationEvent } from "@/types";

interface UseClipboardMonitorProps {
  enabled: boolean;
  onViolation: (type: ViolationEvent, metadata: Record<string, unknown>) => void;
}

export function useClipboardMonitor({
  enabled,
  onViolation,
}: UseClipboardMonitorProps) {
  const onViolationRef = useRef(onViolation);
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  useEffect(() => {
    if (!enabled) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolationRef.current("CLIPBOARD_ATTEMPT", {
        action: "copy",
        timestamp: new Date().toISOString(),
      });
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolationRef.current("CLIPBOARD_ATTEMPT", {
        action: "paste",
        timestamp: new Date().toISOString(),
      });
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      onViolationRef.current("CLIPBOARD_ATTEMPT", {
        action: "cut",
        timestamp: new Date().toISOString(),
      });
    };

    // Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block select all
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
      }
      // Block print screen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        onViolationRef.current("CLIPBOARD_ATTEMPT", {
          action: "screenshot",
          timestamp: new Date().toISOString(),
        });
      }
    };

    document.addEventListener("copy",        handleCopy);
    document.addEventListener("paste",       handlePaste);
    document.addEventListener("cut",         handleCut);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown",     handleKeyDown, true);

    return () => {
      document.removeEventListener("copy",        handleCopy);
      document.removeEventListener("paste",       handlePaste);
      document.removeEventListener("cut",         handleCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown",     handleKeyDown, true);
    };
  }, [enabled]);
}