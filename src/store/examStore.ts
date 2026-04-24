// src/store/examStore.ts

import { create } from "zustand";
import { ExamQuestion, ExamAttempt } from "@/types";

interface ExamState {
  // Exam data
  attemptId: string | null;
  examId: string | null;
  examTitle: string;
  questions: ExamQuestion[];
  answers: Record<string, string>;
  
  // Timer
  timeRemainingS: number;
  timerActive: boolean;

  // Navigation
  currentIndex: number;

  // Status
  status: "idle" | "loading" | "active" | "submitted" | "terminated";
  violationCount: number;

  // Actions
  initExam: (attempt: ExamAttempt, questions: ExamQuestion[], title: string) => void;
  setAnswer: (questionId: string, answer: string) => void;
  setCurrentIndex: (index: number) => void;
  tickTimer: () => void;
  setTimeRemaining: (seconds: number) => void;
  setStatus: (status: ExamState["status"]) => void;
  incrementViolation: () => void;
  resetExam: () => void;
}

export const useExamStore = create<ExamState>((set) => ({
  attemptId: null,
  examId: null,
  examTitle: "",
  questions: [],
  answers: {},
  timeRemainingS: 0,
  timerActive: false,
  currentIndex: 0,
  status: "idle",
  violationCount: 0,

  initExam: (attempt, questions, title) =>
    set({
      attemptId: attempt.id,
      examId: attempt.examId,
      examTitle: title,
      questions,
      answers: (attempt.answers as Record<string, string>) || {},
      timeRemainingS: attempt.timeRemainingS ?? 0,
      timerActive: true,
      currentIndex: 0,
      status: "active",
      violationCount: attempt.violationCount,
    }),

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  tickTimer: () =>
    set((state) => ({
      timeRemainingS: Math.max(0, state.timeRemainingS - 1),
    })),

  setTimeRemaining: (seconds) => set({ timeRemainingS: seconds }),

  setStatus: (status) => set({ status, timerActive: status === "active" }),

  incrementViolation: () =>
    set((state) => ({ violationCount: state.violationCount + 1 })),

  resetExam: () =>
    set({
      attemptId: null,
      examId: null,
      examTitle: "",
      questions: [],
      answers: {},
      timeRemainingS: 0,
      timerActive: false,
      currentIndex: 0,
      status: "idle",
      violationCount: 0,
    }),
}));