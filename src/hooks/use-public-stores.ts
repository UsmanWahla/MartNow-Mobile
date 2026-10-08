import { useCallback, useEffect, useRef, useState } from 'react';

import { getPublicStores } from '@/services/martnow';
import type { PublicStore } from '@/types/api';
import { getErrorMessage } from '@/utils/error-message';

let cachedStores: PublicStore[] | null = null;
let pendingRequest: Promise<PublicStore[]> | null = null;

async function fetchStores(force = false): Promise<PublicStore[]> {
  if (!force && cachedStores) return cachedStores;

  if (!pendingRequest) {
    pendingRequest = getPublicStores()
      .then((response) => {
        cachedStores = response.rows;
        return response.rows;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }

  return pendingRequest;
}

export function usePublicStores() {
  const requestId = useRef(0);
  const [stores, setStores] = useState<PublicStore[]>(cachedStores ?? []);
  const [loading, setLoading] = useState(cachedStores === null);
  const [error, setError] = useState('');

  const load = useCallback(async (force = false) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');

    try {
      const rows = await fetchStores(force);
      if (currentRequest === requestId.current) setStores(rows);
    } catch (cause) {
      if (currentRequest === requestId.current) setError(getErrorMessage(cause));
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { stores, loading, error, refresh };
}
