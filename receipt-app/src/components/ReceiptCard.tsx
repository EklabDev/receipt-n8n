import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DeleteRecordDialog } from '@/components/DeleteRecordDialog';
import { CheckCircle2, AlertCircle, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Receipt } from '@/types/receipt';

interface ReceiptCardProps {
  receipt: Receipt;
  onDelete?: (receipt: Receipt) => Promise<void>;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  uploading: {
    icon: Clock,
    label: 'Processing',
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  success: {
    icon: CheckCircle2,
    label: 'Done',
    className: 'bg-success/10 text-success border-success/30',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
} as const;

export function ReceiptCard({ receipt, onDelete }: ReceiptCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const config = statusConfig[receipt.status];
  const StatusIcon = config.icon;
  const data = receipt.extractedData;
  const date = new Date(receipt.submittedAt);

  return (
    <>
      <Card className="overflow-hidden transition-all hover:shadow-md py-0 gap-0">
        <CardContent className="flex gap-3 p-3">
          {/* Thumbnail */}
          <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
            {receipt.imageData && (
              <img
                src={receipt.imageData}
                alt="Receipt thumbnail"
                className="h-full w-full object-cover"
              />
            )}
          </div>

          {/* Info */}
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="truncate text-sm font-semibold">
                  {data?.vendor || 'Processing...'}
                </h3>
                <div className="flex shrink-0 items-center gap-1">
                  {onDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      aria-label="Delete record"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] px-1.5 py-0', config.className)}
                  >
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
              </div>
              {data?.category && (
                <p className="mt-0.5 text-xs text-muted-foreground">{data.category}</p>
              )}
            </div>

            <div className="flex items-end justify-between">
              <p className="text-[11px] text-muted-foreground">
                {date.toLocaleDateString('en-CA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <div className="flex items-center gap-2">
                {data?.total !== undefined && (
                  <span className="text-sm font-semibold tabular-nums">
                    ${data.total.toFixed(2)}
                  </span>
                )}
                {data?.driveLink && (
                  <a
                    href={data.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80"
                    aria-label="View in Google Drive"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {onDelete && (
        <DeleteRecordDialog
          receipt={receipt}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
