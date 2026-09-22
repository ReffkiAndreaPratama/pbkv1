import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function Spinner({ className }: { className?: string }) {
  return (
    <div role="status" className={cn("flex items-center justify-center gap-2 text-sm text-muted-foreground", className)}>
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span>Memuat…</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-9 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="mt-4 h-64" />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/50 px-6 py-14 text-center">
      {icon && <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</div>}
      <h3 className="font-display font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-5 py-6 text-center">
      <p className="text-sm font-medium text-destructive">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-sm font-semibold text-primary underline underline-offset-4">
          Coba lagi
        </button>
      )}
    </div>
  );
}