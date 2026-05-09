import { Receipt } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl safe-top">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
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
    </header>
  );
}
