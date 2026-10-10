"use client";

import { useEffect, useState } from "react";
import { formatAngle, GATES, opQubits, PALETTE, parseAngle, type Circuit, type GateName, type Op } from "@/lib/quantum";

/** An op with a display column. Columns are only for layout; execution order is (col, insertion). */
export type EOp = Op & { col: number; id: string };

let nextId = 0;
const newId = () => `op${nextId++}`;

const span = (o: Op) => {
  const qs = opQubits(o);
  return [Math.min(...qs), Math.max(...qs)] as const;
};

/** Lay a plain op list out into columns (greedy, ops never visually overlap). */
export function layout(c: Circuit): EOp[] {
  const free = Array(c.qubits).fill(0);
  return c.ops
    .filter((o) => o.gate !== "barrier")
    .map((o) => {
      const [lo, hi] = span(o);
      let col = 0;
      for (let q = lo; q <= hi; q++) col = Math.max(col, free[q]);
      for (let q = lo; q <= hi; q++) free[q] = col + 1;
      return { ...o, col, id: newId() };
    });
}

export function toCircuit(qubits: number, ops: EOp[]): Circuit {
  return {
    qubits,
    ops: [...ops].sort((a, b) => a.col - b.col).map(({ gate, targets, controls, params }) => ({ gate, targets, controls: controls ?? [], params: params ?? [] })),
  };
}

const sorted = (ops: EOp[]) => [...ops].sort((a, b) => a.col - b.col);

const CELL = 56;
const LEFT = 52;
const TOP = 20;

type Props = {
  qubits: number;
  ops: EOp[];
  onChange?: (ops: EOp[]) => void;
  readOnly?: boolean;
  /** Index (in execution order) of the last op to show at full strength, for step-through. */
  stepIndex?: number | null;
};

export default function CircuitEditor({ qubits, ops, onChange, readOnly, stepIndex = null }: Props) {
  const [tool, setTool] = useState<GateName | null>(null);
  const [pending, setPending] = useState<{ col: number; picked: number[] } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<{ q: number; col: number } | null>(null);
  const [angleText, setAngleText] = useState("");

  const maxCol = ops.reduce((m, o) => Math.max(m, o.col), -1);
  const cols = readOnly ? Math.max(maxCol + 1, 1) : Math.max(maxCol + 3, 8);
  const order = sorted(ops);
  const sel = ops.find((o) => o.id === selected) ?? null;
  const info = tool ? GATES[tool] : null;
  const needed = info ? (info.controls === -1 ? Infinity : info.controls + info.targets) : 0;

  useEffect(() => {
    if (sel?.params?.length) setAngleText(formatAngle(sel.params[0]));
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (readOnly) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") { setTool(null); setPending(null); setSelected(null); }
      if ((e.key === "Delete" || e.key === "Backspace") && selected) { remove(selected); }
      if (e.key === "Enter" && pending && tool === "mcz" && pending.picked.length >= 2) commit(pending.col, pending.picked);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const occupied = (col: number, lo: number, hi: number, except?: string) =>
    ops.some((o) => o.col === col && o.id !== except && (() => { const [a, b] = span(o); return a <= hi && lo <= b; })());

  const opAt = (q: number, col: number) => ops.find((o) => o.col === col && (() => { const [a, b] = span(o); return q >= a && q <= b; })());

  function commit(col: number, picked: number[]) {
    if (!tool || !info) return;
    const nc = info.controls === -1 ? picked.length - 1 : info.controls;
    const controls = picked.slice(0, nc);
    const targets = picked.slice(nc);
    const lo = Math.min(...picked), hi = Math.max(...picked);
    // Make room if another gate overlaps this column's span.
    let next = ops;
    if (occupied(col, lo, hi)) next = ops.map((o) => (o.col >= col ? { ...o, col: o.col + 1 } : o));
    const op: EOp = { gate: tool, controls, targets, params: info.params ? [Math.PI / 2] : [], col, id: newId() };
    onChange?.([...next, op]);
    setSelected(op.id);
    setPending(null);
  }

  function clickCell(q: number, col: number) {
    if (readOnly) return;
    if (!tool) {
      setSelected(opAt(q, col)?.id ?? null);
      return;
    }
    if (needed === 1) return commit(col, [q]);
    const base = pending && pending.col === col ? pending.picked : [];
    if (base.includes(q)) return;
    const picked = [...base, q];
    if (picked.length >= needed) commit(col, picked);
    else setPending({ col, picked });
  }

  function remove(id: string) {
    onChange?.(ops.filter((o) => o.id !== id));
    setSelected(null);
  }

  function move(id: string, d: number) {
    const o = ops.find((x) => x.id === id)!;
    const col = o.col + d;
    if (col < 0) return;
    const [lo, hi] = span(o);
    if (occupied(col, lo, hi, id)) {
      // swap with whatever is in the way
      onChange?.(ops.map((x) => (x.id === id ? { ...x, col } : x.col === col && (() => { const [a, b] = span(x); return a <= hi && lo <= b; })() ? { ...x, col: o.col } : x)));
    } else onChange?.(ops.map((x) => (x.id === id ? { ...x, col } : x)));
  }

  function setAngle(text: string) {
    setAngleText(text);
    const v = parseAngle(text);
    if (v !== null && sel) onChange?.(ops.map((o) => (o.id === sel.id ? { ...o, params: [v] } : o)));
  }

  const W = LEFT + cols * CELL + 12;
  const H = TOP * 2 + (qubits - 1) * CELL + 24;
  const y = (q: number) => TOP + 12 + q * CELL;
  const x = (c: number) => LEFT + c * CELL + CELL / 2;

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Gate palette">
          {PALETTE.map((name) => {
            const gi = GATES[name]!;
            return (
              <button
                key={name}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData("gate", name); setTool(name); setPending(null); }}
                onClick={() => { setTool(tool === name ? null : name); setPending(null); setSelected(null); }}
                title={`${gi.name}: ${gi.about}`}
                aria-pressed={tool === name}
                className={`h-10 min-w-10 rounded-lg px-2 font-mono text-sm font-bold text-white shadow transition hover:brightness-110 ${tool === name ? "ring-2 ring-white ring-offset-2 ring-offset-space" : ""}`}
                style={{ background: gi.color }}
              >
                {gi.label}
              </button>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <p className="min-h-5 text-sm text-muted" aria-live="polite">
          {tool && info
            ? pending
              ? tool === "mcz"
                ? `Picked ${pending.picked.map((q) => `q${q}`).join(", ")}. Click more controls, or press Enter to use the last one as the target.`
                : `Now click the ${pending.picked.length < (info.controls || 0) ? "next control" : "target"} qubit in the same column.`
              : `${info.name}: ${info.about} ${needed > 1 ? (info.controls === -1 ? "Click control qubits, then press Enter." : `Click ${info.controls ? "control first, then target" : "two qubits"}.`) : "Click a wire to place it."}`
            : "Pick a gate (or drag it onto a wire). Click a placed gate to edit it. Delete removes, Esc cancels."}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl bg-[#070a24] ring-1 ring-white/10">
        <svg width={W} height={H} role="img" aria-label={`Circuit with ${qubits} qubits and ${ops.length} gates`} className="block select-none">
          {Array.from({ length: qubits }, (_, q) => (
            <g key={q}>
              <text x={10} y={y(q) + 5} className="fill-muted font-mono text-[13px]">q{q}</text>
              <line x1={LEFT - 6} x2={W - 6} y1={y(q)} y2={y(q)} stroke="#ffffff40" strokeWidth={1.5} />
            </g>
          ))}

          {/* hit targets */}
          {!readOnly &&
            Array.from({ length: qubits }, (_, q) =>
              Array.from({ length: cols }, (_, c) => (
                <rect
                  key={`${q}-${c}`}
                  x={LEFT + c * CELL}
                  y={y(q) - CELL / 2}
                  width={CELL}
                  height={CELL}
                  fill={hover?.q === q && hover.col === c && tool ? "#ffffff12" : pending?.col === c ? "#7b6cff14" : "transparent"}
                  onMouseEnter={() => setHover({ q, col: c })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => clickCell(q, c)}
                  onDragOver={(e) => { e.preventDefault(); setHover({ q, col: c }); }}
                  onDrop={(e) => { e.preventDefault(); const gname = e.dataTransfer.getData("gate") as GateName; if (gname) { setTool(gname); if ((GATES[gname]!.controls || 0) + GATES[gname]!.targets === 1) { setTool(gname); setTimeout(() => clickCellWith(gname, q, c)); } else setPending({ col: c, picked: [q] }); } }}
                  style={{ cursor: tool ? "copy" : "pointer" }}
                />
              )),
            )}

          {pending?.picked.map((q) => <circle key={q} cx={x(pending.col)} cy={y(q)} r={8} fill="none" stroke="var(--on)" strokeWidth={2} strokeDasharray="3 2" />)}

          {order.map((o, idx) => {
            const gi = GATES[o.gate];
            const faded = stepIndex !== null && idx > stepIndex;
            const isSel = o.id === selected;
            const [lo, hi] = span(o);
            const cx = x(o.col);
            const color = gi?.color ?? "#888";
            const cs = o.controls ?? [];
            const dot = (q: number, k: string) => <circle key={k} cx={cx} cy={y(q)} r={6} fill={color} />;
            return (
              <g
                key={o.id}
                opacity={faded ? 0.25 : 1}
                onClick={(e) => { if (!readOnly && !tool) { e.stopPropagation(); setSelected(o.id); } }}
                style={{ cursor: readOnly ? "default" : "pointer", pointerEvents: tool ? "none" : "auto" }}
              >
                {hi > lo && <line x1={cx} x2={cx} y1={y(lo)} y2={y(hi)} stroke={color} strokeWidth={2.5} />}
                {cs.map((q) => dot(q, `c${q}`))}
                {o.gate === "cx" || o.gate === "ccx" || o.gate === "mcx" ? (
                  <g>
                    <circle cx={cx} cy={y(o.targets[0])} r={13} fill="#070a24" stroke={color} strokeWidth={2.5} />
                    <line x1={cx - 13} x2={cx + 13} y1={y(o.targets[0])} y2={y(o.targets[0])} stroke={color} strokeWidth={2.5} />
                    <line x1={cx} x2={cx} y1={y(o.targets[0]) - 13} y2={y(o.targets[0]) + 13} stroke={color} strokeWidth={2.5} />
                  </g>
                ) : o.gate === "cz" || o.gate === "mcz" ? (
                  dot(o.targets[0], "t")
                ) : o.gate === "swap" ? (
                  o.targets.map((q) => (
                    <g key={q} stroke={color} strokeWidth={2.5}>
                      <line x1={cx - 8} x2={cx + 8} y1={y(q) - 8} y2={y(q) + 8} />
                      <line x1={cx - 8} x2={cx + 8} y1={y(q) + 8} y2={y(q) - 8} />
                    </g>
                  ))
                ) : o.gate === "initialize" ? (
                  <g>
                    <rect x={cx - 22} y={y(lo) - 20} width={44} height={y(hi) - y(lo) + 40} rx={8} fill="#444a7a" />
                    <text x={cx} y={(y(lo) + y(hi)) / 2 + 4} textAnchor="middle" className="fill-white font-mono text-[11px] font-bold">init</text>
                  </g>
                ) : (
                  o.targets.map((q) => (
                    <g key={q}>
                      <rect x={cx - 21} y={y(q) - 19} width={42} height={38} rx={8} fill={color} />
                      <text x={cx} y={y(q) + (o.params?.length ? 0 : 5)} textAnchor="middle" className="fill-white font-mono text-[14px] font-bold">
                        {(gi?.label ?? o.gate).replace(/^C(?=[A-Z])/, "")}
                      </text>
                      {!!o.params?.length && (
                        <text x={cx} y={y(q) + 13} textAnchor="middle" className="fill-white/90 font-mono text-[9px]">{formatAngle(o.params[0])}</text>
                      )}
                    </g>
                  ))
                )}
                {isSel && <rect x={cx - 26} y={y(lo) - 24} width={52} height={y(hi) - y(lo) + 48} rx={10} fill="none" stroke="var(--on)" strokeWidth={2} />}
              </g>
            );
          })}
        </svg>
      </div>

      {!readOnly && sel && (
        <div className="panel flex flex-wrap items-center gap-3 p-3 text-sm">
          <span className="font-mono font-bold" style={{ color: GATES[sel.gate]?.color }}>{GATES[sel.gate]?.name ?? sel.gate}</span>
          <span className="text-muted">
            {sel.controls?.length ? `control ${sel.controls.map((q) => `q${q}`).join(", ")} → ` : ""}
            {sel.targets.map((q) => `q${q}`).join(", ")}
          </span>
          {!!sel.params?.length && (
            <label className="flex items-center gap-2">
              θ =
              <input
                value={angleText}
                onChange={(e) => setAngle(e.target.value)}
                className={`w-28 rounded-lg bg-white/10 px-2 py-1 font-mono outline-none ring-1 ${parseAngle(angleText) === null ? "ring-bad" : "ring-white/10 focus:ring-accent"}`}
                aria-label="Rotation angle, e.g. pi/2"
              />
              <span className="text-xs text-muted">e.g. pi/4, -pi/2, 1.1</span>
            </label>
          )}
          <div className="ml-auto flex gap-1.5">
            <button className="pbtn-ghost !px-2.5" onClick={() => move(sel.id, -1)} aria-label="Move gate left">←</button>
            <button className="pbtn-ghost !px-2.5" onClick={() => move(sel.id, 1)} aria-label="Move gate right">→</button>
            <button className="pbtn-ghost !px-2.5 text-bad" onClick={() => remove(sel.id)}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );

  // Drops of single-qubit gates place immediately using the dropped gate (tool state may not have updated yet).
  function clickCellWith(name: GateName, q: number, col: number) {
    const gi = GATES[name]!;
    let next = ops;
    if (occupied(col, q, q)) next = ops.map((o) => (o.col >= col ? { ...o, col: o.col + 1 } : o));
    const op: EOp = { gate: name, targets: [q], controls: [], params: gi.params ? [Math.PI / 2] : [], col, id: newId() };
    onChange?.([...next, op]);
    setSelected(op.id);
  }
}
