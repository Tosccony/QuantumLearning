"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import FlowSteps, { type FlowStep } from "@/components/FlowSteps";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import Dialog from "@/components/ui/Dialog";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Notice, Perf } from "@/components/ui/primitives";
import { createProject, getProject } from "@/lib/community";
import { moduleById, MODULES } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { decodeCircuit, runCircuit, type Circuit, type Noise, type RunResult } from "@/lib/quantum";
import { useCircuitPrefix } from "@/lib/useCircuitPrefix";

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
  const [ranCircuit, setRanCircuit] = useState<Circuit>(BELL);
  const [ranFor, setRanFor] = useState<string>("");
  const [ranOps, setRanOps] = useState(0);
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
  const prefix = useCircuitPrefix(ranCircuit, result, stale ? null : step, noiseOn ? noise : null);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(circuit)); } catch {}
  }, [circuit]);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const r = await runCircuit(circuit, { shots, noise: noiseOn ? noise : null, trace: true });
      setResult(r);
      setRanCircuit(circuit);
      setRanFor(key);
      setRanOps(circuit.ops.length);
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
  const delta = nOps - ranOps;
  const staleWhat = delta > 0 ? `${delta} gate${delta > 1 ? "s" : ""} added` : delta < 0 ? `${-delta} gate${delta < -1 ? "s" : ""} removed` : "gates or settings changed";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="mr-auto">
          <h1 className="display text-3xl sm:text-4xl">Quantum Lab</h1>
          <p className="mt-1 text-sm text-fog">
            {source ? (
              <>Loaded from {source.href ? <Link className="text-ice underline underline-offset-4" href={source.href}>{source.label}</Link> : source.label}.</>
            ) : (
              <>Build on the rail, run on the Qiskit Aer simulator, read the real numbers.</>
            )}
          </p>
        </div>
        <FlowSteps current={flow} done={done} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="frame flex flex-col gap-3 p-3 sm:p-4" aria-label="Circuit builder">
            <div className="flex flex-wrap items-center gap-2">
              <span className="label mr-1">Wires</span>
              <button type="button" className="keycap !px-3" onClick={() => changeQubits(qubits - 1)} disabled={qubits <= 1} aria-label="Remove a qubit"><Icon name="minus" size={16} /></button>
              <span className="code w-6 text-center text-lg" aria-live="polite" aria-label={`${qubits} qubits`}>{qubits}</span>
              <button type="button" className="keycap !px-3" onClick={() => changeQubits(qubits + 1)} disabled={qubits >= 8} aria-label="Add a qubit"><Icon name="plus" size={16} /></button>
              <label className="ml-2 flex items-center gap-2">
                <span className="label">Load</span>
                <select
                  className="field !min-h-11 w-44 cursor-pointer bg-navy-deep text-sm sm:w-56"
                  value=""
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "blank") { load({ qubits, ops: [] }); setSource(null); }
                    else if (v === "bell") { load(BELL); setSource(null); }
                    else if (v) { const m = moduleById(v)!; load(m.circuit); setSource({ label: `Lesson: ${m.title}`, href: `/learn/${m.id}` }); }
                  }}
                  aria-label="Load an example circuit"
                >
                  <option value="" disabled>Example circuit…</option>
                  <option value="blank">Empty circuit</option>
                  <option value="bell">Bell pair</option>
                  {(["student", "developer", "researcher"] as const).map((t) => (
                    <optgroup key={t} label={`${t[0].toUpperCase()}${t.slice(1)} track`}>
                      {MODULES.filter((m) => m.track === t).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <button type="button" className="keycap ml-auto" onClick={() => { setOps([]); setResult(null); }} disabled={!nOps}><Icon name="reset" size={14} /> Clear</button>
            </div>
            <CircuitEditor
              qubits={qubits}
              ops={ops}
              onChange={(o) => { setOps(o); setStep(null); }}
              stepIndex={step === null ? null : step - 1}
              scrub={result && !stale && nOps > 0 ? { value: step, max: nOps, onChange: setStep, label: step === null ? "Final state" : step === 0 ? "Initial |0…0⟩" : `After F${String(step).padStart(2, "0")}: ${circuit.ops[step - 1].gate.toUpperCase()}` } : undefined}
            />
          </section>

          <section className="rail" aria-label="Run settings">
            <Perf />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-3 py-3 sm:px-4">
              <label className="flex items-center gap-2">
                <span className="label">Shots</span>
                <select value={shots} onChange={(e) => setShots(+e.target.value)} className="field code !min-h-11 w-28 cursor-pointer bg-navy-deep text-sm">
                  {[100, 1024, 4096, 10000].map((n) => <option key={n} value={n}>{n.toLocaleString()}</option>)}
                </select>
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={noiseOn}
                onClick={() => setNoiseOn(!noiseOn)}
                className="flex min-h-11 items-center gap-2"
              >
                <span className={`relative inline-block h-7 w-12 border ${noiseOn ? "border-ice bg-ice" : "border-[var(--line-strong)]"}`} aria-hidden>
                  <span className={`absolute top-0.5 h-5 w-5 transition-transform ${noiseOn ? "translate-x-6 bg-navy-ink" : "translate-x-0.5 bg-paper"}`} />
                </span>
                <span className="label flex items-center gap-1.5"><Icon name="noise" size={14} /> Noise model</span>
              </button>
              {noiseOn && (
                <div className="flex flex-wrap gap-4">
                  {([["p1", "1-qubit error"], ["p2", "2-qubit error"], ["readout", "Readout error"]] as const).map(([k, label]) => (
                    <label key={k} className="flex flex-col gap-0.5 text-xs text-fog">
                      <span className="label-sm">{label} <span className="code normal-case tracking-normal text-paper">{(noise[k] * 100).toFixed(1)}%</span></span>
                      <input type="range" min={0} max={0.15} step={0.005} value={noise[k]} onChange={(e) => setNoise({ ...noise, [k]: +e.target.value })} className="scrub w-32" aria-label={`${label}, percent`} />
                    </label>
                  ))}
                </div>
              )}
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <EdgeCode className="hidden sm:inline">Sim · Qiskit Aer</EdgeCode>
                <button type="button" className="keycap" onClick={() => setSharing(true)} disabled={!nOps}><Icon name="share" size={15} /> Share</button>
                <button type="button" className="keycap-primary min-w-44" onClick={run} disabled={running || !nOps}>
                  <Icon name="run" size={14} /> {running ? "Running…" : stale ? "Re-run" : `Run ${shots.toLocaleString()} shots`}
                </button>
              </div>
            </div>
            <Perf />
          </section>

          {error && <Notice tone="bad" role="alert">{error}</Notice>}

          {result && (
            <>
              {stale && <Notice tone="warn" role="status">The circuit changed since the last run ({staleWhat}). The result below is bleached until you re-run.</Notice>}

              {prefix.loading && <Notice role="status">Running this circuit prefix on Qiskit…</Notice>}
              {prefix.error && <Notice tone="bad" role="alert">{prefix.error} Move the scrub to retry or return to the final state.</Notice>}
              {prefix.result && <ResultsPanel
                key={ranFor}
                result={prefix.result}
                circuit={prefix.circuit}
                stale={stale}
                stepLabel={!stale && step !== null ? `Results ${step === 0 ? "before any gates" : `after gate ${step} of ${nOps}`} · computed by Qiskit for this prefix` : undefined}
              />}
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)]" onClickCapture={() => setAsked(true)}>
          <Tutor circuit={stale || !result ? circuit : prefix.circuit} result={stale ? null : prefix.result} extra={!stale && step !== null ? `The learner is inspecting the circuit prefix after ${step} gates.` : ""} />
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
    <Dialog title="Publish to the community" onClose={onClose} describedBy="share-desc">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <p id="share-desc" className="text-sm text-[#46587a]">Your circuit is re-run on the Qiskit Aer simulator when you publish, so everyone sees verified results. {forkOf && "It will be linked as a fork."}</p>
        <label className="flex flex-col gap-1 text-sm"><span className="label-sm">Title</span><input data-autofocus required minLength={3} maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} className="field" /></label>
        <label className="flex flex-col gap-1 text-sm"><span className="label-sm">What does it show?</span><textarea maxLength={2000} rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} className="field" /></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm"><span className="label-sm">Tags, comma-separated</span><input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="entanglement, grover" className="field" /></label>
          <label className="flex flex-col gap-1 text-sm"><span className="label-sm">Display name</span><input required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} className="field" /></label>
        </div>
        {err && <Notice tone="bad" role="alert">{err}</Notice>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="keycap-paper" onClick={onClose}>Cancel</button>
          <button className="keycap-paper-primary" disabled={busy}><Icon name="share" size={14} /> {busy ? "Publishing…" : "Publish"}</button>
        </div>
      </form>
    </Dialog>
  );
}
