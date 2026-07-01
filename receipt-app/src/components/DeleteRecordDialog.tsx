import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Receipt } from '@/types/receipt';

interface DeleteRecordDialogProps {
  receipt: Receipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (receipt: Receipt) => Promise<void>;
}

export function DeleteRecordDialog({
  receipt,
  open,
  onOpenChange,
  onConfirm,
}: DeleteRecordDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasSheetKey = Boolean(receipt?.sheetSubmittedAt || receipt?.emailTimestamp);
  const vendor = receipt?.extractedData?.vendor || 'this record';

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep(1);
      setIsDeleting(false);
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!receipt) return;
    setIsDeleting(true);
    try {
      await onConfirm(receipt);
      handleOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Delete expense record?</DialogTitle>
              <DialogDescription>
                You are about to delete <strong>{vendor}</strong>
                {receipt?.extractedData?.total != null && (
                  <> (${Math.abs(receipt.extractedData.total).toFixed(2)})</>
                )}
                . This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {!hasSheetKey && (
              <p className="text-xs text-muted-foreground">
                This record has no Google Sheet key — only local history will be removed.
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => setStep(2)}>
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Confirm permanent deletion</DialogTitle>
              <DialogDescription>
                {hasSheetKey
                  ? 'This will permanently delete the row from your Google Sheet expense tracker.'
                  : 'This will remove the record from your device only.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" disabled={isDeleting} onClick={() => setStep(1)}>
                Go back
              </Button>
              <Button variant="destructive" disabled={isDeleting} onClick={handleConfirm}>
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  'Delete permanently'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
