"use client";

import { useRef, useState } from "react";
import type { Vec3 } from "@/lib/quantum";

/**
 * Orthographic Bloch sphere drawn on paper. Drag or use the arrow keys to turn it.
 * The vector is the qubit's reduced state from Qiskit: length 1 = pure, shorter = entangled or noisy.
 */
export default function BlochSphere({ v, label, purity, size = 170, tone = "paper" }: { v: Vec3; label: string; purity?: number; size?: number; tone?: "paper" | "navy" }) {
  const [az, setAz] = useState(-0.6);
  const drag = useRef<number | null>(null);
  const el = 0.35;
  const R = size * 0.38;
  const c = size / 2;
  const paper = tone === "paper";
  const ink = paper ? "#0b1a33" : "#f5f7fa";
  const faint = paper ? "rgba(11,26,51,0.22)" : "rgba(245,247,250,0.25)";
  const vec = paper ? "#0b1a33" : "#6fe6ff";
  const tipFill = paper ? "#6fe6ff" : "#f5f7fa";

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
        tabIndex={0}
        className="cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => { drag.current = e.clientX; e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={(e) => { if (drag.current !== null) { setAz((a) => a + (e.clientX - drag.current!) * 0.012); drag.current = e.clientX; } }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        onLostPointerCapture={() => (drag.current = null)}
        onBlur={() => (drag.current = null)}
        onKeyDown={(e) => { if (e.key === "ArrowLeft") { e.preventDefault(); setAz((a) => a - 0.2); } if (e.key === "ArrowRight") { e.preventDefault(); setAz((a) => a + 0.2); } }}
        role="img"
        aria-label={`${label} Bloch vector x ${v[0].toFixed(2)}, y ${v[1].toFixed(2)}, z ${v[2].toFixed(2)}. Left and right arrows rotate.`}
      >
        <circle cx={c} cy={c} r={R} fill={paper ? "#e4eaf3" : "rgba(245,247,250,0.04)"} stroke={faint} />
        <path d={ring((t) => [Math.cos(t), Math.sin(t), 0])} fill="none" stroke={faint} />
        <path d={ring((t) => [Math.cos(t), 0, Math.sin(t)])} fill="none" stroke={faint} strokeDasharray="2 3" />
        {axes.map(([a, name]) => {
          const p = proj(a);
          const o = proj([0, 0, 0]);
          return (
            <g key={name}>
              <line x1={o.sx} y1={o.sy} x2={p.sx} y2={p.sy} stroke={faint} strokeDasharray="2 3" />
              <text x={p.sx} y={p.sy} textAnchor="middle" dominantBaseline="middle" fill={ink} style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10 }}>{name}</text>
            </g>
          );
        })}
        <line x1={c} y1={c} x2={tip.sx} y2={tip.sy} stroke={vec} strokeWidth={3} strokeLinecap="round" />
        <circle cx={tip.sx} cy={tip.sy} r={5.5} fill={tipFill} stroke={vec} strokeWidth={2} opacity={tip.depth < 0 ? 0.6 : 1} />
      </svg>
      <figcaption className="text-center text-xs">
        <b className="code">{label}</b>
        <span className="code block opacity-80">({v.map((n) => n.toFixed(2)).join(", ")})</span>
        <span className={`code block ${len < 0.98 ? "font-bold" : "opacity-80"}`}>
          |r| = {len.toFixed(2)}
          {purity !== undefined && ` · purity ${purity.toFixed(3)}`}
        </span>
      </figcaption>
    </figure>
  );
}
