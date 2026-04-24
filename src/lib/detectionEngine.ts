// src/lib/detectionEngine.ts

"use client";

import { getCocoModel, getFaceModel } from "./modelLoader";
import { DetectionResult, CocoDetection } from "@/types/proctor";

// Classes from COCO-SSD that indicate a phone
const PHONE_CLASSES = ["cell phone", "remote", "book"];

// Confidence thresholds
const THRESHOLDS = {
  PHONE: 0.55,
  FACE: 0.60,
  PERSON: 0.55,
};

// ── Run full detection on a video frame ──────────────────
export async function runDetection(
  video: HTMLVideoElement
): Promise<DetectionResult[]> {
  const violations: DetectionResult[] = [];

  if (
    !video ||
    video.readyState < 2 ||
    video.videoWidth === 0 ||
    video.videoHeight === 0
  ) {
    return violations;
  }

  const [cocoViolations, faceViolations] = await Promise.all([
    runCocoDetection(video),
    runFaceDetection(video),
  ]);

  return [...cocoViolations, ...faceViolations];
}

// ── COCO-SSD: Phone + Multiple Person Detection ───────────
async function runCocoDetection(
  video: HTMLVideoElement
): Promise<DetectionResult[]> {
  const model = getCocoModel();
  if (!model) return [];

  const violations: DetectionResult[] = [];

  try {
    const predictions = (await model.detect(video)) as CocoDetection[];

    // Count persons
    const persons = predictions.filter(
      (p) => p.class === "person" && p.score >= THRESHOLDS.PERSON
    );

    if (persons.length === 0) {
      // No person at desk is handled by face detection
    } else if (persons.length > 1) {
      violations.push({
        type: "MULTIPLE_PERSONS",
        confidence: Math.max(...persons.map((p) => p.score)),
        metadata: {
          count: persons.length,
          bboxes: persons.map((p) => p.bbox),
        },
      });
    }

    // Check for phones
    const phones = predictions.filter(
      (p) =>
        PHONE_CLASSES.includes(p.class.toLowerCase()) &&
        p.score >= THRESHOLDS.PHONE
    );

    if (phones.length > 0) {
      violations.push({
        type: "PHONE_DETECTED",
        confidence: Math.max(...phones.map((p) => p.score)),
        metadata: {
          detectedClass: phones[0].class,
          count: phones.length,
          bbox: phones[0].bbox,
        },
      });
    }
  } catch (error) {
    console.error("[COCO DETECTION ERROR]", error);
  }

  return violations;
}

// ── Face Mesh: Face Absence Detection ────────────────────
async function runFaceDetection(
  video: HTMLVideoElement
): Promise<DetectionResult[]> {
  const model = getFaceModel();
  if (!model) return [];

  const violations: DetectionResult[] = [];

  try {
    const faces = await model.estimateFaces(video, {
      flipHorizontal: false,
    });

    if (faces.length === 0) {
      violations.push({
        type: "FACE_ABSENT",
        confidence: 1.0,
        metadata: {
          facesDetected: 0,
          message: "No face detected in frame",
        },
      });
    }
  } catch (error) {
    console.error("[FACE DETECTION ERROR]", error);
  }

  return violations;
} 