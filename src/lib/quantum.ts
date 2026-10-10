/**
 * Client side of the Qiskit service. The browser only describes circuits; every number shown
 * to learners (counts, probabilities, Bloch vectors, purity) comes back from Qiskit.
 */

export type GateName =
  | "h" | "x" | "y" | "z" | "s" | "sdg" | "t" | "tdg" | "sx"
  | "rx" | "ry" | "rz" | "p"
  | "cx" | "cy" | "cz" | "ch" | "cp" | "crz" | "swap" | "ccx" | "cswap" | "mcx" | "mcz"
  | "initialize" | "barrier";

export type Op = { gate: GateName; targets: number[]; controls?: number[]; params?: number[] };
export type Circuit = { qubits: number; ops: Op[] };
export type Noise = { p1: number; p2: number; readout: number };
export type Vec3 = [number, number, number];

export type RunResult = {
  counts: Record<string, number>;
  shots: number;
  probabilities: Record<string, number>;
  statevector: [number, number][];
  bloch: Vec3[];
  purity: number[];
  entangled: boolean;
  diagram: string;
  qasm: string;
  depth: number;
  gate_counts: Record<string, number>;
  transpiled: { depth: number; gate_counts: Record<string, number>; basis: string[] };
  backend: string;
  qiskit_version: string;
  elapsed_ms: number;
  memory?: string[];
  trace?: Vec3[][];
};

export type RunOptions = { shots?: number; noise?: Noise | null; memory?: boolean; trace?: boolean; seed?: number };

export class QuantumServiceError extends Error {}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/qiskit${path}`, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  } catch {
    throw new QuantumServiceError("Can't reach the Qiskit service. Start it with `npm run backend`.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    const msg = typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map((d: { msg: string }) => d.msg).join("; ") : null;
    throw new QuantumServiceError(msg ?? (res.status >= 500 ? "The Qiskit service isn't running. Start it with `npm run backend`." : `Request failed (${res.status})`));
  }
  return res.json();
}

/** How a run request reaches Qiskit: the FastAPI service by default, Qollab's Python bridge on qollab.xyz. */
export type Transport = (body: object) => Promise<RunResult>;

let transport: Transport = (body) => call<RunResult>("/run", { method: "POST", body: JSON.stringify(body) });

export function setTransport(t: Transport) {
  transport = t;
}

export function runCircuit(c: Circuit, opts: RunOptions = {}) {
  return transport({ ...c, ...opts });
}

// ---------------------------------------------------------------- gate catalog

export type GateInfo = {
  label: string;
  name: string;
  controls: number; // -1 = any number (mcx/mcz)
  targets: number;
  params: number;
  color: string;
  group: "Single" | "Rotation" | "Multi";
  about: string;
};

export const GATES: Partial<Record<GateName, GateInfo>> = {
  h: { label: "H", name: "Hadamard", controls: 0, targets: 1, params: 0, color: "#7b6cff", group: "Single", about: "Creates an equal superposition: |0⟩→|+⟩, |1⟩→|−⟩." },
  x: { label: "X", name: "Pauli-X", controls: 0, targets: 1, params: 0, color: "#ff9f1c", group: "Single", about: "Bit flip |0⟩↔|1⟩ (π rotation about X)." },
  y: { label: "Y", name: "Pauli-Y", controls: 0, targets: 1, params: 0, color: "#ff9f1c", group: "Single", about: "π rotation about Y: bit and phase flip." },
  z: { label: "Z", name: "Pauli-Z", controls: 0, targets: 1, params: 0, color: "#2ec4ff", group: "Single", about: "Phase flip: |1⟩→−|1⟩ (π rotation about Z)." },
  s: { label: "S", name: "S", controls: 0, targets: 1, params: 0, color: "#2ec4ff", group: "Single", about: "Quarter turn about Z: |1⟩→i|1⟩." },
  sdg: { label: "S†", name: "S-dagger", controls: 0, targets: 1, params: 0, color: "#2ec4ff", group: "Single", about: "Inverse of S." },
  t: { label: "T", name: "T", controls: 0, targets: 1, params: 0, color: "#2ec4ff", group: "Single", about: "Eighth turn about Z (π/4 phase)." },
  tdg: { label: "T†", name: "T-dagger", controls: 0, targets: 1, params: 0, color: "#2ec4ff", group: "Single", about: "Inverse of T." },
  sx: { label: "√X", name: "Sqrt-X", controls: 0, targets: 1, params: 0, color: "#ff9f1c", group: "Single", about: "Half an X gate; native on IBM hardware." },
  rx: { label: "Rx", name: "X rotation", controls: 0, targets: 1, params: 1, color: "#ff5fa2", group: "Rotation", about: "Rotate by θ about the X axis." },
  ry: { label: "Ry", name: "Y rotation", controls: 0, targets: 1, params: 1, color: "#ff5fa2", group: "Rotation", about: "Rotate by θ about the Y axis. Real amplitudes cos(θ/2), sin(θ/2)." },
  rz: { label: "Rz", name: "Z rotation", controls: 0, targets: 1, params: 1, color: "#ff5fa2", group: "Rotation", about: "Rotate by θ about the Z axis (changes relative phase)." },
  p: { label: "P", name: "Phase", controls: 0, targets: 1, params: 1, color: "#ff5fa2", group: "Rotation", about: "Adds phase e^{iθ} to |1⟩." },
  cx: { label: "CX", name: "CNOT", controls: 1, targets: 1, params: 0, color: "#3ddc97", group: "Multi", about: "Flips the target when the control is |1⟩. Creates entanglement from superposition." },
  cz: { label: "CZ", name: "Controlled-Z", controls: 1, targets: 1, params: 0, color: "#3ddc97", group: "Multi", about: "Phase-flips |11⟩. Symmetric in its two qubits." },
  cy: { label: "CY", name: "Controlled-Y", controls: 1, targets: 1, params: 0, color: "#3ddc97", group: "Multi", about: "Applies Y to the target when the control is |1⟩." },
  ch: { label: "CH", name: "Controlled-H", controls: 1, targets: 1, params: 0, color: "#3ddc97", group: "Multi", about: "Applies H to the target when the control is |1⟩." },
  cp: { label: "CP", name: "Controlled phase", controls: 1, targets: 1, params: 1, color: "#3ddc97", group: "Multi", about: "Adds phase θ to |11⟩ — the building block of the QFT." },
  crz: { label: "CRz", name: "Controlled Rz", controls: 1, targets: 1, params: 1, color: "#3ddc97", group: "Multi", about: "Rz(θ) on the target when the control is |1⟩." },
  swap: { label: "SWAP", name: "Swap", controls: 0, targets: 2, params: 0, color: "#b388ff", group: "Multi", about: "Exchanges two qubits' states." },
  ccx: { label: "CCX", name: "Toffoli", controls: 2, targets: 1, params: 0, color: "#3ddc97", group: "Multi", about: "Flips the target when both controls are |1⟩. Universal for classical logic." },
  mcz: { label: "MCZ", name: "Multi-controlled Z", controls: -1, targets: 1, params: 0, color: "#3ddc97", group: "Multi", about: "Phase-flips the all-ones state. Used in Grover oracles." },
};

export const PALETTE: GateName[] = ["h", "x", "y", "z", "s", "t", "sdg", "sx", "rx", "ry", "rz", "p", "cx", "cz", "ch", "cp", "swap", "ccx", "mcz"];

export const opQubits = (o: Op) => [...(o.controls ?? []), ...o.targets];

/** Parses angles like "pi/2", "-π/4", "3*pi/8", "1.2". */
export function parseAngle(s: string): number | null {
  const t = s.trim().toLowerCase().replace(/π/g, "pi").replace(/\s+/g, "");
  if (!t) return null;
  if (!/^[-+*/().\d]*(pi)?[-+*/().\d]*$/.test(t)) return null;
  try {
    // Only digits, operators and "pi" reach here.
    const v = Function(`"use strict"; const pi = Math.PI; return (${t.replace(/(\d)pi/g, "$1*pi")});`)() as number;
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

export function formatAngle(v: number): string {
  const r = v / Math.PI;
  for (const d of [1, 2, 3, 4, 6, 8, 12, 16]) {
    const n = r * d;
    if (Math.abs(n - Math.round(n)) < 1e-6 && Math.round(n) !== 0) {
      const k = Math.round(n);
      const num = k === 1 ? "π" : k === -1 ? "-π" : `${k}π`;
      return d === 1 ? num : `${num}/${d}`;
    }
  }
  return v === 0 ? "0" : v.toFixed(3);
}

// ---------------------------------------------------------------- export & sharing

const pyAngle = (v: number) => formatAngle(v).replace(/π/g, "pi").replace(/(\d)pi/g, "$1*pi").replace(/^-pi/, "-pi");

/** Equivalent Qiskit Python, so developers can take any Lab circuit into their own code. */
export function toQiskitPython(c: Circuit): string {
  const lines = ["from math import pi", "from qiskit import QuantumCircuit", "from qiskit_aer import AerSimulator", "", `qc = QuantumCircuit(${c.qubits})`];
  for (const o of c.ops) {
    const ps = (o.params ?? []).map(pyAngle);
    const cs = o.controls ?? [];
    if (o.gate === "barrier") lines.push("qc.barrier()");
    else if (o.gate === "initialize") lines.push(`qc.initialize([${(o.params ?? []).join(", ")}], [${o.targets.join(", ")}], normalize=True)`);
    else if (o.gate === "mcx") lines.push(`qc.mcx([${cs.join(", ")}], ${o.targets[0]})`);
    else if (o.gate === "mcz") lines.push(`qc.h(${o.targets[0]}); qc.mcx([${cs.join(", ")}], ${o.targets[0]}); qc.h(${o.targets[0]})`);
    else lines.push(`qc.${o.gate}(${[...ps, ...cs, ...o.targets].join(", ")})`);
  }
  lines.push("qc.measure_all()", "", "sim = AerSimulator()", "counts = sim.run(qc, shots=1024).result().get_counts()", "print(counts)");
  return lines.join("\n");
}

export function encodeCircuit(c: Circuit): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(c)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCircuit(s: string): Circuit | null {
  try {
    const json = decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
    const c = JSON.parse(json) as Circuit;
    return typeof c.qubits === "number" && Array.isArray(c.ops) ? c : null;
  } catch {
    return null;
  }
}

export const labLink = (c: Circuit) => `/lab?c=${encodeCircuit(c)}`;

// ---------------------------------------------------------------- tiny circuit helpers

export const g = (gate: GateName, targets: number[], controls: number[] = [], params: number[] = []): Op => ({ gate, targets, controls, params });

/** Grover search over n qubits for `marked`, with `iterations` rounds (oracle + diffuser). */
export function groverCircuit(n: number, marked: number, iterations: number): Circuit {
  const all = Array.from({ length: n }, (_, q) => q);
  const ops: Op[] = all.map((q) => g("h", [q]));
  const mcz = () => g("mcz", [n - 1], all.slice(0, n - 1));
  for (let k = 0; k < iterations; k++) {
    const zeros = all.filter((q) => !((marked >> q) & 1));
    ops.push(...zeros.map((q) => g("x", [q])), mcz(), ...zeros.map((q) => g("x", [q])));
    ops.push(...all.map((q) => g("h", [q])), ...all.map((q) => g("x", [q])), mcz(), ...all.map((q) => g("x", [q])), ...all.map((q) => g("h", [q])));
  }
  return { qubits: n, ops };
}
