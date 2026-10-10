"""Quantum Quest Qiskit service.

Every experiment in the app is built here as a real `QuantumCircuit`, then:
  * sampled with Qiskit Aer (optionally with a depolarising + readout noise model),
  * analysed exactly with `qiskit.quantum_info` (statevector, per-qubit Bloch vectors, purity),
  * transpiled to a hardware-style basis so learners see what a device would run.

Community projects are stored in SQLite, and each one is re-executed here on publish so the
results shown in the gallery always come from a real run, never from client-side data.
"""

from __future__ import annotations

import json
import math
import sqlite3
import time
import uuid
from contextlib import asynccontextmanager, closing
from pathlib import Path
from typing import Literal

import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from qiskit import QuantumCircuit, qasm2, transpile
from qiskit.quantum_info import DensityMatrix, Statevector, partial_trace
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, ReadoutError, depolarizing_error

MAX_QUBITS = 8
MAX_OPS = 200
MAX_SHOTS = 20000
DB = Path(__file__).with_name("community.db")


app = FastAPI(title="Quantum Quest Qiskit service")

# ---------------------------------------------------------------- circuit model

GateName = Literal[
    "h", "x", "y", "z", "s", "sdg", "t", "tdg", "sx",
    "rx", "ry", "rz", "p",
    "cx", "cy", "cz", "ch", "cp", "crz", "swap", "ccx", "cswap", "mcx", "mcz",
    "initialize", "barrier",
]

# gate -> (controls, targets, params) arity
ARITY: dict[str, tuple[int, int, int]] = {
    "h": (0, 1, 0), "x": (0, 1, 0), "y": (0, 1, 0), "z": (0, 1, 0), "s": (0, 1, 0),
    "sdg": (0, 1, 0), "t": (0, 1, 0), "tdg": (0, 1, 0), "sx": (0, 1, 0),
    "rx": (0, 1, 1), "ry": (0, 1, 1), "rz": (0, 1, 1), "p": (0, 1, 1),
    "cx": (1, 1, 0), "cy": (1, 1, 0), "cz": (1, 1, 0), "ch": (1, 1, 0),
    "cp": (1, 1, 1), "crz": (1, 1, 1), "swap": (0, 2, 0), "ccx": (2, 1, 0), "cswap": (1, 2, 0),
}


class Op(BaseModel):
    gate: GateName
    targets: list[int] = Field(default_factory=list)
    controls: list[int] = Field(default_factory=list)
    params: list[float] = Field(default_factory=list)


class Noise(BaseModel):
    p1: float = Field(0.0, ge=0, le=0.3)  # 1-qubit depolarising probability
    p2: float = Field(0.0, ge=0, le=0.3)  # 2-qubit depolarising probability
    readout: float = Field(0.0, ge=0, le=0.3)  # bit-flip probability on measurement


class Circuit(BaseModel):
    qubits: int = Field(ge=1, le=MAX_QUBITS)
    ops: list[Op] = Field(default_factory=list, max_length=MAX_OPS)


class RunRequest(Circuit):
    shots: int = Field(1024, ge=1, le=MAX_SHOTS)
    noise: Noise | None = None
    memory: bool = False  # return each shot's bitstring (used by the Explorer games)
    trace: bool = False  # return Bloch vectors after every op (step-through "Understand" view)
    seed: int | None = None


def build(c: Circuit) -> QuantumCircuit:
    qc = QuantumCircuit(c.qubits)
    for i, op in enumerate(c.ops):
        qs = op.controls + op.targets
        if any(q < 0 or q >= c.qubits for q in qs) or len(set(qs)) != len(qs):
            raise HTTPException(400, f"op {i} ({op.gate}): invalid or repeated qubit indices")
        if op.gate == "barrier":
            qc.barrier()
            continue
        if op.gate == "initialize":
            n = 2 ** len(op.targets)
            amps = np.array(op.params, dtype=float)
            if len(amps) != n or np.linalg.norm(amps) == 0:
                raise HTTPException(400, f"op {i}: initialize needs {n} non-zero amplitudes")
            qc.initialize(amps / np.linalg.norm(amps), op.targets)
            continue
        if op.gate in ("mcx", "mcz"):
            if len(op.targets) != 1 or not op.controls or op.params:
                raise HTTPException(400, f"op {i} ({op.gate}): expects 1+ controls and 1 target")
            t = op.targets[0]
            if op.gate == "mcz":
                qc.h(t)
            qc.mcx(op.controls, t)
            if op.gate == "mcz":
                qc.h(t)
            continue
        nc, nt, np_ = ARITY[op.gate]
        if (len(op.controls), len(op.targets), len(op.params)) != (nc, nt, np_):
            raise HTTPException(400, f"op {i} ({op.gate}): expects {nc} control(s), {nt} target(s), {np_} param(s)")
        getattr(qc, op.gate)(*op.params, *op.controls, *op.targets)
    return qc


def noise_model(n: Noise) -> NoiseModel:
    m = NoiseModel()
    if n.p1:
        m.add_all_qubit_quantum_error(depolarizing_error(n.p1, 1), ["h", "x", "y", "z", "s", "sdg", "t", "tdg", "sx", "rx", "ry", "rz", "p", "u"])
    if n.p2:
        m.add_all_qubit_quantum_error(depolarizing_error(n.p2, 2), ["cx", "cy", "cz", "ch", "cp", "crz", "swap"])
    if n.readout:
        r = n.readout
        m.add_all_qubit_readout_error(ReadoutError([[1 - r, r], [r, 1 - r]]))
    return m


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


def statevector_of(qc: QuantumCircuit) -> Statevector:
    clean = QuantumCircuit(qc.num_qubits)
    for inst in unitary_part(qc).data:
        if inst.operation.name not in ("reset", "barrier"):
            clean.append(inst)
    return Statevector.from_instruction(clean)


def execute(req: RunRequest) -> dict:
    t0 = time.perf_counter()
    qc = build(req)
    n = req.qubits

    state = statevector_of(qc)
    probs = state.probabilities_dict()
    bloch, purity = bloch_vectors(state, n)

    measured = qc.copy()
    measured.measure_all()
    sim = AerSimulator(noise_model=noise_model(req.noise)) if req.noise else AerSimulator()
    # No optimisation: cancelling gate pairs would also cancel the noise each gate is meant to add.
    tqc = transpile(measured, sim, optimization_level=0)
    result = sim.run(tqc, shots=req.shots, memory=req.memory, seed_simulator=req.seed).result()
    counts = dict(sorted(result.get_counts().items()))

    device = transpile(qc, basis_gates=["rz", "sx", "x", "cx"], optimization_level=1, seed_transpiler=7)

    out = {
        "counts": counts,
        "shots": req.shots,
        "probabilities": {k: round(v, 6) for k, v in sorted(probs.items()) if v > 1e-9},
        "statevector": [[round(float(a.real), 6), round(float(a.imag), 6)] for a in state.data],
        "bloch": bloch,
        "purity": purity,
        "entangled": any(p < 0.999 for p in purity),
        "diagram": str(qc.draw("text", fold=-1)),
        "qasm": qasm2.dumps(unitary_part(qc)) if n else "",
        "depth": qc.depth(),
        "gate_counts": dict(qc.count_ops()),
        "transpiled": {"depth": device.depth(), "gate_counts": dict(device.count_ops()), "basis": ["rz", "sx", "x", "cx"]},
        "backend": "aer_simulator" + (" (noisy)" if req.noise else ""),
        "qiskit_version": __import__("qiskit").__version__,
        "elapsed_ms": round((time.perf_counter() - t0) * 1000, 1),
    }
    if req.memory:
        out["memory"] = result.get_memory()
    if req.trace:
        # One entry per op the learner placed (not per decomposed instruction), so the UI slider lines up.
        out["trace"] = [bloch_vectors(statevector_of(build(Circuit(qubits=n, ops=req.ops[: k + 1]))), n)[0] for k in range(len(req.ops))]
    return out


@app.get("/health")
def health():
    return {"ok": True, "qiskit": __import__("qiskit").__version__, "aer": __import__("qiskit_aer").__version__}


@app.post("/run")
def run(req: RunRequest):
    return execute(req)


# ---------------------------------------------------------------- community projects


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


class ProjectIn(BaseModel):
    title: str = Field(min_length=3, max_length=80)
    description: str = Field("", max_length=2000)
    author: str = Field(min_length=1, max_length=40)
    tags: list[str] = Field(default_factory=list, max_length=6)
    circuit: Circuit
    shots: int = Field(1024, ge=1, le=MAX_SHOTS)
    forked_from: str | None = None


def row_to_project(r: sqlite3.Row, full: bool = False) -> dict:
    p = {k: r[k] for k in ("id", "title", "description", "author", "stars", "forks", "forked_from", "created_at")}
    p["tags"] = json.loads(r["tags"])
    p["circuit"] = json.loads(r["circuit"])
    results = json.loads(r["results"])
    p["counts"] = results["counts"]
    p["shots"] = results["shots"]
    if full:
        p["results"] = results
    return p


def publish(p: ProjectIn, con: sqlite3.Connection) -> str:
    results = execute(RunRequest(**p.circuit.model_dump(), shots=p.shots, seed=42))
    pid = uuid.uuid4().hex[:10]
    con.execute(
        "INSERT INTO projects VALUES (?,?,?,?,?,?,?,0,0,?,?)",
        (pid, p.title.strip(), p.description.strip(), p.author.strip(), json.dumps([t.strip().lower()[:20] for t in p.tags]),
         p.circuit.model_dump_json(), json.dumps(results), p.forked_from, time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
    )
    if p.forked_from:
        con.execute("UPDATE projects SET forks = forks + 1 WHERE id = ?", (p.forked_from,))
    return pid


def op(gate, targets, controls=(), params=()):
    return {"gate": gate, "targets": list(targets), "controls": list(controls), "params": list(params)}


SEEDS = [
    ("Bell state: the entanglement hello-world", "H then CNOT. Measure both qubits and you only ever see 00 or 11.", ["entanglement", "beginner"],
     {"qubits": 2, "ops": [op("h", [0]), op("cx", [1], [0])]}),
    ("3-qubit GHZ state", "A Bell pair stretched across three qubits: all-zero or all-one, never anything in between.", ["entanglement", "ghz"],
     {"qubits": 3, "ops": [op("h", [0]), op("cx", [1], [0]), op("cx", [2], [1])]}),
    ("Grover search for |11>", "One Grover iteration on 2 qubits finds the marked item with certainty.", ["algorithm", "grover"],
     {"qubits": 2, "ops": [op("h", [0]), op("h", [1]), op("cz", [1], [0]), op("h", [0]), op("h", [1]), op("x", [0]), op("x", [1]),
                           op("cz", [1], [0]), op("x", [0]), op("x", [1]), op("h", [0]), op("h", [1])]}),
    ("Deutsch–Jozsa: balanced oracle", "Decides constant vs balanced in a single query. All-zero on the inputs means constant; anything else means balanced.", ["algorithm", "oracle"],
     {"qubits": 3, "ops": [op("x", [2]), op("h", [0]), op("h", [1]), op("h", [2]), op("cx", [2], [0]), op("cx", [2], [1]), op("h", [0]), op("h", [1])]}),
    ("Teleportation (deferred measurement)", "Teleports Ry(1.1)|0> from q0 to q2. Classical corrections are replaced by controlled gates, so q2's Bloch vector matches the original.", ["protocol", "teleportation"],
     {"qubits": 3, "ops": [op("ry", [0], params=[1.1]), op("h", [1]), op("cx", [2], [1]), op("cx", [1], [0]), op("h", [0]),
                           op("cx", [2], [1]), op("cz", [2], [0])]}),
    ("2-qubit QFT of |01>", "Quantum Fourier transform spreads a basis state into equal magnitudes with rotating phases. Check the statevector.", ["algorithm", "qft"],
     {"qubits": 2, "ops": [op("x", [0]), op("h", [1]), op("cp", [1], [0], [math.pi / 2]), op("h", [0]), op("swap", [0, 1])]}),
]


def init_db():
    with closing(db()) as con, con:
        con.execute(
            """CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY, title TEXT, description TEXT, author TEXT, tags TEXT,
                circuit TEXT, results TEXT, stars INTEGER, forks INTEGER, forked_from TEXT, created_at TEXT)"""
        )
        if con.execute("SELECT COUNT(*) FROM projects").fetchone()[0] == 0:
            for title, desc, tags, circ in SEEDS:
                publish(ProjectIn(title=title, description=desc, author="Quantum Quest Team", tags=tags, circuit=Circuit(**circ)), con)


@asynccontextmanager
async def lifespan(_app):
    init_db()
    yield


app.router.lifespan_context = lifespan


@app.get("/projects")
def list_projects(sort: Literal["stars", "new"] = "stars", q: str = "", limit: int = 50):
    order = "stars DESC, created_at DESC" if sort == "stars" else "created_at DESC"
    with closing(db()) as con:
        rows = con.execute(
            f"SELECT * FROM projects WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? ORDER BY {order} LIMIT ?",
            (f"%{q}%", f"%{q}%", f"%{q.lower()}%", min(limit, 200)),
        ).fetchall()
    return [row_to_project(r) for r in rows]


@app.get("/projects/{pid}")
def get_project(pid: str):
    with closing(db()) as con:
        r = con.execute("SELECT * FROM projects WHERE id = ?", (pid,)).fetchone()
    if not r:
        raise HTTPException(404, "project not found")
    return row_to_project(r, full=True)


@app.post("/projects")
def create_project(p: ProjectIn):
    with closing(db()) as con, con:
        pid = publish(p, con)
    return {"id": pid}


@app.post("/projects/{pid}/star")
def star(pid: str, delta: int = 1):
    with closing(db()) as con, con:
        cur = con.execute("UPDATE projects SET stars = MAX(0, stars + ?) WHERE id = ?", (1 if delta > 0 else -1, pid))
    if cur.rowcount == 0:
        raise HTTPException(404, "project not found")
    return {"ok": True}
