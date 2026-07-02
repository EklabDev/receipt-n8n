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
import type { Trip } from '@/types/mileage';

interface DeleteTripDialogProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (trip: Trip) => Promise<void>;
}

export function DeleteTripDialog({
  trip,
  open,
  onOpenChange,
  onConfirm,
}: DeleteTripDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasSheetKey = Boolean(trip?.sheetSubmittedAt);
  const label = trip?.businessPurpose || 'this trip';

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep(1);
      setIsDeleting(false);
    }
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (!trip) return;
    setIsDeleting(true);
    try {
      await onConfirm(trip);
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
              <DialogTitle>Delete mileage record?</DialogTitle>
              <DialogDescription>
                You are about to delete <strong>{label}</strong>
                {trip?.distanceKm != null && <> ({trip.distanceKm.toFixed(2)} km)</>}. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {!hasSheetKey && (
              <p className="text-xs text-muted-foreground">
                This trip has no Google Sheet key — only local history will be removed.
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
                  ? 'This will permanently delete the row from your Mileage tab.'
                  : 'This will remove the trip from your device only.'}
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
