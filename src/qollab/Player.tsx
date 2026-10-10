import { useMemo, useState } from "react";
import Markdown from "@/components/Markdown";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import Predict from "@/components/lab/Predict";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import { MODULES, TRACKS, modulesOf, type Module } from "@/lib/curriculum";
import { runCircuit, type RunResult } from "@/lib/quantum";

const REPO = "https://github.com/Tosccony/QuantumLearning";
const LESSON_TRACKS = TRACKS.filter((t) => t.id !== "explorer");

/** Quantum Quest's lessons on Qollab: every run goes to the simulator picked in "Select QPU". */
export default function Player({ backendName }: { backendName: string }) {
  const [id, setId] = useState(MODULES[0].id);
  const m = MODULES.find((x) => x.id === id)!;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">⚛️ Quantum Quest</h1>
        <span className="chip">Simulator: {backendName}</span>
      </header>
      <nav aria-label="Lessons" className="flex flex-col gap-2">
        {LESSON_TRACKS.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-1.5">
            <span className="w-28 text-sm text-muted">{t.icon} {t.name}</span>
            {modulesOf(t.id).map((x, i) => (
              <button
                key={x.id}
                onClick={() => setId(x.id)}
                aria-current={x.id === id ? "page" : undefined}
                className={`chip ${x.id === id ? "!bg-accent !text-white" : "hover:bg-white/20"}`}
              >
                {i + 1}. {x.title}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <Lesson key={m.id} m={m} isIonQ={/ionq/i.test(backendName)} />
      <footer className="pb-4 text-center text-xs text-muted">
        Kids&apos; Explorer games, community sharing and the AI tutor live in the full web app: <a className="underline" href={REPO}>{REPO}</a>. MIT licensed.
        <br />
        This effort is supported by Qollab &amp; IonQ
      </footer>
    </div>
  );
}

function Lesson({ m, isIonQ }: { m: Module; isIonQ: boolean }) {
  const [ops, setOps] = useState<EOp[]>(() => layout(m.circuit));
  const circuit = useMemo(() => toCircuit(m.circuit.qubits, ops), [m.circuit.qubits, ops]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      setResult(await runCircuit(circuit, { shots: 1024 }));
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
            <button className="pbtn-ghost" disabled={running} onClick={() => { setOps(layout(m.circuit)); setResult(null); setError(null); }}>Reset</button>
            <button className="pbtn-primary" onClick={run} disabled={running || (!!m.predict && guess === null)}>{running ? "Running…" : m.predict && guess === null ? "Predict first ↑" : "▶ Run"}</button>
          </div>
          {isIonQ && <p className="text-xs text-muted">IonQ simulators take one job per Run. To run again, press Stop and Run, or pick a local simulator.</p>}
          <CircuitEditor qubits={m.circuit.qubits} ops={ops} onChange={(next) => { setOps(next); setResult(null); }} />
          {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
          {result && (
            <>
              <p className="rounded-xl bg-accent/15 p-3 text-sm"><b>What to look for:</b> {m.observe}</p>
              <ResultsPanel result={result} circuit={circuit} />
            </>
          )}
          <div className="text-sm">
            <p className="font-semibold">Try it</p>
            <ul className="mt-1 list-disc pl-5 text-muted">{m.tryIt.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>
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
