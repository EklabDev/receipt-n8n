import { Receipt } from 'lucide-react';
import { N8N_WEBHOOK_URL } from '@/lib/api';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl safe-top">
      <div className="mx-auto max-w-lg px-4 py-2.5">
        <div className="flex h-9 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-tight tracking-tight">
                Receipt Scanner
              </h1>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight">
                by EKLab
              </p>
            </div>
          </div>
        </div>
        {N8N_WEBHOOK_URL ? (
          <div className="mt-2 border-t border-border/40 pt-2">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Webhook
            </p>
            <p className="mt-0.5 break-all font-mono text-[11px] leading-snug text-foreground/90">
              {N8N_WEBHOOK_URL}
            </p>
          </div>
        ) : (
          <div className="mt-2 border-t border-border/40 pt-2">
            <p className="text-[11px] text-amber-600 dark:text-amber-500">
              Webhook URL not configured (set VITE_N8N_WEBHOOK_URL).
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
