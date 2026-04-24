// src/types/proctor.ts

export interface DetectionResult {
  type: "FACE_ABSENT" | "MULTIPLE_PERSONS" | "PHONE_DETECTED";
  confidence: number;
  metadata: Record<string, unknown>;
}

export interface ProctorState {
  isLoading: boolean;
  isReady: boolean;
  isRunning: boolean;
  lastDetection: DetectionResult | null;
  error: string | null;
}

export interface CocoDetection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}