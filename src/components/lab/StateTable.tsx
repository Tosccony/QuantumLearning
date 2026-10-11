"use client";

/** Statevector amplitudes on paper: magnitude bar plus phase shown as a dial. */
export default function StateTable({ sv, qubits }: { sv: [number, number][]; qubits: number }) {
  const rows = sv
    .map(([re, im], i) => ({ i, re, im, mag: Math.hypot(re, im), phase: Math.atan2(im, re) }))
    .filter((r) => r.mag > 1e-6);
  const maxP = Math.max(...rows.map((r) => r.mag ** 2), 0.01);
  return (
    <div className="max-h-96 overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-paper text-left">
          <tr className="label-sm text-[#46587a]">
            <th className="border-b border-navy-ink p-2 font-semibold">basis</th>
            <th className="border-b border-navy-ink p-2 font-semibold">amplitude</th>
            <th className="border-b border-navy-ink p-2 font-semibold">|amp|²</th>
            <th className="border-b border-navy-ink p-2 font-semibold">phase</th>
          </tr>
        </thead>
        <tbody className="code">
          {rows.map((r) => {
            const deg = ((r.phase * 180) / Math.PI + 360) % 360;
            const p = r.mag ** 2;
            return (
              <tr key={r.i} className="border-t border-paper-3">
                <td className={`p-2 ${p === maxP ? "font-bold" : ""}`}>|{r.i.toString(2).padStart(qubits, "0")}⟩</td>
                <td className="whitespace-nowrap p-2">
                  {r.re.toFixed(3)} {r.im < 0 ? "−" : "+"} {Math.abs(r.im).toFixed(3)}i
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-24 border border-paper-3 bg-paper-2">
                      <div className="h-full bg-navy-ink" style={{ width: `${p * 100}%` }} />
                    </div>
                    {p.toFixed(3)}
                  </div>
                </td>
                <td className="p-2">
                  <span className="inline-flex items-center gap-2">
                    <svg width="20" height="20" viewBox="-10 -10 20 20" aria-hidden>
                      <circle r="9" fill="none" stroke="#9aa9c4" />
                      <line x1="0" y1="0" x2={8 * Math.cos(r.phase)} y2={-8 * Math.sin(r.phase)} stroke="#0b1a33" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                    {Math.round(deg)}°
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-[#46587a]">Exact statevector before measurement, from <code className="code">qiskit.quantum_info.Statevector</code>. Zero amplitudes are hidden.</p>
    </div>
  );
}
