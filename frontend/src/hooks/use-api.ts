import { useState, useCallback } from "react";

interface UseApiOptions {
  onError?: (msg: string) => void;
}

export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = [], opts?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Terjadi kesalahan.");
        setLoading(false);
        opts?.onError?.(e.message);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refresh = () => load();

  return { data, loading, error, refresh };
}