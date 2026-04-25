// src/hooks/useViolation.ts

"use client";

import { useCallback, useRef } from "react";
import { useExamStore } from "@/store/examStore";
import {
  getEscalationAction,
  getWarningMessage,
  VIOLATION_WEIGHTS,
} from "@/lib/violations";
import { ViolationEvent } from "@/types";
import toast from "react-hot-toast";

interface UseViolationProps {
  onAutoSubmit: () => Promise<void>;
  onTerminate: () => Promise<void>;
}

export function useViolation({
  onAutoSubmit,
  onTerminate,
}: UseViolationProps) {
  const { attemptId, violationCount, incrementViolation, setStatus } =
    useExamStore();

  const isProcessingRef = useRef(false);

  const reportViolation = useCallback(
    async (type: ViolationEvent, metadata: Record<string, unknown> = {}) => {
      if (!attemptId || isProcessingRef.current) return;

      // Optimistic local update
      incrementViolation();

      const weight   = VIOLATION_WEIGHTS[type] ?? 1;
      const newCount = violationCount + weight;
      const action   = getEscalationAction(newCount);
      const message  = getWarningMessage(action, newCount, 5);

      // Show toast based on severity
      if (action === "WARNING") {
        toast(message, {
          icon: "⚠️",
          style: {
            background: "#92400e",
            color: "#fef3c7",
            border: "1px solid #d97706",
          },
          duration: 4000,
        });
      } else if (action === "SEVERE_WARNING") {
        toast(message, {
          icon: "🚨",
          style: {
            background: "#7f1d1d",
            color: "#fee2e2",
            border: "1px solid #ef4444",
          },
          duration: 6000,
        });
      }

      try {
        // Report to server
        const res = await fetch("/api/violation/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attemptId, type, metadata }),
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("[VIOLATION] Server error:", data.error);
          return;
        }

        // Handle server-confirmed actions
        isProcessingRef.current = true;

        if (data.action === "AUTO_SUBMIT" || data.newStatus === "SUBMITTED") {
          setStatus("submitted");
          toast.error("⛔ Exam auto-submitted due to violations.", {
            duration: 8000,
          });
          await onAutoSubmit();
        }

        if (data.action === "TERMINATE" || data.newStatus === "TERMINATED") {
          setStatus("terminated");
          toast.error("🔴 Exam terminated. You have been logged out.", {
            duration: 8000,
          });
          await onTerminate();
        }

      } catch (err) {
        console.error("[VIOLATION] Network error:", err);
      } finally {
        isProcessingRef.current = false;
      }
    },
    [
      attemptId,
      violationCount,
      incrementViolation,
      setStatus,
      onAutoSubmit,
      onTerminate,
    ]
  );

  return { reportViolation };
}