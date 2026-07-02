import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { AppTabs, type AppSection } from '@/components/AppTabs';
import { GmailPanel } from '@/components/GmailPanel';
import { MileagePanel } from '@/components/MileagePanel';
import { PinLock } from '@/components/PinLock';
import { CameraCapture, createThumbnail } from '@/components/CameraCapture';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { ReceiptHistory } from '@/components/ReceiptHistory';
import { StatusIndicator } from '@/components/StatusIndicator';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Toaster, toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useInfiniteSheetRecords } from '@/hooks/useInfiniteSheetRecords';
import { deleteExpenseRecord } from '@/lib/api';
import { useReceiptApi } from '@/hooks/useReceiptApi';
import type { Receipt } from '@/types/receipt';

type AppView = 'capture' | 'preview' | 'result';

function App() {
  const [isUnlocked, setIsUnlocked] = useLocalStorage('receipt-unlocked', false);
  const [section, setSection] = useState<AppSection>('receipts');
  const [view, setView] = useState<AppView>('capture');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const capturedFileRef = useRef<File | null>(null);
  const { isUploading, lastResult, error, submit, reset } = useReceiptApi();

  const {
    items: receipts,
    loading: receiptsLoading,
    initialLoading: receiptsInitialLoading,
    hasMore: receiptsHasMore,
    loadMore: loadMoreReceipts,
    refresh: refreshReceipts,
    error: receiptsError,
    total: receiptsTotal,
  } = useInfiniteSheetRecords<Receipt>('receipt');

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
  }, [setIsUnlocked]);

  const handleLogout = useCallback(() => {
    setIsUnlocked(false);
    setCapturedFile(null);
    capturedFileRef.current = null;
    reset();
    setView('capture');
    setSection('receipts');
  }, [setIsUnlocked, reset]);

  const handleCapture = useCallback((file: File) => {
    setCapturedFile(file);
    capturedFileRef.current = file;
    setView('preview');
  }, []);

  const handleSubmit = useCallback(async () => {
    const file = capturedFileRef.current;
    if (!file) return;

    try {
      const thumbnail = await createThumbnail(file);
      const result = await submit(file, thumbnail);

      if (result.status === 'success') {
        setView('result');
        toast.success('Receipt processed successfully!');
        await refreshReceipts();
      } else {
        toast.error(result.errorMessage || 'Failed to process receipt');
      }
    } catch {
      toast.error('Something went wrong');
    }
  }, [submit, refreshReceipts]);

  const handleRetake = useCallback(() => {
    setCapturedFile(null);
    capturedFileRef.current = null;
    reset();
    setView('capture');
  }, [reset]);

  const handleDismiss = useCallback(() => {
    setCapturedFile(null);
    capturedFileRef.current = null;
    reset();
    setView('capture');
  }, [reset]);

  const handleFabClick = useCallback(() => {
    setSection('receipts');
    handleDismiss();
    setTimeout(() => {
      const input = document.getElementById('camera-input') as HTMLInputElement;
      input?.click();
    }, 100);
  }, [handleDismiss]);

  const handleDeleteReceipt = useCallback(
    async (receipt: Receipt) => {
      const sheetKey = receipt.sheetSubmittedAt ?? receipt.extractedData?.submittedAt;

      try {
        if (sheetKey) {
          await deleteExpenseRecord({ submittedAt: sheetKey });
        }
        await refreshReceipts();
        toast.success('Record deleted');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete record');
        throw err;
      }
    },
    [refreshReceipts]
  );

  if (!isUnlocked) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header onLogout={handleLogout} />
      <Toaster position="top-center" richColors closeButton />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">
        <AppTabs active={section} onChange={setSection} />

        {section === 'mileage' ? (
          <MileagePanel />
        ) : section === 'gmail' ? (
          <GmailPanel />
        ) : (
          <>
            {view === 'result' && lastResult?.extractedData && (
              <div className="mb-5">
                <StatusIndicator data={lastResult.extractedData} onDismiss={handleDismiss} />
              </div>
            )}

            {view === 'preview' && capturedFile && (
              <div className="mb-5">
                <ReceiptPreview
                  imageFile={capturedFile}
                  isUploading={isUploading}
                  error={error}
                  onSubmit={handleSubmit}
                  onRetake={handleRetake}
                />
              </div>
            )}

            {view === 'capture' && (
              <div className="mb-5">
                <CameraCapture onCapture={handleCapture} />
              </div>
            )}

            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-foreground">Recent Receipts</h2>
              </div>
              <ReceiptHistory
                receipts={receipts}
                onDelete={handleDeleteReceipt}
                loading={receiptsLoading}
                initialLoading={receiptsInitialLoading}
                hasMore={receiptsHasMore}
                onLoadMore={loadMoreReceipts}
                error={receiptsError}
                onRefresh={refreshReceipts}
                total={receiptsTotal}
                variant="receipt"
              />
            </div>
          </>
        )}
      </main>

      {section === 'receipts' && view !== 'preview' && (
        <FloatingActionButton onClick={handleFabClick} />
      )}

      <div className="h-24" />
    </div>
  );
}

export default App;
