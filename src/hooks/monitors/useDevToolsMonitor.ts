// src/hooks/monitors/useDevToolsMonitor.ts

"use client";

import { useEffect, useRef } from "react";
import { ViolationEvent } from "@/types";

interface UseDevToolsMonitorProps {
  enabled: boolean;
  onViolation: (type: ViolationEvent, metadata: Record<string, unknown>) => void;
}

const DEVTOOLS_CHECK_INTERVAL = 1000; // check every second
const SIZE_THRESHOLD = 160;           // px difference that signals devtools

export function useDevToolsMonitor({
  enabled,
  onViolation,
}: UseDevToolsMonitorProps) {
  const onViolationRef = useRef(onViolation);
  const lastFiredRef = useRef<number>(0);
  const DEBOUNCE_MS = 8000;

  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  useEffect(() => {
    if (!enabled) return;

    // ── Method 1: Window size differential ───────────────
    const checkBySize = () => {
      const widthDiff  = window.outerWidth  - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;

      if (widthDiff > SIZE_THRESHOLD || heightDiff > SIZE_THRESHOLD) {
        fire({
          method: "size_differential",
          widthDiff,
          heightDiff,
        });
      }
    };

    // ── Method 2: toString() timing trick ────────────────
    const checkByToString = () => {
      let devtoolsOpen = false;

      const element = new Image();
      Object.defineProperty(element, "id", {
        get() {
          devtoolsOpen = true;
          return "";
        },
      });

      // eslint-disable-next-line no-console
      console.log("%c", element);

      if (devtoolsOpen) {
        fire({ method: "console_trick" });
      }
    };

    // ── Method 3: Keyboard shortcuts ─────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      const isDevToolsShortcut =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U"); // view source

      if (isDevToolsShortcut) {
        e.preventDefault();
        e.stopPropagation();
        fire({
          method: "keyboard_shortcut",
          key: e.key,
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
        });
      }
    };

    const fire = (metadata: Record<string, unknown>) => {
      const now = Date.now();
      if (now - lastFiredRef.current < DEBOUNCE_MS) return;
      lastFiredRef.current = now;
      onViolationRef.current("DEVTOOLS_OPEN", {
        ...metadata,
        timestamp: new Date().toISOString(),
      });
    };

    const intervalId = setInterval(checkBySize, DEVTOOLS_CHECK_INTERVAL);
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled]);
}