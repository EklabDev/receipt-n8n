import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { submitReceipt, buildReceiptRecord } from '@/lib/api';
import type { Receipt } from '@/types/receipt';

interface UseReceiptApiReturn {
  isUploading: boolean;
  lastResult: Receipt | null;
  error: string | null;
  submit: (imageFile: File, thumbnailBase64: string) => Promise<Receipt>;
  reset: () => void;
}

/**
 * Hook managing receipt submission state:
 * uploading → success/error, plus the resulting Receipt record.
 */
export function useReceiptApi(): UseReceiptApiReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [lastResult, setLastResult] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (imageFile: File, thumbnailBase64: string): Promise<Receipt> => {
    const id = uuidv4();
    setIsUploading(true);
    setError(null);

    const pendingReceipt = buildReceiptRecord(id, thumbnailBase64, 'uploading');
    setLastResult(pendingReceipt);

    try {
      const response = await submitReceipt(imageFile);

      if (response.success && response.data) {
        const successReceipt = buildReceiptRecord(
          id,
          thumbnailBase64,
          'success',
          response.data
        );
        setLastResult(successReceipt);
        return successReceipt;
      } else {
        const errorMsg = response.error || 'Unknown error';
        const errorReceipt = buildReceiptRecord(id, thumbnailBase64, 'error', undefined, errorMsg);
        setLastResult(errorReceipt);
        setError(errorMsg);
        return errorReceipt;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      const errorReceipt = buildReceiptRecord(id, thumbnailBase64, 'error', undefined, errorMsg);
      setLastResult(errorReceipt);
      setError(errorMsg);
      return errorReceipt;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLastResult(null);
    setError(null);
    setIsUploading(false);
  }, []);

  return { isUploading, lastResult, error, submit, reset };
}
