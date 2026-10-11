import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import BreakTheCode from "@/components/lab/BreakTheCode";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import IdealVsMachine from "@/components/lab/IdealVsMachine";
import LessonReadout from "@/components/lab/LessonReadout";
import Predict from "@/components/lab/Predict";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Flag, Heading, Notice, Perf, Stripe, Window } from "@/components/ui/primitives";
import { codeCircuit, DEFAULT_INJECTION, explainProof, type Injection } from "@/lib/breakTheCode";
import { MODULES, TRACKS, modulesOf, type Module } from "@/lib/curriculum";
import { runCircuit, type Circuit, type RunResult } from "@/lib/quantum";
import Lab from "./Lab";
import Lesson from "./Lesson";

const REPO = "https://github.com/Tosccony/QuantumLearning";
const LETTERS = ["A", "B", "C", "D", "E", "F"];
// Concepts first, right under the Lab: the hard topics are what judges and curious learners look for.
const LESSON_TRACKS = [...TRACKS.filter((t) => t.id === "concepts"), ...TRACKS.filter((t) => t.id !== "explorer" && t.id !== "concepts")];

/** Quantum Quest's lessons on Qollab: every run goes to the simulator picked in "Select QPU". Opens on Judge Start. */
export default function Player({ backendName }: { backendName: string }) {
  // null = Judge Start (Break the Code), else a lesson id.
  const [id, setId] = useState<string | null>(null);
  const [browse, setBrowse] = useState(false);
  const m = id ? MODULES.find((x) => x.id === id)! : null;
  const isIonQ = /ionq/i.test(backendName);
  // `n` re-keys the Lab, so opening it from a lesson starts fresh with that lesson's circuit.
  const [lab, setLab] = useState<{ start: Circuit; n: number } | null>(null);
  const openLab = (start: Circuit) => setLab((l) => ({ start, n: (l?.n ?? 0) + 1 }));
  const open = (next: string | null) => { setLab(null); setId(next); };
  const chip = (active: boolean) => `chip min-h-11 transition-colors ${active ? "border-ice bg-ice text-navy-ink" : "hover:bg-[rgba(111,230,255,0.12)]"}`;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 py-4 sm:px-4">
      <header className="rail -mx-3 sm:-mx-4">
        <Perf />
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 sm:px-4">
          <span className="relative flex items-center gap-2 border border-ice px-3 py-2">
            <Flag className="absolute -top-[11px] left-3" width={16} />
            <Icon name="atom" size={18} className="text-ice" />
            <span className="display text-lg">Quantum Quest</span>
          </span>
          <span className="code text-xs text-fog">on Qollab</span>
          <span className="chip ml-auto"><Icon name="chip" size={12} /> SIM · {backendName}</span>
        </div>
        <Perf />
      </header>

      <nav aria-label="Lessons" className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => open(null)} aria-current={!lab && !m ? "page" : undefined} className={chip(!lab && !m)}>
            <Icon name="flag" size={12} /> Judge start: Break the code
          </button>
          <button type="button" onClick={() => { if (!lab) openLab({ qubits: 2, ops: [] }); }} aria-current={lab ? "page" : undefined} className={chip(!!lab)}>
            <Icon name="lab" size={12} /> Build your own circuit
          </button>
          <button type="button" onClick={() => setBrowse((b) => !b)} aria-expanded={browse} aria-controls="all-lessons" className={chip(false)}>
            <Icon name="list" size={12} /> {browse ? "Hide lessons" : "Browse all 21 lessons"}
            {!browse && !lab && m && <span className="code normal-case tracking-normal text-fog">· {m.title}</span>}
          </button>
        </div>
        {browse && (
          <div id="all-lessons" className="flex flex-col gap-2">
            {LESSON_TRACKS.map((t) => (
              <div key={t.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2">
                <span className="flex items-center gap-1.5 pt-2.5"><Stripe track={t.id} className="!h-3 !w-1" /><EdgeCode>{t.id.slice(0, 3)}</EdgeCode></span>
                <div className="flex flex-wrap gap-1.5">
                  {modulesOf(t.id).map((x, i) => (
                    <button key={x.id} type="button" onClick={() => open(x.id)} aria-current={!lab && x.id === id ? "page" : undefined} className={chip(!lab && x.id === id)}>
                      <span className="code normal-case tracking-normal opacity-80">{String(i + 1).padStart(2, "0")}</span> {x.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {lab ? <Lab key={lab.n} start={lab.start} isIonQ={isIonQ} /> : m ? <Lesson key={m.id} m={m} isIonQ={isIonQ} onOpenLab={openLab} breadcrumb={{ label: "Judge start", onClick: () => open(null) }} /> : <JudgeStart isIonQ={isIonQ} onOpenLab={openLab} onLesson={() => open("r3")} />}

      <footer className="rail -mx-3 sm:-mx-4">
        <Perf />
        <div className="flex flex-col items-center gap-1 px-4 py-3 text-center text-xs text-fog">
          <p>Kids&apos; Explorer games, community sharing and the AI tutor live in the full web app: <a className="text-ice underline underline-offset-4 hover:text-paper" href={REPO}>{REPO}</a>. MIT licensed.</p>
          <p className="label-sm">This effort is supported by Qollab &amp; IonQ</p>
        </div>
        <Perf />
      </footer>
    </div>
  );
}

const PATH = ["Pick a simulator in Select QPU", "Run the code with X on q1: syndrome 11, q0 restored", "Move the error, or inject two", "Ask the explainer what happened"];

/** The first screen judges see: the hardest topic, live, in one run. */
function JudgeStart({ isIonQ, onOpenLab, onLesson }: { isIonQ: boolean; onOpenLab: (c: Circuit) => void; onLesson: () => void }) {
  const [ctx, setCtx] = useState<{ c: Circuit; r: RunResult | null; inj: Injection }>(() => ({ c: codeCircuit(DEFAULT_INJECTION), r: null, inj: DEFAULT_INJECTION }));
  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <BreakTheCode isIonQ={isIonQ} onOpenLab={onOpenLab} onChange={(c, r, inj) => setCtx({ c, r, inj })} />
        <p className="text-sm text-fog">
          The full lesson, with the maths, a prediction and a check question:{" "}
          <button type="button" className="text-ice underline underline-offset-4 hover:text-paper" onClick={onLesson}>Error correction: the 3-qubit bit-flip code</button>.
        </p>
      </div>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
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
