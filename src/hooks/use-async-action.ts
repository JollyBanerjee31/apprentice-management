"use client";

import { useCallback, useState } from "react";

interface UseAsyncActionResult<Args extends unknown[], Result> {
  execute: (...args: Args) => Promise<Result | undefined>;
  loading: boolean;
  error: Error | null;
}

// Wraps a mutation (API call, Firestore write, etc.) with loading/error
// state so buttons can show a spinner + disabled state without each
// component hand-rolling its own submitting/pending boolean.
export function useAsyncAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
): UseAsyncActionResult<Args, Result> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<Result | undefined> => {
      setLoading(true);
      setError(null);
      try {
        return await action(...args);
      } catch (err) {
        const normalized = err instanceof Error ? err : new Error(String(err));
        setError(normalized);
        throw normalized;
      } finally {
        setLoading(false);
      }
    },
    [action],
  );

  return { execute, loading, error };
}
