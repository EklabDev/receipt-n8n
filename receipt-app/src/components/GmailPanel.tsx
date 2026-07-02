import { useCallback } from 'react';
import { toast } from 'sonner';
import { GmailScanPanel } from '@/components/GmailScanPanel';
import { ReceiptHistory } from '@/components/ReceiptHistory';
import { useInfiniteSheetRecords } from '@/hooks/useInfiniteSheetRecords';
import { deleteEmailRecord } from '@/lib/api';
import type { Receipt } from '@/types/receipt';

export function GmailPanel() {
  const {
    items: purchases,
    loading,
    initialLoading,
    hasMore,
    loadMore,
    refresh,
    error,
    total,
  } = useInfiniteSheetRecords<Receipt>('email');

  const handleDelete = useCallback(
    async (receipt: Receipt) => {
      const emailKey = receipt.emailTimestamp ?? receipt.extractedData?.emailTimestamp;
      try {
        if (emailKey) {
          await deleteEmailRecord({ emailTimestamp: emailKey });
        }
        await refresh();
        toast.success('Record deleted');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete record');
        throw err;
      }
    },
    [refresh]
  );

  const handleScanComplete = useCallback(() => {
    void refresh();
  }, [refresh]);

  return (
    <>
      <GmailScanPanel onScanComplete={handleScanComplete} />

      <div className="mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Gmail Purchases</h2>
        </div>
        <ReceiptHistory
          receipts={purchases}
          onDelete={handleDelete}
          loading={loading}
          initialLoading={initialLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          error={error}
          onRefresh={refresh}
          total={total}
          variant="email"
          emptyTitle="No Gmail purchases yet"
          emptyDescription="Run a Gmail scan to import purchase emails"
        />
      </div>
    </>
  );
}
