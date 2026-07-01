import { ReceiptCard } from '@/components/ReceiptCard';
import { FileX2 } from 'lucide-react';
import type { Receipt } from '@/types/receipt';

interface ReceiptHistoryProps {
  receipts: Receipt[];
  onDelete?: (receipt: Receipt) => Promise<void>;
}

export function ReceiptHistory({ receipts, onDelete }: ReceiptHistoryProps) {
  if (receipts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/80 mb-4">
          <FileX2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          No receipts yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Tap the camera button to scan your first receipt
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {receipts.map((receipt) => (
        <ReceiptCard key={receipt.id} receipt={receipt} onDelete={onDelete} />
      ))}
    </div>
  );
}
