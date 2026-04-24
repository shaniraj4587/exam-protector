// src/types/index.ts

export type Role = "STUDENT" | "ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  order: number;
}

export interface ViolationType {
  TAB_SWITCH: "TAB_SWITCH";
  FULLSCREEN_EXIT: "FULLSCREEN_EXIT";
  MULTIPLE_PERSONS: "MULTIPLE_PERSONS";
  PHONE_DETECTED: "PHONE_DETECTED";
  FACE_ABSENT: "FACE_ABSENT";
  DEVTOOLS_OPEN: "DEVTOOLS_OPEN";
  CLIPBOARD_ATTEMPT: "CLIPBOARD_ATTEMPT";
  NETWORK_LOSS: "NETWORK_LOSS";
}

export type ViolationEvent = keyof ViolationType;

export interface Violation {
  id: string;
  attemptId: string;
  type: ViolationEvent;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ExamAttempt {
  timeRemainingS: number;
  id: string;
  examId: string;
  userId: string;
  status: "IN_PROGRESS" | "SUBMITTED" | "TERMINATED";
  startedAt: string;
  submittedAt?: string;
  violationCount: number;
  answers: Record<string, string>;
}