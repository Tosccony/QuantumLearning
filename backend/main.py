"""Quantum Quest Qiskit service.

The circuit work lives in engine.py, which the Qollab project shares. This service adds request
validation, an optional Qiskit Aer noise model (depolarising + readout) and the community store.

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

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, ReadoutError, depolarizing_error

import engine
from engine import MAX_OPS, MAX_QUBITS, MAX_SHOTS

DB = Path(__file__).with_name("community.db")


app = FastAPI(title="Quantum Quest Qiskit service")

# ---------------------------------------------------------------- circuit model

GateName = Literal[
    "h", "x", "y", "z", "s", "sdg", "t", "tdg", "sx",
    "rx", "ry", "rz", "p",
    "cx", "cy", "cz", "ch", "cp", "crz", "swap", "ccx", "cswap", "mcx", "mcz",
    "initialize", "barrier",
]


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


def execute(req: RunRequest) -> dict:
    sim = AerSimulator(noise_model=noise_model(req.noise)) if req.noise else AerSimulator()
    try:
        return engine.run(sim, req.model_dump(), label="aer_simulator" + (" (noisy)" if req.noise else ""))
    except ValueError as e:
        raise HTTPException(400, str(e)) from e


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
