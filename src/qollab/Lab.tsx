import { useEffect, useMemo, useRef, useState } from "react";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import IdealVsMachine from "@/components/lab/IdealVsMachine";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import { MODULES } from "@/lib/curriculum";
import { runCircuit, type Circuit, type RunResult } from "@/lib/quantum";

const MAX_QUBITS = 8;

/** Free-build Lab on Qollab: any circuit up to 8 qubits, run on the simulator picked in "Select QPU". */
export default function Lab({ start, isIonQ }: { start: Circuit; isIonQ: boolean }) {
  const [qubits, setQubits] = useState(start.qubits);
  const [ops, setOps] = useState<EOp[]>(() => layout(start));
  const circuit = useMemo(() => toCircuit(qubits, ops), [qubits, ops]);
  // The circuit on screen right now; a run that finishes after an edit must not show its stale result.
  const current = useRef(circuit);
  useEffect(() => {
    current.current = circuit;
  }, [circuit]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Any edit makes the last result stale, so drop it rather than show numbers for a different circuit.
  const edit = (next: EOp[]) => {
    setOps(next);
    setResult(null);
  };
  const load = (c: Circuit) => {
    setQubits(c.qubits);
    edit(layout(c));
  };
  const changeQubits = (n: number) => {
    if (n < 1 || n > MAX_QUBITS) return;
    setQubits(n);
    edit(ops.filter((op) => [...(op.controls ?? []), ...op.targets].every((q) => q < n)));
  };

  async function run() {
    setRunning(true);
    setError(null);
    try {
      const sent = circuit;
      const r = await runCircuit(sent, { shots: 1024 });
      if (current.current === sent) setResult(r);
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <header>
          <h2 className="text-2xl font-bold">🧪 Lab: build your own circuit</h2>
          <p className="text-muted">
            Pick a gate from the palette and place it on the wires, then run on the simulator you chose in Select QPU. Run the same circuit on the built-in simulator and on an IBM or IonQ machine to see what real-world noise does to it.
          </p>
        </header>
        <section className="panel flex flex-col gap-3 p-4" aria-label="Circuit builder">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1" role="group" aria-label="Number of qubits">
              <button className="pbtn-ghost" onClick={() => changeQubits(qubits - 1)} disabled={running || qubits <= 1} aria-label="Remove a qubit">−</button>
              <span className="chip">{qubits} qubit{qubits > 1 ? "s" : ""}</span>
              <button className="pbtn-ghost" onClick={() => changeQubits(qubits + 1)} disabled={running || qubits >= MAX_QUBITS} aria-label="Add a qubit">+</button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              Start from
              <select
                className="rounded-lg bg-white/10 px-2 py-1"
                value=""
                disabled={running}
                onChange={(e) => {
                  const m = MODULES.find((x) => x.id === e.target.value);
                  load(m ? m.circuit : { qubits, ops: [] });
                }}
              >
                <option value="" disabled>Choose…</option>
                <option value="blank">Blank circuit</option>
                {MODULES.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
            </label>
            <button className="pbtn-primary ml-auto" onClick={run} disabled={running}>{running ? "Running…" : "▶ Run"}</button>
          </div>
          {isIonQ && <p className="text-xs text-muted">IonQ simulators take one job per Run. To run again, press Stop and Run, or pick a local simulator.</p>}
          <CircuitEditor qubits={qubits} ops={ops} onChange={edit} />
          {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
          {result && (
            <>
              <IdealVsMachine result={result} hint="On your next Run, pick an IBM or IonQ machine in Select QPU to see real-world noise." />
              <ResultsPanel result={result} circuit={circuit} />
            </>
          )}
        </section>
      </div>
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <Tutor compact offline circuit={circuit} result={result} extra="Free-build Lab on Qollab." />
      </aside>
    </article>
  );
}
