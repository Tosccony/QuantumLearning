"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import FlowSteps, { type FlowStep } from "@/components/FlowSteps";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import { createProject, getProject } from "@/lib/community";
import { moduleById, MODULES } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { decodeCircuit, runCircuit, type Circuit, type Noise, type RunResult } from "@/lib/quantum";

const DRAFT_KEY = "qq-lab-draft";
const BELL: Circuit = { qubits: 2, ops: [{ gate: "h", targets: [0] }, { gate: "cx", targets: [1], controls: [0] }] };

export default function LabPage() {
  return (
    <Suspense fallback={null}>
      <Lab />
    </Suspense>
  );
}

function Lab() {
  const params = useSearchParams();
  const router = useRouter();
  const { state, recordRun, recordShare } = useProgress();

  const [qubits, setQubits] = useState(2);
  const [ops, setOps] = useState<EOp[]>([]);
  const [source, setSource] = useState<{ label: string; href?: string; forkOf?: string } | null>(null);
  const [shots, setShots] = useState(1024);
  const [noiseOn, setNoiseOn] = useState(false);
  const [noise, setNoise] = useState<Noise>({ p1: 0.01, p2: 0.05, readout: 0.03 });
  const [result, setResult] = useState<RunResult | null>(null);
  const [ranFor, setRanFor] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<number | null>(null);
  const [sharing, setSharing] = useState(false);
  const [asked, setAsked] = useState(false);

  const load = (c: Circuit) => {
    setQubits(c.qubits);
    setOps(layout(c));
    setResult(null);
    setStep(null);
  };

  // Initial circuit: ?c= (encoded), ?module=, ?fork=, else the saved draft, else a Bell pair.
  useEffect(() => {
    const c = params.get("c");
    const mod = params.get("module");
    const fork = params.get("fork");
    if (c) {
      const dec = decodeCircuit(c);
      if (dec) { load(dec); setSource({ label: params.get("from") ?? "Shared link" }); return; }
    }
    if (mod && moduleById(mod)) {
      const m = moduleById(mod)!;
      load(m.circuit);
      setSource({ label: `Lesson: ${m.title}`, href: `/learn/${m.id}` });
      return;
    }
    if (fork) {
      getProject(fork).then((p) => { load(p.circuit); setSource({ label: `Fork of “${p.title}” by ${p.author}`, href: `/community/${p.id}`, forkOf: p.id }); }).catch((e) => setError(e.message));
      return;
    }
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) return load(JSON.parse(d));
    } catch {}
    load(BELL);
  }, [params]);

  const circuit = useMemo(() => toCircuit(qubits, ops), [qubits, ops]);
  const key = JSON.stringify({ circuit, shots, noise: noiseOn ? noise : null });
  const stale = !!result && ranFor !== key;

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(circuit)); } catch {}
  }, [circuit]);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const r = await runCircuit(circuit, { shots, noise: noiseOn ? noise : null, trace: true });
      setResult(r);
      setRanFor(key);
      setStep(null);
      recordRun();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  const changeQubits = (n: number) => {
    if (n < 1 || n > 8) return;
    setQubits(n);
    setOps((o) => o.filter((op) => [...(op.controls ?? []), ...op.targets].every((q) => q < n)));
  };

  const flow: FlowStep = sharing ? "share" : asked ? "understand" : result && !stale ? "run" : "build";
  const done: FlowStep[] = ["learn", "build", ...(result ? (["run"] as FlowStep[]) : []), ...(asked ? (["understand"] as FlowStep[]) : [])];

  const nOps = circuit.ops.length;
  const stepBloch = result?.trace && step !== null ? (step === 0 ? Array.from({ length: qubits }, () => [0, 0, 1] as [number, number, number]) : result.trace[step - 1]) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Quantum Lab</h1>
        <FlowSteps current={flow} done={done} />
      </div>

      {source && (
        <p className="text-sm text-muted">
          Loaded from {source.href ? <Link className="text-accent underline" href={source.href}>{source.label}</Link> : source.label}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="panel flex flex-col gap-3 p-4" aria-label="Circuit builder">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">Qubits</span>
              <button className="pbtn-ghost !px-2.5" onClick={() => changeQubits(qubits - 1)} disabled={qubits <= 1} aria-label="Remove a qubit">−</button>
              <span className="w-4 text-center tabular-nums">{qubits}</span>
              <button className="pbtn-ghost !px-2.5" onClick={() => changeQubits(qubits + 1)} disabled={qubits >= 8} aria-label="Add a qubit">+</button>
              <select
                className="ml-2 rounded-lg bg-white/10 px-2 py-1.5 outline-none"
                value=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "blank") { load({ qubits, ops: [] }); setSource(null); }
                  else if (v === "bell") { load(BELL); setSource(null); }
                  else { const m = moduleById(v)!; load(m.circuit); setSource({ label: `Lesson: ${m.title}`, href: `/learn/${m.id}` }); }
                }}
                aria-label="Load an example circuit"
              >
                <option value="" disabled>Load example…</option>
                <option value="blank">Empty circuit</option>
                <option value="bell">Bell pair</option>
                {(["student", "developer", "researcher", "concepts"] as const).map((t) => (
                  <optgroup key={t} label={`${t[0].toUpperCase()}${t.slice(1)} track`}>
                    {MODULES.filter((m) => m.track === t).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </optgroup>
                ))}
              </select>
              <button className="pbtn-ghost ml-auto" onClick={() => { setOps([]); setResult(null); }}>Clear</button>
            </div>
            <CircuitEditor qubits={qubits} ops={ops} onChange={(o) => { setOps(o); setStep(null); }} stepIndex={step === null ? null : step - 1} />
          </section>

          <section className="panel flex flex-wrap items-end gap-4 p-4" aria-label="Run settings">
            <label className="flex flex-col gap-1 text-xs text-muted">
              Shots
              <select value={shots} onChange={(e) => setShots(+e.target.value)} className="rounded-lg bg-white/10 px-2 py-1.5 text-sm text-ink">
                {[100, 1024, 4096, 10000].map((n) => <option key={n} value={n}>{n.toLocaleString()}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={noiseOn} onChange={(e) => setNoiseOn(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
              Noise model
            </label>
            {noiseOn && (
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                {([["p1", "1-qubit error"], ["p2", "2-qubit error"], ["readout", "Readout error"]] as const).map(([k, label]) => (
                  <label key={k} className="flex flex-col gap-1">
                    {label}: {(noise[k] * 100).toFixed(1)}%
                    <input type="range" min={0} max={0.15} step={0.005} value={noise[k]} onChange={(e) => setNoise({ ...noise, [k]: +e.target.value })} className="w-32 accent-[var(--accent)]" />
                  </label>
                ))}
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button className="pbtn-ghost" onClick={() => setSharing(true)} disabled={!nOps}>🌍 Share</button>
              <button className="pbtn-primary min-w-36" onClick={run} disabled={running || !nOps}>
                {running ? "Running on Qiskit…" : stale ? "▶ Re-run" : "▶ Run on Qiskit"}
              </button>
            </div>
          </section>

          {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}

          {result && (
            <>
              {stale && <p className="text-sm text-on">The circuit changed since the last run. Re-run to update the results.</p>}
              {result.trace && !stale && nOps > 0 && (
                <section className="panel flex flex-wrap items-center gap-3 p-3 text-sm" aria-label="Step through">
                  <span className="font-semibold">💡 Step through</span>
                  <input
                    type="range"
                    min={0}
                    max={nOps}
                    value={step ?? nOps}
                    onChange={(e) => setStep(+e.target.value === nOps ? null : +e.target.value)}
                    className="flex-1 accent-[var(--accent)]"
                    aria-label="Circuit step"
                  />
                  <span className="w-40 text-muted">
                    {step === null ? "Final state" : step === 0 ? "Initial |0…0⟩" : `After gate ${step}: ${circuit.ops[step - 1].gate.toUpperCase()}`}
                  </span>
                </section>
              )}
              <ResultsPanel
                key={ranFor}
                result={result}
                circuit={circuit}
                blochOverride={stepBloch}
                stepLabel={step !== null ? `Bloch vectors ${step === 0 ? "before any gates" : `after gate ${step} of ${nOps}`} (computed by Qiskit for that prefix of the circuit)` : undefined}
                initial={step !== null ? "Bloch" : "Histogram"}
              />
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:h-[calc(100dvh-7rem)]" onClickCapture={() => setAsked(true)}>
          <Tutor circuit={circuit} result={stale ? null : result} />
        </div>
      </div>

      {sharing && (
        <ShareDialog
          circuit={circuit}
          shots={shots}
          author={state.name}
          forkOf={source?.forkOf}
          onClose={() => setSharing(false)}
          onShared={(id) => { recordShare(id); router.push(`/community/${id}?new=1`); }}
        />
      )}
    </div>
  );
}

function ShareDialog({ circuit, shots, author, forkOf, onClose, onShared }: { circuit: Circuit; shots: number; author: string; forkOf?: string; onClose: () => void; onShared: (id: string) => void }) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [name, setName] = useState(author);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { update } = useProgress();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (name !== author) update((s) => ({ ...s, name }));
      const { id } = await createProject({ title, description: desc, author: name, tags: tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 6), circuit, shots, forked_from: forkOf ?? null });
      onShared(id);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="panel flex w-full max-w-lg flex-col gap-3 !bg-panel p-5" role="dialog" aria-modal aria-labelledby="share-title">
        <h2 id="share-title" className="text-xl font-bold">Share to the community</h2>
        <p className="text-sm text-muted">Your circuit is re-run on the Qiskit service when you publish, so everyone sees verified results. {forkOf && "It will be linked as a fork."}</p>
        <label className="flex flex-col gap-1 text-sm">Title<input required minLength={3} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-accent" /></label>
        <label className="flex flex-col gap-1 text-sm">What does it show?<textarea maxLength={2000} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className="rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-accent" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">Tags (comma-separated)<input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="entanglement, grover" className="rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-accent" /></label>
          <label className="flex flex-col gap-1 text-sm">Display name<input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg bg-white/10 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-accent" /></label>
        </div>
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="pbtn-ghost" onClick={onClose}>Cancel</button>
          <button className="pbtn-primary" disabled={busy}>{busy ? "Publishing…" : "Publish"}</button>
        </div>
      </form>
    </div>
  );
}
