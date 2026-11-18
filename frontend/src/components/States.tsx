export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
      <span className="mr-3 size-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      Loading your workspace…
    </div>
  );
}

export function InlineLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
      <span className="size-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      {label}
    </div>
  );
}

export function ErrorMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      <span>{message}</span>
      {onRetry && (
        <button className="ml-3 font-semibold underline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
