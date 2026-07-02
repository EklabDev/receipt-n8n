import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { MileageTripPayload } from '@/types/mileage';

interface ManualTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: Omit<MileageTripPayload, 'submittedAt' | 'trackingMode'>) => Promise<void>;
  isSubmitting?: boolean;
}

export function ManualTripDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: ManualTripDialogProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [distanceKm, setDistanceKm] = useState('');
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setDate(today);
      setDistanceKm('');
      setBusinessPurpose('');
      setStartLocation('');
      setEndLocation('');
    }
    onOpenChange(next);
  };

  const handleSubmit = async () => {
    const km = parseFloat(distanceKm);
    if (!date || !businessPurpose.trim() || !Number.isFinite(km) || km <= 0) return;

    const endIso = new Date().toISOString();
    const startIso = new Date(new Date(endIso).getTime() - 60 * 60 * 1000).toISOString();

    await onSubmit({
      startTime: startIso,
      endTime: endIso,
      distanceKm: km,
      businessPurpose: businessPurpose.trim(),
      startLocation: startLocation.trim() || undefined,
      endLocation: endLocation.trim() || undefined,
    });
    handleOpenChange(false);
  };

  const isValid =
    Boolean(date) &&
    Boolean(businessPurpose.trim()) &&
    Number.isFinite(parseFloat(distanceKm)) &&
    parseFloat(distanceKm) > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual trip entry</DialogTitle>
          <DialogDescription>
            Record a business trip when GPS tracking was unavailable.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Distance (km)</label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="12.5"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Business purpose</label>
            <Input
              placeholder="Client visit, supply run…"
              value={businessPurpose}
              onChange={(e) => setBusinessPurpose(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Start (optional)</label>
            <Input
              placeholder="Office, 123 Main St…"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">End (optional)</label>
            <Input
              placeholder="Client site…"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              'Save trip'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
