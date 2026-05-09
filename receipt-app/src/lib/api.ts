import type { Receipt, ExtractedReceipt } from '@/types/receipt';

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL;
const API_KEY = import.meta.env.VITE_N8N_API_KEY;

export interface SubmitReceiptResponse {
  success: boolean;
  data?: ExtractedReceipt & { sheetRow?: number };
  error?: string;
}

/**
 * Submit a receipt image to the n8n webhook for processing.
 * Sends as multipart/form-data with API key auth header.
 */
export async function submitReceipt(imageFile: File): Promise<SubmitReceiptResponse> {
  if (!WEBHOOK_URL) {
    throw new Error('N8N webhook URL not configured');
  }

  const formData = new FormData();
  formData.append('image', imageFile, `receipt-${Date.now()}.jpg`);
  formData.append(
    'metadata',
    JSON.stringify({
      submittedAt: new Date().toISOString(),
      deviceInfo: navigator.userAgent,
    })
  );

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY || '',
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized – check your API key');
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      (errorBody as { error?: string }).error || `Server error (${response.status})`
    );
  }

  return response.json();
}

/**
 * Build a lightweight receipt record for local history.
 */
export function buildReceiptRecord(
  id: string,
  thumbnailBase64: string,
  status: Receipt['status'],
  extractedData?: ExtractedReceipt,
  errorMessage?: string
): Receipt {
  return {
    id,
    imageData: thumbnailBase64,
    status,
    submittedAt: new Date().toISOString(),
    extractedData,
    errorMessage,
  };
}
