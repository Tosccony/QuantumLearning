import { useState } from "react";
import BreakTheCode from "@/components/lab/BreakTheCode";
import Tutor from "@/components/lab/Tutor";
import Icon from "@/components/ui/Icon";
import { Window } from "@/components/ui/primitives";
import { codeCircuit, DEFAULT_INJECTION, explainProof, type Injection } from "@/lib/breakTheCode";
import { modulesOf } from "@/lib/curriculum";
import type { Circuit, RunResult } from "@/lib/quantum";
import { LESSON_TRACKS } from "./tracks";

const PATH = ["Pick a simulator in Select QPU", "Run the code with X on q1: syndrome 11, q0 restored", "Move the error, or inject two", "Ask the explainer what happened"];
const LESSONS = LESSON_TRACKS.reduce((a, t) => a + modulesOf(t.id).length, 0);
const link = "inline-flex min-h-11 items-center text-ice underline underline-offset-4 hover:text-paper";

/** The first screen judges see: the hardest topic, live, in one run. */
export default function JudgeStart({ isIonQ, onOpenLab, onLesson, onLearn }: { isIonQ: boolean; onOpenLab: (c: Circuit) => void; onLesson: () => void; onLearn: () => void }) {
  const [ctx, setCtx] = useState<{ c: Circuit; r: RunResult | null; inj: Injection }>(() => ({ c: codeCircuit(DEFAULT_INJECTION), r: null, inj: DEFAULT_INJECTION }));
  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-3">
        <BreakTheCode isIonQ={isIonQ} onOpenLab={onOpenLab} onChange={(c, r, inj) => setCtx({ c, r, inj })} headingLevel={1} />
        <p className="text-sm text-fog">
          The full lesson, with the maths, a prediction and a check question:{" "}
          <button type="button" className="text-ice underline underline-offset-4 hover:text-paper" onClick={onLesson}>Error correction: the 3-qubit bit-flip code</button>.
        </p>
        <p className="flex flex-wrap gap-x-6 text-sm">
          <button type="button" className={link} onClick={onLearn}>Browse all {LESSONS} lessons →</button>
          <button type="button" className={link} onClick={() => onOpenLab({ qubits: 2, ops: [] })}>Build your own circuit →</button>
        </p>
      </div>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <Window as="section" className="p-4" aria-label="Three-minute judging path">
          <p className="label-sm flex items-center gap-2 text-[#46587a]"><Icon name="clock" size={14} /> Three-minute path</p>
          <ol className="mt-2 flex flex-col gap-1.5 text-sm leading-snug">
            {PATH.map((s, i) => <li key={s} className="flex gap-2"><span className="code text-xs text-[#46587a]">{i + 1}</span>{s}</li>)}
          </ol>
        </Window>
        <Tutor compact offline circuit={ctx.c} result={ctx.r} offlineText={(level) => (ctx.r ? explainProof(ctx.inj, ctx.r, level) : "Pick an error to inject, predict, and run. I'll explain the syndrome and the correction from the real Qiskit results.")} extra="Break the Code: the 3-qubit bit-flip code with X errors injected after encoding. Ancillas q3, q4 hold the syndrome; q0 is the decoded data qubit." />
      </aside>
    </article>
  );
}
