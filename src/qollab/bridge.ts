import { QuantumServiceError, type RunResult, type Transport } from "@/lib/quantum";

/** The part of our Python module the player calls. `run_json` is engine.py's JSON entry point. */
export type QollabEngine = { run_json: { callPromising(backend: unknown, req: string): Promise<string> } };

/** Python errors arrive as a traceback; learners only need its last line, minus the exception type. */
export function pythonErrorMessage(e: unknown): string {
  const lines = String(e instanceof Error ? e.message : e).trim().split("\n");
  return lines[lines.length - 1].replace(/^[A-Za-z]+(Error|Exception): /, "");
}

export function qollabTransport(engine: QollabEngine, backend: unknown): Transport {
  return async (body) => {
    try {
      return JSON.parse(await engine.run_json.callPromising(backend, JSON.stringify(body))) as RunResult;
    } catch (e) {
      throw new QuantumServiceError(pythonErrorMessage(e));
    }
  };
}
