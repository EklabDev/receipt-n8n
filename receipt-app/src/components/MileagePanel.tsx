import { useCallback, useEffect, useState } from 'react';
import { Car, Loader2, MapPin, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ManualTripDialog } from '@/components/ManualTripDialog';
import { TripHistory } from '@/components/TripHistory';
import { useGpsTracking } from '@/hooks/useGpsTracking';
import { useMileageApi } from '@/hooks/useMileageApi';
import { useInfiniteSheetRecords } from '@/hooks/useInfiniteSheetRecords';
import { N8N_MILEAGE_WEBHOOK_URL } from '@/lib/api';
import { formatCoords } from '@/lib/geo';
import type { MileageTripPayload, Trip } from '@/types/mileage';

function formatElapsed(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function MileagePanel() {
  const {
    items: trips,
    loading: tripsLoading,
    initialLoading: tripsInitialLoading,
    hasMore: tripsHasMore,
    loadMore: loadMoreTrips,
    refresh: refreshTrips,
    error: tripsError,
    total: tripsTotal,
  } = useInfiniteSheetRecords<Trip>('mileage');
  const [manualOpen, setManualOpen] = useState(false);
  const [purposeOpen, setPurposeOpen] = useState(false);
  const [businessPurpose, setBusinessPurpose] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showResume, setShowResume] = useState(false);

  const {
    isTracking,
    points,
    startedAt,
    distanceKm,
    error: gpsError,
    startTrip,
    stopTrip,
    resumeTrip,
    clearTrip,
  } = useGpsTracking();

  const { isSubmitting, submit, remove } = useMileageApi();

  useEffect(() => {
    const stored = localStorage.getItem('active-mileage-trip');
    if (stored && !isTracking) {
      setShowResume(true);
    }
  }, [isTracking]);

  useEffect(() => {
    if (!isTracking || !startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsedMs(Date.now() - start);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isTracking, startedAt]);

  useEffect(() => {
    if (gpsError) toast.error(gpsError);
  }, [gpsError]);

  const buildGpsPayload = useCallback(
    (purpose: string): MileageTripPayload => {
      const endTime = new Date().toISOString();
      const start = points[0];
      const end = points[points.length - 1];
      const submittedAt = endTime;

      return {
        submittedAt,
        startTime: startedAt ?? endTime,
        endTime,
        startLat: start?.lat,
        startLng: start?.lng,
        endLat: end?.lat,
        endLng: end?.lng,
        startLocation: start ? formatCoords(start.lat, start.lng) : undefined,
        endLocation: end ? formatCoords(end.lat, end.lng) : undefined,
        distanceKm,
        businessPurpose: purpose,
        trackingMode: 'GPS',
        gpsPointCount: points.length,
      };
    },
    [points, startedAt, distanceKm]
  );

  const handleStopAndSave = () => {
    if (distanceKm <= 0) {
      toast.error('No distance recorded — try manual entry instead');
      clearTrip();
      return;
    }
    stopTrip();
    setPurposeOpen(true);
  };

  const handlePurposeSubmit = async () => {
    const purpose = businessPurpose.trim();
    if (!purpose) return;

    const payload = buildGpsPayload(purpose);
    try {
      const result = await submit(payload);
      if (result.status === 'success') {
        toast.success(`Trip saved — ${result.distanceKm.toFixed(2)} km`);
        await refreshTrips();
      } else {
        toast.error(result.errorMessage || 'Failed to save trip');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusinessPurpose('');
      setPurposeOpen(false);
      clearTrip();
      setShowResume(false);
    }
  };

  const handleManualSubmit = async (
    data: Omit<MileageTripPayload, 'submittedAt' | 'trackingMode'>
  ) => {
    const submittedAt = new Date().toISOString();
    const payload: MileageTripPayload = {
      ...data,
      submittedAt,
      trackingMode: 'Manual',
    };
    try {
      const result = await submit(payload);
      if (result.status === 'success') {
        toast.success(`Trip saved — ${result.distanceKm.toFixed(2)} km`);
        await refreshTrips();
      } else {
        toast.error(result.errorMessage || 'Failed to save trip');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteTrip = async (trip: Trip) => {
    try {
      if (trip.sheetSubmittedAt) {
        await remove(trip);
      }
      await refreshTrips();
      toast.success('Trip deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete trip');
      throw err;
    }
  };

  const handleResume = () => {
    const ok = resumeTrip();
    if (ok) {
      setShowResume(false);
      toast.message('Trip resumed');
    }
  };

  const handleDiscardResume = () => {
    clearTrip();
    setShowResume(false);
  };

  return (
    <div>
      <Card className="mb-5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Car className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Business Mileage</CardTitle>
              <CardDescription className="text-xs">
                GPS trip tracking for tax records
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!N8N_MILEAGE_WEBHOOK_URL && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Set VITE_N8N_MILEAGE_WEBHOOK_URL to enable mileage recording.
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Keep the app open while driving. GPS may pause when the screen locks — use Manual Trip
            for missed drives.
          </p>

          {showResume && !isTracking && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="text-xs font-medium">Interrupted trip detected</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleResume}>
                  Resume trip
                </Button>
                <Button size="sm" variant="outline" onClick={handleDiscardResume}>
                  Discard
                </Button>
              </div>
            </div>
          )}

          {isTracking ? (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <MapPin className="h-4 w-4 animate-pulse" />
                Tracking in progress
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{distanceKm.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">km</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums">{formatElapsed(elapsedMs)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    elapsed
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                {points.length} GPS point{points.length !== 1 ? 's' : ''}
              </p>
              <Button
                className="w-full"
                variant="destructive"
                onClick={handleStopAndSave}
                disabled={isSubmitting}
              >
                <Square className="h-4 w-4" />
                Stop trip
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={startTrip}
                disabled={!N8N_MILEAGE_WEBHOOK_URL || isSubmitting}
              >
                <Play className="h-4 w-4" />
                Start trip
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => setManualOpen(true)}
                disabled={!N8N_MILEAGE_WEBHOOK_URL || isSubmitting}
              >
                Manual trip
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Recent Trips</h2>
        </div>
        <TripHistory
          trips={trips}
          onDelete={handleDeleteTrip}
          loading={tripsLoading}
          initialLoading={tripsInitialLoading}
          hasMore={tripsHasMore}
          onLoadMore={loadMoreTrips}
          error={tripsError}
          onRefresh={refreshTrips}
          total={tripsTotal}
        />
      </div>

      <Dialog open={purposeOpen} onOpenChange={setPurposeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Business purpose</DialogTitle>
            <DialogDescription>
              {distanceKm.toFixed(2)} km recorded. What was this trip for?
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Client visit, supply run…"
            value={businessPurpose}
            onChange={(e) => setBusinessPurpose(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurposeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePurposeSubmit}
              disabled={!businessPurpose.trim() || isSubmitting}
            >
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

      <ManualTripDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        onSubmit={handleManualSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
