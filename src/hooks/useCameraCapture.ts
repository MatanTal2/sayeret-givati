'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Owns the MediaStream lifecycle for a camera component. Keeps track
 * of the stream so we can reliably stop all tracks on unmount.
 *
 * Returns a support flag so the UI can fall back to <input type="file" capture>
 * on desktop browsers that lack a camera (or when permissions are denied).
 */
export interface UseCameraCaptureState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isActive: boolean;
  isStarting: boolean;
  error: string | null;
  supported: boolean;
  start: (preferRearCamera?: boolean) => Promise<void>;
  stop: () => void;
  capture: () => Promise<Blob | null>;
}

export function useCameraCapture(): UseCameraCaptureState {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const start = useCallback(async (preferRearCamera = true) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
      setError('camera unavailable');
      return;
    }
    setIsStarting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: preferRearCamera ? { facingMode: { ideal: 'environment' } } : true,
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {
          // autoplay policies may throw; we tolerate because the user has already interacted
        });
      }
      setIsActive(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setSupported(false);
    } finally {
      setIsStarting(false);
    }
  }, []);

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return null;
    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return null;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);
    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  }, []);

  useEffect(() => {
    return () => {
      // Stop any lingering tracks when the hook unmounts
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) track.stop();
        streamRef.current = null;
      }
    };
  }, []);

  return { videoRef, isActive, isStarting, error, supported, start, stop, capture };
}
