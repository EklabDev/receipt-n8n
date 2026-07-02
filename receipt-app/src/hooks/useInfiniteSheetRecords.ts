import { useCallback, useEffect, useRef, useState } from 'react';
import { listSheetRecords, type ListSheetRecordsParams } from '@/lib/api';

const PAGE_SIZE = 20;

export function useInfiniteSheetRecords<T>(source: ListSheetRecordsParams['source']) {
  const [items, setItems] = useState<T[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);

  const refresh = useCallback(async () => {
    setInitialLoading(true);
    setError(null);
    loadingRef.current = true;

    try {
      const res = await listSheetRecords<T>({ source, offset: 0, limit: PAGE_SIZE });
      setItems(res.items);
      setOffset(res.nextOffset ?? res.items.length);
      setHasMore(res.hasMore);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load records');
      setItems([]);
      setHasMore(false);
      setTotal(0);
    } finally {
      setInitialLoading(false);
      loadingRef.current = false;
    }
  }, [source]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const res = await listSheetRecords<T>({ source, offset, limit: PAGE_SIZE });
      setItems((prev) => {
        const seen = new Set(prev.map((item) => (item as { id?: string }).id));
        const next = res.items.filter((item) => !seen.has((item as { id?: string }).id));
        return [...prev, ...next];
      });
      setOffset(res.nextOffset ?? offset + res.items.length);
      setHasMore(res.hasMore);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more records');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [source, offset, hasMore]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    items,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
  };
}
