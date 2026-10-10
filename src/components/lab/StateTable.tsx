"use client";

/** Statevector amplitudes: magnitude bar plus phase shown as a colour-wheel dial. */
export default function StateTable({ sv, qubits }: { sv: [number, number][]; qubits: number }) {
  const rows = sv
    .map(([re, im], i) => ({ i, re, im, mag: Math.hypot(re, im), phase: Math.atan2(im, re) }))
    .filter((r) => r.mag > 1e-6);
  return (
    <div className="max-h-80 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-panel text-left text-xs text-muted">
          <tr>
            <th className="p-2">basis</th>
            <th className="p-2">amplitude</th>
            <th className="p-2">|amp|²</th>
            <th className="p-2">phase</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((r) => {
            const deg = ((r.phase * 180) / Math.PI + 360) % 360;
            return (
              <tr key={r.i} className="border-t border-white/5">
                <td className="p-2">|{r.i.toString(2).padStart(qubits, "0")}⟩</td>
                <td className="p-2 whitespace-nowrap">
                  {r.re.toFixed(3)} {r.im < 0 ? "−" : "+"} {Math.abs(r.im).toFixed(3)}i
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-accent" style={{ width: `${r.mag ** 2 * 100}%` }} />
                    </div>
                    {(r.mag ** 2).toFixed(3)}
                  </div>
                </td>
                <td className="p-2">
                  <span className="inline-flex items-center gap-2">
                    <svg width="18" height="18" viewBox="-10 -10 20 20" aria-hidden>
                      <circle r="9" fill={`hsl(${deg} 80% 60%)`} opacity={0.35} />
                      <line x1="0" y1="0" x2={8 * Math.cos(r.phase)} y2={-8 * Math.sin(r.phase)} stroke={`hsl(${deg} 90% 70%)`} strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    {Math.round(deg)}°
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">Exact statevector before measurement, from <code>qiskit.quantum_info.Statevector</code>. Zero amplitudes are hidden.</p>
    </div>
  );
}
