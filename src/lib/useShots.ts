"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { runCircuit, type Circuit } from "./quantum";

/**
 * Pre-fetches individual measurement results (Qiskit `memory`) for a circuit, so games can hand
 * out one real shot per tap without waiting on the network. Refills in the background.
 */
export function useShots(circuit: Circuit, batch = 40) {
  const queue = useRef<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(circuit);
  const loading = useRef(false);

  const refill = useCallback(async () => {
    if (loading.current) return;
    loading.current = true;
    try {
      const r = await runCircuit(JSON.parse(key), { shots: batch, memory: true });
      queue.current.push(...(r.memory ?? []));
      setReady(true);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      loading.current = false;
    }
  }, [key, batch]);

  useEffect(() => {
    queue.current = [];
    setReady(false);
    refill();
  }, [refill]);

  const next = useCallback(() => {
    const s = queue.current.shift() ?? null;
    if (queue.current.length < 5) refill();
    return s;
  }, [refill]);

  return { next, ready, error, retry: refill };
}

export const OFFLINE_MSG = "My quantum lab is switched off! Ask a grown-up to start it (npm run backend), then try again. 🔌";
