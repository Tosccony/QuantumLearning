"use client";

import { useId, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Flag } from "@/components/ui/primitives";
import { toQiskitPython, type Circuit, type RunResult, type Vec3 } from "@/lib/quantum";
import BlochSphere from "./BlochSphere";
import Histogram from "./Histogram";
import StateTable from "./StateTable";

const TABS = ["Histogram", "Bloch", "Statevector", "Qiskit"] as const;
type Tab = (typeof TABS)[number];

/** Results in a punched window; the tabs are frames on its top rail. */
export default function ResultsPanel({
  result,
  circuit,
  blochOverride,
  stepLabel,
  initial = "Histogram",
  stale = false,
}: {
  result: RunResult;
  circuit: Circuit;
  blochOverride?: Vec3[] | null;
  stepLabel?: string;
  initial?: Tab;
  /** The circuit changed since this run: show it bleached under the notice. */
  stale?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initial);
  const [code, setCode] = useState<"python" | "qasm" | "diagram">("python");
  const [copied, setCopied] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const bloch = blochOverride ?? result.bloch;

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.indexOf(tab);
    const next = e.key === "ArrowRight" ? TABS[(i + 1) % TABS.length] : e.key === "ArrowLeft" ? TABS[(i + TABS.length - 1) % TABS.length] : e.key === "Home" ? TABS[0] : e.key === "End" ? TABS[TABS.length - 1] : null;
    if (next) {
      e.preventDefault();
      setTab(next);
      tabsRef.current?.querySelector<HTMLElement>(`[data-tab="${next}"]`)?.focus();
    }
  };

  const copy = () => {
    const text = code === "python" ? toQiskitPython(circuit) : code === "qasm" ? result.qasm : result.diagram;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className={`window transition-opacity ${stale ? "opacity-55" : ""}`} aria-label="Results">
      <div className="perf" aria-hidden />
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border-b border-navy-ink px-3 pt-2">
        <div ref={tabsRef} className="flex" role="tablist" aria-label="Result views" onKeyDown={onTabKey}>
          {TABS.map((t) => (
            <button
              key={t}
              data-tab={t}
              role="tab"
              id={`${panelId}-${t}`}
              aria-controls={panelId}
              aria-selected={tab === t}
              tabIndex={tab === t ? 0 : -1}
              onClick={() => setTab(t)}
              className={`relative -mb-px min-h-11 border px-3 label ${tab === t ? "border-navy-ink border-b-paper bg-paper" : "border-transparent text-[#46587a] hover:text-navy-ink"}`}
            >
              {tab === t && <Flag className="absolute -top-2.5 left-1.5" width={11} />}
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3 pb-2">
          {result.entangled && <span className="chip"><Icon name="twins" size={12} /> entangled</span>}
          <EdgeCode className="!text-[#46587a]">{result.backend}</EdgeCode>
          <EdgeCode className="!text-[#46587a]">Qiskit {result.qiskit_version}</EdgeCode>
          <EdgeCode className="!text-[#46587a]">{result.elapsed_ms} ms</EdgeCode>
        </div>
      </div>

      <div id={panelId} className="p-4" role="tabpanel" aria-labelledby={`${panelId}-${tab}`}>
        {stepLabel && <p className="mb-3 text-sm font-medium"><Icon name="step" size={14} className="mr-1 inline" />{stepLabel}</p>}
        {tab === "Histogram" && <Histogram counts={result.counts} shots={result.shots} probabilities={result.probabilities} />}

        {tab === "Bloch" && (
          <div>
            <div className="flex flex-wrap justify-center gap-4">
              {bloch.map((v, q) => (
                <BlochSphere key={q} v={v} label={`q${q}`} purity={blochOverride ? undefined : result.purity[q]} />
              ))}
            </div>
            <p className="mt-3 max-w-prose text-xs text-[#46587a]">
              Each sphere shows one qubit&apos;s reduced state (partial trace over the others). A vector shorter than 1 means that qubit is entangled or noisy, so its information lives in correlations. Drag a sphere, or focus it and use the arrow keys, to turn it.
            </p>
          </div>
        )}

        {tab === "Statevector" && <StateTable sv={result.statevector} qubits={circuit.qubits} />}

        {tab === "Qiskit" && (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-2 gap-px border border-navy-ink bg-navy-ink text-center sm:grid-cols-4">
              <Stat label="Logical depth" value={result.depth} />
              <Stat label="Transpiled depth" value={result.transpiled.depth} />
              <Stat label="CX after transpile" value={result.transpiled.gate_counts.cx ?? 0} />
              <Stat label="Native gates" value={Object.values(result.transpiled.gate_counts).reduce((a, b) => a + b, 0)} />
            </dl>
            <div className="flex flex-wrap items-center gap-1.5">
              {(["python", "qasm", "diagram"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setCode(k)} aria-pressed={code === k} className={`chip min-h-11 ${code === k ? "!bg-navy-ink !text-paper" : ""}`}>
                  {k === "python" ? "Qiskit Python" : k === "qasm" ? "OpenQASM 2" : "Text diagram"}
                </button>
              ))}
              <button type="button" className="chip ml-auto min-h-11" onClick={copy}>
                <Icon name="copy" size={12} /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="max-h-80 overflow-auto border border-paper-3 bg-navy-ink p-3 code text-xs leading-relaxed text-paper">
              {code === "python" ? toQiskitPython(circuit) : code === "qasm" ? result.qasm : result.diagram}
            </pre>
            <p className="text-xs text-[#46587a]">Transpiled to the basis {`{${result.transpiled.basis.join(", ")}}`} with optimization level 1, like an IBM-style device. Everything here ran on the Qiskit Aer simulator.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-paper p-2">
      <dd className="display num text-2xl">{value}</dd>
      <dt className="label-sm text-[#46587a]">{label}</dt>
    </div>
  );
}
