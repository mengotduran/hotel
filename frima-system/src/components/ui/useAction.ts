"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions/shared";

/**
 * Wraps a server action with pending and error state, and refreshes the route
 * on success so server-rendered figures reflect the change immediately.
 */
export function useAction<Args extends unknown[], T = void>(
  action: (...args: Args) => Promise<ActionResult<T>>,
  options: { onSuccess?: (data: T extends void ? undefined : T) => void } = {},
) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    (...args: Args) => {
      setError(null);
      startTransition(async () => {
        const result = await action(...args);
        if (result.ok) {
          options.onSuccess?.(
            (result as { data?: unknown }).data as T extends void ? undefined : T,
          );
          router.refresh();
        } else {
          setError(result.error);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, router],
  );

  return { run, pending, error, clearError: () => setError(null) };
}
