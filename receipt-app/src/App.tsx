import { useState, useCallback, useRef } from 'react';
import { Header } from '@/components/Header';
import { GmailScanPanel } from '@/components/GmailScanPanel';
import { PinLock } from '@/components/PinLock';
import { CameraCapture, createThumbnail } from '@/components/CameraCapture';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { ReceiptHistory } from '@/components/ReceiptHistory';
import { StatusIndicator } from '@/components/StatusIndicator';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { Toaster, toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useReceiptApi } from '@/hooks/useReceiptApi';
import type { Receipt } from '@/types/receipt';

type AppView = 'capture' | 'preview' | 'result';

function App() {
  const [isUnlocked, setIsUnlocked] = useLocalStorage('receipt-unlocked', false);
  const [receipts, setReceipts] = useLocalStorage<Receipt[]>('receipt-history', []);
  const [view, setView] = useState<AppView>('capture');
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const capturedFileRef = useRef<File | null>(null);
  const { isUploading, lastResult, error, submit, reset } = useReceiptApi();

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
  }, [setIsUnlocked]);

  const handleLogout = useCallback(() => {
    setIsUnlocked(false);
    setCapturedFile(null);
    capturedFileRef.current = null;
    reset();
    setView('capture');
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

      // Add to history (newest first)
      setReceipts((prev) => [result, ...prev]);

      if (result.status === 'success') {
        setView('result');
        toast.success('Receipt processed successfully!');
      } else {
        toast.error(result.errorMessage || 'Failed to process receipt');
      }
    } catch {
      toast.error('Something went wrong');
    }
  }, [submit, setReceipts]);

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
    handleDismiss();
    // Trigger the hidden file input
    setTimeout(() => {
      const input = document.getElementById('camera-input') as HTMLInputElement;
      input?.click();
    }, 100);
  }, [handleDismiss]);

  // PIN Lock gate
  if (!isUnlocked) {
    return <PinLock onUnlock={handleUnlock} />;
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header onLogout={handleLogout} />
      <Toaster position="top-center" richColors closeButton />

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5">
        <GmailScanPanel />

        {/* Result view — shows extracted data summary */}
        {view === 'result' && lastResult?.extractedData && (
          <div className="mb-5">
            <StatusIndicator
              data={lastResult.extractedData}
              onDismiss={handleDismiss}
            />
          </div>
        )}

        {/* Preview view — shows captured image before submit */}
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

        {/* Capture view — camera input */}
        {view === 'capture' && (
          <div className="mb-5">
            <CameraCapture onCapture={handleCapture} />
          </div>
        )}

        {/* Receipt history */}
        <div className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Recent Receipts</h2>
            {receipts.length > 0 && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <ReceiptHistory receipts={receipts} />
        </div>
      </main>

      {/* FAB — visible only in capture/result view */}
      {view !== 'preview' && (
        <FloatingActionButton onClick={handleFabClick} />
      )}

      {/* PWA bottom padding */}
      <div className="h-24" />
    </div>
  );
}

export default App;
