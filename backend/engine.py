"""Quantum Quest's Qiskit core, shared by the FastAPI service (main.py) and the Qollab project.

Only numpy and qiskit, so the same file runs under Pyodide on qollab.xyz, where it ships as
quantum/engine.py. `run` samples on whichever Qiskit backend it is handed: AerSimulator in the web
app, or the simulator picked in Qollab's "Select QPU".
"""

from __future__ import annotations

import json
import time

import numpy as np
import qiskit
from qiskit import QuantumCircuit, qasm2, transpile
from qiskit.quantum_info import DensityMatrix, Statevector, partial_trace

MAX_QUBITS = 8
MAX_OPS = 200
MAX_SHOTS = 20000

# gate -> (controls, targets, params) arity
ARITY: dict[str, tuple[int, int, int]] = {
    "h": (0, 1, 0), "x": (0, 1, 0), "y": (0, 1, 0), "z": (0, 1, 0), "s": (0, 1, 0),
    "sdg": (0, 1, 0), "t": (0, 1, 0), "tdg": (0, 1, 0), "sx": (0, 1, 0),
    "rx": (0, 1, 1), "ry": (0, 1, 1), "rz": (0, 1, 1), "p": (0, 1, 1),
    "cx": (1, 1, 0), "cy": (1, 1, 0), "cz": (1, 1, 0), "ch": (1, 1, 0),
    "cp": (1, 1, 1), "crz": (1, 1, 1), "swap": (0, 2, 0), "ccx": (2, 1, 0), "cswap": (1, 2, 0),
}
SPECIAL = {"barrier", "initialize", "mcx", "mcz"}

# A basis every Qollab simulator accepts, for backends transpile() can't target directly.
GENERIC_BASIS = ["rz", "sx", "x", "cx", "measure"]

# IonQ backends take one job per Run, and Qollab creates a fresh backend object for each Run.
_ionq_used: set[int] = set()


def build(c: dict) -> QuantumCircuit:
    n, ops = c["qubits"], c.get("ops") or []
    if not 1 <= n <= MAX_QUBITS:
        raise ValueError(f"circuits need 1 to {MAX_QUBITS} qubits")
    if len(ops) > MAX_OPS:
        raise ValueError(f"circuits are limited to {MAX_OPS} operations")
    qc = QuantumCircuit(n)
    for i, op in enumerate(ops):
        gate = op["gate"]
        targets, controls, params = op.get("targets") or [], op.get("controls") or [], op.get("params") or []
        if gate not in ARITY and gate not in SPECIAL:
            raise ValueError(f"op {i}: unknown gate {gate!r}")
        qs = controls + targets
        if any(q < 0 or q >= n for q in qs) or len(set(qs)) != len(qs):
            raise ValueError(f"op {i} ({gate}): invalid or repeated qubit indices")
        if gate == "barrier":
            qc.barrier()
            continue
        if gate == "initialize":
            size = 2 ** len(targets)
            amps = np.array(params, dtype=float)
            if len(amps) != size or np.linalg.norm(amps) == 0:
                raise ValueError(f"op {i}: initialize needs {size} non-zero amplitudes")
            qc.initialize(amps / np.linalg.norm(amps), targets)
            continue
        if gate in ("mcx", "mcz"):
            if len(targets) != 1 or not controls or params:
                raise ValueError(f"op {i} ({gate}): expects 1+ controls and 1 target")
            t = targets[0]
            if gate == "mcz":
                qc.h(t)
            qc.mcx(controls, t)
            if gate == "mcz":
                qc.h(t)
            continue
        nc, nt, np_ = ARITY[gate]
        if (len(controls), len(targets), len(params)) != (nc, nt, np_):
            raise ValueError(f"op {i} ({gate}): expects {nc} control(s), {nt} target(s), {np_} param(s)")
        getattr(qc, gate)(*params, *controls, *targets)
    return qc


def bloch_vectors(state: Statevector, n: int) -> tuple[list[list[float]], list[float]]:
    """Per-qubit Bloch vector and purity from the reduced density matrix (purity < 1 => entangled)."""
    vecs, purities = [], []
    rho = DensityMatrix(state)
    for q in range(n):
        red = partial_trace(rho, [k for k in range(n) if k != q]) if n > 1 else rho
        m = red.data
        x = 2 * m[0, 1].real
        y = 2 * m[1, 0].imag
        z = (m[0, 0] - m[1, 1]).real
        vecs.append([round(float(v), 6) for v in (x, y, z)])
        purities.append(round(float(np.real(np.trace(m @ m))), 6))
    return vecs, purities


def unitary_part(qc: QuantumCircuit) -> QuantumCircuit:
    """`initialize` contains a reset, which Statevector can't evolve; from |0…0> it's a pure state prep."""
    return qc.decompose(gates_to_decompose=["initialize"]).decompose(gates_to_decompose=["state_preparation"]) if any(
        i.operation.name == "initialize" for i in qc.data
    ) else qc


def _unitary(qc: QuantumCircuit) -> QuantumCircuit:
    """The circuit minus resets and barriers. Every run starts from |0…0>, so initialize's reset is a no-op."""
    clean = QuantumCircuit(qc.num_qubits)
    for inst in unitary_part(qc).data:
        if inst.operation.name not in ("reset", "barrier"):
            clean.append(inst)
    return clean


def statevector_of(qc: QuantumCircuit) -> Statevector:
    return Statevector.from_instruction(_unitary(qc))


def _compile(measured: QuantumCircuit, backend) -> QuantumCircuit:
    """optimization_level=0: cancelling gate pairs would also cancel the noise each gate is meant to add."""
    try:
        return transpile(measured, backend, optimization_level=0)
    except Exception:  # ponytail: Qollab's backends may expose no Target; GENERIC_BASIS covers every lesson gate
        return transpile(measured, basis_gates=GENERIC_BASIS, optimization_level=0)


def run(backend, req: dict, label: str | None = None) -> dict:
    t0 = time.perf_counter()
    name = label or str(getattr(backend, "name", "unknown backend"))
    ionq = "ionq" in name.lower()
    if ionq and id(backend) in _ionq_used:
        raise ValueError("IonQ allows one job per Run. Press Stop, then Run again, or pick a local simulator.")
    shots = int(req.get("shots", 1024))
    if not 1 <= shots <= MAX_SHOTS:
        raise ValueError(f"shots must be between 1 and {MAX_SHOTS}")

    qc = build(req)
    n = qc.num_qubits
    state = statevector_of(qc)
    probs = state.probabilities_dict()
    bloch, purity = bloch_vectors(state, n)

    measured = _unitary(qc)
    measured.measure_all()
    opts: dict = {"shots": shots}
    if req.get("memory"):
        opts["memory"] = True
    if req.get("seed") is not None:
        opts["seed_simulator"] = req["seed"]
    result = backend.run(_compile(measured, backend), **opts).result()
    if ionq:
        _ionq_used.add(id(backend))
    counts = dict(sorted(result.get_counts().items()))

    device = transpile(qc, basis_gates=["rz", "sx", "x", "cx"], optimization_level=1, seed_transpiler=7)

    out = {
        "counts": counts,
        "shots": shots,
        "probabilities": {k: round(v, 6) for k, v in sorted(probs.items()) if v > 1e-9},
        "statevector": [[round(float(a.real), 6), round(float(a.imag), 6)] for a in state.data],
        "bloch": bloch,
        "purity": purity,
        "entangled": any(p < 0.999 for p in purity),
        "diagram": str(qc.draw("text", fold=-1)),
        "qasm": qasm2.dumps(unitary_part(qc)),
        "depth": qc.depth(),
        "gate_counts": dict(qc.count_ops()),
        "transpiled": {"depth": device.depth(), "gate_counts": dict(device.count_ops()), "basis": ["rz", "sx", "x", "cx"]},
        "backend": name,
        "qiskit_version": qiskit.__version__,
        "elapsed_ms": round((time.perf_counter() - t0) * 1000, 1),
    }
    if req.get("memory"):
        out["memory"] = result.get_memory()
    if req.get("trace"):
        # One entry per op the learner placed (not per decomposed instruction), so the UI slider lines up.
        out["trace"] = [bloch_vectors(statevector_of(build({"qubits": n, "ops": req["ops"][: k + 1]})), n)[0] for k in range(len(req["ops"]))]
    return out


def run_json(backend, req_json: str) -> str:
    """Qollab's JS calls this: JSON in, JSON out, so no Python-to-JS proxy conversion is needed."""
    return json.dumps(run(backend, json.loads(req_json)))
