import { useId, useMemo, useRef, useState, type ReactNode } from "react";
import CircuitEditor, { layout } from "@/components/lab/CircuitEditor";
import Histogram from "@/components/lab/Histogram";
import Icon from "@/components/ui/Icon";
import { EdgeCode, Notice, Perf, Readout } from "@/components/ui/primitives";
import { bitOf, onesRate, pct } from "@/lib/explain";
import { runCircuit, type Circuit, type RunResult } from "@/lib/quantum";
import { angleCircuit, banknoteCircuit, correctProb, exactCorrectDist, lockCircuit, N, p1 } from "@/lib/quantumMoney";

type Kind = "qm-angle" | "qm-lock" | "qm-multi";
type Props = {
  kind: Kind;
  isIonQ?: boolean;
  /** Offered as "Open in Lab" when given (Qollab's Lab, or the web Lab). */
  onOpenLab?: (c: Circuit) => void;
  /** Called after each successful run (the web lesson page counts it toward progress). */
  onRun?: () => void;
};

/** The three interactive demos of the quantum money lesson: a rotation angle, a one-bit lock, and a banknote. */
export default function QuantumMoneyDemo({ kind, ...rest }: Props) {
  if (kind === "qm-angle") return <AngleDemo {...rest} />;
  if (kind === "qm-lock") return <LockDemo {...rest} />;
  return <MultiDemo {...rest} />;
}

const SHOTS = 1000;
const pick = "border-ice bg-ice text-navy-ink";

/** Run state for one demo. Changing an input clears the result, and a run that finishes after that is dropped. */
function useRun(circuit: Circuit, onRun?: () => void) {
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gen = useRef(0);
  const reset = () => {
    gen.current++;
    setResult(null);
    setError(null);
  };
  async function run() {
    const mine = ++gen.current;
    setRunning(true);
    setError(null);
    try {
      const r = await runCircuit(circuit, { shots: SHOTS });
      if (mine === gen.current) {
        setResult(r);
        onRun?.();
      }
    } catch (e) {
      if (mine === gen.current) {
        setResult(null);
        setError((e as Error).message);
      }
    } finally {
      if (mine === gen.current) setRunning(false);
    }
  }
  return { result, running, error, run, reset };
}

function Panel({ title, code, label, children }: { title: string; code: string; label: string; children: ReactNode }) {
  return (
    <section className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-label={label}>
      <Perf />
      <div className="flex flex-col gap-4 px-3 py-4 sm:px-4">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <h3 className="display text-xl sm:text-2xl">{title}</h3>
          <EdgeCode className="pb-1">{code}</EdgeCode>
        </div>
        {children}
      </div>
      <Perf />
    </section>
  );
}

function Actions({ run, running, again, circuit, isIonQ, onOpenLab }: { run: () => void; running: boolean; again: boolean; circuit: Circuit; isIonQ?: boolean; onOpenLab?: (c: Circuit) => void }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {onOpenLab && <button type="button" className="keycap" onClick={() => onOpenLab(circuit)} disabled={running}><Icon name="lab" size={14} /> Open in Lab</button>}
        <button type="button" className="keycap-primary" onClick={run} disabled={running} aria-busy={running}>
          <Icon name="run" size={14} /> {running ? "Running…" : again ? "Run again" : `Run ${SHOTS} shots`}
        </button>
      </div>
      {isIonQ && <Notice tone="warn">IonQ simulators take one job per Run. To run again, press Stop and Run, or pick a local simulator.</Notice>}
    </>
  );
}

function Results({ running, error, status }: { running: boolean; error: string | null; status: string }) {
  return (
    <>
      <p role="status" className="sr-only">{running ? "Running…" : status}</p>
      {error && <Notice tone="bad" role="alert">{error}</Notice>}
    </>
  );
}

/** Pick a rotation angle and see P(0) and P(1) from P(1) = sin²(θ/2). */
function AngleDemo({ isIonQ, onOpenLab, onRun }: Omit<Props, "kind">) {
  const id = useId();
  const [deg, setDeg] = useState(60);
  const circuit = useMemo(() => angleCircuit(deg), [deg]);
  const { result, running, error, run, reset } = useRun(circuit, onRun);
  const one = p1(deg);
  const at = deg === 0 ? " (north pole)" : deg === 180 ? " (south pole)" : deg === 90 || deg === 270 ? " (the equator)" : "";

  return (
    <Panel title="Set the angle" code="1Q · RY(θ)" label="Rotation angle demonstration">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="label-sm text-fog">Rotation angle θ: <span className="code normal-case tracking-normal text-paper">{deg}°{at}</span></label>
        <input id={id} type="range" min={0} max={360} step={1} value={deg} onChange={(e) => { setDeg(+e.target.value); reset(); }} className="scrub w-full" aria-valuetext={`${deg} degrees${at}`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {([["P(0)", 1 - one], ["P(1)", one]] as const).map(([label, v]) => (
          <div key={label} className="flex flex-col gap-2">
            <Readout label={label} value={pct(v)} />
            <div className="frame h-3" aria-hidden><div className="h-full bg-ice" style={{ width: `${v * 100}%` }} /></div>
          </div>
        ))}
      </div>
      <p className="max-w-[68ch] text-sm leading-relaxed text-fog">
        The rule: <span className="code text-paper">P(1) = sin²(θ/2)</span>. At θ = {deg}° that is sin²({deg / 2}°) = <b className="text-paper">{pct(one)}</b>.
        It is not a straight line: equal steps in angle do not give equal steps in probability. The curve is flattest near the poles (0° and 180°) and steepest near the equator (90°, 270°), so the first 45° only raises P(1) to about {pct(p1(45), 0)}, while the next 45° lifts it to 50%.
      </p>
      <Actions run={run} running={running} again={!!result} circuit={circuit} isIonQ={isIonQ} onOpenLab={onOpenLab} />
      <Results running={running} error={error} status={result ? `Results ready. P(1) measured ${pct(onesRate(result.counts, 0))}, exact ${pct(one)}.` : ""} />
      {result && <div className="frame p-3"><Histogram counts={result.counts} shots={result.shots} probabilities={result.probabilities} tone="navy" height={160} /></div>}
    </Panel>
  );
}

/** Two- or three-way segmented bit control: a labelled group of 0/1 toggle buttons. */
function BitToggle({ label, value, onChange }: { label: string; value: number; onChange: (v: 0 | 1) => void }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="label-sm mb-1.5 text-fog">{label}</legend>
      <div className="flex gap-1.5">
        {([0, 1] as const).map((v) => (
          <button key={v} type="button" aria-pressed={value === v} aria-label={`${label}: ${v}`} onClick={() => onChange(v)} className={`chip min-h-11 min-w-11 justify-center text-sm transition-colors ${value === v ? pick : "hover:bg-[rgba(111,230,255,0.12)]"}`}>
            {v}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Choose the bill value, the bank's lock key and your unlock guess for one qubit, then run it. */
function LockDemo({ isIonQ, onOpenLab, onRun }: Omit<Props, "kind">) {
  const [value, setValue] = useState(1);
  const [lock, setLock] = useState(1);
  const [unlock, setUnlock] = useState(1);
  const circuit = useMemo(() => lockCircuit(value, lock, unlock), [value, lock, unlock]);
  const ops = useMemo(() => layout(circuit), [circuit]);
  const { result, running, error, run, reset } = useRun(circuit, onRun);
  const matched = lock === unlock;
  const set = (f: (v: number) => void) => (v: number) => { f(v); reset(); };

  return (
    <Panel title="Lock and unlock one qubit" code="1Q · SET · LOCK · UNLOCK" label="Lock and unlock demonstration">
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        <BitToggle label="Bill value" value={value} onChange={set(setValue)} />
        <BitToggle label="Bank's locking key" value={lock} onChange={set(setLock)} />
        <BitToggle label="Your unlocking key" value={unlock} onChange={set(setUnlock)} />
      </div>
      <Notice tone={matched ? "good" : "warn"} role="status">
        {matched
          ? `Keys match, so the rotations cancel and the qubit should read ${value} every time.`
          : "Keys differ, so the rotation is not undone and the qubit should come back as a coin flip."}
      </Notice>
      <div className="frame overflow-x-auto p-3">
        <CircuitEditor qubits={1} ops={ops} readOnly compact />
      </div>
      <Actions run={run} running={running} again={!!result} circuit={circuit} isIonQ={isIonQ} onOpenLab={onOpenLab} />
      <Results running={running} error={error} status={result ? `Results ready. The qubit read 1 in ${pct(onesRate(result.counts, 0))} of shots.` : ""} />
      {result && <div className="frame p-3"><Histogram counts={result.counts} shots={result.shots} probabilities={result.probabilities} tone="navy" height={160} /></div>}
    </Panel>
  );
}

const rand01 = () => (Math.random() < 0.5 ? 0 : 1);
const randBits = () => Array.from({ length: N }, rand01);

/** The same idea across 8 qubits, one key bit each. */
function MultiDemo({ isIonQ, onOpenLab, onRun }: Omit<Props, "kind">) {
  const [bill, setBill] = useState([1, 0, 1, 1, 0, 0, 1, 0]);
  const [lock, setLock] = useState([1, 0, 0, 1, 1, 0, 1, 0]);
  const [guess, setGuess] = useState<number[]>(() => Array(N).fill(0));
  const circuit = useMemo(() => banknoteCircuit(bill, lock, guess), [bill, lock, guess]);
  const ops = useMemo(() => layout(circuit), [circuit]);
  const { result, running, error, run, reset } = useRun(circuit, onRun);

  const flip = (arr: number[], setArr: (a: number[]) => void, i: number) => { setArr(arr.map((b, k) => (k === i ? 1 - b : b))); reset(); };
  const choose = (setArr: (a: number[]) => void, bits: number[]) => () => { setArr(bits); reset(); };

  // Per qubit: how many shots read back the bill's true value. Across qubits: how many came back right in each shot.
  const perQubit = result && {
    counts: Object.fromEntries(Array.from({ length: N }, (_, i) => [`q${i}`, Object.entries(result.counts).reduce((a, [k, v]) => a + (+bitOf(k, i) === bill[i] ? v : 0), 0)])),
    probabilities: Object.fromEntries(Array.from({ length: N }, (_, i) => [`q${i}`, correctProb(lock, guess, i)])),
  };
  const total = result && (() => {
    const counts = Object.fromEntries(Array.from({ length: N + 1 }, (_, k) => [`${k}/${N}`, 0]));
    for (const [bits, v] of Object.entries(result.counts)) counts[`${bill.filter((b, i) => +bitOf(bits, i) === b).length}/${N}`] += v;
    const exact = exactCorrectDist(lock, guess);
    return { counts, probabilities: Object.fromEntries(exact.map((p, k) => [`${k}/${N}`, p])) };
  })();
  const rates = result ? Array.from({ length: N }, (_, i) => onesRate(result.counts, i)) : null;
  const steady = (p: number) => p < 0.1 || p > 0.9;

  const row = (label: string, bits: number[], setBits: (a: number[]) => void) => (
    <tr>
      <th scope="row" className="label-sm p-1 text-left font-normal text-fog">{label}</th>
      {bits.map((v, i) => (
        <td key={i} className="p-1">
          <button type="button" aria-pressed={v === 1} aria-label={`${label}, q${i}: ${v}`} onClick={() => flip(bits, setBits, i)} className={`chip min-h-11 min-w-11 justify-center text-sm transition-colors ${v ? pick : "hover:bg-[rgba(111,230,255,0.12)]"}`}>
            {v}
          </button>
        </td>
      ))}
    </tr>
  );

  return (
    <Panel title="Forge a banknote" code={`${N}Q · SET · LOCK · UNLOCK`} label="Multi-qubit banknote demonstration">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="keycap" onClick={() => { setBill(randBits()); setLock(randBits()); reset(); }}>Randomize bill and bank key</button>
        <button type="button" className="keycap" onClick={choose(setGuess, Array(N).fill(0))}>Guess all 0s</button>
        <button type="button" className="keycap" onClick={choose(setGuess, [...lock])}>Guess the real key</button>
        <button type="button" className="keycap" onClick={choose(setGuess, randBits())}>Guess randomly</button>
      </div>

      <div className="frame overflow-x-auto p-2">
        <table className="w-full min-w-[34rem] text-center">
          <caption className="sr-only">Bill value, the bank&apos;s lock key and your unlock guess for each of the {N} qubits. Press a bit to flip it.</caption>
          <thead>
            <tr>
              <td />
              {Array.from({ length: N }, (_, i) => <th key={i} scope="col" className="code p-1 text-xs font-normal text-fog">q{i}</th>)}
            </tr>
          </thead>
          <tbody>
            {row("Bill value", bill, setBill)}
            {row("Bank's lock key", lock, setLock)}
            {row("Your unlock guess", guess, setGuess)}
            <tr>
              <th scope="row" className="label-sm p-1 text-left font-normal text-fog">Measured P(1)</th>
              {Array.from({ length: N }, (_, i) => (
                <td key={i} className={`code p-1 text-sm ${rates && steady(rates[i]) ? "border border-ice font-bold text-ice" : "text-fog"}`}>
                  {rates ? (steady(rates[i]) ? `${pct(rates[i], 0)} steady` : pct(rates[i], 0)) : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="frame overflow-x-auto p-3">
        <CircuitEditor qubits={N} ops={ops} readOnly compact />
      </div>
      <Actions run={run} running={running} again={!!result} circuit={circuit} isIonQ={isIonQ} onOpenLab={onOpenLab} />
      <Results running={running} error={error} status={result && rates ? `Results ready. ${rates.filter(steady).length} of ${N} qubits read steadily and reveal their bill bit.` : ""} />
      {result && perQubit && total && (
        <div className="flex flex-col gap-4 strike">
          <Notice tone="info">Qubits where your guess matches the lock key read a steady 0% or 100% and reveal that bill bit. Where it misses, the qubit sits near 50% and tells you nothing.</Notice>
          <div className="frame p-3">
            <h4 className="label-sm mb-1 text-fog">How often each qubit read back the true bill value</h4>
            <Histogram counts={perQubit.counts} shots={result.shots} probabilities={perQubit.probabilities} tone="navy" height={160} />
          </div>
          <div className="frame p-3">
            <h4 className="label-sm mb-1 text-fog">How many of the {N} bits came back correct, per shot</h4>
            <Histogram counts={total.counts} shots={result.shots} probabilities={total.probabilities} tone="navy" height={160} />
          </div>
        </div>
      )}
    </Panel>
  );
}
