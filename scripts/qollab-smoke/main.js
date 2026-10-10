// Throwaway: proves Qollab's JS → Python bridge runs our engine on each backend.
import * as engine from 'quantum.engine';

const out = document.getElementById('out');
document.getElementById('backend').textContent = String(backend.name);
const g = (gate, targets, controls = [], params = []) => ({ gate, targets, controls, params });
const CIRCUITS = {
  bell: { qubits: 2, ops: [g('h', [0]), g('cx', [1], [0])] },
  ccx: { qubits: 3, ops: [g('initialize', [0], [], [1, 1]), g('x', [1]), g('ccx', [2], [0, 1])] },
  r3: {
    qubits: 5,
    ops: [
      g('ry', [0], [], [0.8]), g('cx', [1], [0]), g('cx', [2], [0]),
      g('x', [1]),
      g('cx', [3], [0]), g('cx', [3], [1]), g('cx', [4], [1]), g('cx', [4], [2]),
      g('ccx', [1], [3, 4]),
      g('x', [4]), g('ccx', [0], [3, 4]), g('x', [4]),
      g('x', [3]), g('ccx', [2], [3, 4]), g('x', [3]),
      g('cx', [2], [0]), g('cx', [1], [0]),
    ],
  },
};
for (const [id, c] of Object.entries(CIRCUITS)) {
  document.getElementById(id).onclick = async () => {
    out.textContent = `Running ${id} on ${backend.name}…`;
    const t0 = performance.now();
    try {
      const r = JSON.parse(await engine.run_json.callPromising(backend, JSON.stringify({ ...c, shots: 1024 })));
      out.textContent = JSON.stringify({ backend: r.backend, counts: r.counts, q0_bloch: r.bloch[0], ms: Math.round(performance.now() - t0) }, null, 1);
      console.log(id, 'OK', r.backend, JSON.stringify(r.counts));
    } catch (e) {
      out.textContent = `FAILED: ${e.message}`;
      console.log(id, 'FAILED', e.message);
    }
  };
}
out.textContent = 'Ready. Press a button.';
