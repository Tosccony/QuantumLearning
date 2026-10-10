"use client";

import { useState } from "react";
import { toQiskitPython, type Circuit, type RunResult, type Vec3 } from "@/lib/quantum";
import BlochSphere from "./BlochSphere";
import Histogram from "./Histogram";
import StateTable from "./StateTable";

const TABS = ["Histogram", "Bloch", "Statevector", "Qiskit"] as const;
type Tab = (typeof TABS)[number];

export default function ResultsPanel({
  result,
  circuit,
  blochOverride,
  stepLabel,
  initial = "Histogram",
}: {
  result: RunResult;
  circuit: Circuit;
  blochOverride?: Vec3[] | null;
  stepLabel?: string;
  initial?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initial);
  const [code, setCode] = useState<"python" | "qasm" | "diagram">("python");
  const bloch = blochOverride ?? result.bloch;

  return (
    <section className="panel p-4" aria-label="Results">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-white/5 p-0.5 text-sm" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded-md px-3 py-1.5 ${tab === t ? "bg-white/15 font-semibold" : "text-muted"}`}>
              {t}
            </button>
          ))}
        </div>
        <span className="ml-auto flex flex-wrap items-center gap-2 text-xs text-muted">
          {result.entangled && <span className="chip !bg-on/20 !text-on">🔗 entangled</span>}
          <span className="chip">{result.backend}</span>
          <span className="chip">Qiskit {result.qiskit_version}</span>
          <span className="chip">{result.elapsed_ms} ms</span>
        </span>
      </div>

      {tab === "Histogram" && <Histogram counts={result.counts} shots={result.shots} probabilities={result.probabilities} />}

      {tab === "Bloch" && (
        <div>
          {stepLabel && <p className="mb-2 text-sm text-on">{stepLabel}</p>}
          <div className="flex flex-wrap justify-center gap-4">
            {bloch.map((v, q) => (
              <BlochSphere key={q} v={v} label={`q${q}`} purity={blochOverride ? undefined : result.purity[q]} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            Each sphere shows one qubit&apos;s reduced state (partial trace over the others). A vector shorter than 1 means that qubit is entangled or noisy, so its information lives in correlations. Drag a sphere to rotate it.
          </p>
        </div>
      )}

      {tab === "Statevector" && <StateTable sv={result.statevector} qubits={circuit.qubits} />}

      {tab === "Qiskit" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-center text-sm sm:grid-cols-4">
            <Stat label="Logical depth" value={result.depth} />
            <Stat label="Transpiled depth" value={result.transpiled.depth} />
            <Stat label="CX after transpile" value={result.transpiled.gate_counts.cx ?? 0} />
            <Stat label="Native gates" value={Object.values(result.transpiled.gate_counts).reduce((a, b) => a + b, 0)} />
          </div>
          <div className="flex gap-1 text-xs">
            {(["python", "qasm", "diagram"] as const).map((k) => (
              <button key={k} onClick={() => setCode(k)} className={`chip ${code === k ? "!bg-accent !text-white" : ""}`}>
                {k === "python" ? "Qiskit Python" : k === "qasm" ? "OpenQASM 2" : "Text diagram"}
              </button>
            ))}
            <button className="chip ml-auto" onClick={() => navigator.clipboard?.writeText(code === "python" ? toQiskitPython(circuit) : code === "qasm" ? result.qasm : result.diagram)}>
              Copy
            </button>
          </div>
          <pre className="max-h-80 overflow-auto rounded-xl bg-[#070a24] p-3 font-mono text-xs leading-relaxed ring-1 ring-white/10">
            {code === "python" ? toQiskitPython(circuit) : code === "qasm" ? result.qasm : result.diagram}
          </pre>
          <p className="text-xs text-muted">Transpiled to the basis {`{${result.transpiled.basis.join(", ")}}`} with optimization level 1, like an IBM-style device.</p>
        </div>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/5 p-2">
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
