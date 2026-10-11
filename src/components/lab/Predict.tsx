import Icon from "@/components/ui/Icon";
import { Perf, Window } from "@/components/ui/primitives";
import type { Predict as PredictData } from "@/lib/curriculum";

export const SKIPPED = -1;
const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Predict → Run → Explain: the learner commits to an outcome, the run reveals it, and feedback answers their pick. */
export default function Predict({ p, picked, onPick, revealed }: { p: PredictData; picked: number | null; onPick: (k: number) => void; revealed: boolean }) {
  const answered = picked !== null;
  const correct = picked === p.answer;
  return (
    <Window as="section" className="flex flex-col gap-4 p-5 sm:p-6" aria-label="Predict before you run">
      <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="display text-2xl leading-tight sm:text-3xl">Predict first</h2>
        <span className="label-sm text-[#46587a]">then run, then explain the gap</span>
      </div>
      <p className="max-w-[68ch] text-lg leading-snug">{p.q}</p>

      <div className="flex flex-col gap-2" role="group" aria-label="Your prediction">
        {p.options.map((o, k) => {
          const isPick = picked === k;
          const isAnswer = k === p.answer;
          const tone = !answered
            ? "border-navy-ink hover:bg-paper-2"
            : revealed
              ? isAnswer
                ? "border-navy-ink bg-paper-2 ring-1 ring-inset ring-navy-ink"
                : isPick
                  ? "border-bad ring-1 ring-inset ring-bad"
                  : "border-paper-3 text-[#46587a]"
              : isPick
                ? "border-navy-ink bg-paper-2 ring-1 ring-inset ring-navy-ink"
                : "border-paper-3 text-[#46587a]";
          return (
            <button
              key={k}
              type="button"
              aria-pressed={isPick}
              disabled={answered}
              onClick={() => onPick(k)}
              className={`flex min-h-11 w-full items-center gap-3 border px-4 py-3 text-left text-base leading-snug transition-colors disabled:pointer-events-none ${tone}`}
              aria-label={answered ? `${LETTERS[k]}. ${o}${revealed && isAnswer ? " (what Qiskit found)" : isPick ? " (your prediction)" : ""}` : undefined}
            >
              <span className="code shrink-0 text-xs text-[#46587a]">{LETTERS[k]}</span>
              <span className="flex-1">{o}</span>
              {revealed && answered && isAnswer && <Icon name="cross" size={16} className="shrink-0 text-navy-ink" title="What Qiskit found" />}
              {revealed && answered && isPick && !isAnswer && <Icon name="close" size={16} className="shrink-0 text-bad" title="Your prediction" />}
              {!revealed && isPick && <Icon name="flag" size={16} className="shrink-0 text-navy-ink" title="Your prediction" />}
            </button>
          );
        })}
      </div>

      {!answered && (
        <button type="button" className="keycap-paper self-start" onClick={() => onPick(SKIPPED)}>
          <Icon name="skip" size={14} /> Skip, just show me
        </button>
      )}
      {answered && !revealed && (
        <p role="status" className="flex items-center gap-2 text-sm text-[#46587a]">
          <Icon name="run" size={14} /> {picked === SKIPPED ? "Prediction skipped. Run the circuit to see the answer." : "Prediction locked. Run the circuit to see whether Qiskit agrees."}
        </p>
      )}
      {revealed && answered && (
        <div className="flex items-start gap-3 border-t border-paper-3 pt-4 strike" role="status">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${correct ? "border-navy-ink bg-navy-ink text-ice" : "border-navy-ink text-navy-ink"}`} aria-hidden>
            <Icon name={correct ? "cross" : picked === SKIPPED ? "eye" : "info"} size={18} />
          </span>
          <div className="min-w-0">
            <p className="display text-lg">{picked === SKIPPED ? `The answer: ${p.options[p.answer]}` : correct ? "You called it" : "Surprised?"}</p>
            <p className="mt-1 text-sm leading-relaxed">{p.feedback[picked === SKIPPED ? p.answer : picked]}</p>
          </div>
        </div>
      )}
    </Window>
  );
}
