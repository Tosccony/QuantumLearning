import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import IdealVsMachine from "@/components/lab/IdealVsMachine";
import LessonReadout from "@/components/lab/LessonReadout";
import Predict from "@/components/lab/Predict";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Flag, Heading, Notice, Perf, Stripe, Window } from "@/components/ui/primitives";
import { MODULES, TRACKS, modulesOf, type Module } from "@/lib/curriculum";
import { onesRate } from "@/lib/explain";
import { runCircuit, type Circuit, type RunResult } from "@/lib/quantum";
import Lab from "./Lab";

const REPO = "https://github.com/Tosccony/QuantumLearning";
const LETTERS = ["A", "B", "C", "D", "E", "F"];
// Concepts first, right under the Lab: the hard topics are what judges and curious learners look for.
const LESSON_TRACKS = [...TRACKS.filter((t) => t.id === "concepts"), ...TRACKS.filter((t) => t.id !== "explorer" && t.id !== "concepts")];

/** Quantum Quest's lessons on Qollab: every run goes to the simulator picked in "Select QPU". */
export default function Player({ backendName }: { backendName: string }) {
  const [id, setId] = useState(MODULES[0].id);
  const m = MODULES.find((x) => x.id === id)!;
  const isIonQ = /ionq/i.test(backendName);
  // `n` re-keys the Lab, so opening it from a lesson starts fresh with that lesson's circuit.
  const [lab, setLab] = useState<{ start: Circuit; n: number } | null>(null);
  const openLab = (start: Circuit) => setLab((l) => ({ start, n: (l?.n ?? 0) + 1 }));
  const chip = (active: boolean) => `chip min-h-9 transition-colors ${active ? "border-ice bg-ice text-navy-ink" : "hover:bg-[rgba(111,230,255,0.12)]"}`;
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
        <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2">
          <EdgeCode className="pt-2.5">LAB</EdgeCode>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => { if (!lab) openLab({ qubits: 2, ops: [] }); }} aria-current={lab ? "page" : undefined} className={chip(!!lab)}>
              <Icon name="lab" size={12} /> Build your own circuit
            </button>
          </div>
        </div>
        {LESSON_TRACKS.map((t) => (
          <div key={t.id} className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-2">
            <span className="flex items-center gap-1.5 pt-2.5"><Stripe track={t.id} className="!h-3 !w-1" /><EdgeCode>{t.id.slice(0, 3)}</EdgeCode></span>
            <div className="flex flex-wrap gap-1.5">
              {modulesOf(t.id).map((x, i) => (
                <button key={x.id} type="button" onClick={() => { setLab(null); setId(x.id); }} aria-current={!lab && x.id === id ? "page" : undefined} className={chip(!lab && x.id === id)}>
                  <span className="code normal-case tracking-normal opacity-80">{String(i + 1).padStart(2, "0")}</span> {x.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {lab ? <Lab key={lab.n} start={lab.start} isIonQ={isIonQ} /> : <Lesson key={m.id} m={m} isIonQ={isIonQ} onOpenLab={openLab} />}

      <footer className="rail -mx-3 sm:-mx-4">
        <Perf />
        <div className="flex flex-col items-center gap-1 px-4 py-3 text-center text-xs text-fog">
          <p>Kids&apos; Explorer games, community sharing and the AI tutor live in the full web app: <a className="text-ice hover:text-paper" href={REPO}>{REPO}</a>. MIT licensed.</p>
          <p className="label-sm">This effort is supported by Qollab &amp; IonQ</p>
        </div>
        <Perf />
      </footer>
    </div>
  );
}

function Lesson({ m, isIonQ, onOpenLab }: { m: Module; isIonQ: boolean; onOpenLab: (c: Circuit) => void }) {
  const [ops, setOps] = useState<EOp[]>(() => layout(m.circuit));
  const circuit = useMemo(() => toCircuit(m.circuit.qubits, ops), [m.circuit.qubits, ops]);
  // The circuit on screen right now; a run that finishes after an edit must not show its stale result.
  const current = useRef(circuit);
  useEffect(() => {
    current.current = circuit;
  }, [circuit]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const track = TRACKS.find((t) => t.id === m.track)!;
  const correct = picked === m.check.answer;

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const sent = circuit;
      const r = await runCircuit(sent, { shots: 1024 });
      if (current.current === sent) setResult(r);
      else setError("The circuit changed while it was running, so that result was dropped. Run again to see the new circuit's result.");
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <p role="status" className="sr-only">{running ? "Running…" : result ? "Results ready." : ""}</p>
        <header className="flex flex-col gap-2">
          <Heading as="h2" code={`${track.name.toUpperCase()} · ${m.minutes} MIN`}>{m.title}</Heading>
          <p className="max-w-prose text-fog">{m.summary}</p>
        </header>

        <Window as="div" className="flex flex-col gap-5 p-5 sm:p-6">
          <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
          {m.sections.map((s) => (
            <section key={s.heading}>
              <h3 className="display text-xl sm:text-2xl">{s.heading}</h3>
              <Markdown text={s.body} />
            </section>
          ))}
        </Window>

        {m.predict && <Predict p={m.predict} picked={guess} onPick={setGuess} revealed={!!result} />}

        <section className="rail -mx-3 sm:-mx-4" aria-label="Lesson circuit">
          <Perf />
          <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto flex items-center gap-3">
                <Icon name="chip" size={18} className="text-ice" />
                <h3 className="display text-xl sm:text-2xl">The circuit</h3>
                <EdgeCode>{circuit.qubits}Q · {circuit.ops.length} GATES · EDITABLE</EdgeCode>
              </div>
              <button type="button" className="keycap" onClick={() => onOpenLab(circuit)} disabled={running}><Icon name="lab" size={14} /> Open in Lab</button>
              <button type="button" className="keycap" disabled={running} onClick={() => { setOps(layout(m.circuit)); setResult(null); setError(null); }}><Icon name="reset" size={14} /> Reset</button>
              <button type="button" className="keycap-primary" onClick={run} disabled={running || (!!m.predict && guess === null)} aria-busy={running}>
                <Icon name="run" size={14} />
                {running ? "Running…" : m.predict && guess === null ? "Predict first" : "Run"}
              </button>
            </div>
            {isIonQ && <Notice tone="warn">IonQ simulators take one job per Run. To run again, press Stop and Run, or pick a local simulator.</Notice>}
            <div className="frame overflow-x-auto p-3">
              <CircuitEditor qubits={m.circuit.qubits} ops={ops} onChange={(next) => { setOps(next); setResult(null); }} />
            </div>
            {error && <Notice tone="bad" role="alert">{error}</Notice>}
            {result && (
              <div className="flex flex-col gap-3 strike">
                <Notice tone="info" role="status"><b>What to look for:</b> {m.observe}</Notice>
                <IdealVsMachine result={result} hint="If this was the built-in simulator, pick an IBM or IonQ machine in Select QPU on your next Run to see real-world noise." />
                {m.readout && <LessonReadout readout={m.readout} result={result} />}
                <ResultsPanel result={result} circuit={circuit} />
              </div>
            )}
            <Window as="div" className="p-4 sm:p-5">
              <p className="label-sm flex items-center gap-2 text-[#46587a]"><Icon name="lab" size={14} /> Try it</p>
              <div className="prose-q">
                <ul className="!mb-0">{m.tryIt.map((t) => <li key={t}>{t}</li>)}</ul>
              </div>
            </Window>
          </div>
          <Perf />
        </section>

        {m.compare && <CodeVsBare circuit={m.compare} isIonQ={isIonQ} />}

        <Window as="section" className="flex flex-col gap-4 p-5 sm:p-6" aria-label="Check your understanding">
          <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
          <h3 className="display text-2xl leading-tight sm:text-3xl">Check your understanding</h3>
          <p className="max-w-[68ch] text-lg leading-snug">{m.check.q}</p>
          <div className="flex flex-col gap-2" role="group" aria-label="Answers">
            {m.check.options.map((o, k) => {
              const isAnswer = k === m.check.answer;
              const isPick = k === picked;
              const tone = picked === null ? "border-navy-ink hover:bg-paper-2" : isAnswer ? "border-navy-ink bg-paper-2 ring-1 ring-inset ring-navy-ink" : isPick ? "border-bad ring-1 ring-inset ring-bad" : "border-paper-3 text-[#46587a]";
              return (
                <button key={k} type="button" onClick={() => setPicked(k)} disabled={picked !== null} className={`flex min-h-11 w-full items-center gap-3 border px-4 py-3 text-left text-base leading-snug transition-colors disabled:pointer-events-none ${tone}`}>
                  <span className="code shrink-0 text-xs text-[#46587a]">{LETTERS[k]}</span>
                  <span className="flex-1">{o}</span>
                  {picked !== null && isAnswer && <Icon name="cross" size={16} className="shrink-0 text-navy-ink" title="Correct answer" />}
                  {picked !== null && isPick && !isAnswer && <Icon name="close" size={16} className="shrink-0 text-bad" title="Your answer" />}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="flex items-start gap-3 border-t border-paper-3 pt-4 strike" role="status">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${correct ? "border-navy-ink bg-navy-ink text-ice" : "border-bad text-bad"}`} aria-hidden>
                <Icon name={correct ? "cross" : "close"} size={18} />
              </span>
              <div className="min-w-0">
                <p className="display text-lg">{correct ? "Correct" : "Not quite"}</p>
                <p className="mt-1 text-sm leading-relaxed">{m.check.why}</p>
              </div>
            </div>
          )}
        </Window>
      </div>
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <Tutor compact offline circuit={circuit} result={result} extra={`Lesson: ${m.title}. What to look for: ${m.observe}`} />
      </aside>
    </article>
  );
}

function CodeVsBare({ circuit, isIonQ }: { circuit: Circuit; isIonQ: boolean }) {
  const [r, setR] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bare = r ? onesRate(r.counts, 0) : 0;
  const coded = r ? onesRate(r.counts, 1) : 0;
  const pc = (x: number) => `${(x * 100).toFixed(1)}%`;
  const se = r ? Math.sqrt((bare * (1 - bare) + coded * (1 - coded)) / r.shots) : 0;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      setR(await runCircuit(circuit, { shots: 1024 }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rail -mx-3 sm:-mx-4" aria-label="Bare qubit versus protected qubit">
      <Perf />
      <div className="flex flex-col gap-3 px-3 py-4 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto flex items-center gap-3">
            <Icon name="noise" size={18} className="text-ice" />
            <h3 className="display text-xl sm:text-2xl">Does the code help on this machine?</h3>
          </div>
          <button type="button" className="keycap-primary" onClick={run} disabled={busy} aria-busy={busy}><Icon name="run" size={14} /> {busy ? "Running…" : "Run bare vs protected"}</button>
        </div>
        <p className="max-w-prose text-sm text-fog">One circuit holds a bare qubit and a qubit protected by the 3-qubit code, both storing 0. Any 1 we read is an error. The bare qubit can only be misread. The protected one can be misread too, plus whatever its 15 extra gates add, minus whatever the code catches.</p>
        {isIonQ && <Notice tone="warn">IonQ simulators take one job per Run. If you already ran the lesson circuit, press Stop and Run before this comparison.</Notice>}
        {error && <Notice tone="bad" role="alert">{error}</Notice>}
        {r && (
          <div className="frame flex flex-col gap-2 px-3 py-3 text-sm strike" role="status">
            <p className="flex flex-wrap gap-x-6 gap-y-1">
              <span><span className="label-sm text-fog">Bare qubit error</span> <b className="display num text-xl">{pc(bare)}</b></span>
              <span><span className="label-sm text-fog">Protected qubit error</span> <b className="display num text-xl">{pc(coded)}</b></span>
            </p>
            <p className="leading-relaxed">
              {bare === 0 && coded === 0
                ? "No errors at all: this is a perfect machine. Pick an IBM or IonQ simulator on your next Run."
                : Math.abs(coded - bare) <= 2 * se
                  ? "Too close to call: the difference is within shot-to-shot wobble. Run again to check."
                  : coded < bare
                    ? "The protected qubit came out ahead. On this test that can only mean q1 reads out more reliably than q0, because the bare qubit's only possible error is a misread."
                    : "The code lost: its own gates added more errors than it can fix. Error correction pays off only once gates are good enough (below the fault-tolerance threshold) and the stored qubit actually suffers errors while it waits."}
            </p>
          </div>
        )}
      </div>
      <Perf />
    </section>
  );
}
