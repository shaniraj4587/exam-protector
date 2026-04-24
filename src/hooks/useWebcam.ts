// src/hooks/useWebcam.ts

"use client";

import { useEffect, useRef, useState } from "react";

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isReady: boolean;
  error: string | null;
  requestCamera: () => Promise<void>;
  stopCamera: () => void;
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsReady(true);
        };
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Camera access denied";

      if (message.includes("Permission denied")) {
        setError("Camera permission denied. Please allow camera access.");
      } else if (message.includes("NotFoundError")) {
        setError("No camera found. A webcam is required.");
      } else {
        setError("Could not access camera: " + message);
      }
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsReady(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  return {
    videoRef,
    stream: streamRef.current,
    isReady,
    error,
    requestCamera,
    stopCamera,
  };
}