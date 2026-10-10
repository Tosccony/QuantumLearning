import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import IdealVsMachine from "@/components/lab/IdealVsMachine";
import LessonReadout from "@/components/lab/LessonReadout";
import Predict from "@/components/lab/Predict";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import { MODULES, TRACKS, modulesOf, type Module } from "@/lib/curriculum";
import { onesRate } from "@/lib/explain";
import { runCircuit, type Circuit, type RunResult } from "@/lib/quantum";
import Lab from "./Lab";

const REPO = "https://github.com/Tosccony/QuantumLearning";
const LESSON_TRACKS = TRACKS.filter((t) => t.id !== "explorer");

/** Quantum Quest's lessons on Qollab: every run goes to the simulator picked in "Select QPU". */
export default function Player({ backendName }: { backendName: string }) {
  const [id, setId] = useState(MODULES[0].id);
  const m = MODULES.find((x) => x.id === id)!;
  const isIonQ = /ionq/i.test(backendName);
  // `n` re-keys the Lab, so opening it from a lesson starts fresh with that lesson's circuit.
  const [lab, setLab] = useState<{ start: Circuit; n: number } | null>(null);
  const openLab = (start: Circuit) => setLab((l) => ({ start, n: (l?.n ?? 0) + 1 }));
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">⚛️ Quantum Quest</h1>
        <span className="chip">Simulator: {backendName}</span>
      </header>
      <nav aria-label="Lessons" className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="w-28 text-sm text-muted">🧪 Lab</span>
          <button
            onClick={() => { if (!lab) openLab({ qubits: 2, ops: [] }); }}
            aria-current={lab ? "page" : undefined}
            className={`chip ${lab ? "!bg-accent !text-white" : "hover:bg-white/20"}`}
          >
            Build your own circuit
          </button>
        </div>
        {LESSON_TRACKS.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-1.5">
            <span className="w-28 text-sm text-muted">{t.icon} {t.name}</span>
            {modulesOf(t.id).map((x, i) => (
              <button
                key={x.id}
                onClick={() => { setLab(null); setId(x.id); }}
                aria-current={!lab && x.id === id ? "page" : undefined}
                className={`chip ${!lab && x.id === id ? "!bg-accent !text-white" : "hover:bg-white/20"}`}
              >
                {i + 1}. {x.title}
              </button>
            ))}
          </div>
        ))}
      </nav>
      {lab ? <Lab key={lab.n} start={lab.start} isIonQ={isIonQ} /> : <Lesson key={m.id} m={m} isIonQ={isIonQ} onOpenLab={openLab} />}
      <footer className="pb-4 text-center text-xs text-muted">
        Kids&apos; Explorer games, community sharing and the AI tutor live in the full web app: <a className="underline" href={REPO}>{REPO}</a>. MIT licensed.
        <br />
        This effort is supported by Qollab &amp; IonQ
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

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const sent = circuit;
      const r = await runCircuit(sent, { shots: 1024 });
      if (current.current === sent) setResult(r);
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
        <header>
          <h2 className="text-2xl font-bold">{m.title}</h2>
          <p className="text-muted">{m.summary}</p>
        </header>
        {m.sections.map((s) => (
          <section key={s.heading}>
            <h3 className="mb-1 text-lg font-semibold">{s.heading}</h3>
            <Markdown text={s.body} />
          </section>
        ))}
        {m.predict && <Predict p={m.predict} picked={guess} onPick={setGuess} revealed={!!result} />}

        <section className="panel flex flex-col gap-3 p-4" aria-label="Lesson circuit">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-auto font-semibold">🧩 The circuit (you can edit it)</h3>
            <button className="pbtn-ghost" onClick={() => onOpenLab(circuit)} disabled={running}>Open in Lab →</button>
            <button className="pbtn-ghost" disabled={running} onClick={() => { setOps(layout(m.circuit)); setResult(null); setError(null); }}>Reset</button>
            <button className="pbtn-primary" onClick={run} disabled={running || (!!m.predict && guess === null)}>{running ? "Running…" : m.predict && guess === null ? "Predict first ↑" : "▶ Run"}</button>
          </div>
          {isIonQ && <p className="text-xs text-muted">IonQ simulators take one job per Run. To run again, press Stop and Run, or pick a local simulator.</p>}
          <CircuitEditor qubits={m.circuit.qubits} ops={ops} onChange={(next) => { setOps(next); setResult(null); }} />
          {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
          {result && (
            <>
              <p className="rounded-xl bg-accent/15 p-3 text-sm"><b>What to look for:</b> {m.observe}</p>
              <IdealVsMachine result={result} hint="If this was the built-in simulator, pick an IBM or IonQ machine in Select QPU on your next Run to see real-world noise." />
              {m.readout && <LessonReadout readout={m.readout} result={result} />}
              <ResultsPanel result={result} circuit={circuit} />
            </>
          )}
          <div className="text-sm">
            <p className="font-semibold">Try it</p>
            <ul className="mt-1 list-disc pl-5 text-muted">{m.tryIt.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>
        {m.compare && <CodeVsBare circuit={m.compare} isIonQ={isIonQ} />}
        <section className="panel flex flex-col gap-3 p-4" aria-label="Check your understanding">
          <h3 className="font-semibold">✅ Check your understanding</h3>
          <p>{m.check.q}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {m.check.options.map((o, k) => {
              const st = picked === null ? "hover:bg-white/10" : k === m.check.answer ? "ring-2 ring-good" : k === picked ? "ring-2 ring-bad" : "opacity-50";
              return (
                <button key={k} onClick={() => setPicked(k)} disabled={picked !== null} className={`rounded-xl bg-white/5 p-3 text-left text-sm ${st}`}>
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <p role="status" className={picked === m.check.answer ? "text-good" : "text-on"}>
              {picked === m.check.answer ? "Correct! " : "Not quite. "}
              {m.check.why}
            </p>
          )}
        </section>
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
    <section className="panel flex flex-col gap-3 p-4" aria-label="Bare qubit versus protected qubit">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="mr-auto font-semibold">🛡️ Does the code help on this machine?</h3>
        <button className="pbtn-primary" onClick={run} disabled={busy}>{busy ? "Running…" : "▶ Run bare vs protected"}</button>
      </div>
      <p className="text-sm text-muted">One circuit holds a bare qubit and a qubit protected by the 3-qubit code, both storing 0. Any 1 we read is an error. The bare qubit can only be misread. The protected one can be misread too, plus whatever its 15 extra gates (about 26 two-qubit gates once compiled) add. A stored 0 barely suffers from waiting, so this is a tough test for the code.</p>
      {isIonQ && <p className="text-xs text-muted">IonQ simulators take one job per Run. If you already ran the lesson circuit, press Stop and Run before this comparison.</p>}
      {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
      {r && (
        <p role="status" className="text-sm">
          Bare qubit error: <b>{pc(bare)}</b> · Protected qubit error: <b>{pc(coded)}</b>.{" "}
          {bare === 0 && coded === 0
            ? "No errors at all: this is a perfect machine. Pick an IBM or IonQ simulator on your next Run."
            : Math.abs(coded - bare) <= 2 * se
              ? "Too close to call: the difference is within shot-to-shot wobble. Run again to check."
              : coded < bare
                ? "The protected qubit came out ahead. On this test that can only mean q1 reads out more reliably than q0, because the bare qubit's only possible error is a misread."
                : "The code lost: its own gates added more errors than it can fix. Error correction pays off only once gates are good enough (below the fault-tolerance threshold) and the stored qubit actually suffers errors while it waits."}
        </p>
      )}
    </section>
  );
}
