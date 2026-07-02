import { Loader2 } from 'lucide-react';
import { TripCard } from '@/components/TripCard';
import { InfiniteScrollSentinel } from '@/components/InfiniteScrollSentinel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Trip } from '@/types/mileage';

interface TripHistoryProps {
  trips: Trip[];
  onDelete?: (trip: Trip) => Promise<void>;
  loading?: boolean;
  initialLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  error?: string | null;
  onRefresh?: () => void;
  total?: number;
}

export function TripHistory({
  trips,
  onDelete,
  loading = false,
  initialLoading = false,
  hasMore = false,
  onLoadMore,
  error,
  onRefresh,
  total,
}: TripHistoryProps) {
  if (initialLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error && trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <p className="text-sm text-destructive">{error}</p>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No trips recorded yet. Start a GPS trip or add one manually.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {total != null && total > 0 && (
        <p className="text-xs text-muted-foreground tabular-nums">
          Showing {trips.length} of {total}
        </p>
      )}
      {trips.map((trip) => (
        <TripCard key={trip.id} trip={trip} onDelete={onDelete} />
      ))}
      {loading && (
        <div className="flex justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {onLoadMore && (
        <InfiniteScrollSentinel
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          loading={loading}
        />
      )}
    </div>
  );
}
