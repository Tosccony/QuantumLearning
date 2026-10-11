"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import BlochSphere from "@/components/lab/BlochSphere";
import CircuitEditor, { CELL, LEFT, layout } from "@/components/lab/CircuitEditor";
import Histogram, { ScaleBar } from "@/components/lab/Histogram";
import Icon, { type IconName } from "@/components/ui/Icon";
import { EdgeCode, Flag, Notice, Perf, Stripe, TRACK_VAR } from "@/components/ui/primitives";
import { DEMO_NOISE } from "@/lib/breakTheCode";
import { moduleById, modulesOf, TRACKS, type TrackId } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { runCircuit, type RunResult } from "@/lib/quantum";
import { nextModule, trackProgress } from "@/lib/skills";
import { useCircuitPrefix } from "@/lib/useCircuitPrefix";

const DEMO = moduleById("r3")!;
const SHOTS = 1024;

/** Column groups of the bit-flip code strip, in layout() columns. */
const GROUPS: { label: string; from: number; to: number }[] = [
  { label: "Encode", from: 0, to: 2 },
  { label: "Error", from: 3, to: 3 },
  { label: "Syndrome", from: 4, to: 7 },
  { label: "Correct", from: 8, to: 12 },
  { label: "Decode", from: 13, to: 14 },
];

const TRACK_ICON: Record<TrackId, IconName> = { explorer: "explorer", student: "student", developer: "developer", researcher: "researcher", concepts: "unlock" };

const CLAIMS: { icon: IconName; title: string; text: string; href: string; proof: string }[] = [
  { icon: "learn", title: "Learn", text: "Twenty-one modules and seven planet games, each ending in a circuit you run.", href: "/learn", proof: "Explore the five learning tracks" },
  { icon: "chip", title: "Build", text: "Nineteen gates on a visual strip, by mouse, drag or keyboard.", href: "/lab", proof: "The strip above is the editor" },
  { icon: "run", title: "Run", text: "Every number comes back from the Qiskit Aer simulator, ideal or noisy.", href: "/lab", proof: "Backend and version printed on each result" },
  { icon: "tutor", title: "Understand", text: "A tutor grounded in the counts, Bloch vectors and purity of your own run.", href: "/lab", proof: "Offline explainer when no API key is set" },
];

export default function Home() {
  const { state, ready, recordRun } = useProgress();
  const [runResult, setResult] = useState<RunResult | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [ranNoisy, setRanNoisy] = useState(true);
  const [running, setRunning] = useState<"ideal" | "noisy" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ops = useMemo(() => layout(DEMO.circuit), []);
  const resultsRef = useRef<HTMLDivElement>(null);

  // On narrow screens the results window sits below the strip: bring it into view when a run lands.
  useEffect(() => {
    if (!runResult || window.innerWidth >= 1280) return;
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [runResult]);
  const prefix = useCircuitPrefix(DEMO.circuit, runResult, step, ranNoisy ? DEMO_NOISE : null);
  const result = prefix.result;

  async function run(noisy: boolean) {
    setRunning(noisy ? "noisy" : "ideal");
    setError(null);
    try {
      const r = await runCircuit(DEMO.circuit, { shots: SHOTS, noise: noisy ? DEMO_NOISE : null });
      setResult(r);
      setStep(null);
      setRanNoisy(noisy);
      recordRun();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(null);
    }
  }

  const resume = ready ? nextModule(state) : undefined;
  const started = ready && Object.keys(state.modules).length > 0;
  const q0 = result?.bloch[0];
  const r0 = q0 ? Math.hypot(...q0) : null;
  const syndrome = result ? topSyndrome(result.counts) : null;

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      {/* ---------------------------------------------------------------- Fig. 1 */}
      <section className="flex flex-col gap-6" aria-labelledby="hero-title">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <h1 id="hero-title" className="display max-w-[14ch] text-[clamp(2.6rem,7vw,5.6rem)]">
            Every result here is a real Qiskit run.
          </h1>
          <p className="max-w-md text-base text-fog sm:text-lg">
            From a child&apos;s first light switch to quantum error correction, every experiment executes on the Qiskit Aer simulator, and every number on screen comes back from it. Start with the hardest one.
          </p>
        </div>

        <div className="rail">
          <Perf />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-3 py-3">
            <button type="button" className="keycap-primary flex-1 sm:flex-none" onClick={() => run(true)} disabled={!!running}>
              <Icon name="run" size={14} /> {running === "noisy" ? "Running…" : "Run with noise"}
            </button>
            <button type="button" className="keycap" onClick={() => run(false)} disabled={!!running}>
              {running === "ideal" ? "Running…" : "Run ideal"}
            </button>
            <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
              <EdgeCode className="hidden md:inline">F01–F15 · 3-qubit bit-flip code · 5 wires</EdgeCode>
              <Link href="/learn/r3" className="label inline-flex min-h-11 items-center text-ice underline-offset-4 hover:underline">Read the lesson</Link>
              <Link href={`/lab?module=${DEMO.id}`} className="label inline-flex min-h-11 items-center text-ice underline-offset-4 hover:underline">Open in the Lab</Link>
            </div>
          </div>
          <Perf />
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* the strip */}
          <div className="flex min-w-0 flex-col gap-3">
            <div className="overflow-x-auto bg-navy-deep" tabIndex={0} role="region" aria-label="Bit-flip code circuit strip, scrolls sideways">
              <div className="relative" style={{ minWidth: LEFT + 15 * CELL + 12 }}>
                <div className="relative h-8" aria-hidden>
                  {GROUPS.map((g) => (
                    <span
                      key={g.label}
                      className="label absolute top-1.5 flex items-center gap-1.5 text-fog"
                      style={{ left: LEFT + g.from * CELL + 6, width: (g.to - g.from + 1) * CELL - 12 }}
                    >
                      <span className="h-px flex-1 bg-[var(--line-strong)]" />
                      <span className="shrink-0">{g.label}</span>
                      <span className="h-px flex-1 bg-[var(--line-strong)]" />
                    </span>
                  ))}
                </div>
                <CircuitEditor
                  qubits={DEMO.circuit.qubits}
                  ops={ops}
                  readOnly
                  stepIndex={step === null ? null : step - 1}
                  scrub={runResult ? { value: step, max: DEMO.circuit.ops.length, onChange: setStep } : undefined}
                />
              </div>
            </div>
            <p className="window p-4 text-sm leading-relaxed [&>span]:mr-2">
              A data qubit Ry(0.8)|0⟩ is encoded into three wires. An X error is injected on q1. Two ancillas measure the parities Z₀Z₁ and Z₁Z₂ without learning the data, a Toffoli puts the flipped qubit right, and the code is decoded. Read q0&apos;s Bloch vector: with the correction it comes back to ≈ (0.717, 0, 0.697), error or not.
            </p>
          </div>

          {/* the window */}
          <div ref={resultsRef} className="window flex scroll-mt-24 flex-col">
            <Perf />
            <div className="flex flex-1 flex-col gap-3 p-4">
              <h2 className="display text-2xl">{step === null ? "Qiskit results" : `After ${step} gates`}</h2>
              {error && <Notice tone="bad" role="alert">{error}</Notice>}
              {prefix.error && <Notice tone="bad" role="alert">{prefix.error}</Notice>}
              {prefix.loading && <p role="status">Running this prefix on Qiskit…</p>}
              {!runResult && !error && (
                <div className="flex flex-1 flex-col gap-3 text-sm text-[#46587a]">
                  <p>Nothing has run yet. Press <b className="text-navy-ink">Run with noise</b> to execute the strip on the Qiskit Aer simulator with a 1% single-qubit, 5% two-qubit and 3% readout error model. The window fills with the measured counts, the exact probabilities and q0&apos;s Bloch vector.</p>
                  <div className="graticule relative min-h-28 flex-1 border border-paper-3" aria-hidden>
                    <span className="absolute inset-x-3 bottom-3 border-t border-dashed border-[#9aa9c4]" />
                  </div>
                  <ScaleBar shots={0} />
                </div>
              )}
              {result && (
                <div className="strike flex flex-col gap-3" aria-live="polite">
                  <dl className="grid grid-cols-3 gap-px border border-navy-ink bg-navy-ink text-center">
                    <div className="bg-paper p-2">
                      <dd className="display num text-2xl">{r0?.toFixed(2)}</dd>
                      <dt className="label-sm text-[#46587a]">|r| of q0</dt>
                    </div>
                    <div className="bg-paper p-2">
                      <dd className="display num code text-2xl">{syndrome}</dd>
                      <dt className="label-sm text-[#46587a]">syndrome q4q3</dt>
                    </div>
                    <div className="bg-paper p-2">
                      <dd className="display num text-2xl">{result.transpiled.gate_counts.cx ?? 0}</dd>
                      <dt className="label-sm text-[#46587a]">CX after transpile</dt>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-3 pb-2 text-xs text-[#46587a]">
                    <span className="code">{ranNoisy ? "noisy" : "ideal"} · {result.backend} · Qiskit {result.qiskit_version} · <span className="whitespace-nowrap">{result.elapsed_ms} ms</span></span>
                    <ScaleBar shots={result.shots} />
                  </div>
                  <Histogram counts={result.counts} shots={result.shots} probabilities={result.probabilities} max={6} height={130} showScale={false} />
                  <div className="flex items-center gap-4 border-t border-paper-3 pt-3">
                    {q0 && <BlochSphere v={q0} label="q0" purity={result.purity[0]} size={120} />}
                    <p className="text-sm text-[#46587a]">
                      {step !== null ? `Qiskit results for the first ${step} gates. Scrub to the end to see the correction.` : ranNoisy ? "Noisy shots can land on other codewords. The Bloch vector and exact ticks describe the ideal circuit; noise is applied to the measured counts." : "Ideal run: every shot reads the corrected codeword, the syndrome is 11, and q0 comes back with |r| = 1."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- Tracks rail */}
      <section aria-labelledby="tracks-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <h2 id="tracks-title" className="display text-3xl sm:text-4xl">Five tracks, one engine</h2>
          <p className="text-fog">Same circuits, same simulator, five registers.</p>
          {started && resume ? (
            <Link href={`/learn/${resume.id}`} className="keycap-primary ml-auto"><Icon name="flag" size={14} /> Continue: {resume.title}</Link>
          ) : (
            <Link href="/learn" className="keycap-primary ml-auto"><Icon name="flag" size={14} /> Start learning</Link>
          )}
        </div>
        <div className="rail">
          <Perf />
          <ul className="flex snap-x gap-2 overflow-x-auto px-2 py-3 sm:px-3 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {TRACKS.map((t) => {
              const p = ready ? trackProgress(state, t.id) : { done: 0, total: t.id === "explorer" ? 7 : modulesOf(t.id).length };
              const mins = t.id === "explorer" ? 30 : modulesOf(t.id).reduce((a, m) => a + m.minutes, 0);
              const isNext = resume?.track === t.id;
              return (
                <li key={t.id} className="w-[min(78vw,300px)] shrink-0 snap-start lg:w-auto">
                  <Link href={t.id === "explorer" ? "/explorer" : `/tracks/${t.id}`} className={`frame relative flex h-full flex-col gap-3 p-4 transition hover:border-[var(--line-strong)] ${isNext ? "frame-active" : ""}`}>
                    <Stripe track={t.id} className="absolute inset-x-0 top-0" />
                    {isNext && <Flag className="absolute -top-[11px] right-3" width={16} />}
                    <div className="flex items-center gap-2 pt-1">
                      <Icon name={TRACK_ICON[t.id]} size={22} className="text-ice" />
                      <h3 className="display text-2xl">{t.name}</h3>
                      <EdgeCode className="ml-auto">{t.id.slice(0, 3)}</EdgeCode>
                    </div>
                    <p className="label-sm text-fog">{t.audience}</p>
                    <p className="text-sm leading-relaxed">{t.tagline}</p>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                      <div className="flex gap-1" role="img" aria-label={`${p.done} of ${p.total} complete`}>
                        {Array.from({ length: p.total }, (_, i) => (
                          <span key={i} className={`relative h-3 w-4 border ${i < p.done ? "border-ice bg-ice" : "border-[var(--line-strong)]"}`} style={i < p.done ? { boxShadow: `inset 0 0 0 1px ${TRACK_VAR[t.id]}` } : undefined} />
                        ))}
                      </div>
                      <span className="code text-xs text-fog">{p.total} {t.id === "explorer" ? "planets" : "modules"} · {mins} min</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Perf />
        </div>
      </section>

      {/* ---------------------------------------------------------------- Claims and proofs */}
      <section aria-labelledby="loop-title" className="flex flex-col gap-4">
        <h2 id="loop-title" className="display text-3xl sm:text-4xl">Learn, build, run, understand</h2>
        <div className="rail">
          <Perf />
          <ol className="grid gap-2 px-2 py-3 sm:grid-cols-2 sm:px-3 lg:grid-cols-4">
            {CLAIMS.map((c) => (
              <li key={c.title}>
                <Link href={c.href} className="frame flex h-full flex-col gap-2 p-4 transition hover:border-[var(--line-strong)]">
                  <div className="flex items-center gap-2">
                    <Icon name={c.icon} size={18} className="text-ice" />
                    <h3 className="display text-xl">{c.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed">{c.text}</p>
                  <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-fog"><Icon name="check" size={12} className="text-ice" /> {c.proof}</p>
                </Link>
              </li>
            ))}
          </ol>
          <Perf />
        </div>
      </section>
    </div>
  );
}

/** Most common ancilla reading (q4 q3 are the two leftmost bits of a 5-qubit bitstring). */
function topSyndrome(counts: Record<string, number>) {
  const agg: Record<string, number> = {};
  for (const [k, v] of Object.entries(counts)) agg[k.slice(0, 2)] = (agg[k.slice(0, 2)] ?? 0) + v;
  return Object.entries(agg).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
}
