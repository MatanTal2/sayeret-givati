'use client';

import { useCallback, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { TEXT_CONSTANTS } from '@/constants/text';

interface ProfileImageCropperProps {
  imageSrc: string;
  outputSize?: number;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void | Promise<void>;
}

const DEFAULT_OUTPUT_SIZE = 512;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.src = src;
  });
}

async function renderCroppedBlob(
  imageSrc: string,
  croppedAreaPixels: Area,
  outputSize: number
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92
    );
  });
}

export default function ProfileImageCropper({
  imageSrc,
  outputSize = DEFAULT_OUTPUT_SIZE,
  onCancel,
  onConfirm,
}: ProfileImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || isProcessing) return;
    setIsProcessing(true);
    try {
      const blob = await renderCroppedBlob(imageSrc, croppedAreaPixels, outputSize);
      await onConfirm(blob);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={TEXT_CONSTANTS.PROFILE_COMPONENTS.CROPPER_TITLE}
    >
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-200">
          <h2 className="text-base font-semibold text-neutral-900">
            {TEXT_CONSTANTS.PROFILE_COMPONENTS.CROPPER_TITLE}
          </h2>
        </div>

        <div className="relative w-full aspect-square bg-neutral-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <label htmlFor="cropper-zoom" className="text-sm text-neutral-700 shrink-0">
              {TEXT_CONSTANTS.PROFILE_COMPONENTS.CROPPER_ZOOM_LABEL}
            </label>
            <input
              id="cropper-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary-600"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="btn-ghost"
            >
              {TEXT_CONSTANTS.PROFILE_COMPONENTS.CROPPER_CANCEL}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !croppedAreaPixels}
              className="btn-primary"
            >
              {isProcessing
                ? TEXT_CONSTANTS.PROFILE_COMPONENTS.CROPPER_PROCESSING
                : TEXT_CONSTANTS.PROFILE_COMPONENTS.CROPPER_CONFIRM}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
