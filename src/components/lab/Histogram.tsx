"use client";

import { useEffect, useState } from "react";

/**
 * Measured counts as bars on a graticule, with Qiskit's exact probability as a tick on each bar.
 * Label weight tracks magnitude: the most-measured outcome carries the heaviest label.
 * Paper tone (inside a window): navy bars, ice ticks. Navy tone: ice bars, white ticks.
 */
export default function Histogram({
  counts,
  shots,
  probabilities,
  max = 32,
  tone = "paper",
  height = 224,
  animate = true,
  showScale = true,
}: {
  counts: Record<string, number>;
  shots: number;
  probabilities?: Record<string, number>;
  max?: number;
  tone?: "paper" | "navy";
  height?: number;
  animate?: boolean;
  showScale?: boolean;
}) {
  const keys = Array.from(new Set([...Object.keys(counts), ...Object.keys(probabilities ?? {})]));
  const shown = (keys.length > max ? keys.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)).slice(0, max) : keys).sort();
  const top = Math.max(...shown.map((k) => Math.max((counts[k] ?? 0) / shots, probabilities?.[k] ?? 0)), 0.01);
  const scale = top > 0.5 ? 1 : top > 0.25 ? 0.5 : 0.25;
  const maxCount = Math.max(...shown.map((k) => counts[k] ?? 0), 1);
  const paper = tone === "paper";
  const bar = paper ? "bg-navy-ink" : "bg-ice";
  const tick = paper ? "bg-ice-deep outline outline-1 outline-navy-ink" : "bg-paper";
  const muted = paper ? "text-[#46587a]" : "text-fog";
  const grat = paper ? "graticule" : "graticule-navy";
  const border = paper ? "border-navy-ink" : "border-[var(--line-strong)]";

  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div className="overflow-x-auto pt-5">
      <div style={{ minWidth: shown.length * Math.max(28, (shown[0]?.length ?? 0) * 7 + 8) + 36 }}>
      <div className="flex gap-2">
        <div className={`flex flex-col justify-between py-0.5 text-right code text-[0.65rem] ${muted}`} aria-hidden style={{ height }}>
          <span>{Math.round(scale * 100)}%</span>
          <span>{Math.round(scale * 50)}%</span>
          <span>0</span>
        </div>
        <div
          className={`flex flex-1 items-end gap-1 border-b border-l ${border} ${grat} pl-1`}
          style={{ height }}
          role="img"
          aria-label={`Histogram: ${shown.map((k) => `${k} ${(((counts[k] ?? 0) / shots) * 100).toFixed(1)}%`).join(", ")}`}
        >
          {shown.map((k) => {
            const f = (counts[k] ?? 0) / shots;
            const p = probabilities?.[k];
            const hot = (counts[k] ?? 0) === maxCount;
            return (
              <div key={k} className="group relative flex h-full min-w-5 flex-1 flex-col items-center justify-end">
                <span className={`absolute mb-1 code text-[0.68rem] ${hot ? "font-bold" : ""} ${muted}`} style={{ bottom: `calc(${(Math.max(f, p ?? 0) / scale) * 100}% + 4px)` }}>{(f * 100).toFixed(f < 0.1 ? 1 : 0)}%</span>
                <div
                  className={`relative w-full max-w-14 ${bar} ${animate ? "rise" : ""}`}
                  style={{ height: `${(f / scale) * 100}%`, minHeight: f > 0 ? 2 : 0 }}
                />
                {f === 0 && <div className={`w-full max-w-14 border border-dashed ${paper ? "border-[#9aa9c4]" : "border-[var(--line)]"}`} style={{ height: 3 }} aria-hidden />}
                {p !== undefined && (
                  <div className={`absolute inset-x-0 mx-auto h-[3px] max-w-14 ${tick}`} style={{ bottom: `${(p / scale) * 100}%` }} title={`exact ${(p * 100).toFixed(2)}%`} />
                )}
                <div className={`pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap px-2 py-1 code text-xs group-hover:block ${paper ? "bg-navy-ink text-paper" : "bg-paper text-navy-ink"}`}>
                  {counts[k] ?? 0} shots{p !== undefined ? ` · exact ${(p * 100).toFixed(2)}%` : ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex gap-1 pl-[2.1rem]">
        {shown.map((k) => (
          <span key={k} className={`min-w-5 flex-1 text-center code text-[0.7rem] ${(counts[k] ?? 0) === maxCount ? "font-bold" : ""} ${muted} [writing-mode:vertical-rl] sm:[writing-mode:horizontal-tb]`}>{k}</span>
        ))}
      </div>
      </div>
      </div>
      <figcaption className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${muted}`}>
        <span className="flex items-center gap-1.5"><span className={`inline-block h-2.5 w-2.5 ${bar}`} aria-hidden />measured</span>
        {probabilities && <span className="flex items-center gap-1.5"><span className={`inline-block h-[3px] w-4 ${tick}`} aria-hidden />exact probability</span>}
        {showScale && <ScaleBar shots={shots} tone={tone} />}
        <span>bitstrings read q<sub>n−1</sub>…q<sub>0</sub></span>
        {keys.length > max && <span>top {max} of {keys.length}</span>}
      </figcaption>
    </figure>
  );
}

/** The scale bar is the shot count. */
export function ScaleBar({ shots, tone = "paper" }: { shots: number; tone?: "paper" | "navy" }) {
  const [displayed, setDisplayed] = useState(shots);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(shots);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / 520, 1);
      setDisplayed(Math.round(shots * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shots]);
  const c = tone === "paper" ? "border-navy-ink text-[#46587a]" : "border-paper text-fog";
  return (
    <span className={`inline-flex items-center gap-1.5 ${c}`} role="img" aria-label={`${shots.toLocaleString()} shots`}>
      <span className={`inline-block h-2 w-10 border-x border-b ${c}`} aria-hidden />
      <span className="code" aria-hidden>{displayed.toLocaleString()} shots</span>
    </span>
  );
}
