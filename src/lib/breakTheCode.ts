import { R3_CORRECT, R3_ENCODE } from "./curriculum";
import { bitOf, onesRate, pct, tvd, type Level } from "./explain";
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

/** The case judges see first: X on q1, the same error as the r3 lesson circuit. */
export const DEFAULT_INJECTION = INJECTIONS[2];

/** The data qubit starts in Ry(0.8)|0⟩: Bloch (sin 0.8, 0, cos 0.8), P(read 1) = sin²(0.4). */
export const THETA = 0.8;
export const START: [number, number, number] = [Math.sin(THETA), 0, Math.cos(THETA)];
export const P_ONE = Math.sin(THETA / 2) ** 2;

/** Syndrome (s0 s1) → which qubit the Toffolis flip back. s0 = q0⊕q1 lands on q3, s1 = q1⊕q2 on q4. */
export const CORRECTION: Record<string, number | null> = { "00": null, "10": 0, "11": 1, "01": 2 };

export function codeCircuit(inj: Injection): Circuit {
  return { qubits: 5, ops: [...R3_ENCODE, ...inj.qubits.map((q) => g("x", [q])), ...R3_CORRECT] };
}

/** What the code should do with this injection: single errors are undone, two errors fool it into a logical flip. */
export function expected(inj: Injection) {
  const f = (q: number) => +inj.qubits.includes(q);
  const syndrome = `${f(0) ^ f(1)}${f(1) ^ f(2)}`;
  return { syndrome, fixes: CORRECTION[syndrome], recovered: inj.qubits.length < 2 };
}

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
    const s = bitOf(k, 3) + bitOf(k, 4);
    tally[s] = (tally[s] ?? 0) + v;
  }
  const [syndrome, n] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0] ?? ["00", 0];
  const total = Object.values(r.counts).reduce((a, b) => a + b, 0);
  const exactBloch = r.bloch[0];
  const exactOne = Object.entries(r.probabilities).reduce((a, [k, p]) => a + (bitOf(k, 0) === "1" ? p : 0), 0);
  return {
    syndrome,
    syndromeShare: total ? n / total : 0,
    fixes: CORRECTION[syndrome] ?? null,
    exactBloch,
    recovered: exactBloch.every((x, i) => Math.abs(x - START[i]) < 0.02),
    measuredOne: onesRate(r.counts, 0),
    exactOne,
    distance: tvd(r),
    cx: r.transpiled.gate_counts.cx ?? 0,
  };
}

const vec = (v: number[]) => `(${v.map((x) => x.toFixed(3)).join(", ")})`;

/**
 * Explains the *expected* chain (the ideal physics) for this injection, then, if the most common measured
 * syndrome differs, says so and what the code would then have corrected. Used by both the Explain window and the offline tutor.
 */
export function explainProof(inj: Injection, r: RunResult, level: Level): string {
  const p = readProof(r);
  const want = expected(inj);
  const q = inj.qubits;
  const out: string[] = [];
  if (q.length === 0)
    out.push(`No error, so both parities agree and the syndrome reads ${want.syndrome}. No Toffoli fires, decoding undoes the encoding, and q0 is exactly where it started.`);
  else if (q.length === 1)
    out.push(`The X on q${q[0]} broke the parity on ${q[0] === 1 ? "both checks" : q[0] === 0 ? "Z₀Z₁ only" : "Z₁Z₂ only"}, so the syndrome reads ${want.syndrome} and points straight at q${q[0]}. The Toffoli flips it back and q0 decodes to its original state. The parities are the same for |000⟩ and |111⟩, so the check never learned the amplitudes it protected.`);
  else
    out.push(`Two errors fool the code. X on q0 and q1 leaves Z₀Z₁ unchanged and breaks Z₁Z₂, so the syndrome reads ${want.syndrome}, the same as a single error on q2. The code "fixes" q2, which leaves all three flipped: a logical X, and q0 decodes as ${vec(p.exactBloch)} instead of ${vec(START)}. A distance-3 code corrects one error; stronger protection needs bigger codes and better gates.`);
  if (p.syndrome !== want.syndrome)
    out.push(`This run's most common measured syndrome was ${p.syndrome}, not ${want.syndrome}, most likely because of noise: the ancillas and the gates that fill them can fail too. A machine that reads ${p.syndrome} would have ${p.fixes === null ? "applied no correction" : `corrected X on q${p.fixes}`}.`);
  if (level !== "beginner")
    out.push(`Exact q0 Bloch vector ${vec(p.exactBloch)}, started at ${vec(START)}. P(q0 = 1): measured ${pct(p.measuredOne)} vs exact ${pct(p.exactOne)}.`);
  if (level === "advanced")
    out.push(`The stabilisers are Z₀Z₁ and Z₁Z₂, measured onto q3 and q4 without touching the data. It is a distance-3 code: one X error is corrected and two are not (they alias to a single error elsewhere). The sampled counts sit TVD ${p.distance.toFixed(3)} from the exact distribution.`);
  return out.join(" ");
}
