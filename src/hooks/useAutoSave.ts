// src/hooks/useAutoSave.ts

"use client";

import { useEffect, useRef } from "react";
import { useExamStore } from "@/store/examStore";

const SAVE_INTERVAL_MS = 30_000; // every 30 seconds

export function useAutoSave() {
  const { attemptId, answers, timeRemainingS, status } = useExamStore();
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveNow = async () => {
    if (!attemptId || status !== "active") return;
    try {
      await fetch("/api/exam/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers, timeRemainingS }),
      });
    } catch {
      console.warn("[AUTO-SAVE] Failed silently");
    }
  };

  // Periodic save
  useEffect(() => {
    if (status !== "active") return;
    saveTimerRef.current = setInterval(saveNow, SAVE_INTERVAL_MS);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [status, attemptId, answers, timeRemainingS]);

  // Save on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (!attemptId || status !== "active") return;
      navigator.sendBeacon(
        "/api/exam/save",
        JSON.stringify({ attemptId, answers, timeRemainingS })
      );
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [attemptId, answers, timeRemainingS, status]);

  return { saveNow };
}