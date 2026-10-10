// Qollab's runtime: our Python module (quantum/engine.py) and the simulator picked in "Select QPU".
declare module "quantum.engine" {
  export const run_json: { callPromising(backend: unknown, req: string): Promise<string> };
}
declare const backend: { name?: unknown };
