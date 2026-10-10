"use client";

/** Measured counts as bars, with Qiskit's exact probability as a tick on each bar. */
export default function Histogram({
  counts,
  shots,
  probabilities,
  max = 32,
}: {
  counts: Record<string, number>;
  shots: number;
  probabilities?: Record<string, number>;
  max?: number;
}) {
  const keys = Array.from(new Set([...Object.keys(counts), ...Object.keys(probabilities ?? {})]));
  // Many outcomes: keep the most frequent so the chart stays readable.
  const shown = (keys.length > max ? keys.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0)).slice(0, max) : keys).sort();
  const top = Math.max(...shown.map((k) => Math.max((counts[k] ?? 0) / shots, probabilities?.[k] ?? 0)), 0.01);
  const scale = top > 0.5 ? 1 : top > 0.25 ? 0.5 : 0.25;

  return (
    <figure className="flex flex-col gap-2">
      <div className="flex h-56 items-end gap-1 border-b border-l border-white/20 pl-1" role="img" aria-label={`Histogram: ${shown.map((k) => `${k} ${(((counts[k] ?? 0) / shots) * 100).toFixed(1)}%`).join(", ")}`}>
        {shown.map((k) => {
          const f = (counts[k] ?? 0) / shots;
          const p = probabilities?.[k];
          return (
            <div key={k} className="group relative flex h-full min-w-5 flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-[11px] tabular-nums text-muted">{(f * 100).toFixed(f < 0.1 ? 1 : 0)}%</span>
              <div className="relative w-full max-w-14 rounded-t-md bg-accent transition-all duration-500" style={{ height: `${(f / scale) * 85}%`, minHeight: f > 0 ? 2 : 0 }} />
              {p !== undefined && (
                <div className="absolute inset-x-0 mx-auto h-0.5 max-w-14 bg-on" style={{ bottom: `${(p / scale) * 85}%` }} title={`exact ${(p * 100).toFixed(2)}%`} />
              )}
              <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded bg-black/80 px-2 py-1 text-xs group-hover:block">
                {counts[k] ?? 0} shots{p !== undefined ? ` · exact ${(p * 100).toFixed(2)}%` : ""}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 pl-1">
        {shown.map((k) => (
          <span key={k} className="min-w-5 flex-1 text-center font-mono text-[11px] text-muted [writing-mode:vertical-rl] sm:[writing-mode:horizontal-tb]">{k}</span>
        ))}
      </div>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted">
        <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-accent align-middle" />measured ({shots.toLocaleString()} shots)</span>
        {probabilities && <span><span className="mr-1 inline-block h-0.5 w-3 bg-on align-middle" />exact probability (statevector)</span>}
        <span>Bitstrings read q{"ₙ₋₁"}…q₀ (Qiskit order)</span>
        {keys.length > max && <span>Showing top {max} of {keys.length} outcomes</span>}
      </figcaption>
    </figure>
  );
}
