import type { LucideIcon } from "lucide-react";
import { AlertTriangle, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) => (
  <div
    role="status"
    className={cn(
      "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center",
      className,
    )}
  >
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
      <Icon aria-hidden="true" className="h-6 w-6 text-primary" />
    </div>
    <p className="text-base font-semibold text-foreground">{title}</p>
    {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({
  title = "Something went wrong",
  description = "We couldn't load this right now. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
  className?: string;
}) => (
  <div
    role="alert"
    className={cn(
      "flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
      className,
    )}
  >
    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
      <AlertTriangle aria-hidden="true" className="h-6 w-6 text-destructive" />
    </div>
    <p className="text-base font-semibold text-foreground">{title}</p>
    <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
    <Button onClick={onRetry} variant="outline" className="mt-4 rounded-xl">
      <RotateCw aria-hidden="true" className="mr-2 h-4 w-4" />
      Retry
    </Button>
  </div>
);

export const ListSkeleton = ({ rows = 4, thumb = true }: { rows?: number; thumb?: boolean }) => (
  <div aria-busy="true" aria-label="Loading" className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        {thumb && <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export const StatGridSkeleton = ({ count = 4, cols = 2 }: { count?: number; cols?: number }) => (
  <div aria-busy="true" aria-label="Loading" className={cn("grid gap-3", cols === 2 ? "grid-cols-2" : "grid-cols-3")}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <Skeleton className="h-5 w-5 rounded-md" />
        <Skeleton className="h-6 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    ))}
  </div>
);

export const EventCardSkeleton = ({ count = 2 }: { count?: number }) => (
  <div aria-busy="true" aria-label="Loading events" className="space-y-4 px-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-3xl border border-border bg-card">
        <Skeleton className="aspect-[4/5] w-full rounded-none sm:aspect-video" />
        <div className="space-y-2 p-4">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
