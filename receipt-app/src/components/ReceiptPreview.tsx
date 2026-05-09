import { useState, useEffect } from 'react';
import { Check, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReceiptPreviewProps {
  imageFile: File;
  isUploading: boolean;
  error: string | null;
  onSubmit: () => void;
  onRetake: () => void;
}

export function ReceiptPreview({
  imageFile,
  isUploading,
  error,
  onSubmit,
  onRetake,
}: ReceiptPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  return (
    <div className="flex flex-col gap-4">
      {/* Image preview */}
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/30">
        {previewUrl && (
          <img
            src={previewUrl}
            alt="Receipt preview"
            className={cn(
              'w-full max-h-[50vh] object-contain transition-opacity',
              isUploading && 'opacity-50'
            )}
          />
        )}

        {/* Upload overlay */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                Analyzing receipt...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onRetake}
          disabled={isUploading}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Retake
        </Button>
        <Button
          className="flex-1"
          onClick={onSubmit}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          {isUploading ? 'Processing...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
}
