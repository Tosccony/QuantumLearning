import { useMemo, useState } from "react";
import CircuitEditor, { layout } from "@/components/lab/CircuitEditor";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Notice, Perf, Readout, Window } from "@/components/ui/primitives";
import { CORRECTION, codeCircuit, DEFAULT_INJECTION, expected, explainProof, INJECTIONS, P_ONE, readProof, START, type Injection, type Proof } from "@/lib/breakTheCode";
import { pct } from "@/lib/explain";
import { runCircuit, type Circuit, type Noise, type RunResult } from "@/lib/quantum";

const STEPS = ["Inject", "Predict", "Run", "Syndrome", "Explain"];
const vec = (v: number[]) => `(${v.map((x) => x.toFixed(3)).join(", ")})`;

type Props = {
  isIonQ?: boolean;
  /** Web app only: offer the home page's device noise model (Qollab picks noise through Select QPU). */
  noise?: Noise;
  onOpenLab?: (c: Circuit) => void;
  /** Lets a docked explainer see the circuit on screen and its latest run. */
  onChange?: (c: Circuit, r: RunResult | null, inj: Injection) => void;
  /** Called after each successful run (the web lesson page counts it toward progress). */
  onRun?: () => void;
  /** Heading level of the section title: 2 on the Judge Start page, 3 inside a lesson that already has an h2 title. */
  headingLevel?: 2 | 3;
};

/** Break the Code: inject X errors into the 3-qubit bit-flip code and read the proof back from one run. */
export default function BreakTheCode({ isIonQ, noise, onOpenLab, onChange, onRun, headingLevel = 2 }: Props) {
  const [inj, setInj] = useState(DEFAULT_INJECTION);
  const [guess, setGuess] = useState<boolean | "skip" | null>(null);
  const [noisy, setNoisy] = useState(false);
  const [run, setRun] = useState<{ r: RunResult; p: Proof; inj: Injection; guess: boolean | "skip" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const circuit = useMemo(() => codeCircuit(inj), [inj]);
  const ops = useMemo(() => layout(circuit), [circuit]);
  const H = `h${headingLevel}` as "h2" | "h3";
  const done = run ? 4 : guess !== null ? 2 : 1;

  // Any input change makes a shown proof stale: clear it, as a new injection does.
  function clear(c: Circuit, i: Injection = inj) {
    setRun(null);
    setError(null);
    onChange?.(c, null, i);
  }

  function pick(i: Injection) {
    setInj(i);
    setGuess(null);
    clear(codeCircuit(i), i);
  }

  function predict(v: boolean | "skip") {
    setGuess(v);
    clear(circuit);
  }

  async function go() {
    if (guess === null) return;
    setBusy(true);
    setError(null);
    try {
      const r = await runCircuit(circuit, { shots: 1024, noise: noise && noisy ? noise : null });
      setRun({ r, p: readProof(r), inj, guess });
      onChange?.(circuit, r, inj);
      onRun?.();
    } catch (e) {
      setRun(null);
      setError((e as Error).message);
      onChange?.(circuit, null, inj);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-labelledby="btc-title">
      <Perf />
      <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <H id="btc-title" className="display text-3xl leading-none sm:text-4xl">Break the code</H>
            <EdgeCode className="pb-1">3-QUBIT BIT-FLIP CODE · 5Q · ONE RUN</EdgeCode>
          </div>
          <p className="max-w-[70ch] text-fog">
            q0 holds Ry(0.8)|0⟩, copied onto q1 and q2. You inject X errors, two ancillas (q3, q4) read the parities Z₀Z₁ and Z₁Z₂ without looking at the data, Toffolis fix the qubit the syndrome blames, and the code is decoded. Can you make it fail?
          </p>
          <ol className="flex flex-wrap gap-1.5" aria-label="Steps">
            {STEPS.map((s, i) => (
              <li key={s} className={`chip ${i < done ? "border-ice text-ice" : i === done ? "border-paper text-paper" : "opacity-70"}`} aria-current={i === done ? "step" : undefined}>
                <span className="code normal-case tracking-normal">{i + 1}</span> {s}
              </li>
            ))}
          </ol>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <fieldset className="flex flex-col gap-2">
            <legend className="label-sm mb-2 text-fog">1 · Inject an error after encoding</legend>
            <div className="flex flex-wrap gap-1.5">
              {INJECTIONS.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  aria-pressed={i.id === inj.id}
                  disabled={busy}
                  onClick={() => pick(i)}
                  className={`chip min-h-11 transition-colors ${i.id === inj.id ? "border-ice bg-ice text-navy-ink" : "hover:bg-[rgba(111,230,255,0.12)]"}`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="label-sm mb-2 text-fog">2 · Predict: after decoding, is q0 back to its starting state?</legend>
            <div className="flex flex-wrap gap-1.5">
              {([[true, "Yes, recovered"], [false, "No, it's corrupted"]] as const).map(([v, label]) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={guess === v}
                  disabled={busy}
                  onClick={() => predict(v)}
                  className={`chip min-h-11 transition-colors ${guess === v ? "border-ice bg-ice text-navy-ink" : "hover:bg-[rgba(111,230,255,0.12)]"}`}
                >
                  {label}
                </button>
              ))}
              <button type="button" aria-pressed={guess === "skip"} disabled={busy} onClick={() => predict("skip")} className={`chip min-h-11 ${guess === "skip" ? "border-ice text-ice" : "opacity-80"}`}>
                Skip
              </button>
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="label-sm mr-auto text-fog">3 · Run it</p>
          {noise && (
            <label className="label-sm flex min-h-11 cursor-pointer items-center gap-2 text-fog">
              <input type="checkbox" className="h-4 w-4 accent-[var(--ice)]" checked={noisy} onChange={(e) => { setNoisy(e.target.checked); clear(circuit); }} disabled={busy} />
              Device noise ({pct(noise.p1)} / {pct(noise.p2)} / {pct(noise.readout)} readout)
            </label>
          )}
          {onOpenLab && <button type="button" className="keycap" onClick={() => onOpenLab(circuit)} disabled={busy}><Icon name="lab" size={14} /> Open in Lab</button>}
          <button type="button" className="keycap-primary" onClick={go} disabled={busy || guess === null} aria-busy={busy}>
            <Icon name="run" size={14} /> {busy ? "Running…" : guess === null ? "Predict first" : "Run"}
          </button>
        </div>
        {isIonQ && <Notice tone="warn">IonQ simulators take one job per Run. To run again, press Stop and Run, or pick a local simulator.</Notice>}
        {error && <Notice tone="bad" role="alert">{error}</Notice>}
        <p role="status" className="sr-only">{busy ? "Running…" : run ? `Syndrome ${run.p.syndrome}. q0 ${run.p.recovered ? "recovered" : "not recovered"}.` : ""}</p>
        {run && <ProofPanel {...run} />}
        <p className="label-sm -mb-2 text-fog">The circuit you&apos;re running · the injected X sits right after encoding</p>
        <div className="frame overflow-x-auto p-3">
          <CircuitEditor qubits={circuit.qubits} ops={ops} readOnly compact />
        </div>
      </div>
      <Perf />
    </section>
  );
}

function ProofPanel({ r, p, inj, guess }: { r: RunResult; p: Proof; inj: Injection; guess: boolean | "skip" }) {
  const want = expected(inj);
  const fixOf = (q: number | null | undefined) => (q == null ? null : `X on q${q}`);
  const flipped = !p.recovered;
  return (
    <div className="flex flex-col gap-3 strike">
      <section className="frame flex flex-col gap-4 px-3 py-4 text-paper sm:px-4" aria-label="Result proof">
        <p className="label-sm flex flex-wrap items-center gap-x-3 text-fog">
          <span className="flex items-center gap-2"><Icon name="chip" size={14} className="text-ice" /> 4 · Result proof</span>
          <span className="code normal-case tracking-normal">{r.backend} · Qiskit {r.qiskit_version}</span>
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          <Readout label="Injected" value={<span className="text-xl">{inj.label}</span>} />
          <Readout label="Expected syndrome (perfect machine)" value={<span className="code text-ice">{want.syndrome}</span>} sub={fixOf(CORRECTION[want.syndrome]) ?? "None needed"} />
          <Readout label="Measured syndrome (most common)" value={<span className="code text-ice">{p.syndrome}</span>} sub={`${pct(p.syndromeShare)} of shots → ${fixOf(p.fixes) ?? "no correction"}`} />
          <Readout label="Logical outcome (exact)" value={<span className={flipped ? "text-bad" : "text-ice"}>{flipped ? "Logical flip" : "Recovered"}</span>} sub={flipped ? "q0 decoded as X·|ψ⟩" : "q0 back to |ψ⟩"} />
        </div>
        <div className="grid gap-3 border-t border-[var(--line)] pt-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1 text-sm">
            <p className="label-sm text-fog">Exact · statevector (no shots, no noise)</p>
            <p>q0 Bloch <span className="code">{vec(p.exactBloch)}</span></p>
            <p className="text-fog">started at <span className="code">{vec(START)}</span></p>
          </div>
          <div className="flex flex-col gap-1 text-sm">
            <p className="label-sm text-fog">Sampled · {r.shots} shots on {r.backend}</p>
            <p>P(q0 = 1) measured <b className="num">{pct(p.measuredOne)}</b> vs exact <b className="num">{pct(p.exactOne)}</b></p>
            <p className="text-fog">distance from exact (TVD) <span className="code text-paper">{p.distance.toFixed(3)}</span></p>
          </div>
        </div>
        <p className="border-t border-[var(--line)] pt-3 text-sm text-fog">
          Circuit compiled to {`{${r.transpiled.basis.join(", ")}}`} (IBM-style, optimization level 1): depth <span className="code text-paper">{r.transpiled.depth}</span>, CX <span className="code text-paper">{p.cx}</span>
        </p>
      </section>

      <Window as="section" className="flex flex-col gap-2 p-4 sm:p-5" aria-label="Explain the result">
        <p className="label-sm flex items-center gap-2 text-[#46587a]"><Icon name="tutor" size={14} /> 5 · Explain</p>
        {guess !== "skip" && <p className="display text-lg">{guess === p.recovered ? "You called it" : "Surprised?"}</p>}
        <p className="leading-relaxed">{explainProof(inj, r, "beginner")}</p>
        <p className="text-sm leading-relaxed text-[#46587a]">
          Sampled check: a recovered q0 reads 1 about {pct(P_ONE)} of the time, a flipped one about {pct(1 - P_ONE)}. This run measured {pct(p.measuredOne)}.
        </p>
      </Window>
    </div>
  );
}
