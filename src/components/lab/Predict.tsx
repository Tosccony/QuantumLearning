import type { Predict as PredictData } from "@/lib/curriculum";

export const SKIPPED = -1;

/** Predict → Run → Explain: the learner commits to an outcome, the run reveals it, and feedback answers their pick. */
export default function Predict({ p, picked, onPick, revealed }: { p: PredictData; picked: number | null; onPick: (k: number) => void; revealed: boolean }) {
  return (
    <section className="panel flex flex-col gap-3 p-4" aria-label="Predict before you run">
      <h3 className="font-semibold">🔮 Predict first</h3>
      <p>{p.q}</p>
      <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Your prediction">
        {p.options.map((o, k) => (
          <button
            key={k}
            aria-pressed={picked === k}
            onClick={() => { if (picked === null) onPick(k); }}
            className={`rounded-xl bg-white/5 p-3 text-left text-sm ${picked === k ? "ring-2 ring-accent" : picked === null ? "hover:bg-white/10" : "opacity-50"}`}
          >
            {o}
          </button>
        ))}
      </div>
      {picked === null && (
        <button className="self-start text-xs text-muted underline" onClick={() => onPick(SKIPPED)}>
          Skip, just show me
        </button>
      )}
      <p role="status" className={picked === p.answer ? "text-good" : "text-on"}>
        {revealed && picked !== null && (
          <>
            {picked === SKIPPED ? `The answer: “${p.options[p.answer]}”. ` : picked === p.answer ? "You called it. " : "Surprised? "}
            {p.feedback[picked === SKIPPED ? p.answer : picked]}
          </>
        )}
      </p>
    </section>
  );
}
