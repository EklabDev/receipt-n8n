import type { Receipt, ExtractedReceipt } from '@/types/receipt';

/** Public n8n webhook URL (from env); safe to show in the UI after PIN unlock. */
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;
export const N8N_GMAIL_LIMIT_WEBHOOK_URL = import.meta.env.VITE_N8N_GMAIL_LIMIT_WEBHOOK_URL as
  | string
  | undefined;
export const N8N_GMAIL_ALL_WEBHOOK_URL = import.meta.env.VITE_N8N_GMAIL_ALL_WEBHOOK_URL as
  | string
  | undefined;
const API_KEY = import.meta.env.VITE_N8N_API_KEY;

export interface SubmitReceiptResponse {
  success: boolean;
  data?: ExtractedReceipt & { sheetRow?: number };
  error?: string;
}

export interface GmailScanResponse {
  success: boolean;
  mode?: 'limit' | 'all';
  processed?: number;
  purchases?: number;
  refunds?: number;
  skipped?: number;
  accepted?: boolean;
  toProcess?: number;
  message?: string;
  errors?: string[];
}

async function postGmailWebhook(url: string | undefined): Promise<GmailScanResponse> {
  if (!url) {
    throw new Error('Gmail webhook URL not configured');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY || '',
    },
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

/** Scan up to 50 Purchases-category Gmail emails; awaits full summary. */
export async function scanGmailBillsLimit(): Promise<GmailScanResponse> {
  return postGmailWebhook(N8N_GMAIL_LIMIT_WEBHOOK_URL);
}

/** Scan all Purchases-category Gmail emails; returns early acceptance response. */
export async function scanGmailBillsAll(): Promise<GmailScanResponse> {
  return postGmailWebhook(N8N_GMAIL_ALL_WEBHOOK_URL);
}

/**
 * Submit a receipt image to the n8n webhook for processing.
 * Sends as multipart/form-data with API key auth header.
 */
export async function submitReceipt(imageFile: File): Promise<SubmitReceiptResponse> {
  if (!N8N_WEBHOOK_URL) {
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

  const response = await fetch(N8N_WEBHOOK_URL, {
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
