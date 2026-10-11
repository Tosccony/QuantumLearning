import { g, type Circuit, type Op } from "./quantum";

/** The circuits and arithmetic behind the quantum money lesson's three demos. Pure, so scripts/check.ts can test them. */

/** Qubits in the banknote demo: the platform's simulator limit. */
export const N = 8;
const KEY = Math.PI / 2;

/** A barrier across qubits 0..n-1: a visual break between the set, lock and unlock phases. */
export const barrier = (n: number): Op => g("barrier", Array.from({ length: n }, (_, i) => i));

/** P(1) after Ry(θ)|0⟩ is sin²(θ/2), for θ in degrees. */
export const p1 = (deg: number) => Math.sin((deg * Math.PI) / 360) ** 2;

/** One qubit rotated by `deg` degrees about Y. */
export const angleCircuit = (deg: number): Circuit => ({ qubits: 1, ops: [g("ry", [0], [], [(deg * Math.PI) / 180])] });

/** Set the bill bit (X if 1), lock with Ry(π/2) if the lock key is 1, unlock with Ry(−π/2) if the guess is 1. */
export function banknoteCircuit(bill: number[], lock: number[], guess: number[]): Circuit {
  const n = bill.length;
  const at = (bits: number[], gate: "x" | "ry", angle?: number) => bits.flatMap((b, q) => (b ? [g(gate, [q], [], angle === undefined ? [] : [angle])] : []));
  return { qubits: n, ops: [...at(bill, "x"), barrier(n), ...at(lock, "ry", KEY), barrier(n), ...at(guess, "ry", -KEY)] };
}

/** The one-qubit version of the banknote. */
export const lockCircuit = (value: number, lock: number, unlock: number) => banknoteCircuit([value], [lock], [unlock]);

/** 1 if the guess cancels the real lock exactly (always right); 0.5 if not (a coin flip). */
export const correctProb = (lock: number[], guess: number[], i: number) => (lock[i] === guess[i] ? 1 : 0.5);

/** Exact distribution of "how many bits come back right", convolving each qubit's Bernoulli(p). */
export function exactCorrectDist(lock: number[], guess: number[]): number[] {
  let dist = [1];
  for (let i = 0; i < lock.length; i++) {
    const p = correctProb(lock, guess, i);
    const next = Array(dist.length + 1).fill(0);
    dist.forEach((d, k) => { next[k] += d * (1 - p); next[k + 1] += d * p; });
    dist = next;
  }
  return dist;
}
