import { useState, useCallback } from 'react';
import { Loader2, Mail, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import {
  scanGmailBillsAll,
  scanGmailBillsLimit,
  N8N_GMAIL_ALL_WEBHOOK_URL,
  N8N_GMAIL_LIMIT_WEBHOOK_URL,
  type GmailScanResponse,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type LastScan = GmailScanResponse & { scanType: 'limit' | 'all' };

export function GmailScanPanel() {
  const [isLimitLoading, setIsLimitLoading] = useState(false);
  const [isAllLoading, setIsAllLoading] = useState(false);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);

  const limitConfigured = Boolean(N8N_GMAIL_LIMIT_WEBHOOK_URL);
  const allConfigured = Boolean(N8N_GMAIL_ALL_WEBHOOK_URL);
  const isBusy = isLimitLoading || isAllLoading;

  const handleLimitScan = useCallback(async () => {
    if (!limitConfigured || isBusy) return;

    setIsLimitLoading(true);
    try {
      const result = await scanGmailBillsLimit();
      setLastScan({ ...result, scanType: 'limit' });
      toast.success(
        `Scan complete: ${result.processed ?? 0} processed (${result.purchases ?? 0} purchases, ${result.refunds ?? 0} refunds)`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gmail scan failed');
    } finally {
      setIsLimitLoading(false);
    }
  }, [isBusy, limitConfigured]);

  const handleAllScan = useCallback(async () => {
    if (!allConfigured || isBusy) return;

    setConfirmAllOpen(false);
    setIsAllLoading(true);
    try {
      const result = await scanGmailBillsAll();
      setLastScan({ ...result, scanType: 'all' });
      toast.success(result.message || 'Full Gmail scan started');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gmail scan failed');
    } finally {
      setIsAllLoading(false);
    }
  }, [allConfigured, isBusy]);

  if (!limitConfigured && !allConfigured) {
    return null;
  }

  return (
    <>
      <Card className="mb-5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">Gmail Purchases</CardTitle>
              <CardDescription className="text-xs">
                Scan Purchases-category emails for bills and refunds
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              disabled={!limitConfigured || isBusy}
              onClick={handleLimitScan}
            >
              {isLimitLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ScanLine />
              )}
              Scan recent purchases (50)
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={!allConfigured || isBusy}
              onClick={() => setConfirmAllOpen(true)}
            >
              {isAllLoading ? <Loader2 className="animate-spin" /> : <Mail />}
              Scan all purchases
            </Button>
          </div>

          {!limitConfigured && (
            <p className="text-[11px] text-amber-600 dark:text-amber-500">
              Set VITE_N8N_GMAIL_LIMIT_WEBHOOK_URL to enable limit scan.
            </p>
          )}
          {!allConfigured && (
            <p className="text-[11px] text-amber-600 dark:text-amber-500">
              Set VITE_N8N_GMAIL_ALL_WEBHOOK_URL to enable full scan.
            </p>
          )}

          {lastScan && (
            <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs">
              <p className="font-medium text-foreground">Last scan</p>
              {lastScan.scanType === 'limit' ? (
                <p className="mt-1 text-muted-foreground">
                  {lastScan.processed ?? 0} processed · {lastScan.purchases ?? 0} purchases ·{' '}
                  {lastScan.refunds ?? 0} refunds · {lastScan.skipped ?? 0} skipped
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  {lastScan.toProcess ?? 0} queued · {lastScan.skipped ?? 0} skipped ·{' '}
                  {lastScan.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmAllOpen} onOpenChange={setConfirmAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan all purchase emails?</DialogTitle>
            <DialogDescription>
              This may take several minutes for large inboxes. Processing continues in the
              background after you confirm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAllOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAllScan} disabled={isAllLoading}>
              {isAllLoading ? <Loader2 className="animate-spin" /> : null}
              Start scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
