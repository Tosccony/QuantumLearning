"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import FlowSteps, { type FlowStep } from "@/components/FlowSteps";
import Markdown from "@/components/Markdown";
import CircuitEditor, { layout } from "@/components/lab/CircuitEditor";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Heading, Notice, Perf, Stripe, Window } from "@/components/ui/primitives";
import { moduleById, modulesOf, TRACKS } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { runCircuit, type RunResult } from "@/lib/quantum";
import { moduleStatus } from "@/lib/skills";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** A lesson: copy in a punched window, the circuit as frames on the rail, the check as a window of keycaps. */
export default function LessonPage() {
  const { module: id } = useParams<{ module: string }>();
  const m = moduleById(id);
  const { state, ready, completeModule, recordRun } = useProgress();
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
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
  const code = `F${String(idx + 1).padStart(2, "0")}`;

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
  const correct = picked !== null && picked === m.check.answer;

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Link href={`/tracks/${m.track}`} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-fog hover:text-paper">
            <Icon name="back" size={16} />
            <Icon name={track.id} size={16} />
            {track.name} track · module {idx + 1} of {siblings.length}
          </Link>
          <div className="flex flex-col gap-2">
            <Stripe track={m.track} className="max-w-24" />
            <Heading as="h1" code={code}>{m.title}</Heading>
            <p className="max-w-prose text-lg text-fog">{m.summary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip"><Icon name="clock" size={12} /> {m.minutes} min</span>
            <span className="chip"><Icon name="badge" size={12} /> Skill: {m.skill}</span>
            {done && <span className="chip !border-ice"><Icon name="cross" size={12} className="text-ice" /> Completed</span>}
          </div>
          {locked && (
            <Notice tone="warn">
              Recommended first:{" "}
              {m.requires.map((r, i) => (
                <span key={r}>
                  {i > 0 && ", "}
                  <Link href={`/learn/${r}`} className="underline underline-offset-2">{moduleById(r)?.title ?? r}</Link>
                </span>
              ))}
              . You can still explore this lesson.
            </Notice>
          )}
          <FlowSteps current={flow} done={flowDone} />
        </header>

        <Window as="section" className="p-5 sm:p-6" aria-label="Lesson">
          <Perf className="-mx-5 -mt-5 mb-4 sm:-mx-6 sm:-mt-6" />
          {m.sections.map((s, i) => (
            <section key={s.heading} className={i > 0 ? "mt-7 border-t border-paper-3 pt-6" : ""}>
              <div className="flex items-baseline gap-3">
                <h2 className="display text-xl sm:text-2xl">{s.heading}</h2>
              </div>
              <Markdown text={s.body} />
            </section>
          ))}
        </Window>

        <section className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-label="Lesson circuit">
          <Perf />
          <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto flex items-center gap-3">
                <Icon name="chip" size={18} className="text-ice" />
                <h2 className="display text-xl sm:text-2xl">The circuit</h2>
                <EdgeCode>{m.circuit.qubits}Q · {m.circuit.ops.length} GATES</EdgeCode>
              </div>
              <Link href={`/lab?module=${m.id}`} className="keycap">
                <Icon name="lab" size={14} /> Open in Lab to modify
              </Link>
              <button type="button" className="keycap-primary" onClick={run} disabled={running} aria-busy={running}>
                <Icon name="run" size={14} />
                {running ? "Running on Qiskit…" : result ? "Run again" : "Run on Qiskit"}
              </button>
            </div>

            <div className="frame overflow-x-auto p-3">
              <CircuitEditor qubits={m.circuit.qubits} ops={ops} readOnly />
            </div>

            {error && <Notice tone="bad" role="alert">{error}</Notice>}

            {result && (
              <div className="flex flex-col gap-3 strike">
                <Notice tone="info" role="status">
                  <b>What to look for:</b> {m.observe}
                </Notice>
                <ResultsPanel result={result} circuit={m.circuit} />
              </div>
            )}

            <Window as="div" className="p-4 sm:p-5">
              <p className="label-sm flex items-center gap-2 text-[#46587a]"><Icon name="lab" size={14} /> Try it yourself in the Lab</p>
              <div className="prose-q">
                <ul className="!mb-0">
                  {m.tryIt.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
            </Window>
          </div>
          <Perf />
        </section>

        <Window as="section" className="flex flex-col gap-4 p-5 sm:p-6" aria-label="Check your understanding">
          <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
          <h2 className="display text-2xl leading-tight sm:text-3xl">Check your understanding</h2>
          <p className="max-w-[68ch] text-lg leading-snug">{m.check.q}</p>

          <div className="flex flex-col gap-2" role="group" aria-label="Answers">
            {m.check.options.map((o, k) => {
              const isAnswer = k === m.check.answer;
              const isPick = k === picked;
              const tone =
                picked === null
                  ? "border-navy-ink hover:bg-paper-2"
                  : isAnswer
                    ? "border-navy-ink bg-paper-2 ring-1 ring-inset ring-navy-ink"
                    : isPick
                      ? "border-bad ring-1 ring-inset ring-bad"
                      : "border-paper-3 text-[#46587a]";
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => answer(k)}
                  disabled={picked !== null}
                  className={`flex min-h-11 w-full items-center gap-3 border px-4 py-3 text-left text-base leading-snug transition-colors disabled:pointer-events-none ${tone}`}
                  aria-label={picked !== null ? `${LETTERS[k]}. ${o}${isAnswer ? " (correct answer)" : isPick ? " (your answer)" : ""}` : undefined}
                >
                  <span className="code shrink-0 text-xs text-[#46587a]">{LETTERS[k]}</span>
                  <span className="flex-1">{o}</span>
                  {picked !== null && isAnswer && <Icon name="cross" size={16} className="shrink-0 text-navy-ink" title="Correct answer" />}
                  {picked !== null && isPick && !isAnswer && <Icon name="close" size={16} className="shrink-0 text-bad" title="Your answer" />}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <div className="flex flex-col gap-4 border-t border-paper-3 pt-4 strike" role="status">
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${correct ? "border-navy-ink bg-navy-ink text-ice" : "border-bad text-bad"}`} aria-hidden>
                  <Icon name={correct ? "cross" : "close"} size={18} />
                </span>
                <div className="min-w-0">
                  <p className="display text-lg">{correct ? "Correct" : "Not quite"}</p>
                  <p className="mt-1 text-sm leading-relaxed">{m.check.why}</p>
                </div>
              </div>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#46587a]">
                <span className="flex items-center gap-1.5"><Icon name="xp" size={14} /> <span className="code text-navy-ink">+{earned} XP</span></span>
                <span className="flex items-center gap-1.5"><Icon name="badge" size={14} /> Skill unlocked: <span className="text-navy-ink">{m.skill}</span></span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/lab?module=${m.id}`} className="keycap-paper">
                  <Icon name="share" size={14} /> Remix in the Lab and share
                </Link>
                {next ? (
                  <Link href={`/learn/${next.id}`} className="keycap-paper-primary">
                    Next: {next.title} <Icon name="next" size={14} />
                  </Link>
                ) : (
                  <Link href={`/certificate/${m.track}`} className="keycap-paper-primary">
                    <Icon name="badge" size={14} /> Claim your certificate
                  </Link>
                )}
              </div>
            </div>
          )}
        </Window>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start" onClickCapture={() => setAsked(true)}>
        <Tutor compact circuit={m.circuit} result={result} extra={`Lesson: ${m.title} (${track.name} track). Summary: ${m.summary}. What the learner should observe: ${m.observe}`} />
      </div>
    </article>
  );
}
