"use client";

import { useRef, useState } from "react";
import type { Vec3 } from "@/lib/quantum";

/**
 * Orthographic Bloch sphere. Drag horizontally to turn it. The vector is the qubit's reduced state
 * from Qiskit: length 1 = pure, shorter = entangled with other qubits (or noisy).
 */
export default function BlochSphere({ v, label, purity, size = 170 }: { v: Vec3; label: string; purity?: number; size?: number }) {
  const [az, setAz] = useState(-0.6);
  const drag = useRef<number | null>(null);
  const el = 0.35; // camera elevation
  const R = size * 0.38;
  const c = size / 2;

  // Physics (x, y, z) -> screen. z is up.
  const proj = ([x, y, z]: Vec3) => {
    const xr = x * Math.cos(az) - y * Math.sin(az);
    const yr = x * Math.sin(az) + y * Math.cos(az);
    const depth = yr * Math.cos(el) + z * Math.sin(el);
    return { sx: c + xr * R, sy: c - (z * Math.cos(el) - yr * Math.sin(el)) * R, depth };
  };

  const ring = (f: (t: number) => Vec3) =>
    Array.from({ length: 65 }, (_, k) => proj(f((k / 64) * 2 * Math.PI))).map((p, k) => `${k ? "L" : "M"}${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");

  const tip = proj(v);
  const len = Math.hypot(...v);
  const axes: [Vec3, string][] = [[[1.25, 0, 0], "x"], [[0, 1.25, 0], "y"], [[0, 0, 1.2], "|0⟩"], [[0, 0, -1.2], "|1⟩"]];

  return (
    <figure className="flex flex-col items-center gap-1">
      <svg
        width={size}
        height={size}
        className="cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => { drag.current = e.clientX; (e.target as Element).setPointerCapture?.(e.pointerId); }}
        onPointerMove={(e) => { if (drag.current !== null) { setAz((a) => a + (e.clientX - drag.current!) * 0.012); drag.current = e.clientX; } }}
        onPointerUp={() => (drag.current = null)}
        role="img"
        aria-label={`${label} Bloch vector x ${v[0].toFixed(2)}, y ${v[1].toFixed(2)}, z ${v[2].toFixed(2)}`}
      >
        <circle cx={c} cy={c} r={R} fill="url(#bg)" stroke="#ffffff30" />
        <defs>
          <radialGradient id="bg" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#3a43a0" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#0b1033" stopOpacity={0.4} />
          </radialGradient>
        </defs>
        <path d={ring((t) => [Math.cos(t), Math.sin(t), 0])} fill="none" stroke="#ffffff30" />
        <path d={ring((t) => [Math.cos(t), 0, Math.sin(t)])} fill="none" stroke="#ffffff18" />
        {axes.map(([a, name]) => {
          const p = proj(a);
          const o = proj([0, 0, 0]);
          return (
            <g key={name}>
              <line x1={o.sx} y1={o.sy} x2={p.sx} y2={p.sy} stroke="#ffffff25" strokeDasharray="2 3" />
              <text x={p.sx} y={p.sy} textAnchor="middle" dominantBaseline="middle" className="fill-muted text-[10px]">{name}</text>
            </g>
          );
        })}
        <line x1={c} y1={c} x2={tip.sx} y2={tip.sy} stroke="var(--on)" strokeWidth={3} strokeLinecap="round" />
        <circle cx={tip.sx} cy={tip.sy} r={5} fill="var(--on)" opacity={tip.depth < 0 ? 0.55 : 1} />
      </svg>
      <figcaption className="text-center text-xs">
        <b className="font-mono">{label}</b>
        <span className="block font-mono text-muted">({v.map((n) => n.toFixed(2)).join(", ")})</span>
        <span className={`block ${len < 0.98 ? "text-on" : "text-muted"}`}>
          |r| = {len.toFixed(2)}
          {purity !== undefined && ` · purity ${purity.toFixed(3)}`}
        </span>
      </figcaption>
    </figure>
  );
}
