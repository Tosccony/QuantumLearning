"use client";

import { useEffect, useMemo, useState } from "react";
import { runCircuit, type Circuit, type Noise, type RunResult } from "./quantum";

export function useCircuitPrefix(circuit: Circuit, result: RunResult | null, step: number | null, noise: Noise | null = null) {
  const prefix = useMemo(() => step === null ? circuit : { ...circuit, ops: circuit.ops.slice(0, step) }, [circuit, step]);
  const request = result && step !== null ? JSON.stringify({ circuit: prefix, shots: result.shots, noise }) : null;
  const [response, setResponse] = useState<{ request: string; result: RunResult | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!request) return;
    let active = true;
    const timer = setTimeout(() => {
      const payload = JSON.parse(request);
      runCircuit(payload.circuit, { shots: payload.shots, noise: payload.noise })
        .then((next) => { if (active) setResponse({ request, result: next, error: null }); })
        .catch((error: Error) => { if (active) setResponse({ request, result: null, error: error.message }); });
    }, 150);
    return () => { active = false; clearTimeout(timer); };
  }, [request, result]);

  const current = response?.request === request ? response : null;
  return {
    circuit: prefix,
    result: request ? current?.result ?? null : result,
    loading: !!request && !current,
    error: request ? current?.error ?? null : null,
  };
}
