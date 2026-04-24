// src/lib/modelLoader.ts

"use client";

import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

// Singleton instances
let cocoModel: cocoSsd.ObjectDetection | null = null;
let faceModel: faceLandmarksDetection.FaceLandmarksDetector | null = null;
let isInitializing = false;

export async function loadModels(): Promise<void> {
  if ((cocoModel && faceModel) || isInitializing) return;
  isInitializing = true;

  try {
    // Set backend
    await tf.setBackend("webgl");
    await tf.ready();

    // Load models in parallel
    const [coco, face] = await Promise.all([
      cocoSsd.load({ base: "mobilenet_v2" }),
      faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "tfjs",
          refineLandmarks: false,
          maxFaces: 5,
        }
      ),
    ]);

    cocoModel = coco;
    faceModel = face;
    console.log("[PROCTOR] Models loaded successfully");
  } catch (error) {
    console.error("[PROCTOR] Model load failed:", error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

export function getCocoModel(): cocoSsd.ObjectDetection | null {
  return cocoModel;
}

export function getFaceModel(): faceLandmarksDetection.FaceLandmarksDetector | null {
  return faceModel;
}

export function areModelsReady(): boolean {
  return cocoModel !== null && faceModel !== null;
}