"use client";

import { useState } from "react";
import CircuitEditor, { layout } from "@/components/lab/CircuitEditor";
import Histogram from "@/components/lab/Histogram";
import { g, runCircuit, type Circuit, type Op, type RunResult } from "@/lib/quantum";

/** The three interactive demos called for in the quantum money lesson outline. */
export default function QuantumMoneyDemo({ kind }: { kind: "qm-angle" | "qm-lock" | "qm-multi" }) {
  if (kind === "qm-angle") return <AngleDemo />;
  if (kind === "qm-lock") return <LockDemo />;
  return <MultiDemo />;
}

/** A full-width barrier, drawn as a break across every qubit named, to separate the setting /
 * locking / unlocking phases of a circuit. */
const barrier = (n: number): Op => ({ gate: "barrier", targets: Array.from({ length: n }, (_, i) => i), controls: [], params: [] });

function useRun(circuit: Circuit, shots: number) {
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    setRunning(true);
    setError(null);
    try {
      setResult(await runCircuit(circuit, { shots }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }
  return { result, running, error, run, reset: () => setResult(null) };
}

/** Set the angle of a qubit and get the calculated probabilities of the 0 and 1 states. */
function AngleDemo() {
  const [deg, setDeg] = useState(60);
  const rad = (deg * Math.PI) / 180;
  const p1 = Math.sin(rad / 2) ** 2;
  const p0 = 1 - p1;
  const { result, running, error, run, reset } = useRun({ qubits: 1, ops: [g("ry", [0], [], [rad])] }, 1000);

  return (
    <div className="panel mt-3 flex flex-col gap-4 p-4" aria-label="Rotation angle demonstration">
      <label className="flex flex-col gap-1 text-sm">
        <span>Rotation angle: <b className="font-mono">{deg}°</b> {deg === 0 ? "(north pole)" : deg === 180 ? "(south pole)" : deg === 90 || deg === 270 ? "(the equator)" : ""}</span>
        <input type="range" min={0} max={360} value={deg} onChange={(e) => { setDeg(+e.target.value); reset(); }} className="w-full" aria-label="Rotation angle in degrees" />
      </label>
      <div className="flex gap-6">
        <ProbBar label="P(0)" value={p0} />
        <ProbBar label="P(1)" value={p1} />
      </div>
      <p className="rounded-xl bg-white/5 p-3 text-sm text-muted">
        The equation behind these bars: <code className="font-mono text-ink">P(1) = sin²(θ/2)</code>. At θ = {deg}°, that&apos;s sin²({(deg / 2).toFixed(1)}°) = <b className="text-ink">{(p1 * 100).toFixed(1)}%</b>.
        This is <b className="text-ink">non-linear</b> — equal steps in angle don&apos;t give equal steps in probability. The curve is flattest near the poles (0° and 180°) and steepest near the equator (90°, 270°): going from 0° to 45° only raises P(1) to about 15%, but the next 45°, from 45° to 90°, raises it the rest of the way to 50%.
      </p>
      <button className="pbtn-ghost self-start" onClick={run} disabled={running}>{running ? "Running…" : "▶ Run 1000 shots on Qiskit"}</button>
      {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
      {result && <Histogram counts={result.counts} shots={result.shots} probabilities={result.probabilities} />}
    </div>
  );
}

function ProbBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <div className="flex h-24 w-full items-end overflow-hidden rounded-md bg-white/5">
        <div className="w-full rounded-md bg-accent transition-all duration-300" style={{ height: `${value * 100}%`, minHeight: value > 0 ? 2 : 0 }} />
      </div>
      <span className="text-xs text-muted">{label}: <b className="font-mono text-ink">{(value * 100).toFixed(1)}%</b></span>
    </div>
  );
}

/** Set the value of the qubit (0 or 1) and choose a locking key and an unlocking key, then run the resulting circuit. */
function LockDemo() {
  const [value, setValue] = useState<0 | 1>(1);
  const [lock, setLock] = useState<0 | 1>(1);
  const [unlock, setUnlock] = useState<0 | 1>(1);

  const ops = [
    ...(value ? [g("x", [0])] : []),
    barrier(1),
    ...(lock ? [g("ry", [0], [], [Math.PI / 2])] : []),
    barrier(1),
    ...(unlock ? [g("ry", [0], [], [-Math.PI / 2])] : []),
  ];
  const circuit: Circuit = { qubits: 1, ops };
  const matched = lock === unlock;
  const { result, running, error, run, reset } = useRun(circuit, 1000);

  return (
    <div className="panel mt-3 flex flex-col gap-4 p-4" aria-label="Lock and unlock demonstration">
      <div className="flex flex-wrap gap-4">
        <BitToggle label="Bill value" value={value} onChange={(v) => { setValue(v); reset(); }} />
        <BitToggle label="Bank's locking key" value={lock} onChange={(v) => { setLock(v); reset(); }} />
        <BitToggle label="Your unlocking key" value={unlock} onChange={(v) => { setUnlock(v); reset(); }} />
      </div>
      <p className={`text-sm font-medium ${matched ? "text-good" : "text-bad"}`}>
        {matched ? "Keys match — the rotations cancel, so the qubit should return a predictable value." : "Keys differ — the rotation isn't undone, so the qubit should come back unpredictable."}
      </p>
      <CircuitEditor qubits={1} ops={layout(circuit)} readOnly />
      <button className="pbtn-ghost self-start" onClick={run} disabled={running}>{running ? "Running…" : "▶ Run 1000 shots on Qiskit"}</button>
      {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
      {result && <Histogram counts={result.counts} shots={result.shots} probabilities={result.probabilities} />}
    </div>
  );
}

function BitToggle({ label, value, onChange }: { label: string; value: 0 | 1; onChange: (v: 0 | 1) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-muted">{label}</span>
      <div className="flex rounded-lg bg-white/5 p-0.5" role="group" aria-label={label}>
        {([0, 1] as const).map((v) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={`w-10 rounded-md py-1 font-mono font-bold ${value === v ? "bg-white/15" : "text-muted hover:text-ink"}`}>
            {v}
          </button>
        ))}
      </div>
    </label>
  );
}

/** The same idea, scaled up to many qubits, one key bit each — capped at 8, the platform's simulator limit. */
const N = 8;
const rand01 = () => (Math.random() < 0.5 ? 0 : 1);
const randBits = () => Array.from({ length: N }, rand01);

/** 1 if the guess cancels the real lock exactly (always correct); 0.5 if it doesn't (a coin flip). */
function correctProb(lockKey: number[], guessKey: number[], i: number) {
  return lockKey[i] === guessKey[i] ? 1 : 0.5;
}

/** Exact distribution of "how many of the N bits come back correct", by convolving each qubit's Bernoulli(p). */
function exactCorrectDist(lockKey: number[], guessKey: number[]) {
  let dist = [1];
  for (let i = 0; i < N; i++) {
    const p = correctProb(lockKey, guessKey, i);
    const next = Array(dist.length + 1).fill(0);
    for (let k = 0; k < dist.length; k++) {
      next[k] += dist[k] * (1 - p);
      next[k + 1] += dist[k] * p;
    }
    dist = next;
  }
  return dist;
}

function MultiDemo() {
  const [bill, setBill] = useState<number[]>(() => [1, 0, 1, 1, 0, 0, 1, 0]);
  const [lockKey, setLockKey] = useState<number[]>(() => [1, 0, 0, 1, 1, 0, 1, 0]);
  const [guessKey, setGuessKey] = useState<number[]>(() => Array(N).fill(0));

  const ops: Op[] = [];
  for (let i = 0; i < N; i++) if (bill[i]) ops.push(g("x", [i]));
  ops.push(barrier(N));
  for (let i = 0; i < N; i++) if (lockKey[i]) ops.push(g("ry", [i], [], [Math.PI / 2]));
  ops.push(barrier(N));
  for (let i = 0; i < N; i++) if (guessKey[i]) ops.push(g("ry", [i], [], [-Math.PI / 2]));
  const circuit: Circuit = { qubits: N, ops };
  const { result, running, error, run, reset } = useRun(circuit, 1000);

  function measuredP1(i: number): number | null {
    if (!result) return null;
    let ones = 0;
    for (const [bits, count] of Object.entries(result.counts)) ones += bits[bits.length - 1 - i] === "1" ? count : 0;
    return ones / result.shots;
  }

  // Per-qubit: how many of the 1000 shots read back the bill's true value on that qubit.
  function perQubitCorrect(): { counts: Record<string, number>; probabilities: Record<string, number> } | null {
    if (!result) return null;
    const counts: Record<string, number> = {};
    const probabilities: Record<string, number> = {};
    for (let i = 0; i < N; i++) {
      let correct = 0;
      for (const [bits, count] of Object.entries(result.counts)) {
        const bit = bits[bits.length - 1 - i] === "1" ? 1 : 0;
        if (bit === bill[i]) correct += count;
      }
      counts[`q${i}`] = correct;
      probabilities[`q${i}`] = correctProb(lockKey, guessKey, i);
    }
    return { counts, probabilities };
  }

  // Across all N qubits: how many came back correct in each shot, as a distribution.
  function totalCorrectDist(): { counts: Record<string, number>; probabilities: Record<string, number> } | null {
    if (!result) return null;
    const counts: Record<string, number> = {};
    for (let k = 0; k <= N; k++) counts[`${k}/${N}`] = 0;
    for (const [bits, count] of Object.entries(result.counts)) {
      let correct = 0;
      for (let i = 0; i < N; i++) {
        const bit = bits[bits.length - 1 - i] === "1" ? 1 : 0;
        if (bit === bill[i]) correct++;
      }
      counts[`${correct}/${N}`] += count;
    }
    const exact = exactCorrectDist(lockKey, guessKey);
    const probabilities: Record<string, number> = {};
    for (let k = 0; k <= N; k++) probabilities[`${k}/${N}`] = exact[k];
    return { counts, probabilities };
  }

  function flip(arr: number[], setArr: (a: number[]) => void, i: number) {
    const next = [...arr];
    next[i] = next[i] ? 0 : 1;
    setArr(next);
    reset();
  }

  return (
    <div className="panel mt-3 flex flex-col gap-4 p-4" aria-label="Multi-qubit banknote demonstration">
      <div className="flex flex-wrap gap-2 text-xs">
        <button className="chip" onClick={() => { setBill(randBits()); setLockKey(randBits()); reset(); }}>🎲 Randomize bill &amp; bank key</button>
        <button className="chip" onClick={() => { setGuessKey(Array(N).fill(0)); reset(); }}>Guess all 0s</button>
        <button className="chip" onClick={() => { setGuessKey([...lockKey]); reset(); }}>Guess the real key</button>
        <button className="chip" onClick={() => { setGuessKey(randBits()); reset(); }}>Guess randomly</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-center text-xs">
          <thead className="text-muted">
            <tr>
              <th className="p-1 text-left">qubit</th>
              {Array.from({ length: N }, (_, i) => <th key={i} className="p-1 font-mono">q{i}</th>)}
            </tr>
          </thead>
          <tbody>
            <BitRow label="Bill value" values={bill} onToggle={(i) => flip(bill, setBill, i)} />
            <BitRow label="Bank's lock key" values={lockKey} onToggle={(i) => flip(lockKey, setLockKey, i)} />
            <BitRow label="Your unlock guess" values={guessKey} onToggle={(i) => flip(guessKey, setGuessKey, i)} />
            <tr>
              <td className="p-1 text-left text-muted">Measured P(1)</td>
              {Array.from({ length: N }, (_, i) => {
                const p = measuredP1(i);
                const revealed = p !== null && (p < 0.1 || p > 0.9);
                return (
                  <td key={i} className={`p-1 font-mono ${revealed ? "rounded-md bg-good/20 font-bold text-good" : p !== null ? "rounded-md bg-white/5 text-muted" : ""}`}>
                    {p === null ? "—" : `${(p * 100).toFixed(0)}%`}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <CircuitEditor qubits={N} ops={layout(circuit)} readOnly />

      <div className="flex flex-wrap items-center gap-2">
        <button className="pbtn-ghost self-start" onClick={run} disabled={running}>{running ? "Running…" : result ? "▶ Run again" : "▶ Run 1000 shots on Qiskit"}</button>
        {result && <span className="chip">✓ ran {result.shots.toLocaleString()} shots in {result.elapsed_ms} ms on {result.backend}</span>}
      </div>
      <p role="status" className="sr-only">{running ? "Running…" : result ? "Results ready." : ""}</p>
      {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
      {result && (() => {
        const perQubit = perQubitCorrect()!;
        const total = totalCorrectDist()!;
        return (
          <>
            <p className="rounded-xl bg-accent/15 p-3 text-sm">
              Qubits where your guess matches the real lock key (lock = guess) read back a steady 0% or 100%, revealing that bit of the bill (highlighted above and below). Qubits where the guess missed sit near 50%, telling you nothing.
            </p>
            <div>
              <h3 className="mb-1 text-sm font-semibold">How often each qubit read back the true bill value</h3>
              <Histogram counts={perQubit.counts} shots={result.shots} probabilities={perQubit.probabilities} />
            </div>
            <div>
              <h3 className="mb-1 text-sm font-semibold">What fraction of the {N} bits came back correct, per shot</h3>
              <Histogram counts={total.counts} shots={result.shots} probabilities={total.probabilities} />
            </div>
          </>
        );
      })()}
    </div>
  );
}

function BitRow({ label, values, onToggle }: { label: string; values: number[]; onToggle: (i: number) => void }) {
  return (
    <tr>
      <td className="p-1 text-left text-muted">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="p-1">
          <button type="button" onClick={() => onToggle(i)} aria-label={`${label}, q${i}: ${v}, click to flip`} className={`h-7 w-7 rounded-md font-mono font-bold ${v ? "bg-accent text-white" : "bg-white/10 text-muted"}`}>
            {v}
          </button>
        </td>
      ))}
    </tr>
  );
}
