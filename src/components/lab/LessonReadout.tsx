import Icon from "@/components/ui/Icon";
import type { Readout } from "@/lib/curriculum";
import { bellScore, registerCounts, shorFactors } from "@/lib/explain";
import type { RunResult } from "@/lib/quantum";

const PAIRS = ["A (q0, q1)", "B (q2, q3)", "C (q4, q5)", "D (q6, q7)"];

/** Lesson-specific arithmetic on the measured counts, so the punchline is a number, not homework. */
export default function LessonReadout({ readout, result }: { readout: Readout; result: RunResult }) {
  if (readout.kind === "bell") {
    const { E, S } = bellScore(result.counts);
    return (
      <section className="frame flex flex-col gap-2 px-3 py-3 text-sm text-paper" aria-label="Bell score">
        <p className="label-sm flex items-center gap-2 text-fog"><Icon name="twins" size={14} className="text-ice" /> Bell score</p>
        <ul className="code grid gap-1 text-xs sm:grid-cols-2">
          {E.map((e, p) => <li key={p}>Pair {PAIRS[p]}: E = {e.toFixed(2)}</li>)}
        </ul>
        <p className="leading-relaxed">
          S = E(A) + E(B) + E(C) − E(D) = <b className="display num text-xl text-ice">{S.toFixed(2)}</b>.{" "}
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
    <section className="frame flex flex-col gap-2 px-3 py-3 text-sm text-paper" aria-label="Shor's classical step">
      <p className="label-sm flex items-center gap-2 text-fog"><Icon name="chip" size={14} className="text-ice" /> From measurements to factors <span className="code normal-case tracking-normal text-paper">a = {readout.a}, N = {readout.N}</span></p>
      <ul className="flex flex-col gap-1">
        {top.map(([ys, n]) => {
          const f = shorFactors(Number(ys), bits, readout.a, readout.N);
          return (
            <li key={ys} className="leading-relaxed">
              <span className="code">y = {ys}</span> ({Math.round((100 * n) / result.shots)}% of shots) → phase {ys}/{2 ** bits}
              {f.r ? `, r = ${f.r}` : ""}: <b className="text-ice">{f.note}</b>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
