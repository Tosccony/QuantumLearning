"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import FlowSteps, { type FlowStep } from "@/components/FlowSteps";
import Markdown from "@/components/Markdown";
import CircuitEditor, { layout } from "@/components/lab/CircuitEditor";
import IdealVsMachine from "@/components/lab/IdealVsMachine";
import LessonReadout from "@/components/lab/LessonReadout";
import Predict from "@/components/lab/Predict";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import { moduleById, modulesOf, TRACKS } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { runCircuit, type RunResult } from "@/lib/quantum";
import { moduleStatus } from "@/lib/skills";

export default function LessonPage() {
  const { module: id } = useParams<{ module: string }>();
  const m = moduleById(id);
  const { state, ready, completeModule, recordRun } = useProgress();
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [guess, setGuess] = useState<number | null>(null);
  const [asked, setAsked] = useState(false);
  const [earned, setEarned] = useState(0);
  const ops = useMemo(() => (m ? layout(m.circuit) : []), [m]);

  if (!m) notFound();
  if (!ready) return null;

  const track = TRACKS.find((t) => t.id === m.track)!;
  const siblings = modulesOf(m.track);
  const idx = siblings.findIndex((x) => x.id === m.id);
  const next = siblings[idx + 1];
  const done = !!state.modules[m.id];
  const locked = moduleStatus(state, m) === "locked";

  async function run() {
    setRunning(true);
    setError(null);
    try {
      setResult(await runCircuit(m!.circuit, { shots: 2048 }));
      recordRun();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  function answer(k: number) {
    if (picked !== null) return;
    setPicked(k);
    setEarned(state.modules[m!.id] ? 0 : 100 + (k === m!.check.answer ? 25 : 0));
    completeModule(m!.id, k === m!.check.answer);
  }

  const flow: FlowStep = picked !== null ? "share" : asked ? "understand" : result ? "understand" : "run";
  const flowDone: FlowStep[] = ["learn", "build", ...(result ? (["run"] as FlowStep[]) : []), ...(asked || picked !== null ? (["understand"] as FlowStep[]) : [])];

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-2">
          <Link href={`/tracks/${m.track}`} className="text-sm text-muted hover:text-ink">← {track.icon} {track.name} track · module {idx + 1} of {siblings.length}</Link>
          <h1 className="text-3xl font-bold">{m.title}</h1>
          <p className="text-lg text-muted">{m.summary}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">⏱ {m.minutes} min</span>
            <span className="chip">🧠 Skill: {m.skill}</span>
            {done && <span className="chip !bg-good/20 !text-good">✓ Completed</span>}
          </div>
          {locked && (
            <p className="rounded-xl bg-on/10 p-3 text-sm text-on">
              Recommended first: {m.requires.map((r) => <Link key={r} href={`/learn/${r}`} className="underline">{moduleById(r)?.title}</Link>)}. You can still explore this lesson.
            </p>
          )}
          <FlowSteps current={flow} done={flowDone} />
        </header>

        {m.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="mb-1 text-xl font-semibold">{s.heading}</h2>
            <Markdown text={s.body} />
          </section>
        ))}

        {m.predict && <Predict p={m.predict} picked={guess} onPick={setGuess} revealed={!!result} />}

        <section className="panel flex flex-col gap-4 p-4" aria-label="Lesson circuit">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="mr-auto text-lg font-semibold">🧩 The circuit</h2>
            <Link href={`/lab?module=${m.id}`} className="pbtn-ghost">Open in Lab to modify →</Link>
            <button className="pbtn-primary" onClick={run} disabled={running || (!!m.predict && guess === null)}>{running ? "Running on Qiskit…" : m.predict && guess === null ? "Predict first ↑" : result ? "▶ Run again" : "▶ Run on Qiskit"}</button>
          </div>
          <p role="status" className="sr-only">{running ? "Running…" : result ? "Results ready." : ""}</p>
          <CircuitEditor qubits={m.circuit.qubits} ops={ops} readOnly />
          {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
          {result && (
            <>
              <p className="rounded-xl bg-accent/15 p-3 text-sm"><b>What to look for:</b> {m.observe}</p>
              <IdealVsMachine result={result} hint="Turn on noise in the Lab to see how a real device drifts." />
              {m.readout && <LessonReadout readout={m.readout} result={result} />}
              <ResultsPanel result={result} circuit={m.circuit} />
            </>
          )}
          <div className="text-sm">
            <p className="font-semibold">Try it yourself in the Lab</p>
            <ul className="mt-1 list-disc pl-5 text-muted">{m.tryIt.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>

        <section className="panel flex flex-col gap-3 p-4" aria-label="Check your understanding">
          <h2 className="text-lg font-semibold">✅ Check your understanding</h2>
          <p>{m.check.q}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {m.check.options.map((o, k) => {
              const st = picked === null ? "hover:bg-white/10" : k === m.check.answer ? "ring-2 ring-good" : k === picked ? "ring-2 ring-bad" : "opacity-50";
              return (
                <button key={k} onClick={() => answer(k)} className={`rounded-xl bg-white/5 p-3 text-left text-sm ${st}`} disabled={picked !== null}>
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className="flex flex-col gap-3">
              <p className={picked === m.check.answer ? "text-good" : "text-on"}>{picked === m.check.answer ? "Correct! " : "Not quite. "}{m.check.why}</p>
              <p className="text-sm text-muted">Module complete: +{earned} XP and the “{m.skill}” skill unlocked.</p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/lab?module=${m.id}`} className="pbtn-ghost">🌍 Remix it in the Lab and share</Link>
                {next ? <Link href={`/learn/${next.id}`} className="pbtn-primary">Next: {next.title} →</Link> : <Link href={`/certificate/${m.track}`} className="pbtn-primary">🏅 Claim your certificate</Link>}
              </div>
            </div>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-20 lg:self-start" onClickCapture={() => setAsked(true)}>
        <Tutor compact circuit={m.circuit} result={result} extra={`Lesson: ${m.title} (${track.name} track). Summary: ${m.summary}. What the learner should observe: ${m.observe}`} />
      </aside>
    </article>
  );
}
