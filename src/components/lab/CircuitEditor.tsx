"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { Flag } from "@/components/ui/primitives";
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

export const CELL = 56;
export const LEFT = 56;
const TOP = 30;
const BOTTOM = 14;

type Props = {
  qubits: number;
  ops: EOp[];
  onChange?: (ops: EOp[]) => void;
  readOnly?: boolean;
  /** Index (in execution order) of the last op to show at full strength, for step-through. */
  stepIndex?: number | null;
  /** Compact strips (community cards, home) hide the edge codes. */
  compact?: boolean;
  /** Step-through ruler on the strip: one tick per gate, the handle snaps to gate pitch. */
  scrub?: { value: number | null; max: number; onChange: (v: number | null) => void; label?: string };
};

/**
 * The circuit as frames on a rail. Mouse: pick a gate, click a wire. Keyboard: focus the strip,
 * arrows move the cursor, Enter places or selects, Delete removes, [ and ] move a gate, Esc cancels.
 */
export default function CircuitEditor({ qubits, ops, onChange, readOnly, stepIndex = null, compact, scrub }: Props) {
  const [tool, setTool] = useState<GateName | null>(null);
  const [pending, setPending] = useState<{ col: number; picked: number[] } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [hover, setHover] = useState<{ q: number; col: number } | null>(null);
  const [cursor, setCursor] = useState<{ q: number; col: number }>({ q: 0, col: 0 });
  const [focused, setFocused] = useState(false);
  const [angleText, setAngleText] = useState("");
  const [fillCols, setFillCols] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  // The strip fills its container: frames run to the edge even when the circuit is short.
  useEffect(() => {
    const el = stripRef.current;
    if (!el || readOnly) return;
    const ro = new ResizeObserver(([e]) => setFillCols(Math.floor((e.contentRect.width - LEFT - 12) / CELL)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [readOnly]);
  const helpId = useId();

  const maxCol = ops.reduce((m, o) => Math.max(m, o.col), -1);
  const cols = readOnly ? Math.max(maxCol + 1, 1) : Math.max(maxCol + 3, 8, fillCols);
  const rulerCols = Math.max(maxCol + 1, 1);
  const order = sorted(ops);
  const sel = ops.find((o) => o.id === selected) ?? null;
  const info = tool ? GATES[tool] : null;
  const needed = info ? (info.controls === -1 ? Infinity : info.controls + info.targets) : 0;

  useEffect(() => {
    setCursor((current) => ({ q: Math.min(current.q, qubits - 1), col: Math.min(current.col, cols - 1) }));
    setPending(null);
  }, [qubits, cols]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || !focused) return;
    const left = LEFT + cursor.col * CELL;
    if (left < strip.scrollLeft) strip.scrollLeft = left;
    else if (left + CELL > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = left + CELL - strip.clientWidth;
  }, [cursor.col, focused]);

  useEffect(() => {
    if (sel?.params?.length) setAngleText(formatAngle(sel.params[0]));
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const occupied = (col: number, lo: number, hi: number, except?: string) =>
    ops.some((o) => o.col === col && o.id !== except && (() => { const [a, b] = span(o); return a <= hi && lo <= b; })());

  const opAt = (q: number, col: number) => ops.find((o) => o.col === col && (() => { const [a, b] = span(o); return q >= a && q <= b; })());

  function commit(col: number, picked: number[], gname: GateName | null = tool) {
    const gi = gname ? GATES[gname] : null;
    if (!gname || !gi) return;
    const nc = gi.controls === -1 ? picked.length - 1 : gi.controls;
    const controls = picked.slice(0, nc);
    const targets = picked.slice(nc);
    const lo = Math.min(...picked), hi = Math.max(...picked);
    let next = ops;
    if (occupied(col, lo, hi)) next = ops.map((o) => (o.col >= col ? { ...o, col: o.col + 1 } : o));
    const op: EOp = { gate: gname, controls, targets, params: gi.params ? [Math.PI / 2] : [], col, id: newId() };
    onChange?.([...next, op]);
    setSelected(op.id);
    setPending(null);
  }

  function clickCell(q: number, col: number) {
    if (readOnly) return;
    setCursor({ q, col });
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
    const o = ops.find((x) => x.id === id);
    if (!o) return;
    const col = o.col + d;
    if (col < 0) return;
    const [lo, hi] = span(o);
    if (occupied(col, lo, hi, id)) {
      onChange?.(ops.map((x) => (x.id === id ? { ...x, col } : x.col === col && (() => { const [a, b] = span(x); return a <= hi && lo <= b; })() ? { ...x, col: o.col } : x)));
    } else onChange?.(ops.map((x) => (x.id === id ? { ...x, col } : x)));
  }

  function setAngle(text: string) {
    setAngleText(text);
    const v = parseAngle(text);
    if (v !== null && sel) onChange?.(ops.map((o) => (o.id === sel.id ? { ...o, params: [v] } : o)));
  }

  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (readOnly) return;
    const { q, col } = cursor;
    switch (e.key) {
      case "ArrowUp": e.preventDefault(); setCursor({ q: Math.max(0, q - 1), col }); break;
      case "ArrowDown": e.preventDefault(); setCursor({ q: Math.min(qubits - 1, q + 1), col }); break;
      case "ArrowLeft": e.preventDefault(); setCursor({ q, col: Math.max(0, col - 1) }); break;
      case "ArrowRight": e.preventDefault(); setCursor({ q, col: Math.min(cols - 1, col + 1) }); break;
      case "Home": e.preventDefault(); setCursor({ q, col: 0 }); break;
      case "End": e.preventDefault(); setCursor({ q, col: cols - 1 }); break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (pending && tool === "mcz" && pending.picked.length >= 2 && e.key === "Enter" && pending.col === col && pending.picked.includes(q)) commit(pending.col, pending.picked);
        else clickCell(q, col);
        break;
      case "Escape": setTool(null); setPending(null); setSelected(null); break;
      case "Delete":
      case "Backspace": if (selected) { e.preventDefault(); remove(selected); } break;
      case "[": if (selected) { e.preventDefault(); move(selected, -1); setCursor({ q, col: Math.max(0, col - 1) }); } break;
      case "]": if (selected) { e.preventDefault(); move(selected, 1); setCursor({ q, col: col + 1 }); } break;
      default: {
        // Quick gate pick: type a gate label (h, x, z, c for CX…) to arm it.
        const k = e.key.toLowerCase();
        const quick: Record<string, GateName> = { h: "h", x: "x", y: "y", z: "z", s: "s", t: "t", c: "cx", w: "swap", r: "ry" };
        if (quick[k] && !e.metaKey && !e.ctrlKey) { setTool(tool === quick[k] ? null : quick[k]); setPending(null); setSelected(null); }
      }
    }
  }

  const W = LEFT + cols * CELL + 12;
  const H = TOP + (qubits - 1) * CELL + CELL / 2 + BOTTOM + 10;
  const y = (q: number) => TOP + CELL / 2 + q * CELL - 6;
  const x = (c: number) => LEFT + c * CELL + CELL / 2;
  const activeCol = stepIndex !== null && order[stepIndex] ? order[stepIndex].col : null;

  const status = tool && info
    ? pending
      ? tool === "mcz"
        ? `Picked ${pending.picked.map((q) => `q${q}`).join(", ")}. Pick more controls, or press Enter to use the last one as the target.`
        : `Now pick the ${pending.picked.length < (info.controls || 0) ? "next control" : "target"} qubit in the same frame.`
      : `${info.name} armed. ${needed > 1 ? (info.controls === -1 ? "Pick control qubits, then press Enter." : `Pick ${info.controls ? "control first, then target" : "two qubits"}.`) : "Pick a wire to place it."}`
    : sel
      ? `${GATES[sel.gate]?.name ?? sel.gate} selected. Delete removes it, [ and ] move it.`
      : "Pick a gate, then a wire. Keyboard: arrows move, Enter places or selects, type a gate letter to arm it.";

  // Ruler geometry: tick 0 at the strip's left edge, then one tick per gate at its frame column
  // (gates sharing a column spread inside it).
  const cur = scrub ? (scrub.value ?? scrub.max) : 0;
  const ticks: number[] = scrub
    ? [LEFT, ...order.map((o) => {
        const mates = order.filter((m) => m.col === o.col);
        const j = mates.indexOf(o);
        const spread = mates.length > 1 ? (j / (mates.length - 1) - 0.5) * (CELL * 0.5) : 0;
        return x(o.col) + spread;
      })]
    : [];
  const pickTick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrub) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    ticks.forEach((tx, k) => { if (Math.abs(tx - px) < Math.abs(ticks[best] - px)) best = k; });
    scrub.onChange(best === scrub.max ? null : best);
  };

  return (
    <div className="flex flex-col gap-3">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Gate palette">
          {PALETTE.map((name) => {
            const gi = GATES[name]!;
            const armed = tool === name;
            return (
              <button
                key={name}
                type="button"
                draggable
                onDragStart={(e) => { e.dataTransfer.setData("gate", name); setTool(name); setPending(null); }}
                onClick={() => { setTool(armed ? null : name); setPending(null); setSelected(null); }}
                title={`${gi.name}: ${gi.about}`}
                aria-pressed={armed}
                aria-label={`${gi.name} gate`}
                className={`relative flex h-11 min-w-11 items-center justify-center px-2 code text-sm font-bold transition ${armed ? "bg-ice text-navy-ink" : "frame text-paper hover:border-[var(--line-strong)]"}`}
              >
                <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: gi.color }} aria-hidden />
                {gi.label}
              </button>
            );
          })}
        </div>
      )}

      {!readOnly && (
        <p id={helpId} className="min-h-5 text-sm text-fog" aria-live="polite">{status}{focused && <span className="sr-only"> Cursor: wire q{cursor.q}, frame {cursor.col + 1}, {opAt(cursor.q, cursor.col)?.gate.toUpperCase() ?? "empty"}.</span>}</p>
      )}

      <div
        ref={stripRef}
        className={`relative overflow-x-auto bg-navy-deep ${focused ? "outline outline-2 outline-ice" : ""}`}
        tabIndex={0}
        role={readOnly ? "region" : "application"}
        aria-label={readOnly ? `Circuit diagram, ${qubits} wires, ${ops.length} gates. Scrolls sideways.` : `Circuit strip, ${qubits} wires, ${ops.length} gates. Arrow keys move the cursor.`}
        aria-describedby={readOnly ? undefined : helpId}
        onKeyDown={onKey}
        onFocus={(e) => { if (e.target === e.currentTarget) setFocused(true); }}
        onBlur={(e) => { if (e.target === e.currentTarget) setFocused(false); }}
      >
        <div className="perf" aria-hidden />
        {scrub && scrub.max > 0 && (
          <div
            className="relative [&:has(input:focus-visible)]:outline [&:has(input:focus-visible)]:outline-2 [&:has(input:focus-visible)]:outline-ice"
            style={{ height: 40, width: W }}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pickTick(e); }}
            onPointerMove={(e) => { if (e.buttons & 1) pickTick(e); }}
          >
            {/* Ticks sit on the frame columns the gates occupy; the handle snaps to them. */}
            <svg width={W} height={40} aria-hidden className="absolute inset-0">
              <line x1={LEFT} x2={LEFT + rulerCols * CELL} y1={33} y2={33} stroke="var(--line-strong)" />
              {ticks.map((tx, k) => {
                const on = k <= cur;
                return <line key={k} x1={tx} x2={tx} y1={on ? 24 : 28} y2={33} stroke={on ? "var(--ice)" : "var(--line-strong)"} strokeWidth={1.5} />;
              })}
              <text x={6} y={35} className="fill-fog" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 9, letterSpacing: "0.08em" }}>STEP</text>
              <g transform={`translate(${ticks[cur] - 8}, 2)`}><Flag width={16} /></g>
              {scrub.label && cols - rulerCols >= 3 && (
                <text x={LEFT + rulerCols * CELL + 14} y={31} className="fill-fog" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11 }}>{scrub.label}</text>
              )}
            </svg>
            <input
              type="range"
              min={0}
              max={scrub.max}
              step={1}
              value={cur}
              onChange={(e) => scrub.onChange(+e.target.value === scrub.max ? null : +e.target.value)}
              className="absolute top-0 h-full opacity-0"
              style={{ left: LEFT, width: rulerCols * CELL, pointerEvents: "none" }}
              aria-label="Step through the circuit, one tick per gate"
              aria-valuetext={scrub.value === null ? `Final state, all ${scrub.max} gates` : scrub.value === 0 ? "Initial state, before any gate" : `After gate ${scrub.value} of ${scrub.max}`}
            />
          </div>
        )}
        <svg width={W} height={H} role="img" aria-label={`Circuit with ${qubits} qubits and ${ops.length} gates`} className="block select-none">
          {/* frame dividers and edge codes */}
          {Array.from({ length: cols }, (_, c) => (
            <g key={c}>
              <line x1={LEFT + c * CELL} x2={LEFT + c * CELL} y1={8} y2={H - 6} stroke="rgba(245,247,250,0.12)" />
              {!compact && (
                <text x={LEFT + c * CELL + 6} y={16} className="fill-fog" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 9, letterSpacing: "0.08em" }}>
                  F{String(c + 1).padStart(2, "0")}
                </text>
              )}
              {activeCol === c && <g transform={`translate(${LEFT + c * CELL + CELL / 2 - 7}, 2)`}><Flag width={14} /></g>}
            </g>
          ))}
          <line x1={LEFT + cols * CELL} x2={LEFT + cols * CELL} y1={8} y2={H - 6} stroke="rgba(245,247,250,0.12)" />

          {Array.from({ length: qubits }, (_, q) => (
            <g key={q}>
              <text x={10} y={y(q) + 4} className="fill-paper" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12 }}>q{q}</text>
              <line x1={LEFT - 8} x2={W - 6} y1={y(q)} y2={y(q)} stroke="rgba(245,247,250,0.55)" strokeWidth={1.5} />
            </g>
          ))}

          {/* hit targets */}
          {!readOnly &&
            Array.from({ length: qubits }, (_, q) =>
              Array.from({ length: cols }, (_, c) => {
                const isHover = hover?.q === q && hover.col === c && !!tool;
                const isPendingCol = pending?.col === c;
                return (
                  <g key={`${q}-${c}`}>
                    <rect
                      x={LEFT + c * CELL}
                      y={y(q) - CELL / 2}
                      width={CELL}
                      height={CELL}
                      fill={isPendingCol ? "rgba(111,230,255,0.08)" : "transparent"}
                      onMouseEnter={() => setHover({ q, col: c })}
                      onMouseLeave={() => setHover(null)}
                      onClick={() => clickCell(q, c)}
                      onDragOver={(e) => { e.preventDefault(); setHover({ q, col: c }); }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const gname = e.dataTransfer.getData("gate") as GateName;
                        if (!gname) return;
                        const gi = GATES[gname]!;
                        if ((gi.controls || 0) + gi.targets === 1) commit(c, [q], gname);
                        else { setTool(gname); setPending({ col: c, picked: [q] }); }
                        setHover(null);
                      }}
                      style={{ cursor: tool ? "copy" : "pointer" }}
                    />
                    {isHover && !opAt(q, c) && (
                      <rect x={x(c) - 21} y={y(q) - 19} width={42} height={38} fill="none" stroke="var(--ice)" strokeDasharray="3 3" pointerEvents="none" />
                    )}
                  </g>
                );
              }),
            )}

          {/* keyboard cursor */}
          {!readOnly && focused && (
            <rect x={LEFT + cursor.col * CELL + 2} y={y(cursor.q) - CELL / 2 + 2} width={CELL - 4} height={CELL - 4} fill="none" stroke="var(--ice)" strokeWidth={2} strokeDasharray="4 3" pointerEvents="none" />
          )}

          {pending?.picked.map((q) => <circle key={q} cx={x(pending.col)} cy={y(q)} r={9} fill="none" stroke="var(--ice)" strokeWidth={2} strokeDasharray="3 2" />)}

          {order.map((o, idx) => {
            const gi = GATES[o.gate];
            const faded = stepIndex !== null && idx > stepIndex;
            const isSel = o.id === selected;
            const [lo, hi] = span(o);
            const cx = x(o.col);
            const stripe = gi?.color ?? "#888";
            const cs = o.controls ?? [];
            const ink = "var(--ice)";
            const dot = (q: number, k: string) => <circle key={k} cx={cx} cy={y(q)} r={6} fill={ink} />;
            return (
              <g
                key={o.id}
                opacity={faded ? 0.28 : 1}
                onClick={(e) => { if (!readOnly && !tool) { e.stopPropagation(); setSelected(o.id); setCursor({ q: o.targets[0], col: o.col }); } }}
                style={{ cursor: readOnly ? "default" : "pointer", pointerEvents: tool ? "none" : "auto" }}
              >
                {hi > lo && <line x1={cx} x2={cx} y1={y(lo)} y2={y(hi)} stroke={ink} strokeWidth={2} />}
                {cs.map((q) => dot(q, `c${q}`))}
                {o.gate === "cx" || o.gate === "ccx" || o.gate === "mcx" ? (
                  <g>
                    <circle cx={cx} cy={y(o.targets[0])} r={13} fill="var(--navy-deep)" stroke={ink} strokeWidth={2} />
                    <line x1={cx - 13} x2={cx + 13} y1={y(o.targets[0])} y2={y(o.targets[0])} stroke={ink} strokeWidth={2} />
                    <line x1={cx} x2={cx} y1={y(o.targets[0]) - 13} y2={y(o.targets[0]) + 13} stroke={ink} strokeWidth={2} />
                  </g>
                ) : o.gate === "cz" || o.gate === "mcz" ? (
                  dot(o.targets[0], "t")
                ) : o.gate === "swap" || o.gate === "cswap" ? (
                  o.targets.map((q) => (
                    <g key={q} stroke={ink} strokeWidth={2.5}>
                      <line x1={cx - 8} x2={cx + 8} y1={y(q) - 8} y2={y(q) + 8} />
                      <line x1={cx - 8} x2={cx + 8} y1={y(q) + 8} y2={y(q) - 8} />
                    </g>
                  ))
                ) : o.gate === "initialize" ? (
                  <g>
                    <rect x={cx - 22} y={y(lo) - 20} width={44} height={y(hi) - y(lo) + 40} fill="var(--navy-ink)" stroke={ink} strokeWidth={1.5} />
                    <text x={cx} y={(y(lo) + y(hi)) / 2 + 4} textAnchor="middle" className="fill-paper" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, fontWeight: 700 }}>init</text>
                  </g>
                ) : (
                  o.targets.map((q) => (
                    <g key={q}>
                      <rect x={cx - 21} y={y(q) - 19} width={42} height={38} fill="var(--navy-ink)" stroke={ink} strokeWidth={1.5} />
                      <rect x={cx - 21} y={y(q) - 19} width={42} height={3} fill={stripe} />
                      <text x={cx} y={y(q) + (o.params?.length ? 1 : 5)} textAnchor="middle" className="fill-paper" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 14, fontWeight: 700 }}>
                        {(gi?.label ?? o.gate).replace(/^C(?=[A-Z])/, "")}
                      </text>
                      {!!o.params?.length && (
                        <text x={cx} y={y(q) + 13} textAnchor="middle" className="fill-fog" style={{ fontFamily: "var(--font-jetbrains)", fontSize: 9 }}>{formatAngle(o.params[0])}</text>
                      )}
                    </g>
                  ))
                )}
                {isSel && (
                  <>
                    <rect x={cx - 26} y={y(lo) - 24} width={52} height={y(hi) - y(lo) + 48} fill="none" stroke="var(--ice)" strokeWidth={1.5} />
                    <rect x={cx - 29} y={y(lo) - 27} width={58} height={y(hi) - y(lo) + 54} fill="none" stroke="var(--ice)" strokeWidth={1} opacity={0.6} />
                  </>
                )}
              </g>
            );
          })}
        </svg>
        {scrub?.label && cols - rulerCols < 3 && <p className="code px-3 pb-2 text-xs text-fog" aria-live="polite">{scrub.label}</p>}
        <div className="perf" aria-hidden />
      </div>

      {!readOnly && sel && (
        <div className="frame flex flex-wrap items-center gap-3 p-3 text-sm">
          <span className="code font-bold text-ice">{GATES[sel.gate]?.name ?? sel.gate}</span>
          <span className="code text-fog">
            {sel.controls?.length ? `control ${sel.controls.map((q) => `q${q}`).join(", ")} → ` : ""}
            {sel.targets.map((q) => `q${q}`).join(", ")}
          </span>
          {!!sel.params?.length && (
            <label className="flex items-center gap-2">
              <span className="code">θ =</span>
              <input
                value={angleText}
                onChange={(e) => setAngle(e.target.value)}
                className={`field code !min-h-10 w-28 py-1 ${parseAngle(angleText) === null ? "!border-bad" : ""}`}
                aria-label="Rotation angle, for example pi/2"
                aria-invalid={parseAngle(angleText) === null}
              />
              <span className="text-xs text-fog">e.g. pi/4, -pi/2, 1.1</span>
            </label>
          )}
          <div className="ml-auto flex gap-1.5">
            <button type="button" className="keycap !min-h-10 !px-3" onClick={() => move(sel.id, -1)} aria-label="Move gate left"><Icon name="back" size={16} /></button>
            <button type="button" className="keycap !min-h-10 !px-3" onClick={() => move(sel.id, 1)} aria-label="Move gate right"><Icon name="next" size={16} /></button>
            <button type="button" className="keycap !min-h-10 !border-bad !px-3 text-bad hover:!bg-[rgba(255,123,123,0.12)]" onClick={() => remove(sel.id)}><Icon name="close" size={14} /> Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
