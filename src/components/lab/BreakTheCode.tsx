import { useMemo, useState } from "react";
import CircuitEditor, { layout } from "@/components/lab/CircuitEditor";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Notice, Perf, Readout, Window } from "@/components/ui/primitives";
import { codeCircuit, expected, INJECTIONS, P_ONE, readProof, START, type Injection, type Proof } from "@/lib/breakTheCode";
import { runCircuit, type Circuit, type Noise, type RunResult } from "@/lib/quantum";

const STEPS = ["Inject", "Predict", "Run", "Syndrome", "Explain"];
const vec = (v: number[]) => `(${v.map((x) => x.toFixed(3)).join(", ")})`;
const pc = (x: number) => `${(x * 100).toFixed(1)}%`;

type Props = {
  isIonQ?: boolean;
  /** Web app only: offer the home page's device noise model (Qollab picks noise through Select QPU). */
  noise?: Noise;
  onOpenLab?: (c: Circuit) => void;
  /** Lets a docked explainer see the circuit on screen and its latest run. */
  onChange?: (c: Circuit, r: RunResult | null) => void;
};

/** Break the Code: inject X errors into the 3-qubit bit-flip code and read the proof back from one run. */
export default function BreakTheCode({ isIonQ, noise, onOpenLab, onChange }: Props) {
  const [inj, setInj] = useState(INJECTIONS[2]);
  const [guess, setGuess] = useState<boolean | "skip" | null>(null);
  const [noisy, setNoisy] = useState(false);
  const [run, setRun] = useState<{ r: RunResult; p: Proof; inj: Injection; guess: boolean | "skip" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const circuit = useMemo(() => codeCircuit(inj), [inj]);
  const ops = useMemo(() => layout(circuit), [circuit]);
  const done = run ? 4 : guess !== null ? 2 : 1;

  function pick(i: Injection) {
    setInj(i);
    setGuess(null);
    setRun(null);
    setError(null);
    onChange?.(codeCircuit(i), null);
  }

  async function go() {
    if (guess === null) return;
    setBusy(true);
    setError(null);
    try {
      const r = await runCircuit(circuit, { shots: 1024, noise: noise && noisy ? noise : null });
      setRun({ r, p: readProof(r), inj, guess });
      onChange?.(circuit, r);
    } catch (e) {
      setRun(null);
      setError((e as Error).message);
      onChange?.(circuit, null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rail -mx-3 sm:-mx-4" aria-labelledby="btc-title">
      <Perf />
      <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <h2 id="btc-title" className="display text-3xl leading-none sm:text-4xl">Break the code</h2>
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
                  onClick={() => setGuess(v)}
                  className={`chip min-h-11 transition-colors ${guess === v ? "border-ice bg-ice text-navy-ink" : "hover:bg-[rgba(111,230,255,0.12)]"}`}
                >
                  {label}
                </button>
              ))}
              <button type="button" aria-pressed={guess === "skip"} disabled={busy} onClick={() => setGuess("skip")} className={`chip min-h-11 ${guess === "skip" ? "border-ice text-ice" : "opacity-80"}`}>
                Skip
              </button>
            </div>
          </fieldset>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <p className="label-sm mr-auto text-fog">3 · Run it</p>
          {noise && (
            <label className="label-sm flex min-h-11 cursor-pointer items-center gap-2 text-fog">
              <input type="checkbox" className="h-4 w-4 accent-[var(--ice)]" checked={noisy} onChange={(e) => setNoisy(e.target.checked)} disabled={busy} />
              Device noise ({pc(noise.p1)} / {pc(noise.p2)} / {pc(noise.readout)} readout)
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
        <div className="frame overflow-x-auto p-3" tabIndex={0} role="region" aria-label={`Bit-flip code circuit with ${inj.label.toLowerCase()}, scrolls sideways`}>
          <CircuitEditor qubits={circuit.qubits} ops={ops} readOnly compact />
        </div>
      </div>
      <Perf />
    </section>
  );
}

function ProofPanel({ r, p, inj, guess }: { r: RunResult; p: Proof; inj: Injection; guess: boolean | "skip" }) {
  const want = expected(inj);
  const fix = p.fixes === null ? "None needed" : `X on q${p.fixes}`;
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
          <Readout label="Syndrome s₀s₁ (q3 q4)" value={<span className="code text-ice">{p.syndrome}</span>} sub={`${pc(p.syndromeShare)} of ${r.shots} shots`} />
          <Readout label="Correction applied" value={<span className="text-xl">{fix}</span>} sub="Toffoli on that syndrome" />
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
            <p>P(q0 = 1) measured <b className="num">{pc(p.measuredOne)}</b> vs exact <b className="num">{pc(p.exactOne)}</b></p>
            <p className="text-fog"><span className="whitespace-nowrap">distance from exact (TVD) <span className="code text-paper">{p.distance.toFixed(3)}</span></span> · <span className="whitespace-nowrap">transpiled depth <span className="code text-paper">{r.transpiled.depth}</span></span> · <span className="whitespace-nowrap">CX <span className="code text-paper">{p.cx}</span></span></p>
          </div>
        </div>
        {p.syndrome !== want.syndrome && (
          <Notice tone="warn">The most common syndrome was {p.syndrome}, but a perfect machine reads {want.syndrome} for this error. That&apos;s noise: the ancillas and the gates that fill them can fail too.</Notice>
        )}
      </section>

      <Window as="section" className="flex flex-col gap-2 p-4 sm:p-5" aria-label="Explain the result">
        <p className="label-sm flex items-center gap-2 text-[#46587a]"><Icon name="tutor" size={14} /> 5 · Explain</p>
        {guess !== "skip" && <p className="display text-lg">{guess === p.recovered ? "You called it" : "Surprised?"}</p>}
        <p className="leading-relaxed">{explain(inj.qubits, want.syndrome, p)}</p>
        <p className="text-sm leading-relaxed text-[#46587a]">
          Sampled check: a recovered q0 reads 1 about {pc(P_ONE)} of the time, a flipped one about {pc(1 - P_ONE)}. This run measured {pc(p.measuredOne)}.
        </p>
      </Window>
    </div>
  );
}

function explain(qubits: number[], syndrome: string, p: Proof): string {
  if (qubits.length === 0)
    return `No error, so both parities agree and the syndrome reads ${syndrome}. No Toffoli fires, decoding undoes the encoding, and q0 is exactly where it started.`;
  if (qubits.length === 1)
    return `The X on q${qubits[0]} broke the parity on ${qubits[0] === 1 ? "both checks" : qubits[0] === 0 ? "Z₀Z₁ only" : "Z₁Z₂ only"}, so the syndrome reads ${syndrome} and points straight at q${qubits[0]}. The Toffoli flips it back and q0 decodes to its original state. The parities are the same for |000⟩ and |111⟩, so the check never learned the amplitudes it protected.`;
  return `Two errors fool the code. X on q0 and q1 leaves Z₀Z₁ unchanged and breaks Z₁Z₂, so the syndrome reads ${syndrome}, the same as a single error on q2. The code "fixes" q2, which leaves all three flipped: a logical X, and q0 decodes as ${vec(p.exactBloch)} instead of ${vec(START)}. A distance-3 code corrects one error; stronger protection needs bigger codes and better gates.`;
}
