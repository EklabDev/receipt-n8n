import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ExtractedReceipt } from '@/types/receipt';

interface StatusIndicatorProps {
  data: ExtractedReceipt;
  onDismiss: () => void;
}

export function StatusIndicator({ data, onDismiss }: StatusIndicatorProps) {
  return (
    <Card className="animate-in slide-in-from-bottom-4 border-success/30 bg-success/5">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <h3 className="text-sm font-semibold">Receipt Processed</h3>
        </div>

        {/* Extracted data summary */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Vendor</p>
            <p className="font-medium truncate">{data.vendor}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-medium">{data.date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-foreground">
              ${data.total.toFixed(2)} {data.currency}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tax</p>
            <p className="font-medium">${data.tax.toFixed(2)}</p>
          </div>
        </div>

        {/* Category badge */}
        <div className="mt-3">
          <Badge variant="secondary" className="text-xs">
            {data.category}
          </Badge>
          {data.confidence !== undefined && (
            <Badge
              variant="outline"
              className="ml-2 text-[10px] text-muted-foreground"
            >
              {Math.round(data.confidence * 100)}% confidence
            </Badge>
          )}
        </div>

        {/* Items */}
        {data.items && data.items.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Items
              </p>
              {data.items.slice(0, 5).map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="truncate text-muted-foreground">
                    {item.quantity && item.quantity > 1
                      ? `${item.quantity}× `
                      : ''}
                    {item.description}
                  </span>
                  <span className="shrink-0 font-medium tabular-nums ml-2">
                    ${item.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              {data.items.length > 5 && (
                <p className="text-[10px] text-muted-foreground">
                  +{data.items.length - 5} more items
                </p>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {data.driveLink && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              asChild
            >
              <a href={data.driveLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3 w-3" />
                View in Drive
              </a>
            </Button>
          )}
          <Button size="sm" className="text-xs flex-1" onClick={onDismiss}>
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
