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
  confidence: number;
  driveLink?: string;
}

export interface Receipt {
  id: string;
  imageData: string; // base64 thumbnail for history display
  status: 'pending' | 'uploading' | 'success' | 'error';
  submittedAt: string; // ISO date
  extractedData?: ExtractedReceipt;
  errorMessage?: string;
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
