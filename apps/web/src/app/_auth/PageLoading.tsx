import { Loader2 } from "lucide-react";

/** Shared full-height spinner for client-guarded pages while auth resolves. */
export function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2
        role="status"
        aria-label="loading"
        className="h-8 w-8 animate-spin text-blue-600"
      />
    </div>
  );
}
