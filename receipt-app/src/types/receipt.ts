export interface ReceiptItem {
  description: string;
  amount: number;
  quantity?: number;
}

export interface ExtractedReceipt {
  vendor: string;
  date: string;
  total: number;
  tax: number;
  currency: string;
  category: string;
  items: ReceiptItem[];
  itemsSummary?: string;
  confidence: number;
  driveLink?: string;
  /** Sheet dedup key from n8n (camera receipts) */
  submittedAt?: string;
  /** Sheet dedup key from n8n (Gmail imports) */
  emailTimestamp?: string;
  transactionType?: string;
  source?: string;
  gmailMessageId?: string;
  driveFilename?: string;
}

export interface Receipt {
  id: string;
  imageData: string; // base64 thumbnail for history display
  status: 'pending' | 'uploading' | 'success' | 'error';
  submittedAt: string; // ISO date — local display / fallback
  extractedData?: ExtractedReceipt;
  errorMessage?: string;
  /** Google Sheet row key — `Submitted At` column value */
  sheetSubmittedAt?: string;
  /** Google Sheet row key — `Email Timestamp` column value */
  emailTimestamp?: string;
}

export type ReceiptCategory =
  | 'Office Supplies'
  | 'Travel'
  | 'Meals & Entertainment'
  | 'Software & Subscriptions'
  | 'Hardware & Equipment'
  | 'Professional Services'
  | 'Utilities'
  | 'Transportation'
  | 'Other';

export const RECEIPT_CATEGORIES: ReceiptCategory[] = [
  'Office Supplies',
  'Travel',
  'Meals & Entertainment',
  'Software & Subscriptions',
  'Hardware & Equipment',
  'Professional Services',
  'Utilities',
  'Transportation',
  'Other',
];
