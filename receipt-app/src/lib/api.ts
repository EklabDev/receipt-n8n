import type { Receipt, ExtractedReceipt } from '@/types/receipt';
import type { MileageTripPayload, MileageTripResult, Trip } from '@/types/mileage';

/** Public n8n webhook URL (from env); safe to show in the UI after PIN unlock. */
export const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;
export const N8N_GMAIL_LIMIT_WEBHOOK_URL = import.meta.env.VITE_N8N_GMAIL_LIMIT_WEBHOOK_URL as
  | string
  | undefined;
export const N8N_GMAIL_ALL_WEBHOOK_URL = import.meta.env.VITE_N8N_GMAIL_ALL_WEBHOOK_URL as
  | string
  | undefined;
export const N8N_DELETE_WEBHOOK_URL = import.meta.env.VITE_N8N_DELETE_WEBHOOK_URL as
  | string
  | undefined;
export const N8N_EMAIL_DELETE_WEBHOOK_URL = import.meta.env.VITE_N8N_EMAIL_DELETE_WEBHOOK_URL as
  | string
  | undefined;
export const N8N_MILEAGE_WEBHOOK_URL = import.meta.env.VITE_N8N_MILEAGE_WEBHOOK_URL as
  | string
  | undefined;
export const N8N_MILEAGE_DELETE_WEBHOOK_URL = import.meta.env
  .VITE_N8N_MILEAGE_DELETE_WEBHOOK_URL as string | undefined;
export const N8N_RECORDS_LIST_WEBHOOK_URL = import.meta.env.VITE_N8N_RECORDS_LIST_WEBHOOK_URL as
  | string
  | undefined;
const API_KEY = import.meta.env.VITE_N8N_API_KEY;

export type SheetRecordSource = 'receipt' | 'email' | 'mileage';

export interface ListSheetRecordsParams {
  source: SheetRecordSource;
  offset?: number;
  limit?: number;
}

export interface ListSheetRecordsResponse<T> {
  success: boolean;
  source: SheetRecordSource;
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  nextOffset: number | null;
  error?: string;
}

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

/** Fetch paginated records from Google Sheets via n8n Receipt Getter. */
export async function listSheetRecords<T>(
  params: ListSheetRecordsParams
): Promise<ListSheetRecordsResponse<T>> {
  if (!N8N_RECORDS_LIST_WEBHOOK_URL) {
    throw new Error('Records list webhook URL not configured');
  }

  const response = await fetch(N8N_RECORDS_LIST_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || '',
    },
    body: JSON.stringify({
      source: params.source,
      offset: params.offset ?? 0,
      limit: params.limit ?? 20,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as ListSheetRecordsResponse<T> & {
    error?: string;
  };

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized – check your API key');
    }
    throw new Error(body.error || `Server error (${response.status})`);
  }

  return body;
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

export interface DeleteExpenseResponse {
  success: boolean;
  deleted?: boolean;
  error?: string;
  rowNumber?: number;
}

export interface DeleteExpenseParams {
  submittedAt: string;
}

/** Delete a camera receipt row from the Receipts tab. */
export async function deleteExpenseRecord(
  params: DeleteExpenseParams
): Promise<DeleteExpenseResponse> {
  if (!N8N_DELETE_WEBHOOK_URL) {
    throw new Error('Delete webhook URL not configured');
  }
  if (!params.submittedAt) {
    throw new Error('No sheet key available for this record');
  }

  const response = await fetch(N8N_DELETE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || '',
    },
    body: JSON.stringify({ submittedAt: params.submittedAt }),
  });

  const body = (await response.json().catch(() => ({}))) as DeleteExpenseResponse & {
    error?: string;
  };

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized – check your API key');
    }
    throw new Error(body.error || `Server error (${response.status})`);
  }

  return body;
}

export interface DeleteEmailParams {
  emailTimestamp: string;
}

/** Delete a Gmail import row from the Email tab. */
export async function deleteEmailRecord(params: DeleteEmailParams): Promise<DeleteExpenseResponse> {
  if (!N8N_EMAIL_DELETE_WEBHOOK_URL) {
    throw new Error('Email delete webhook URL not configured');
  }
  if (!params.emailTimestamp) {
    throw new Error('No email timestamp available for this record');
  }

  const response = await fetch(N8N_EMAIL_DELETE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || '',
    },
    body: JSON.stringify({ emailTimestamp: params.emailTimestamp }),
  });

  const body = (await response.json().catch(() => ({}))) as DeleteExpenseResponse & {
    error?: string;
  };

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized – check your API key');
    }
    throw new Error(body.error || `Server error (${response.status})`);
  }

  return body;
}

export interface SubmitMileageResponse {
  success: boolean;
  data?: MileageTripResult;
  error?: string;
}

/** Submit a mileage trip to the n8n webhook. */
export async function submitMileageTrip(
  payload: MileageTripPayload
): Promise<SubmitMileageResponse> {
  if (!N8N_MILEAGE_WEBHOOK_URL) {
    throw new Error('Mileage webhook URL not configured');
  }

  const response = await fetch(N8N_MILEAGE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || '',
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as SubmitMileageResponse & {
    error?: string;
  };

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized – check your API key');
    }
    throw new Error(body.error || `Server error (${response.status})`);
  }

  return body;
}

export interface DeleteMileageParams {
  submittedAt: string;
}

/** Delete a mileage row from the Mileage tab. */
export async function deleteMileageRecord(
  params: DeleteMileageParams
): Promise<DeleteExpenseResponse> {
  if (!N8N_MILEAGE_DELETE_WEBHOOK_URL) {
    throw new Error('Mileage delete webhook URL not configured');
  }
  if (!params.submittedAt) {
    throw new Error('No sheet key available for this trip');
  }

  const response = await fetch(N8N_MILEAGE_DELETE_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY || '',
    },
    body: JSON.stringify({ submittedAt: params.submittedAt }),
  });

  const body = (await response.json().catch(() => ({}))) as DeleteExpenseResponse & {
    error?: string;
  };

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized – check your API key');
    }
    throw new Error(body.error || `Server error (${response.status})`);
  }

  return body;
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
  const sheetSubmittedAt = extractedData?.submittedAt;
  const emailTimestamp = extractedData?.emailTimestamp;

  return {
    id,
    imageData: thumbnailBase64,
    status,
    submittedAt: sheetSubmittedAt ?? new Date().toISOString(),
    extractedData,
    errorMessage,
    sheetSubmittedAt,
    emailTimestamp,
  };
}

/** Build a trip record for local mileage history. */
export function buildTripRecord(
  id: string,
  status: Trip['status'],
  payload: MileageTripPayload,
  result?: MileageTripResult,
  errorMessage?: string
): Trip {
  return {
    id,
    submittedAt: payload.submittedAt,
    startTime: payload.startTime,
    endTime: payload.endTime,
    startLocation: payload.startLocation,
    endLocation: payload.endLocation,
    distanceKm: result?.distanceKm ?? payload.distanceKm,
    businessPurpose: payload.businessPurpose,
    trackingMode: payload.trackingMode,
    deduction: result?.deduction,
    status,
    errorMessage,
    sheetSubmittedAt: payload.submittedAt,
  };
}
