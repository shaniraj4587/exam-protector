// src/lib/violations.ts

import { ViolationEvent } from "@/types";

// ── Escalation thresholds (from PRD) ────────────────────
export const ESCALATION = {
  WARNING:        1,
  SEVERE_WARNING: 2,
  AUTO_SUBMIT:    4,
  TERMINATE:      5,
} as const;

// ── Human-readable violation labels ─────────────────────
export const VIOLATION_LABELS: Record<ViolationEvent, string> = {
  TAB_SWITCH:       "Tab Switch",
  FULLSCREEN_EXIT:  "Fullscreen Exit",
  MULTIPLE_PERSONS: "Multiple Persons Detected",
  PHONE_DETECTED:   "Phone Detected",
  FACE_ABSENT:      "Face Not Visible",
  DEVTOOLS_OPEN:    "DevTools Opened",
  CLIPBOARD_ATTEMPT:"Clipboard Attempt",
  NETWORK_LOSS:     "Network Disconnection",
};

// ── Severity weights ─────────────────────────────────────
export const VIOLATION_WEIGHTS: Record<ViolationEvent, number> = {
  TAB_SWITCH:        1,
  FULLSCREEN_EXIT:   1,
  MULTIPLE_PERSONS:  2,
  PHONE_DETECTED:    2,
  FACE_ABSENT:       1,
  DEVTOOLS_OPEN:     2,
  CLIPBOARD_ATTEMPT: 1,
  NETWORK_LOSS:      1,
};

// ── Get escalation action for a given count ───────────────
export type EscalationAction =
  | "WARNING"
  | "SEVERE_WARNING"
  | "AUTO_SUBMIT"
  | "TERMINATE"
  | "NONE";

export function getEscalationAction(count: number): EscalationAction {
  if (count >= ESCALATION.TERMINATE)      return "TERMINATE";
  if (count >= ESCALATION.AUTO_SUBMIT)    return "AUTO_SUBMIT";
  if (count >= ESCALATION.SEVERE_WARNING) return "SEVERE_WARNING";
  if (count >= ESCALATION.WARNING)        return "WARNING";
  return "NONE";
}

// ── Get warning message for UI ────────────────────────────
export function getWarningMessage(
  action: EscalationAction,
  count: number,
  max: number
): string {
  switch (action) {
    case "WARNING":
      return `⚠️ Warning: Suspicious activity detected. (${count}/${max})`;
    case "SEVERE_WARNING":
      return `🚨 Severe Warning: Further violations will auto-submit your exam. (${count}/${max})`;
    case "AUTO_SUBMIT":
      return `❌ Your exam has been auto-submitted due to repeated violations.`;
    case "TERMINATE":
      return `🔴 Your exam has been terminated. You have been logged out.`;
    default:
      return "";
  }
}