import { moduleById } from "./curriculum";
import { onesRate, tvd } from "./explain";
import { g, type Circuit, type Noise, type RunResult } from "./quantum";

/** Break the Code: the r3 bit-flip circuit with the judge's choice of injected X errors, read back from one run. */

/** The web app's demo device: 1% one-qubit, 5% two-qubit and 3% readout error (Qiskit Aer noise model). */
export const DEMO_NOISE: Noise = { p1: 0.01, p2: 0.05, readout: 0.03 };

export type Injection = { id: string; label: string; qubits: number[] };

export const INJECTIONS: Injection[] = [
  { id: "none", label: "No error", qubits: [] },
  { id: "q0", label: "X on q0", qubits: [0] },
  { id: "q1", label: "X on q1", qubits: [1] },
  { id: "q2", label: "X on q2", qubits: [2] },
  { id: "two", label: "Two errors: q0 + q1", qubits: [0, 1] },
];

/** The data qubit starts in Ry(0.8)|0⟩: Bloch (sin 0.8, 0, cos 0.8), P(read 1) = sin²(0.4). */
export const THETA = 0.8;
export const START: [number, number, number] = [Math.sin(THETA), 0, Math.cos(THETA)];
export const P_ONE = Math.sin(THETA / 2) ** 2;

/** Syndrome (s0 s1) → which qubit the Toffolis flip back. s0 = q0⊕q1 lands on q3, s1 = q1⊕q2 on q4. */
export const CORRECTION: Record<string, number | null> = { "00": null, "10": 0, "11": 1, "01": 2 };

// r3's circuit is encode (3 ops), its own X on q1 (op 3), then syndrome, correction and decode.
const R3 = moduleById("r3")!.circuit.ops;

export function codeCircuit(inj: Injection): Circuit {
  return { qubits: 5, ops: [...R3.slice(0, 3), ...inj.qubits.map((q) => g("x", [q])), ...R3.slice(4)] };
}

/** What the code should do with this injection: single errors are undone, two errors fool it into a logical flip. */
export function expected(inj: Injection) {
  const f = (q: number) => +inj.qubits.includes(q);
  const syndrome = `${f(0) ^ f(1)}${f(1) ^ f(2)}`;
  return { syndrome, fixes: CORRECTION[syndrome], recovered: inj.qubits.length < 2 };
}

const bit = (k: string, q: number) => k[k.length - 1 - q];

export type Proof = {
  syndrome: string; // most frequent (q3, q4) reading
  syndromeShare: number; // fraction of shots that read it
  fixes: number | null;
  exactBloch: [number, number, number];
  recovered: boolean; // from the exact state: q0's Bloch vector matches the start
  measuredOne: number; // sampled P(q0 = 1)
  exactOne: number; // exact P(q0 = 1)
  distance: number; // TVD between the sampled counts and the exact distribution
  cx: number; // CX count after transpiling to rz, sx, x, cx
};

export function readProof(r: RunResult): Proof {
  const tally: Record<string, number> = {};
  for (const [k, v] of Object.entries(r.counts)) {
    const s = bit(k, 3) + bit(k, 4);
    tally[s] = (tally[s] ?? 0) + v;
  }
  const [syndrome, n] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] ?? ["00", 0];
  const exactBloch = r.bloch[0];
  const exactOne = Object.entries(r.probabilities).reduce((a, [k, p]) => a + (bit(k, 0) === "1" ? p : 0), 0);
  return {
    syndrome,
    syndromeShare: n / r.shots,
    fixes: CORRECTION[syndrome] ?? null,
    exactBloch,
    recovered: exactBloch.every((x, i) => Math.abs(x - START[i]) < 0.02),
    measuredOne: onesRate(r.counts, 0),
    exactOne,
    distance: tvd(r),
    cx: r.transpiled.gate_counts.cx ?? 0,
  };
}
