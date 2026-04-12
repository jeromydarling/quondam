import { useEffect, useState } from "react";
import type { Catalog } from "./types";
import { loadCatalog } from "./source";

interface UseCatalogResult {
  catalog: Catalog | null;
  loading: boolean;
  error: Error | null;
}

/**
 * React hook that loads the catalog through the swap-point in source.ts.
 * v1: instant (static import). Lovable v2: async fetch — this hook handles
 * either case with no caller change.
 */
export function useCatalog(): UseCatalogResult {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((c) => {
        if (!cancelled) {
          setCatalog(c);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, loading, error };
}
