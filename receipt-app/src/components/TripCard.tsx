import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteTripDialog } from '@/components/DeleteTripDialog';
import { CheckCircle2, AlertCircle, Clock, MapPin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trip } from '@/types/mileage';

interface TripCardProps {
  trip: Trip;
  onDelete?: (trip: Trip) => Promise<void>;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  uploading: {
    icon: Clock,
    label: 'Saving',
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  success: {
    icon: CheckCircle2,
    label: 'Done',
    className: 'bg-success/10 text-success border-success/30',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
} as const;

export function TripCard({ trip, onDelete }: TripCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const config = statusConfig[trip.status];
  const StatusIcon = config.icon;
  const date = new Date(trip.endTime || trip.submittedAt);

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md py-0 gap-0">
        <CardContent className="flex gap-3 p-3">
          <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-6 w-6 text-primary" />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold">{trip.businessPurpose}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  {onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Delete trip"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] px-1.5 py-0', config.className)}
                  >
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {trip.trackingMode} · {trip.distanceKm.toFixed(2)} km
              </p>
            </div>

            <div className="flex items-end justify-between">
              <p className="text-[11px] text-muted-foreground">
                {date.toLocaleDateString('en-CA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              {trip.deduction != null && (
                <span className="text-sm font-semibold tabular-nums">
                  ${trip.deduction.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {onDelete && (
        <DeleteTripDialog
          trip={trip}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
