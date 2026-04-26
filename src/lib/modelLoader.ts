// src/lib/modelLoader.ts

"use client";

import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as blazeface from "@tensorflow-models/blazeface";

// Singleton instances
let cocoModel: cocoSsd.ObjectDetection | null = null;
let faceModel: blazeface.BlazeFaceModel | null = null;
let isInitializing = false;

export async function loadModels(): Promise<void> {
    if ((cocoModel && faceModel) || isInitializing) return;
    isInitializing = true;

    try {
        await tf.setBackend("webgl");
        await tf.ready();

        const [coco, face] = await Promise.all([
            cocoSsd.load({ base: "mobilenet_v2" }),
            blazeface.load(),
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

export function getFaceModel(): blazeface.BlazeFaceModel | null {
    return faceModel;
}

export function areModelsReady(): boolean {
    return cocoModel !== null && faceModel !== null;
}