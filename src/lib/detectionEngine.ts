// src/lib/detectionEngine.ts

"use client";

import { getCocoModel, getFaceModel } from "./modelLoader";
import { DetectionResult, CocoDetection } from "@/types/proctor";

const PHONE_CLASSES = ["cell phone", "remote", "book"];
const THRESHOLDS = { PHONE: 0.40, PERSON: 0.45, FACE: 0.50 };
// ↑ Lowered thresholds so phone is easier to detect

export async function runDetection(
    video: HTMLVideoElement
): Promise<DetectionResult[]> {
    if (
        !video ||
        video.readyState < 2 ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
    ) return [];

    const [cocoViolations, faceViolations] = await Promise.all([
        runCocoDetection(video),
        runFaceDetection(video),
    ]);

    return [...cocoViolations, ...faceViolations];
}

async function runCocoDetection(
    video: HTMLVideoElement
): Promise<DetectionResult[]> {
    const model = getCocoModel();
    if (!model) return [];

    const violations: DetectionResult[] = [];

    try {
        const predictions = (await model.detect(video)) as CocoDetection[];

        // Log ALL detections so you can see what COCO sees
        if (predictions.length > 0) {
            console.log(
                "[COCO] Detected:",
                predictions.map((p) => `${p.class} (${(p.score * 100).toFixed(0)}%)`).join(", ")
            );
        }

        // Multiple persons
        const persons = predictions.filter(
            (p) => p.class === "person" && p.score >= THRESHOLDS.PERSON
        );
        if (persons.length > 1) {
            violations.push({
                type: "MULTIPLE_PERSONS",
                confidence: Math.max(...persons.map((p) => p.score)),
                metadata: { count: persons.length, bboxes: persons.map((p) => p.bbox) },
            });
        }

        // Phone
        const phones = predictions.filter(
            (p) =>
                PHONE_CLASSES.includes(p.class.toLowerCase()) &&
                p.score >= THRESHOLDS.PHONE
        );
        if (phones.length > 0) {
            console.log("[COCO] 🚨 PHONE DETECTED:", phones[0].class, phones[0].score);
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
    } catch (err) {
        console.error("[COCO ERROR]", err);
    }

    return violations;
}

async function runFaceDetection(
    video: HTMLVideoElement
): Promise<DetectionResult[]> {
    const model = getFaceModel();
    if (!model) return [];

    try {
        const predictions = await model.estimateFaces(video, false);
        console.log("[BLAZEFACE] Faces detected:", predictions.length);

        if (predictions.length === 0) {
            return [{
                type: "FACE_ABSENT",
                confidence: 1.0,
                metadata: { facesDetected: 0 },
            }];
        }
    } catch (err) {
        console.error("[BLAZEFACE ERROR]", err);
    }

    return [];
}