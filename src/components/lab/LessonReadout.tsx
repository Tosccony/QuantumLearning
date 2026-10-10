import type { Readout } from "@/lib/curriculum";
import { bellScore, registerCounts, shorFactors } from "@/lib/explain";
import type { RunResult } from "@/lib/quantum";

const PAIRS = ["A (q0, q1)", "B (q2, q3)", "C (q4, q5)", "D (q6, q7)"];

/** Lesson-specific arithmetic on the measured counts, so the punchline is a number, not homework. */
export default function LessonReadout({ readout, result }: { readout: Readout; result: RunResult }) {
  if (readout.kind === "bell") {
    const { E, S } = bellScore(result.counts);
    return (
      <section className="rounded-xl bg-white/5 p-3 text-sm" aria-label="Bell score">
        <p className="font-semibold">🔔 Bell score</p>
        <ul className="mt-1 grid gap-1 sm:grid-cols-2">
          {E.map((e, p) => <li key={p}>Pair {PAIRS[p]}: E = {e.toFixed(2)}</li>)}
        </ul>
        <p role="status" className="mt-2">
          S = E(A) + E(B) + E(C) − E(D) = <b>{S.toFixed(2)}</b>.{" "}
          {S > 2.1
            ? "That's above 2: if the settings were chosen at random, no hidden instruction sheet could produce these correlations."
            : "That's not clearly above 2 (results wobble by about ±0.1 from run to run), so hidden instruction sheets could still explain it. Check the angles, or noise may have washed out the entanglement."}
          {" "}Classical limit 2, quantum limit 2√2 ≈ 2.83.
        </p>
      </section>
    );
  }
  const reg = registerCounts(result.counts, readout.counting);
  const bits = readout.counting.length;
  const top = Object.entries(reg).sort((x, y) => y[1] - x[1]).slice(0, 4);
  return (
    <section className="rounded-xl bg-white/5 p-3 text-sm" aria-label="Shor's classical step">
      <p className="font-semibold">🧮 From measurements to factors (a = {readout.a}, N = {readout.N})</p>
      <ul role="status" className="mt-1 flex flex-col gap-1">
        {top.map(([ys, n]) => {
          const f = shorFactors(Number(ys), bits, readout.a, readout.N);
          return (
            <li key={ys}>
              y = {ys} ({Math.round((100 * n) / result.shots)}% of shots) → phase {ys}/{2 ** bits}
              {f.r ? `, r = ${f.r}` : ""}: <b>{f.note}</b>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
