import { cn } from '@/lib/utils';

export type AppSection = 'receipts' | 'gmail' | 'mileage';

interface AppTabsProps {
  active: AppSection;
  onChange: (section: AppSection) => void;
}

const tabs: { id: AppSection; label: string }[] = [
  { id: 'receipts', label: 'Receipts' },
  { id: 'gmail', label: 'Gmail' },
  { id: 'mileage', label: 'Mileage' },
];

export function AppTabs({ active, onChange }: AppTabsProps) {
  return (
    <div className="mb-5 flex rounded-lg border bg-muted/40 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={cn(
            'flex-1 rounded-md px-2 py-2 text-sm font-medium transition-colors',
            active === tab.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
