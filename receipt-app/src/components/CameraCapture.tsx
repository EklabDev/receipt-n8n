import { useRef, useCallback } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  className?: string;
}

/**
 * Resize an image file client-side to reduce upload size.
 * Max dimension 1920px, JPEG at 85% quality.
 */
async function resizeImage(file: File, maxDim = 1920, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width <= maxDim && height <= maxDim) {
        resolve(file);
        return;
      }

      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          const resized = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(resized);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Create a small base64 thumbnail for local history storage.
 */
export async function createThumbnail(file: File, maxDim = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export { resizeImage };

export function CameraCapture({ onCapture, className }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const resized = await resizeImage(file);
        onCapture(resized);
      } catch {
        // If resize fails, use original
        onCapture(file);
      }

      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = '';
    },
    [onCapture]
  );

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label="Capture receipt photo"
        id="camera-input"
      />
      <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center transition-all hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Camera className="h-8 w-8 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            Tap to capture receipt
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Take a photo or choose from gallery
          </p>
        </div>
      </div>
    </div>
  );
}
