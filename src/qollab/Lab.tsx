import { useEffect, useMemo, useRef, useState } from "react";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import IdealVsMachine from "@/components/lab/IdealVsMachine";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Heading, Notice, Perf } from "@/components/ui/primitives";
import { MODULES, TRACKS } from "@/lib/curriculum";
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
  const [startFrom, setStartFrom] = useState("blank");

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
      else setError("The circuit changed while it was running, so that result was dropped. Run again to see the new circuit's result.");
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
        <p role="status" className="sr-only">{running ? "Running…" : result ? "Results ready." : ""}</p>
        <header className="flex flex-col gap-2">
          <Heading as="h1" code="FREE BUILD · UP TO 8 WIRES">Lab: build your own circuit</Heading>
          <p className="max-w-prose text-fog">
            Pick a gate from the palette and place it on the wires, then run on the simulator you chose in Select QPU. To compare machines, press Stop, then Run, and pick another simulator. Qollab starts fresh on every Run, so start again from the same lesson&apos;s circuit if you want to repeat a comparison.
          </p>
        </header>

        <section className="rail -mx-3 sm:-mx-4" aria-label="Circuit builder">
          <Perf />
          <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center" role="group" aria-label="Number of wires">
                <EdgeCode className="mr-2">Wires</EdgeCode>
                <button type="button" className="keycap !min-w-11 !px-0" onClick={() => changeQubits(qubits - 1)} disabled={running || qubits <= 1} aria-label="Remove a wire"><Icon name="minus" size={14} /></button>
                <span className="display -ml-px flex min-h-11 min-w-11 items-center justify-center border border-[var(--line-strong)] text-lg num" aria-live="polite">{qubits}</span>
                <button type="button" className="keycap -ml-px !min-w-11 !px-0" onClick={() => changeQubits(qubits + 1)} disabled={running || qubits >= MAX_QUBITS} aria-label="Add a wire"><Icon name="plus" size={14} /></button>
              </div>
              <label className="flex items-center gap-2">
                <EdgeCode>Start from</EdgeCode>
                <select className="field !w-auto max-w-[260px]" value={startFrom} disabled={running} onChange={(e) => setStartFrom(e.target.value)}>
                  <option value="blank">Blank circuit</option>
                  {TRACKS.filter((t) => t.id !== "explorer").map((t) => (
                    <optgroup key={t.id} label={`${t.name} track`}>
                      {MODULES.filter((m) => m.track === t.id).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <button type="button" className="keycap" disabled={running} onClick={() => { const m = MODULES.find((x) => x.id === startFrom); load(m ? m.circuit : { qubits, ops: [] }); }}><Icon name="fork" size={14} /> Load</button>
              <button type="button" className="keycap-primary ml-auto" onClick={run} disabled={running} aria-busy={running}><Icon name="run" size={14} /> {running ? "Running…" : "Run 1,024 shots"}</button>
            </div>
            {isIonQ && <Notice tone="warn">IonQ simulators take one job per Run. To run again, press Stop and Run, or pick a local simulator.</Notice>}
            <div className="frame overflow-x-auto p-3">
              <CircuitEditor qubits={qubits} ops={ops} onChange={edit} />
            </div>
            {error && <Notice tone="bad" role="alert">{error}</Notice>}
            {result && (
              <div className="flex flex-col gap-3 strike">
                <IdealVsMachine result={result} hint="If this was the built-in simulator, pick an IBM or IonQ machine in Select QPU on your next Run to see real-world noise." />
                <ResultsPanel result={result} circuit={circuit} />
              </div>
            )}
          </div>
          <Perf />
        </section>
      </div>
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Tutor compact offline circuit={circuit} result={result} extra="Free-build Lab on Qollab." />
      </aside>
    </article>
  );
}
