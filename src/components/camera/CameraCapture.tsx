'use client';

import { useEffect, useRef, useState } from 'react';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { TEXT_CONSTANTS } from '@/constants/text';

export interface CameraCaptureProps {
  /** Called when the user confirms a capture. Parent is responsible for uploading. */
  onCapture: (blob: Blob) => void;
  /** Start the camera immediately on mount (default: true). Set false to require an explicit user click. */
  autoStart?: boolean;
  /** Prefer the rear-facing camera if available (default: true). */
  preferRearCamera?: boolean;
}

/**
 * Camera capture component. Prefers getUserMedia live preview; falls back to
 * <input type="file" capture="environment"> when the browser lacks camera support
 * (desktop) or the user denies permission.
 *
 * Intentionally does not perform the upload — the parent controls when a blob
 * becomes durable so we can abort or retake without wasting storage writes.
 */
export default function CameraCapture({
  onCapture,
  autoStart = true,
  preferRearCamera = true,
}: CameraCaptureProps) {
  const camera = useCameraCapture();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    if (autoStart && camera.supported) camera.start(preferRearCamera);
    return () => camera.stop();
    // camera.start/stop are stable refs from the hook; depending on `supported` triggers
    // a re-start if support is detected late (e.g., permission prompt resolves).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, camera.supported, preferRearCamera]);

  useEffect(() => {
    if (!previewBlob) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(previewBlob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [previewBlob]);

  const handleCapture = async () => {
    setCaptureError(null);
    try {
      const blob = await camera.capture();
      if (!blob) {
        setCaptureError(TEXT_CONSTANTS.CAMERA.ERROR_CAPTURE);
        return;
      }
      setPreviewBlob(blob);
    } catch {
      setCaptureError(TEXT_CONSTANTS.CAMERA.ERROR_CAPTURE);
    }
  };

  const handleUsePhoto = () => {
    if (!previewBlob) return;
    camera.stop();
    onCapture(previewBlob);
  };

  const handleRetake = () => {
    setPreviewBlob(null);
    if (!camera.isActive) camera.start(preferRearCamera);
  };

  const handleFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreviewBlob(file);
  };

  // Fallback: camera not supported → file input
  if (!camera.supported) {
    return (
      <div className="border border-dashed border-neutral-300 rounded-lg p-6 text-center">
        <p className="text-sm text-neutral-600 mb-3">{TEXT_CONSTANTS.CAMERA.FALLBACK_HINT}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChosen}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary"
        >
          {TEXT_CONSTANTS.CAMERA.CHOOSE_FILE}
        </button>
        {previewUrl && (
          <PreviewBox src={previewUrl} onRetake={handleRetake} onUse={handleUsePhoto} />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {!previewUrl ? (
        <>
          <video
            ref={camera.videoRef}
            className="w-full aspect-[3/4] bg-neutral-900 rounded-lg object-cover"
            playsInline
            muted
          />
          <div className="flex items-center justify-center gap-3 mt-3">
            {!camera.isActive && !camera.isStarting && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => camera.start(preferRearCamera)}
              >
                {TEXT_CONSTANTS.CAMERA.START}
              </button>
            )}
            {camera.isStarting && (
              <span className="text-sm text-neutral-600">{TEXT_CONSTANTS.CAMERA.STARTING}</span>
            )}
            {camera.isActive && (
              <button type="button" className="btn-primary" onClick={handleCapture}>
                {TEXT_CONSTANTS.CAMERA.CAPTURE}
              </button>
            )}
          </div>
          {(captureError || camera.error) && (
            <p className="text-danger-600 text-xs mt-2 text-center">
              {captureError ?? camera.error}
            </p>
          )}
        </>
      ) : (
        <PreviewBox src={previewUrl} onRetake={handleRetake} onUse={handleUsePhoto} />
      )}
    </div>
  );
}

function PreviewBox({
  src,
  onRetake,
  onUse,
}: {
  src: string;
  onRetake: () => void;
  onUse: () => void;
}) {
  return (
    <div>
      {/* Preview uses plain <img> because the Blob URL is ephemeral and next/image refuses non-configured hosts */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="preview" className="w-full aspect-[3/4] rounded-lg object-cover bg-neutral-100" />
      <div className="flex items-center justify-center gap-3 mt-3">
        <button type="button" className="btn-secondary" onClick={onRetake}>
          {TEXT_CONSTANTS.CAMERA.RETAKE}
        </button>
        <button type="button" className="btn-primary" onClick={onUse}>
          {TEXT_CONSTANTS.CAMERA.USE_PHOTO}
        </button>
      </div>
    </div>
  );
}
