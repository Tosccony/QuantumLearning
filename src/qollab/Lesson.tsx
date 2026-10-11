import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { focusById, Kbd, KeysHint, useLessonKeys } from "@/components/LessonKeys";
import Markdown from "@/components/Markdown";
import BreakTheCode from "@/components/lab/BreakTheCode";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import IdealVsMachine from "@/components/lab/IdealVsMachine";
import LessonReadout from "@/components/lab/LessonReadout";
import Predict from "@/components/lab/Predict";
import QuantumMoneyDemo from "@/components/lab/QuantumMoneyDemo";
import ResultsPanel from "@/components/lab/ResultsPanel";
import SidebarNote from "@/components/lab/SidebarNote";
import Tutor from "@/components/lab/Tutor";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Heading, Notice, Perf, Window } from "@/components/ui/primitives";
import { TRACKS, type Module } from "@/lib/curriculum";
import { runCircuit, type Circuit, type RunResult } from "@/lib/quantum";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

type Crumb = { label: string; onClick: () => void };

export default function Lesson({ m, isIonQ, onOpenLab, breadcrumb, next }: { m: Module; isIonQ: boolean; onOpenLab: (c: Circuit) => void; breadcrumb: Crumb; next?: { title: string; onClick: () => void } }) {
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
  // In memory only: the Qollab player must not touch browser storage.
  const [keys, setKeys] = useState(true);
  const nSections = Math.min(m.sections.length, 9);
  useLessonKeys({ enabled: keys, sections: nSections, onSection: (i) => focusById(`lesson-sec-${i + 1}`), onTutor: () => focusById("lesson-tutor") });

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

  const checkBlock = (
    <Window as="section" className="flex flex-col gap-4 p-5 sm:p-6" aria-label="Check your understanding">
      <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
      <h2 className="display text-2xl leading-tight sm:text-3xl">Check your understanding</h2>
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
              {picked !== null && isAnswer && <Icon name="check" size={16} className="shrink-0 text-navy-ink" title="Correct answer" />}
              {picked !== null && isPick && !isAnswer && <Icon name="close" size={16} className="shrink-0 text-bad" title="Your answer, incorrect" />}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="flex items-start gap-3 border-t border-paper-3 pt-4 strike" role="status">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center border ${correct ? "border-navy-ink bg-navy-ink text-ice" : "border-bad text-bad"}`} aria-hidden>
            <Icon name={correct ? "check" : "close"} size={18} />
          </span>
          <div className="min-w-0">
            <p className="display text-lg">{correct ? "Correct" : "Not quite"}</p>
            <p className="mt-1 text-sm leading-relaxed">{m.check.why}</p>
          </div>
        </div>
      )}
    </Window>
  );

  const circuitPanel = m.circuitPanel !== false;
  const predictInline = m.sections.some((s) => s.predictHere);
  const checkInline = m.sections.some((s) => s.checkHere);
  const predictBlock = m.predict && <Predict p={m.predict} picked={guess} onPick={setGuess} revealed={circuitPanel ? !!result : guess !== null} />;

  // The lesson copy sits in one punched window. A section with a demo, an inline prediction or an inline check ends the
  // window; those blocks follow (prediction, then demo, then check), and the copy resumes in a new window.
  const copy: ReactNode[] = [];
  let part: typeof m.sections = [];
  let first = 0; // index in m.sections of part[0]
  const flush = () => {
    if (!part.length) return;
    copy.push(
      <Window key={`copy-${copy.length}`} as="div" className="flex flex-col gap-5 p-5 sm:p-6">
        <Perf className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6" />
        {part.map((s, i) => (
          <section key={s.heading}>
            {first + i < 9 ? (
              <h2 id={`lesson-sec-${first + i + 1}`} tabIndex={-1} aria-keyshortcuts={keys ? String(first + i + 1) : undefined} className="display scroll-mt-24 text-xl sm:text-2xl">{s.heading}{keys && <Kbd className="ml-2">{String(first + i + 1)}</Kbd>}</h2>
            ) : (
              <h2 className="display text-xl sm:text-2xl">{s.heading}</h2>
            )}
            <Markdown text={s.body} />
          </section>
        ))}
      </Window>,
    );
    part = [];
  };
  for (const [n, s] of m.sections.entries()) {
    if (!part.length) first = n;
    part.push(s);
    if (!s.demo && !s.predictHere && !s.checkHere) continue;
    flush();
    if (s.predictHere) copy.push(<Fragment key={`predict-${s.heading}`}>{predictBlock}</Fragment>);
    if (s.demo) copy.push(<QuantumMoneyDemo key={`demo-${s.heading}`} kind={s.demo} isIonQ={isIonQ} onOpenLab={onOpenLab} />);
    if (s.checkHere) copy.push(<Fragment key={`check-${s.heading}`}>{checkBlock}</Fragment>);
  }
  flush();

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <p role="status" className="sr-only">{running ? "Running…" : result ? "Results ready." : ""}</p>
        <header className="flex flex-col gap-2">
          <button type="button" onClick={breadcrumb.onClick} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-fog hover:text-paper">
            <Icon name="back" size={16} /> {breadcrumb.label}
          </button>
          <Heading as="h1" code={`${track.name.toUpperCase()} · ${m.minutes} MIN`}>{m.title}</Heading>
          <p className="max-w-prose text-fog">{m.summary}</p>
          <KeysHint enabled={keys} sections={nSections} tutor="explainer" onToggle={() => setKeys(!keys)} />
        </header>

        {copy}

        {!predictInline && predictBlock}

        {circuitPanel && (
        <section className="rail -mx-3 sm:-mx-4" aria-label="Lesson circuit">
          <Perf />
          <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="mr-auto flex items-center gap-3">
                <Icon name="chip" size={18} className="text-ice" />
                <h2 className="display text-xl sm:text-2xl">The circuit</h2>
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
        )}

        {m.extra === "breakTheCode" && <BreakTheCode isIonQ={isIonQ} onOpenLab={onOpenLab} />}

        {!checkInline && checkBlock}
        {next && (
          <button type="button" className="keycap-primary w-fit" onClick={next.onClick}>Next: {next.title} <Icon name="next" size={14} /></button>
        )}
      </div>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Tutor compact offline shortcut={keys} circuit={circuit} result={result} extra={`Lesson: ${m.title}. What to look for: ${m.observe}`} />
        {m.sidebarNote && <SidebarNote note={m.sidebarNote} />}
      </aside>
    </article>
  );
}
