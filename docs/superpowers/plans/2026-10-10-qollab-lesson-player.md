# Qollab Lesson Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run Quantum Quest's 18 lessons on qollab.xyz with Qollab's free simulators, which is the hackathon's eligibility requirement. Then add Predict → Run → Explain and Ideal vs this machine.

**Architecture:** The Qiskit core moves out of `backend/main.py` into `backend/engine.py`, which uses only qiskit and numpy and samples on any Qiskit backend it's given. The FastAPI service passes AerSimulator. The Qollab project ships the same file as `quantum/engine.py` and passes Qollab's `backend`. On the frontend, `runCircuit` gets a swappable transport. A new `src/qollab/` entry point reuses the existing lesson data and lab components, and esbuild plus the Tailwind CLI bundle it into Qollab's `index.html`, `main.js` and `main.css`.

**Tech Stack:** Python 3 (qiskit 2.5.2, qiskit-aer 0.17.2 for the web service only), FastAPI, TypeScript, React 19, Next.js 15, Tailwind 4, esbuild 0.28.2, and Qollab (Pyodide in the browser).

**Spec:** `docs/superpowers/specs/2026-10-10-qollab-lesson-player-design.md`

**Deliberate departures from the spec:**
- **Order.** The engine extraction (Task 1) comes before the Qollab bridge test (Task 2), so that the test exercises the real engine. Every fallback path needs the engine anyway, so no work is wasted.
- **Sampled circuit.** The engine samples the circuit with `initialize` decomposed and resets and barriers removed (`_unitary`), on every backend. This is what makes it portable to Qollab, and it's equivalent because every run starts from |0…0⟩. In the web app, one side effect is that a noisy run now applies noise to the gates `initialize` decomposes into, which is more realistic.
- **Progress.** The Qollab player tracks no progress (no XP or checkmarks), because nothing persists between Runs on Qollab. Progress stays a web-app feature.
- **Amendment (user request, Oct 10).** Added Task 8 (the BB84 and Bell test lessons), Task 9 (Shor's algorithm) and Task 10 (the project-page story). The old wrap-up is now Task 11. Execution order is 1–4, 6, 7, 8, 9, 10, then 5 (publish once, with everything), then 11.

## Global Constraints

- **Deadline:** submissions close **Oct 11, 19:00 ET**, and the internal target is 15:00 ET. Tasks 1–5 (eligibility) come before the stretch Tasks 6–7. If time runs out, cut from Task 7 upward and never touch Tasks 1–5.
- **Branch:** all work goes on `qollab-lesson-player`. Never push to `main`. Push only when the user says so.
- **Qollab project shape:** top-level `index.html` and `main.js`, plus `main.css`. At most **100 files**, each **≤ 2 MB**. No POST requests and no browser storage. Nothing persists between Runs. **IonQ backends accept one job per Run.**
- **`backend/engine.py` imports only the standard library, `numpy` and `qiskit`.** No `qiskit_aer`, `fastapi` or `pydantic`, because it must run under Pyodide.
- **The web API's `/run` response keys stay unchanged:** `counts, shots, probabilities, statevector, bloch, purity, entangled, diagram, qasm, depth, gate_counts, transpiled, backend, qiskit_version, elapsed_ms`, plus optional `memory` and `trace`.
- **Limits stay** at `MAX_QUBITS = 8`, `MAX_OPS = 200` and `MAX_SHOTS = 20000`. They're defined once, in `engine.py`.
- **The attribution text, exactly:** `This effort is supported by Qollab & IonQ`. It appears in the Qollab player and on the project page.
- **New dev dependencies, exactly:** `esbuild@0.28.2` and `@tailwindcss/cli@4.3.3`. No other new dependencies.
- **Accessibility:** every interactive element is a `<button>`, link or input with visible text or an `aria-label`. Use `role="alert"` for errors and `role="status"` for feedback.
- **License and secrets:** MIT. Commit no secrets.

## Review Focus

1. **A second IonQ job in the same Run** should show "IonQ allows one job per Run…", not hang or show a traceback. Pinned by the Task 1 `FakeIonQ` test and the Task 3 `pythonErrorMessage` check.
2. **A learner edits a lesson circuit into an empty or invalid one on Qollab** (deletes every gate, or uses the same qubit twice). An empty circuit should run, and an invalid one should give a one-line message. Pinned by the Task 1 empty-circuit and repeated-qubit tests and the Task 3 transport rejection check.
3. **Qollab's `backend` can't be targeted by `transpile()`, or rejects `initialize` or `ccx`.** The engine should fall back to a basis every simulator accepts. Pinned by the Task 1 `NoTarget` test.
4. **A 5-qubit uniform result on the ideal simulator at 1024 shots** should not be labelled "noise visible", because shot noise alone gives a TVD of about 0.07. Pinned by the Task 7 `shotNoiseTvd` check.
5. **The upload is built while the README still has `TODO(team)` lines.** The release build should refuse, because the README becomes the public project page. Pinned by the Task 4 release-guard step.

---

### Task 1: Extract the shared Qiskit engine

**Files:**
- Create: `backend/engine.py`
- Create: `backend/test_engine.py`
- Modify: `backend/main.py`: everything above the line `# ---------------------------------------------------------------- community projects` (currently lines 1–212)
- Modify: `package.json`: add the `check:py` script

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `engine.MAX_QUBITS`, `engine.MAX_OPS`, `engine.MAX_SHOTS` (ints)
  - `engine.GENERIC_BASIS: list[str]`
  - `engine.build(c: dict) -> QuantumCircuit` (raises `ValueError`)
  - `engine.run(backend, req: dict, label: str | None = None) -> dict` (raises `ValueError`)
  - `engine.run_json(backend, req_json: str) -> str`

  `req` has these keys: `qubits`, `ops` (a list of `{gate, targets, controls?, params?}`), and the optional `shots` (default 1024), `memory`, `trace` and `seed`.

- [ ] **Step 1: Write the failing test**

Create `backend/test_engine.py`:

```python
"""Self-checks for engine.py. Run: backend/.venv/bin/python backend/test_engine.py"""

import json

from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, depolarizing_error

import engine


def g(gate, targets, controls=(), params=()):
    return {"gate": gate, "targets": list(targets), "controls": list(controls), "params": list(params)}


BELL = {"qubits": 2, "ops": [g("h", [0]), g("cx", [1], [0])], "shots": 2000, "seed": 1}


class FakeIonQ:
    """Stands in for Qollab's IonQ simulator: Aer's results under an IonQ name, and no Target."""

    name = "ionq_simulator"

    def run(self, circuit, **opts):
        return AerSimulator().run(circuit, **opts)


class NoTarget:
    """A backend transpile() can't target, so the engine must lower to GENERIC_BASIS itself."""

    name = "no_target"

    def run(self, circuit, **opts):
        assert set(circuit.count_ops()) <= set(engine.GENERIC_BASIS), circuit.count_ops()
        return AerSimulator().run(circuit, **opts)


def expect_error(fn, text):
    try:
        fn()
    except ValueError as e:
        assert text in str(e), f"{text!r} not in {e!r}"
        return
    raise AssertionError(f"expected a ValueError containing {text!r}")


def main():
    r = engine.run(AerSimulator(), BELL)
    assert set(r["counts"]) <= {"00", "11"}, r["counts"]
    assert r["purity"] == [0.5, 0.5] and r["entangled"]
    assert r["backend"] == "aer_simulator"

    # Gate pairs must not be optimised away, or the noise they carry disappears with them.
    m = NoiseModel()
    m.add_all_qubit_quantum_error(depolarizing_error(0.3, 2), ["cx"])
    r = engine.run(AerSimulator(noise_model=m), {"qubits": 2, "ops": [g("cx", [1], [0])] * 10, "seed": 3})
    assert set(r["counts"]) != {"00"}, "noise was optimised away"

    expect_error(lambda: engine.run(AerSimulator(), {"qubits": 2, "ops": [g("cx", [0], [0])]}), "repeated qubit")
    expect_error(lambda: engine.run(AerSimulator(), {"qubits": 2, "ops": [g("measure_all", [0])]}), "unknown gate")
    expect_error(lambda: engine.run(AerSimulator(), {"qubits": 9, "ops": []}), "1 to 8 qubits")

    r = engine.run(AerSimulator(), {"qubits": 3, "ops": [], "shots": 100})
    assert r["counts"] == {"000": 100}, r["counts"]

    r = engine.run(AerSimulator(), {**BELL, "trace": True, "memory": True, "shots": 50})
    assert len(r["trace"]) == 2 and len(r["memory"]) == 50

    r = engine.run(AerSimulator(), {"qubits": 1, "ops": [g("initialize", [0], params=[1, 1])], "shots": 4000, "seed": 1})
    assert set(r["counts"]) == {"0", "1"}, r["counts"]

    out = json.loads(engine.run_json(AerSimulator(), json.dumps(BELL)))
    assert set(out["counts"]) <= {"00", "11"}

    ionq = FakeIonQ()
    assert engine.run(ionq, BELL)["backend"] == "ionq_simulator"
    expect_error(lambda: engine.run(ionq, BELL), "one job per Run")
    engine.run(FakeIonQ(), BELL)  # the next Run gets a fresh backend object

    engine.run(NoTarget(), {"qubits": 3, "ops": [g("initialize", [0], params=[1, 1]), g("x", [1]), g("ccx", [2], [0, 1])]})

    print("engine: all checks passed")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `backend/.venv/bin/python backend/test_engine.py`
Expected: FAIL with `ModuleNotFoundError: No module named 'engine'`

- [ ] **Step 3: Write the engine**

Create `backend/engine.py`:

```python
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
GENERIC_BASIS = ["rz", "sx", "x", "cx", "measure", "barrier"]

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `backend/.venv/bin/python backend/test_engine.py`
Expected: `engine: all checks passed`

- [ ] **Step 5: Point `main.py` at the engine**

In `backend/main.py`, replace everything above the line `# ---------------------------------------------------------------- community projects` with:

```python
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


```

- [ ] **Step 6: Check the web API is unchanged**

Run:
```bash
cd backend && (.venv/bin/uvicorn main:app --port 8001 > /dev/null 2>&1 &) && sleep 4 && cd ..
curl -s -X POST localhost:8001/run -H 'content-type: application/json' -d '{"qubits":2,"ops":[{"gate":"h","targets":[0]},{"gate":"cx","targets":[1],"controls":[0]}],"seed":1}' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(sorted(d), d["counts"], d["backend"])'
curl -s -X POST localhost:8001/run -H 'content-type: application/json' -d '{"qubits":2,"ops":[{"gate":"cx","targets":[0],"controls":[0]}]}' -w ' %{http_code}\n'
curl -s -X POST localhost:8001/run -H 'content-type: application/json' -d '{"qubits":2,"noise":{"p2":0.3},"ops":[{"gate":"cx","targets":[1],"controls":[0]},{"gate":"cx","targets":[1],"controls":[0]}],"seed":1}' | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["counts"], d["backend"])'
curl -s localhost:8001/projects | python3 -c 'import json,sys; print(len(json.load(sys.stdin)), "projects")'
pkill -f 'uvicorn main:app --port 8001'; rm -f backend/community.db
```
Expected:
- Line 1: the 15 keys listed in Global Constraints, `{'00': …, '11': …}`, then `aer_simulator`
- Line 2: `{"detail":"op 0 (cx): invalid or repeated qubit indices"} 400`
- Line 3: counts that include `01` or `10`, then `aer_simulator (noisy)`
- Line 4: `6 projects`

- [ ] **Step 7: Add the npm script**

In `package.json` `"scripts"`, add `"check:py": "backend/.venv/bin/python backend/test_engine.py",`. Run `npm run check:py` and expect `engine: all checks passed`.

- [ ] **Step 8: Commit**

```bash
git add backend/engine.py backend/test_engine.py backend/main.py package.json
git commit -m "Extract shared Qiskit engine from the FastAPI service"
```

---

### Task 2: Qollab bridge test (throwaway; needs the user's Qollab account)

**Files:**
- Create: `scripts/qollab-smoke/index.html`
- Create: `scripts/qollab-smoke/main.js`
- Create: `scripts/qollab-smoke/build.sh`
- Modify: `.gitignore`: add `/dist/`
- Modify: `package.json`: add the `qollab:smoke` script

**Interfaces:**
- Consumes: `engine.run_json(backend, req_json) -> str` from Task 1.
- Produces: a go/no-go decision for Tasks 3–5, and the backend names Qollab reports. Write both down in the PR description.

- [ ] **Step 1: Write the test page**

`scripts/qollab-smoke/index.html`:
```html
<main style="font-family: system-ui, sans-serif; padding: 1rem">
  <h1>Quantum Quest · Qollab bridge test</h1>
  <p>Backend: <b id="backend">?</b></p>
  <p>
    <button id="bell">Bell</button>
    <button id="ccx">initialize + Toffoli</button>
    <button id="r3">Bit-flip code (r3)</button>
  </p>
  <pre id="out">Loading Python…</pre>
</main>
```

`scripts/qollab-smoke/main.js`:
```js
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
```

`scripts/qollab-smoke/build.sh`:
```bash
#!/usr/bin/env bash
# Throwaway: packs the Qollab bridge test plus engine.py into dist/qollab-smoke.zip.
set -euo pipefail
cd "$(dirname "$0")/../.."
rm -rf dist/qollab-smoke dist/qollab-smoke.zip
mkdir -p dist/qollab-smoke/quantum
cp scripts/qollab-smoke/index.html scripts/qollab-smoke/main.js dist/qollab-smoke/
cp backend/engine.py dist/qollab-smoke/quantum/engine.py
: > dist/qollab-smoke/quantum/__init__.py
(cd dist/qollab-smoke && zip -qr ../qollab-smoke.zip .)
echo "wrote dist/qollab-smoke.zip"
```

Add `/dist/` to `.gitignore` under `# production`. Add `"dist/**",` to the `ignores` list in `eslint.config.mjs`, because the generated bundles must not be linted. Add the script `"qollab:smoke": "bash scripts/qollab-smoke/build.sh",` to `package.json`.

- [ ] **Step 2: Build the zip**

Run: `npm run qollab:smoke`
Expected: `wrote dist/qollab-smoke.zip`. Running `unzip -l dist/qollab-smoke.zip` lists `index.html`, `main.js`, `quantum/__init__.py` and `quantum/engine.py`.

- [ ] **Step 3: The user runs it on Qollab**

1. On qollab.xyz, click **New Project**, choose **Upload your own files**, drop `dist/qollab-smoke.zip`, and check that the card says it will run as **JS**. Click **Create**.
2. On the Code tab, click **Run Project**, then **Run**. In **Select QPU**, pick the **Built-in simulator** and click **Run**. Press all three buttons.
3. Click **Stop**, then **Run**, and pick one **IBM** simulator (for example IBM Fez). Press all three buttons.
4. Click **Stop**, then **Run**, and pick **IonQ Aria 1**. Press **Bell**, then press **Bell** again.

Expected:

| Backend | Bell | initialize + Toffoli | r3 |
|---|---|---|---|
| Built-in | only `00`, `11` | about half `000`, half `111` | `q0_bloch` ≈ [0.717, 0, 0.697] |
| IBM | mostly `00`, `11`, plus a little noise | mostly `000`/`111` | `q0_bloch` the same (it's exact) |
| IonQ | 1st: mostly `00`/`11`. 2nd: `FAILED: IonQ allows one job per Run…` | (skip) | (skip) |

Record the backend names shown and each result in the PR description.

- [ ] **Step 4: Decision gate**

- **All OK:** commit and continue to Task 3.
- **The `import … 'quantum.engine'` line or `callPromising` fails on every backend:** STOP. Report the exact console error to the user and re-plan. The fallback is to rewrite the player to use Qollab's JS Qiskit API (`import { QuantumCircuit } from 'qiskit'`). Don't start Task 3.
- **Only IBM or IonQ fails with an unsupported-gate or target error:** extend `GENERIC_BASIS` in `engine.py` to the gates the error names. Re-run `npm run check:py`, re-upload, and continue.

```bash
git add scripts/qollab-smoke .gitignore eslint.config.mjs package.json
git commit -m "Add throwaway Qollab bridge test"
```

---

### Task 3: Transport seam, Qollab bridge and JS checks

**Files:**
- Modify: `src/lib/quantum.ts`: the `runCircuit` function (currently lines 58–60)
- Create: `src/qollab/bridge.ts`
- Create: `src/qollab/qollab.d.ts`
- Create: `scripts/check.ts`
- Modify: `src/components/lab/Tutor.tsx`: the `offline` prop
- Modify: `package.json`: the `esbuild@0.28.2` dev dependency and the `check:js` script

**Interfaces:**
- Consumes: `QuantumServiceError` and `RunResult` from `src/lib/quantum.ts`.
- Produces:
  - `type Transport = (body: object) => Promise<RunResult>`
  - `setTransport(t: Transport): void`
  - `type QollabEngine = { run_json: { callPromising(backend: unknown, req: string): Promise<string> } }`
  - `qollabTransport(engine: QollabEngine, backend: unknown): Transport`
  - `pythonErrorMessage(e: unknown): string`
  - `<Tutor offline />`
  - the ambient module `"quantum.engine"` and the global `backend: { name?: unknown }`

- [ ] **Step 1: Install esbuild and add the check script**

Run: `npm install --save-dev --save-exact esbuild@0.28.2`
In `package.json` `"scripts"`, add:
`"check:js": "esbuild scripts/check.ts --bundle --platform=node --format=esm --outfile=dist/check.mjs --log-level=warning && node dist/check.mjs",`

- [ ] **Step 2: Write the failing check**

Create `scripts/check.ts`:
```ts
// Runnable checks for the logic the Qollab player depends on. Run: npm run check:js
import assert from "node:assert/strict";
import { QuantumServiceError } from "@/lib/quantum";
import { pythonErrorMessage, qollabTransport } from "@/qollab/bridge";

assert.equal(
  pythonErrorMessage(new Error("Traceback (most recent call last):\n  File \"engine.py\", line 9\nValueError: IonQ allows one job per Run.")),
  "IonQ allows one job per Run.",
);
assert.equal(pythonErrorMessage("plain message"), "plain message");

const ok = qollabTransport({ run_json: { callPromising: async (_b, req) => JSON.stringify({ echoed: JSON.parse(req) }) } }, {});
assert.deepEqual(await ok({ qubits: 1 }), { echoed: { qubits: 1 } });

const bad = qollabTransport(
  { run_json: { callPromising: async () => { throw new Error("Traceback\nValueError: op 0 (cx): invalid or repeated qubit indices"); } } },
  {},
);
await assert.rejects(bad({}), (e) => e instanceof QuantumServiceError && e.message === "op 0 (cx): invalid or repeated qubit indices");

console.log("js: all checks passed");
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm run check:js`
Expected: FAIL. esbuild reports `Could not resolve "@/qollab/bridge"`.

- [ ] **Step 4: Add the transport seam**

In `src/lib/quantum.ts`, replace:
```ts
export function runCircuit(c: Circuit, opts: RunOptions = {}) {
  return call<RunResult>("/run", { method: "POST", body: JSON.stringify({ ...c, ...opts }) });
}
```
with:
```ts
/** How a run request reaches Qiskit: the FastAPI service by default, Qollab's Python bridge on qollab.xyz. */
export type Transport = (body: object) => Promise<RunResult>;

let transport: Transport = (body) => call<RunResult>("/run", { method: "POST", body: JSON.stringify(body) });

export function setTransport(t: Transport) {
  transport = t;
}

export function runCircuit(c: Circuit, opts: RunOptions = {}) {
  return transport({ ...c, ...opts });
}
```

- [ ] **Step 5: Write the bridge and the ambient types**

Create `src/qollab/bridge.ts`:
```ts
import { QuantumServiceError, type RunResult, type Transport } from "@/lib/quantum";

/** The part of our Python module the player calls. `run_json` is engine.py's JSON entry point. */
export type QollabEngine = { run_json: { callPromising(backend: unknown, req: string): Promise<string> } };

/** Python errors arrive as a traceback; learners only need its last line, minus the exception type. */
export function pythonErrorMessage(e: unknown): string {
  const lines = String(e instanceof Error ? e.message : e).trim().split("\n");
  return lines[lines.length - 1].replace(/^[A-Za-z]+(Error|Exception): /, "");
}

export function qollabTransport(engine: QollabEngine, backend: unknown): Transport {
  return async (body) => {
    try {
      return JSON.parse(await engine.run_json.callPromising(backend, JSON.stringify(body))) as RunResult;
    } catch (e) {
      throw new QuantumServiceError(pythonErrorMessage(e));
    }
  };
}
```

Create `src/qollab/qollab.d.ts`:
```ts
// Qollab's runtime: our Python module (quantum/engine.py) and the simulator picked in "Select QPU".
declare module "quantum.engine" {
  export const run_json: { callPromising(backend: unknown, req: string): Promise<string> };
}
declare const backend: { name?: unknown };
```

- [ ] **Step 6: Run the checks to verify they pass**

Run: `npm run check:js`
Expected: `js: all checks passed`

- [ ] **Step 7: Add an offline mode to the tutor**

In `src/components/lab/Tutor.tsx`:

Change the signature to:
```tsx
export default function Tutor({ circuit, result, extra = "", compact, offline }: { circuit: Circuit; result: RunResult | null; extra?: string; compact?: boolean; offline?: boolean }) {
```

In `ask`, replace:
```tsx
    setInput("");
    setBusy(true);
```
with:
```tsx
    setInput("");
    // Offline (e.g. on Qollab, where POST is blocked): answer from the run results without calling Claude.
    if (offline) return setMsgs([...history, { role: "assistant", content: offlineExplain(circuit, result, level), offline: true }]);
    setBusy(true);
```

Replace `<h2 className="mr-auto font-semibold">🤖 AI tutor</h2>` with:
```tsx
        <h2 className="mr-auto font-semibold">{offline ? "🤖 Explainer" : "🤖 AI tutor"}</h2>
```

- [ ] **Step 8: Verify the web app still builds and runs**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three pass.

Then, with `npm run backend` and `npm run dev` running, open http://localhost:3000/learn/s4, press **▶ Run on Qiskit**, and check that only `00` and `11` appear.

- [ ] **Step 9: Commit**

```bash
git add src/lib/quantum.ts src/qollab/bridge.ts src/qollab/qollab.d.ts scripts/check.ts src/components/lab/Tutor.tsx package.json package-lock.json
git commit -m "Add swappable run transport, Qollab bridge and JS checks"
```

---

### Task 4: Qollab lesson player and build

**Files:**
- Create: `src/qollab/index.html`, `src/qollab/main.tsx`, `src/qollab/Player.tsx`, `src/qollab/qollab.css`
- Create: `scripts/build-qollab.sh`
- Modify: `package.json`: the `@tailwindcss/cli@4.3.3` dev dependency and the `qollab:build` script
- Modify: `README.md`: add a "Run it on Qollab" section after "Run it"

**Interfaces:**
- Consumes:
  - `setTransport`, `runCircuit`, `RunResult` and `Circuit` from `@/lib/quantum`
  - `qollabTransport` from `./bridge`
  - `MODULES`, `TRACKS`, `modulesOf` and `Module` from `@/lib/curriculum`
  - `CircuitEditor` (props `{qubits, ops, onChange?, readOnly?}`), `layout(c: Circuit): EOp[]`, `toCircuit(qubits: number, ops: EOp[]): Circuit` and `EOp` from `@/components/lab/CircuitEditor`
  - `ResultsPanel` (props `{result, circuit}`)
  - `Tutor` (props `{circuit, result, extra?, compact?, offline?}`)
  - `Markdown` (props `{text}`)
- Produces: `dist/qollab/` and `dist/qollab.zip`. Task 6 adds a `<Predict>` and Task 7 an `<IdealVsMachine>` inside `Lesson` in `Player.tsx`.

- [ ] **Step 1: Install the Tailwind CLI**

Run: `npm install --save-dev --save-exact @tailwindcss/cli@4.3.3`

- [ ] **Step 2: Write the entry point, HTML and CSS**

`src/qollab/index.html`:
```html
<div id="root"><p style="padding: 1rem">Loading Quantum Quest…</p></div>
```

`src/qollab/qollab.css`:
```css
@import "../app/globals.css";

/* Next's font loader defines these in the web app; on Qollab fall back to system fonts. */
:root {
  --font-inter: system-ui, sans-serif;
  --font-jetbrains: ui-monospace, monospace;
  --font-fredoka: ui-rounded, system-ui, sans-serif;
}
```

`src/qollab/main.tsx`:
```tsx
import * as engine from "quantum.engine";
import { createRoot } from "react-dom/client";
import { setTransport } from "@/lib/quantum";
import { qollabTransport } from "./bridge";
import Player from "./Player";

setTransport(qollabTransport(engine, backend));
createRoot(document.getElementById("root")!).render(<Player backendName={String(backend.name ?? "unknown backend")} />);
```

- [ ] **Step 3: Write the player**

`src/qollab/Player.tsx`:
```tsx
import { useMemo, useState } from "react";
import Markdown from "@/components/Markdown";
import CircuitEditor, { layout, toCircuit, type EOp } from "@/components/lab/CircuitEditor";
import ResultsPanel from "@/components/lab/ResultsPanel";
import Tutor from "@/components/lab/Tutor";
import { MODULES, TRACKS, modulesOf, type Module } from "@/lib/curriculum";
import { runCircuit, type RunResult } from "@/lib/quantum";

const REPO = "https://github.com/Tosccony/QuantumLearning";
const LESSON_TRACKS = TRACKS.filter((t) => t.id !== "explorer");

/** Quantum Quest's lessons on Qollab: every run goes to the simulator picked in "Select QPU". */
export default function Player({ backendName }: { backendName: string }) {
  const [id, setId] = useState(MODULES[0].id);
  const m = MODULES.find((x) => x.id === id)!;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4">
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">⚛️ Quantum Quest</h1>
        <span className="chip">Simulator: {backendName}</span>
      </header>
      <nav aria-label="Lessons" className="flex flex-col gap-2">
        {LESSON_TRACKS.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-1.5">
            <span className="w-28 text-sm text-muted">{t.icon} {t.name}</span>
            {modulesOf(t.id).map((x, i) => (
              <button
                key={x.id}
                onClick={() => setId(x.id)}
                aria-current={x.id === id ? "page" : undefined}
                className={`chip ${x.id === id ? "!bg-accent !text-white" : "hover:bg-white/20"}`}
              >
                {i + 1}. {x.title}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <Lesson key={m.id} m={m} isIonQ={/ionq/i.test(backendName)} />
      <footer className="pb-4 text-center text-xs text-muted">
        Kids&apos; Explorer games, community sharing and the AI tutor live in the full web app: <a className="underline" href={REPO}>{REPO}</a>. MIT licensed.
        <br />
        This effort is supported by Qollab &amp; IonQ
      </footer>
    </div>
  );
}

function Lesson({ m, isIonQ }: { m: Module; isIonQ: boolean }) {
  const [ops, setOps] = useState<EOp[]>(() => layout(m.circuit));
  const circuit = useMemo(() => toCircuit(m.circuit.qubits, ops), [m.circuit.qubits, ops]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      setResult(await runCircuit(circuit, { shots: 1024 }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        <header>
          <h2 className="text-2xl font-bold">{m.title}</h2>
          <p className="text-muted">{m.summary}</p>
        </header>
        {m.sections.map((s) => (
          <section key={s.heading}>
            <h3 className="mb-1 text-lg font-semibold">{s.heading}</h3>
            <Markdown text={s.body} />
          </section>
        ))}
        <section className="panel flex flex-col gap-3 p-4" aria-label="Lesson circuit">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="mr-auto font-semibold">🧩 The circuit (you can edit it)</h3>
            <button className="pbtn-ghost" onClick={() => { setOps(layout(m.circuit)); setResult(null); setError(null); }}>Reset</button>
            <button className="pbtn-primary" onClick={run} disabled={running}>{running ? "Running…" : "▶ Run"}</button>
          </div>
          {isIonQ && <p className="text-xs text-muted">IonQ simulators take one job per Run. To run again, press Stop and Run, or pick a local simulator.</p>}
          <CircuitEditor qubits={m.circuit.qubits} ops={ops} onChange={setOps} />
          {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
          {result && (
            <>
              <p className="rounded-xl bg-accent/15 p-3 text-sm"><b>What to look for:</b> {m.observe}</p>
              <ResultsPanel result={result} circuit={circuit} />
            </>
          )}
          <div className="text-sm">
            <p className="font-semibold">Try it</p>
            <ul className="mt-1 list-disc pl-5 text-muted">{m.tryIt.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </section>
        <section className="panel flex flex-col gap-3 p-4" aria-label="Check your understanding">
          <h3 className="font-semibold">✅ Check your understanding</h3>
          <p>{m.check.q}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {m.check.options.map((o, k) => {
              const st = picked === null ? "hover:bg-white/10" : k === m.check.answer ? "ring-2 ring-good" : k === picked ? "ring-2 ring-bad" : "opacity-50";
              return (
                <button key={k} onClick={() => setPicked(k)} disabled={picked !== null} className={`rounded-xl bg-white/5 p-3 text-left text-sm ${st}`}>
                  {o}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <p role="status" className={picked === m.check.answer ? "text-good" : "text-on"}>
              {picked === m.check.answer ? "Correct! " : "Not quite. "}
              {m.check.why}
            </p>
          )}
        </section>
      </div>
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <Tutor compact offline circuit={circuit} result={result} extra={`Lesson: ${m.title}. What to look for: ${m.observe}`} />
      </aside>
    </article>
  );
}
```

- [ ] **Step 4: Write the build script**

`scripts/build-qollab.sh`:
```bash
#!/usr/bin/env bash
# Builds the Qollab project into dist/qollab/ and dist/qollab.zip: the lesson player bundled into
# main.js/main.css, plus engine.py as the Python module it calls. Upload the zip on qollab.xyz.
# RELEASE=1 refuses to build while README.md (the public project page) still has TODO(team) lines.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=dist/qollab

if grep -q 'TODO(team)' README.md; then
  [ "${RELEASE:-0}" = 1 ] && { echo "FAIL: README.md still has TODO(team) lines; it becomes the Qollab project page" >&2; exit 1; }
  echo "WARNING: README.md still has TODO(team) lines; fill them before RELEASE=1" >&2
fi

rm -rf "$OUT" dist/qollab.zip
mkdir -p "$OUT/quantum"
npx esbuild src/qollab/main.tsx --bundle --format=esm --jsx=automatic --minify \
  --external:quantum.engine --define:process.env.NODE_ENV='"production"' \
  --outfile="$OUT/main.js" --log-level=error
npx tailwindcss -i src/qollab/qollab.css -o "$OUT/main.css" --minify
cp src/qollab/index.html README.md LICENSE "$OUT/"
cp backend/engine.py "$OUT/quantum/engine.py"
: > "$OUT/quantum/__init__.py"

COUNT=$(find "$OUT" -type f | wc -l | tr -d ' ')
[ "$COUNT" -le 100 ] || { echo "FAIL: $COUNT files (Qollab allows 100)" >&2; exit 1; }
BIG=$(find "$OUT" -type f -size +2097152c)
[ -z "$BIG" ] || { echo "FAIL: files over 2 MB: $BIG" >&2; exit 1; }
(cd "$OUT" && zip -qr ../qollab.zip .)
echo "wrote dist/qollab.zip ($COUNT files)"
ls -l "$OUT" "$OUT/quantum"
```

In `package.json` `"scripts"`, add `"qollab:build": "bash scripts/build-qollab.sh",`.

- [ ] **Step 5: Build and check the output**

Run: `npm run qollab:build`
Expected:
- the `TODO(team)` WARNING, unless the team has filled those lines
- then `wrote dist/qollab.zip (7 files)`, listing `LICENSE`, `README.md`, `index.html`, `main.css`, `main.js` and `quantum/{__init__.py,engine.py}`

`main.js` should be well under 2 MB (React plus components, roughly 300–500 KB).

Run: `grep -c "quantum.engine" dist/qollab/main.js`
Expected: `1`. The import is kept external.

- [ ] **Step 6: Check the release guard (Review Focus 5)**

Run: `RELEASE=1 npm run qollab:build; echo "exit $?"`
Expected while the README still has `TODO(team)`: `FAIL: README.md still has TODO(team) lines…` and `exit 1`. If the team has already filled them, expect a successful build instead. Check the guard by temporarily adding a `TODO(team)` line to a copy of the README.

- [ ] **Step 7: Check the web app still builds**

Run: `npx tsc --noEmit && npm run lint && npm run check:js && npm run build`
Expected: all pass. Next type-checks `src/qollab/*` through the ambient `qollab.d.ts`.

- [ ] **Step 8: Add the README section**

In `README.md`, after the `## Run it` section, add:
```markdown
## Run it on Qollab

All 18 Student, Developer and Researcher lessons also run on qollab.xyz, on Qollab's free simulators (the built-in ideal simulator, IBM device noise models, and IonQ's Aria and Forte simulators).

1. Open the project on Qollab and go to the **Code** tab.
2. Press **Run Project**, then **Run**, and pick a simulator in **Select QPU**.
3. Pick a lesson, edit its circuit if you like, and press **▶ Run**.

IonQ simulators accept one job per Run. For another job, press **Stop** and **Run** again, or pick a local simulator.

To rebuild the upload: `npm run qollab:build` writes `dist/qollab.zip`. Use `RELEASE=1` for the version you publish.
```

- [ ] **Step 9: The user checks the upload on Qollab**

Use the Task 2 project. In edit mode, open the Code tab and choose **Erase first**, then upload `dist/qollab.zip` and **Unpack** it. Run it on the **Built-in simulator** and check:
1. The page is styled (dark theme, chips, buttons).
2. s1 runs and shows a histogram of about 25% / 75%.
3. Editing the circuit (remove a gate) and pressing ▶ Run updates the result.
4. Removing every gate and pressing Run shows only `0`.
5. The Explainer answers from the results.

Then do one lesson on an **IBM** simulator, and on **IonQ** run s4, then press ▶ Run again and check the one-job message appears.

- [ ] **Step 10: Commit**

```bash
git add src/qollab scripts/build-qollab.sh package.json package-lock.json README.md
git commit -m "Add Qollab lesson player and build"
```

---

### Task 5: Publish on Qollab (eligibility gate; the user drives it)

**Files:**
- Modify: `README.md`: the two `TODO(team)` lines (the team writes these) and the Qollab project link
- Modify: `HACKATHON.md`: section 7 checklist

**Interfaces:**
- Consumes: `dist/qollab.zip` from Task 4.
- Produces: a published, public Qollab project URL, `qollab.xyz/u/<user>/<project>`.

- [ ] **Step 1: The team fills in the Disclosure section**

Replace both `TODO(team)` lines in the README's Disclosure section with the real answers. Also add to the AI-tools list: `Claude Code helped build the Qollab lesson player (engine extraction, bridge, bundle) on Oct 10–11.` Commit with `git commit -am "Complete hackathon disclosure"`.

- [ ] **Step 2: Build the release**

Run: `RELEASE=1 npm run qollab:build`
Expected: `wrote dist/qollab.zip (7 files)` with no warning.

- [ ] **Step 3: Create the final project**

On qollab.xyz, click **New Project**, choose **Upload your own files**, drop `dist/qollab.zip`, check the card says **JS**, and click **Create**. The README becomes the write-up. On the Project Card:
- title **Quantum Quest**
- an About summary
- tags `education`, `qiskit`, `ionq`
- the GitHub repo as the repository link

Confirm the write-up shows `This effort is supported by Qollab & IonQ`.

- [ ] **Step 4: Run the acceptance check on Qollab**

On the **Built-in simulator**, run every lesson (s1–s6, d1–d6, r1–r6) once. Each should show a result with no error. On an **IBM** simulator, run s2 and r2. On **IonQ Aria 1**, run s4. Paste this table into the PR description:

| Lesson | Built-in | IBM | IonQ |
|---|---|---|---|

- [ ] **Step 5: Publish**

Click **Publish** and make the version public and the default. Copy the URL `qollab.xyz/u/<user>/<project>`.

- [ ] **Step 6: Record the link**

In `README.md`, under `## Run it on Qollab`, change step 1 to `1. Open [the project on Qollab](<URL>) and go to the **Code** tab.` In `HACKATHON.md` section 7, tick:
- "Qollab project format confirmed"
- "Qiskit project published on qollab.xyz, MIT-licensed"
- "**Run** works on the free local simulator and on IonQ's simulator"
- "Project page covers what it does, the problem, how to run it, a link to this repo, and the attribution"

```bash
git commit -am "Link the published Qollab project"
```

**Eligibility is reached here.** Tell the user. Ask before pushing the branch or opening a PR.

---

### Task 6 (stretch): Predict → Run → Explain

**Files:**
- Modify: `src/lib/curriculum.ts`: the `Predict` type, `Module.predict?`, and `predict` data for s2, s4, s5, d4 and r3
- Create: `src/components/lab/Predict.tsx`
- Modify: `src/app/(platform)/learn/[module]/page.tsx`: render Predict and gate Run
- Modify: `src/qollab/Player.tsx`: the same, inside `Lesson`
- Modify: `scripts/check.ts`: a lesson data check

**Interfaces:**
- Consumes: `Module` and `MODULES` from `@/lib/curriculum`.
- Produces:
  - `type Predict = { q: string; options: string[]; answer: number; feedback: string[] }`
  - `Module.predict?: Predict`
  - `export const SKIPPED = -1`
  - default export `Predict({ p, picked, onPick, revealed }: { p: Predict; picked: number | null; onPick: (k: number) => void; revealed: boolean })`

- [ ] **Step 1: Write the failing data check**

Append to `scripts/check.ts`, before the final `console.log`:
```ts
import { MODULES } from "@/lib/curriculum";

const predicted = MODULES.filter((m) => m.predict);
assert.deepEqual(predicted.map((m) => m.id), ["s2", "s4", "s5", "d4", "r3"]);
for (const m of predicted) {
  const p = m.predict!;
  assert.equal(p.options.length, p.feedback.length, `${m.id}: one feedback line per option`);
  assert.ok(p.answer >= 0 && p.answer < p.options.length, `${m.id}: answer in range`);
}
```
Move the new `import` line up with the other imports at the top of the file.

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run check:js`
Expected: FAIL. A TypeScript-free esbuild bundle still runs, and `assert.deepEqual` fails with `[]` vs the five ids.

- [ ] **Step 3: Add the type and the data**

In `src/lib/curriculum.ts`, after `export type Check = …`, add:
```ts
/** A prediction made before running. Each wrong option is a common misconception, answered in `feedback`. */
export type Predict = { q: string; options: string[]; answer: number; feedback: string[] };
```
In `export type Module = {…}`, after `check: Check;`, add `predict?: Predict;`.

Add a `predict` property to these five modules, next to their `check`:

s2:
```ts
    predict: {
      q: "This circuit applies H twice to |0⟩. Before you run it: what will the shots show?",
      options: ["About 50% 0 and 50% 1", "0 every time", "1 every time", "A different random mix on every run"],
      answer: 1,
      feedback: [
        "That's the coin-flip picture of H. One H does give 50/50, but the second H makes the two paths into |1⟩ cancel (+½ and −½). Amplitudes can cancel; probabilities can't, which is why the coin picture breaks.",
        "Right. The paths into |1⟩ carry +½ and −½ and cancel, while the paths into |0⟩ add up. That's interference.",
        "H undoes itself (H·H = I), so the qubit returns to where it started: |0⟩, not |1⟩.",
        "Shots are random only when the final state is a superposition. Interference leaves exactly |0⟩ here, so there's nothing random left to measure.",
      ],
    },
```

s4:
```ts
    predict: {
      q: "H on q0, then a CNOT from q0 to q1. Which outcomes will you see?",
      options: ["All four (00, 01, 10, 11), about 25% each", "Only 00 and 11, about half each", "Only 00", "Only 01 and 10"],
      answer: 1,
      feedback: [
        "That's what two independent coin flips give. The CNOT copies q0's value into q1 in every branch, so 01 and 10 never appear.",
        "Right. Each qubit on its own is random, but the pair always agrees. That correlation is entanglement.",
        "q0 is in superposition after H, so half the time it's 1, and the CNOT then flips q1 too, giving 11.",
        "That would be anti-correlation, which you get by adding an X on q1 first. Here the CNOT makes q1 match q0.",
      ],
    },
```

s5:
```ts
    predict: {
      q: "q0 starts as Ry(1.1)|0⟩. After the teleportation protocol, what does q2's Bloch vector look like?",
      options: ["The same as q0's starting state, about (0.89, 0, 0.45)", "Still |0⟩, since no gate with the angle touched q2", "q0 and q2 both hold copies of the state", "Random: it changes every run"],
      answer: 0,
      feedback: [
        "Right. The state moved from q0 to q2, and q0 no longer holds it, so nothing was copied.",
        "The angle never touches q2 directly. Entanglement plus the two corrections carry the state across, which is the whole point of teleportation.",
        "Quantum states can't be copied (the no-cloning theorem). After teleportation q0 is left in |+⟩ and only q2 holds the state.",
        "Bloch vectors are calculated exactly from the statevector, not sampled, so they're the same every run. Only the histogram counts wobble.",
      ],
    },
```

d4:
```ts
    predict: {
      q: "Grover's search marks |11⟩ among 4 possibilities and asks the oracle once. What will you measure?",
      options: ["|11⟩ about 25% of the time, the same as guessing", "|11⟩ every time", "|11⟩ about half the time", "All four answers at once, because a quantum computer tries them all in parallel"],
      answer: 1,
      feedback: [
        "The oracle flips |11⟩'s sign, and the diffuser turns that sign into extra amplitude through interference, so the odds aren't the same as guessing.",
        "Right. For 4 items, one Grover iteration rotates the state exactly onto the marked item. Larger searches need about √N iterations and usually stop just short of 100%.",
        "For N = 4 the amplification isn't partial: one iteration lands exactly on the answer.",
        "This is the most common myth. Every shot gives one outcome. The speed-up comes from interference boosting the right answer, not from reading out all the answers.",
      ],
    },
```

r3:
```ts
    predict: {
      q: "An X error hits q1 in the middle of the code. After correction and decoding, what happens to q0's Bloch vector?",
      options: ["It's restored to about (0.717, 0, 0.697), the original state", "It's flipped, because the error was never measured", "It collapses to |0⟩ or |1⟩, because we checked for errors", "It's partly damaged, about halfway between"],
      answer: 0,
      feedback: [
        "Right. The syndrome pinpoints q1, the Toffoli flips it back, and decoding returns the original state, all without learning α or β.",
        "The ancillas detect the error by checking parities, and the controlled corrections act on that information. The data never needs to be measured directly.",
        "The syndrome checks only parities (Z₀Z₁ and Z₁Z₂), which are the same for |000⟩ and |111⟩. That reveals the error without disturbing the superposition.",
        "This code fully corrects a single X error. Damage starts only with two or more errors, or with errors it can't see, such as Z flips.",
      ],
    },
```

- [ ] **Step 4: Run the check to verify it passes**

Run: `npm run check:js`
Expected: `js: all checks passed`

- [ ] **Step 5: Write the component**

`src/components/lab/Predict.tsx`:
```tsx
import type { Predict as PredictData } from "@/lib/curriculum";

export const SKIPPED = -1;

/** Predict → Run → Explain: the learner commits to an outcome, the run reveals it, and feedback answers their pick. */
export default function Predict({ p, picked, onPick, revealed }: { p: PredictData; picked: number | null; onPick: (k: number) => void; revealed: boolean }) {
  return (
    <section className="panel flex flex-col gap-3 p-4" aria-label="Predict before you run">
      <h3 className="font-semibold">🔮 Predict first</h3>
      <p>{p.q}</p>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Your prediction">
        {p.options.map((o, k) => (
          <button
            key={k}
            role="radio"
            aria-checked={picked === k}
            disabled={picked !== null}
            onClick={() => onPick(k)}
            className={`rounded-xl bg-white/5 p-3 text-left text-sm ${picked === k ? "ring-2 ring-accent" : picked === null ? "hover:bg-white/10" : "opacity-50"}`}
          >
            {o}
          </button>
        ))}
      </div>
      {picked === null && (
        <button className="self-start text-xs text-muted underline" onClick={() => onPick(SKIPPED)}>
          Skip, just show me
        </button>
      )}
      {revealed && picked !== null && (
        <p role="status" className={picked === p.answer ? "text-good" : "text-on"}>
          {picked === SKIPPED ? `The answer: “${p.options[p.answer]}”. ` : picked === p.answer ? "You called it. " : "Surprised? "}
          {p.feedback[picked === SKIPPED ? p.answer : picked]}
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Wire it into both lesson views**

In `src/app/(platform)/learn/[module]/page.tsx`:
- Add the import `import Predict from "@/components/lab/Predict";`.
- After `const [earned, setEarned] = useState(0);`, add `const [guess, setGuess] = useState<number | null>(null);`.
- Just before `<section className="panel flex flex-col gap-4 p-4" aria-label="Lesson circuit">`, add:
  ```tsx
        {m.predict && <Predict p={m.predict} picked={guess} onPick={setGuess} revealed={!!result} />}
  ```
- Change the Run button's `disabled={running}` to `disabled={running || (!!m.predict && guess === null)}`.
- Change its label expression to `{running ? "Running on Qiskit…" : m.predict && guess === null ? "Predict first ↑" : result ? "▶ Run again" : "▶ Run on Qiskit"}`.

In `src/qollab/Player.tsx`, inside `Lesson`:
- Add the import `import Predict from "@/components/lab/Predict";`.
- After `const [picked, setPicked] = useState<number | null>(null);`, add `const [guess, setGuess] = useState<number | null>(null);`.
- Just before `<section className="panel flex flex-col gap-3 p-4" aria-label="Lesson circuit">`, add:
  ```tsx
        {m.predict && <Predict p={m.predict} picked={guess} onPick={setGuess} revealed={!!result} />}
  ```
- Change the Run button to `disabled={running || (!!m.predict && guess === null)}`, with the label `{running ? "Running…" : m.predict && guess === null ? "Predict first ↑" : "▶ Run"}`.

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run check:js && npm run build && npm run qollab:build`
Expected: all pass.

Manual check in the web app at http://localhost:3000/learn/s2:
1. Run reads "Predict first ↑" and is disabled.
2. Pick "About 50% 0 and 50% 1". Run is enabled. Run it: "Surprised? That's the coin-flip picture…" appears.
3. At /learn/s4, "Skip, just show me" leads to Run, then "The answer: …".
4. At /learn/s1 (no `predict`), Run works straight away.

- [ ] **Step 8: Commit**

```bash
git add src/lib/curriculum.ts src/components/lab/Predict.tsx "src/app/(platform)/learn/[module]/page.tsx" src/qollab/Player.tsx scripts/check.ts
git commit -m "Add Predict → Run → Explain to five lessons"
```

---

### Task 7 (stretch): Ideal vs this machine, and code vs bare

**Files:**
- Modify: `src/lib/explain.ts`: export `tvd`, `shotNoiseTvd` and `onesRate`, and use `tvd` inside `offlineExplain`
- Create: `src/components/lab/IdealVsMachine.tsx`
- Modify: `src/lib/curriculum.ts`: `Module.compare?: Circuit`, plus the r3 `compare` circuit
- Modify: `src/qollab/Player.tsx`: render `IdealVsMachine` and the `CodeVsBare` block
- Modify: `src/app/(platform)/learn/[module]/page.tsx`: render `IdealVsMachine`
- Modify: `backend/test_engine.py`: the bit-flip comparison check
- Modify: `scripts/check.ts`: the TVD checks

**Interfaces:**
- Consumes: `RunResult` and `runCircuit` from `@/lib/quantum`, and `Module` from `@/lib/curriculum`.
- Produces:
  - `tvd(r: Pick<RunResult, "counts" | "probabilities">): number`
  - `shotNoiseTvd(r: Pick<RunResult, "probabilities" | "shots">): number`
  - `onesRate(counts: Record<string, number>, q: number): number`
  - `IdealVsMachine({ result, hint }: { result: RunResult; hint?: string })`
  - `Module.compare?: Circuit`

- [ ] **Step 1: Write the failing checks**

Append to `scripts/check.ts`, before the final `console.log`, and move the import to the top of the file:
```ts
import { onesRate, shotNoiseTvd, tvd } from "@/lib/explain";

assert.equal(tvd({ counts: { "0": 512, "1": 512 }, probabilities: { "0": 0.5, "1": 0.5 } }), 0);
// Outcomes the ideal machine never produces must count as distance (noise lands there).
assert.ok(Math.abs(tvd({ counts: { "00": 900, "01": 100 }, probabilities: { "00": 1 } }) - 0.1) < 1e-12);
// 5 qubits, uniform, 1024 shots: shot noise alone gives ~0.07 TVD, so a 0.05 cutoff would cry "noise".
const uniform = Object.fromEntries(Array.from({ length: 32 }, (_, i) => [i.toString(2).padStart(5, "0"), 1 / 32]));
assert.ok(shotNoiseTvd({ probabilities: uniform, shots: 1024 }) > 0.05);
assert.equal(onesRate({ "10": 30, "01": 70 }, 0), 0.7); // q0 is the last character
assert.equal(onesRate({ "10": 30, "01": 70 }, 1), 0.3);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run check:js`
Expected: FAIL. esbuild reports `No matching export in "src/lib/explain.ts" for import "onesRate"`.

- [ ] **Step 3: Implement the helpers**

In `src/lib/explain.ts`, after the `pct` constant, add:
```ts
/** Total-variation distance between sampled counts and the exact distribution: 0 = identical, 1 = disjoint. */
export function tvd(r: Pick<RunResult, "counts" | "probabilities">): number {
  const shots = Object.values(r.counts).reduce((a, b) => a + b, 0);
  const keys = new Set([...Object.keys(r.counts), ...Object.keys(r.probabilities)]);
  let d = 0;
  for (const k of keys) d += Math.abs((r.counts[k] ?? 0) / shots - (r.probabilities[k] ?? 0));
  return d / 2;
}

/** The TVD a perfect machine still shows from finite shots: mean binomial deviation, summed over outcomes. */
export function shotNoiseTvd(r: Pick<RunResult, "probabilities" | "shots">): number {
  return Object.values(r.probabilities).reduce((a, p) => a + Math.sqrt((2 * p * (1 - p)) / (Math.PI * r.shots)), 0) / 2;
}

/** Fraction of shots where qubit q read 1. Qiskit bitstrings are little-endian: q0 is the last character. */
export function onesRate(counts: Record<string, number>, q: number): number {
  let ones = 0;
  let shots = 0;
  for (const [k, v] of Object.entries(counts)) {
    shots += v;
    if (k[k.length - 1 - q] === "1") ones += v;
  }
  return shots ? ones / shots : 0;
}
```

In `offlineExplain`, replace:
```ts
  const shots = Object.values(r.counts).reduce((a, b) => a + b, 0);
  const totalShotDev = probs.reduce((a, [k, p]) => a + Math.abs((r.counts[k] ?? 0) / shots - p), 0) / 2;
```
with:
```ts
  const shots = Object.values(r.counts).reduce((a, b) => a + b, 0);
  const totalShotDev = tvd(r); // includes outcomes the ideal machine never produces, which is where noise lands
```

- [ ] **Step 4: Run the checks to verify they pass**

Run: `npm run check:js`
Expected: `js: all checks passed`

- [ ] **Step 5: Write the callout**

`src/components/lab/IdealVsMachine.tsx`:
```tsx
import { shotNoiseTvd, tvd } from "@/lib/explain";
import type { RunResult } from "@/lib/quantum";

/** Puts a number on "how far is this machine from a perfect one" for the run just made. */
export default function IdealVsMachine({ result, hint }: { result: RunResult; hint?: string }) {
  const d = tvd(result);
  const noisy = d > 2 * shotNoiseTvd(result) + 0.01;
  return (
    <p className="rounded-xl bg-white/5 p-3 text-sm" role="note">
      <b>Ideal vs {result.backend}:</b> distance {d.toFixed(3)}.{" "}
      {noisy
        ? "Noise is visible: the bars drift away from the exact (ideal) markers, and outcomes a perfect machine never gives start to appear."
        : "This matches a perfect machine, apart from normal shot-to-shot wobble."}
      {!noisy && hint ? ` ${hint}` : ""}
    </p>
  );
}
```

- [ ] **Step 6: Add the bit-flip comparison circuit and its Python check**

In `src/lib/curriculum.ts`, add `compare?: Circuit;` to `Module` after `predict?: Predict;`. Add to module r3:
```ts
    // q0: a bare qubit. q1–q3: the same bit protected by the 3-qubit code (ancillas q4, q5).
    // One circuit, so it fits IonQ's one-job-per-Run rule. Bare error = P(q0 = 1), protected = P(q1 = 1).
    compare: {
      qubits: 6,
      ops: [
        g("cx", [2], [1]), g("cx", [3], [1]),
        g("cx", [4], [1]), g("cx", [4], [2]), g("cx", [5], [2]), g("cx", [5], [3]),
        g("ccx", [2], [4, 5]),
        g("x", [5]), g("ccx", [1], [4, 5]), g("x", [5]),
        g("x", [4]), g("ccx", [3], [4, 5]), g("x", [4]),
        g("cx", [3], [1]), g("cx", [2], [1]),
      ],
    },
```

In `backend/test_engine.py`, add before `print("engine: all checks passed")`:
```python
    # Mirror of curriculum.ts r3.compare: with one X error on any data qubit, the protected bit (q1) still reads 0.
    compare = [g("cx", [2], [1]), g("cx", [3], [1]),
               g("cx", [4], [1]), g("cx", [4], [2]), g("cx", [5], [2]), g("cx", [5], [3]),
               g("ccx", [2], [4, 5]),
               g("x", [5]), g("ccx", [1], [4, 5]), g("x", [5]),
               g("x", [4]), g("ccx", [3], [4, 5]), g("x", [4]),
               g("cx", [3], [1]), g("cx", [2], [1])]
    for q in (None, 1, 2, 3):
        ops = compare[:2] + ([g("x", [q])] if q else []) + compare[2:]
        counts = engine.run(AerSimulator(), {"qubits": 6, "ops": ops, "shots": 200})["counts"]
        assert all(k[-2] == "0" and k[-1] == "0" for k in counts), (q, counts)  # q1 and bare q0 read 0
```

Run: `npm run check:py`
Expected: `engine: all checks passed`

- [ ] **Step 7: Render the callout and the comparison**

In `src/app/(platform)/learn/[module]/page.tsx`:
- Add `import IdealVsMachine from "@/components/lab/IdealVsMachine";`.
- After the line `<p className="rounded-xl bg-accent/15 p-3 text-sm"><b>What to look for:</b> {m.observe}</p>`, add:
  ```tsx
              <IdealVsMachine result={result} hint="Turn on noise in the Lab to see how a real device drifts." />
  ```

In `src/qollab/Player.tsx`:
- Add the imports `import IdealVsMachine from "@/components/lab/IdealVsMachine";`, `import { onesRate } from "@/lib/explain";`, and the type `Circuit` from `@/lib/quantum`. Change that import line to `import { runCircuit, type Circuit, type RunResult } from "@/lib/quantum";`.
- After the "What to look for" line inside `Lesson`, add:
  ```tsx
              <IdealVsMachine result={result} hint="On your next Run, pick an IBM or IonQ machine in Select QPU to see real-world noise." />
  ```
- After the closing `</section>` of the "Lesson circuit" section, add `{m.compare && <CodeVsBare circuit={m.compare} />}`.
- At the end of the file, add:
  ```tsx
  function CodeVsBare({ circuit }: { circuit: Circuit }) {
    const [r, setR] = useState<RunResult | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bare = r ? onesRate(r.counts, 0) : 0;
    const coded = r ? onesRate(r.counts, 1) : 0;
    const pc = (x: number) => `${(x * 100).toFixed(1)}%`;

    async function run() {
      setBusy(true);
      setError(null);
      try {
        setR(await runCircuit(circuit, { shots: 1024 }));
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    }

    return (
      <section className="panel flex flex-col gap-3 p-4" aria-label="Bare qubit versus protected qubit">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto font-semibold">🛡️ Does the code help on this machine?</h3>
          <button className="pbtn-primary" onClick={run} disabled={busy}>{busy ? "Running…" : "▶ Run bare vs protected"}</button>
        </div>
        <p className="text-sm text-muted">One circuit holds a bare qubit and a qubit protected by the 3-qubit code, both storing 0. Any 1 we read is an error.</p>
        {error && <p role="alert" className="rounded-xl bg-bad/15 p-3 text-sm text-bad">{error}</p>}
        {r && (
          <p role="status" className="text-sm">
            Bare qubit error: <b>{pc(bare)}</b> · Protected qubit error: <b>{pc(coded)}</b>.{" "}
            {bare === 0 && coded === 0
              ? "No errors at all: this is a perfect machine. Pick an IBM or IonQ simulator on your next Run."
              : coded < bare
                ? "The code helped: it caught flips that hit the bare qubit unprotected."
                : "The code lost: its extra gates added more errors than it fixed. Error correction pays off only once gates are good enough, below the fault-tolerance threshold."}
          </p>
        )}
      </section>
    );
  }
  ```

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit && npm run lint && npm run check:js && npm run check:py && npm run build && npm run qollab:build`
Expected: all pass.

In the web app, /learn/s1 → Run should show "Ideal vs aer_simulator: … matches a perfect machine". On Qollab, re-upload: on the built-in simulator, r3's comparison should say "No errors at all". On an IBM simulator, it should show two non-zero rates and a verdict.

- [ ] **Step 9: Commit**

```bash
git add src/lib/explain.ts src/components/lab/IdealVsMachine.tsx src/lib/curriculum.ts src/qollab/Player.tsx "src/app/(platform)/learn/[module]/page.tsx" backend/test_engine.py scripts/check.ts
git commit -m "Add Ideal-vs-machine callout and bit-flip code vs bare comparison"
```

---

### Task 8: BB84 and Bell test lessons

**Files:**
- Modify: `src/lib/curriculum.ts`: the `Readout` type and `Module.readout?`, plus modules `s7` and `s8`, inserted right after module `s6` (before `d1`)
- Modify: `src/lib/explain.ts`: `pairCorrelation` and `bellScore`, after `onesRate`
- Create: `src/components/lab/LessonReadout.tsx`
- Modify: `src/app/(platform)/learn/[module]/page.tsx` and `src/qollab/Player.tsx`: render `LessonReadout`
- Create: `backend/check_lessons.py`
- Modify: `scripts/check.ts`: write `dist/lessons.json`, update the predicted-ids list, and add the helper checks
- Modify: `package.json`: add the `check:lessons` script

**Interfaces:**
- Consumes: `Module`, `Predict` and `MODULES` from Task 6. `IdealVsMachine` render lines from Task 7, used as anchors. `g` and `PI` in `curriculum.ts`.
- Produces:
  - `export type Readout = { kind: "bell" }` (Task 9 widens it)
  - `Module.readout?: Readout`
  - `pairCorrelation(counts: Record<string, number>, a: number, b: number): number`
  - `bellScore(counts: Record<string, number>): { E: number[]; S: number }`
  - default export `LessonReadout({ readout, result }: { readout: Readout; result: RunResult })`
  - `dist/lessons.json` (`{ [moduleId]: Circuit }`)
  - `backend/check_lessons.py`

The physics was verified on the engine before writing this task:
- BB84 gives exactly 4 outcomes, `001x1y0`. With Eve listening on q2, that round is wrong 48% of the time.
- CHSH gives E ≈ [0.70, 0.71, 0.71, −0.71], so S ≈ 2.83.

- [ ] **Step 1: Write the failing checks**

In `scripts/check.ts`:
- Add `import { mkdirSync, writeFileSync } from "node:fs";` to the imports at the top.
- Add `pairCorrelation` and `bellScore` to the existing `@/lib/explain` import.
- Change the predicted-ids assertion to `["s2", "s4", "s5", "s7", "s8", "d4", "r3"]`.
- Add these lines before the final `console.log`:

```ts
assert.ok(Math.abs(pairCorrelation({ "00": 85, "01": 15 }, 0, 1) - 0.7) < 1e-12);
assert.equal(bellScore({ "00000000": 100 }).S, 2); // everyone agrees: exactly the classical limit
assert.equal(bellScore({ "10000000": 100 }).S, 4); // pair D always disagrees: the formula's maximum

// Every lesson circuit, for backend/check_lessons.py to run through the real engine.
mkdirSync("dist", { recursive: true });
writeFileSync("dist/lessons.json", JSON.stringify(Object.fromEntries(MODULES.map((m) => [m.id, m.circuit]))));
```

Create `backend/check_lessons.py`:
```python
"""Runs every lesson circuit through engine.py and checks the physics of lessons that make a claim.
Run: npm run check:lessons (check:js writes dist/lessons.json from curriculum.ts first)."""

import json
import sys
from pathlib import Path

from qiskit_aer import AerSimulator

import engine


def ones(counts, q):
    """Fraction of shots where qubit q read 1 (Qiskit bitstrings: q0 is the last character)."""
    return sum(v for k, v in counts.items() if k[-1 - q] == "1") / sum(counts.values())


def corr(counts, a, b):
    """E = P(same) - P(different) for qubits a and b."""
    return sum(v if k[-1 - a] == k[-1 - b] else -v for k, v in counts.items()) / sum(counts.values())


def main(path):
    lessons = json.loads(Path(path).read_text())
    counts = {lid: engine.run(AerSimulator(), {**c, "shots": 4000, "seed": 7})["counts"] for lid, c in lessons.items()}

    # BB84: kept rounds q0, q2, q4, q5 carry the key 0, 1, 1, 0; mismatched q1, q3 are coin flips; Eve's q6 stays 0.
    c = counts["s7"]
    assert [ones(c, q) for q in (0, 2, 4, 5, 6)] == [0, 1, 1, 0, 0], c
    assert all(0.4 < ones(c, q) < 0.6 for q in (1, 3)), c

    # Bell test: E ≈ +0.71, +0.71, +0.71, -0.71, so S ≈ 2.83 (classical limit 2).
    c = counts["s8"]
    E = [corr(c, 2 * p, 2 * p + 1) for p in range(4)]
    S = E[0] + E[1] + E[2] - E[3]
    assert 2.7 < S < 2.95, (E, S)

    print(f"lessons: {len(counts)} circuits ran; physics checks passed")


if __name__ == "__main__":
    main(sys.argv[1])
```

In `package.json` `"scripts"`, add `"check:lessons": "npm run check:js && backend/.venv/bin/python backend/check_lessons.py dist/lessons.json",`.

- [ ] **Step 2: Run the checks to verify they fail**

Run: `npm run check:lessons`
Expected: FAIL. esbuild reports `No matching export in "src/lib/explain.ts" for import "pairCorrelation"`.

- [ ] **Step 3: Add the helpers**

In `src/lib/explain.ts`, after `onesRate`, add:
```ts
/** Agreement score E = P(same) − P(different) for qubits a and b: +1 always agree, −1 always disagree. */
export function pairCorrelation(counts: Record<string, number>, a: number, b: number): number {
  let shots = 0;
  let score = 0;
  for (const [k, v] of Object.entries(counts)) {
    shots += v;
    score += k[k.length - 1 - a] === k[k.length - 1 - b] ? v : -v;
  }
  return shots ? score / shots : 0;
}

/** CHSH score for the Bell-test lesson: pairs (q0,q1) (q2,q3) (q4,q5) (q6,q7), S = E₀ + E₁ + E₂ − E₃. */
export function bellScore(counts: Record<string, number>): { E: number[]; S: number } {
  const E = [0, 1, 2, 3].map((p) => pairCorrelation(counts, 2 * p, 2 * p + 1));
  return { E, S: E[0] + E[1] + E[2] - E[3] };
}
```

- [ ] **Step 4: Add the type and the two lessons**

In `src/lib/curriculum.ts`, after the `Predict` type, add:
```ts
/** Lesson-specific arithmetic shown under the results (see LessonReadout). */
export type Readout = { kind: "bell" };
```
In `Module`, after `compare?: Circuit;`, add `readout?: Readout;`.

Insert these two modules right after module `s6`'s closing `},` and before the first developer module (`d1`):
```ts
  {
    id: "s7", track: "student", title: "Quantum key distribution: BB84", minutes: 12, skill: "Quantum cryptography", requires: ["s3"],
    summary: "Alice and Bob build a shared secret key from single qubits. Measuring in the wrong basis disturbs a state, so an eavesdropper leaves errors they can detect.",
    sections: [
      { heading: "Why quantum helps with secrets", body: "To encrypt messages, two people first need a shared secret key: a string of random bits nobody else knows. Sent over an ordinary channel, those bits can be copied without leaving a trace. Qubits are different. An unknown quantum state can't be copied (the **no-cloning theorem**), and measuring it in the wrong basis changes it. BB84, proposed by Charles Bennett and Gilles Brassard in 1984, turns that fragility into a burglar alarm." },
      { heading: "The protocol", body: "1. For each qubit, Alice picks a random bit and a random basis: **Z** (|0⟩, |1⟩) or **X** (|+⟩, |−⟩).\n2. Bob picks his own random basis for each qubit and measures in it.\n3. Over a public channel they compare **bases, never bits**, and keep only the rounds where the bases matched. This step is called sifting.\n4. When the bases match, Bob's bit always equals Alice's. When they don't, Bob gets a coin flip, so those rounds are thrown away." },
      { heading: "This circuit", body: "Each qubit is one round, with the random choices written into the circuit. Alice uses `X` to send a 1 and `H` to switch to the X basis. Bob measuring in the X basis is an `H` just before measurement.\n\n- q0: Alice sends 0 in Z, Bob measures Z. Kept.\n- q1: Alice sends 1 in Z, Bob measures X. Thrown away.\n- q2: Alice sends 1 in X, Bob measures X. Kept.\n- q3: Alice sends 0 in X, Bob measures Z. Thrown away.\n- q4: Alice sends 1 in Z, Bob measures Z. Kept.\n- q5: Alice sends 0 in X, Bob measures X. Kept.\n\nq6 is Eve's notebook. She isn't listening yet, so it always reads 0. The shared key is q0, q2, q4, q5 = **0, 1, 1, 0**." },
      { heading: "Catching Eve", body: "Eve can't copy the qubits, so to learn anything she has to measure them, and she doesn't know Alice's bases. Whenever she guesses the wrong basis, she knocks the qubit into the other basis, and Bob's result turns into a coin flip even though his basis matched Alice's. Over many rounds that's a 25% error rate in the sifted key. Alice and Bob publicly compare a random sample of key bits; if too many disagree, they know someone listened, throw the key away and start again. In the circuit, a `CX` from a key qubit into q6 plays Eve: it records the qubit's Z value, which disturbs it exactly like a Z-basis measurement." },
    ],
    circuit: {
      qubits: 7,
      ops: [
        g("x", [1]), g("x", [2]), g("h", [2]), g("h", [3]), g("x", [4]), g("h", [5]), // Alice
        g("h", [1]), g("h", [2]), g("h", [5]), // Bob
      ],
    },
    observe: "Read each bitstring right to left (q0 first). q0, q2, q4 and q5 never change: they hold the key 0, 1, 1, 0. Only q1 and q3 flip, because those rounds used different bases and get thrown away. q6, Eve's notebook, stays 0.",
    tryIt: [
      "Let Eve listen to round q2: add a `CX` with q2 as control and q6 as target, after Alice's `H` and before Bob's `H`. How often is q2 wrong now?",
      "Move Eve to round q4 instead, a Z-basis round. Does the key change? Why do Alice and Bob need to check many bits, not just one?",
    ],
    check: { q: "Why can't Eve just copy each qubit and measure her copy later?", options: ["Unknown quantum states can't be copied (no-cloning)", "Qubits travel faster than light", "Alice encrypts each qubit first", "Bob always measures before Eve can"], answer: 0, why: "The no-cloning theorem rules out a perfect copy of an unknown state. Eve has to measure the original, and measuring in the wrong basis disturbs it, which Alice and Bob can detect." },
    predict: {
      q: "Rounds q1 and q3 used different bases for Alice and Bob. What will Bob read on those qubits?",
      options: ["Always Alice's bit", "Always the opposite of Alice's bit", "A random 0 or 1, 50/50", "Always 0"],
      answer: 2,
      feedback: [
        "Only matching bases guarantee that. A Z-basis state measured in the X basis, or the reverse, gives a coin flip.",
        "There's no systematic flip. With mismatched bases the result is completely random, so it carries no information about Alice's bit.",
        "Right. A Z-basis state measured in the X basis, or the reverse, is a perfect coin flip. That's why these rounds are thrown away during sifting.",
        "Nothing forces 0. q1 starts as |1⟩ and q3 as |+⟩, and measured in the other basis each gives 0 or 1 with equal odds.",
      ],
    },
  },
  {
    id: "s8", track: "student", title: "Is entanglement real? The Bell test", minutes: 14, skill: "Bell inequalities", requires: ["s4"],
    summary: "If entangled pairs secretly carried pre-agreed answers, a score called S could never exceed 2. Real quantum pairs score about 2.83.",
    sections: [
      { heading: "Hidden instructions?", body: "Entangled qubits always agree when they're measured the same way. Einstein suspected a boring explanation: perhaps each pair leaves the source carrying a hidden instruction sheet, like twins who agreed on their answers in advance. In 1964 John Bell showed that this idea makes a testable prediction, and that quantum mechanics disagrees with it." },
      { heading: "The CHSH game", body: "Alice measures her qubit along one of two directions (a₀ or a₁), and Bob along one of two (b₀ or b₁). For each combination they compute an agreement score:\n\n```\nE = P(same result) − P(different result)\nS = E(a₀,b₀) + E(a₀,b₁) + E(a₁,b₀) − E(a₁,b₁)\n```\n\nWith hidden instruction sheets, S can never be larger than 2, whatever the sheets say. Quantum mechanics allows up to 2√2 ≈ 2.83, which is called Tsirelson's bound." },
      { heading: "This circuit", body: "Four Bell pairs, one for each combination of settings: A (q0, q1), B (q2, q3), C (q4, q5) and D (q6, q7). Measuring along an angle θ is an `Ry(−θ)` just before measurement. Alice uses a₀ = 0 and a₁ = π/2; Bob uses b₀ = π/4 and b₁ = −π/4. For these pairs E = cos(θ_Alice − θ_Bob), so pairs A, B and C score +0.71 and pair D scores −0.71, giving S ≈ 2.83. The Bell score panel under the results does the arithmetic." },
      { heading: "Why it matters", body: "Experiments since the 1970s have measured S above 2, closing loophole after loophole, and the 2022 Nobel Prize in Physics went to Alain Aspect, John Clauser and Anton Zeilinger for this work. Entanglement-based key distribution (Ekert's E91 protocol) uses the same test: if S drops to 2 or below, someone has disturbed the pairs." },
    ],
    circuit: {
      qubits: 8,
      ops: [
        g("h", [0]), g("cx", [1], [0]), g("h", [2]), g("cx", [3], [2]),
        g("h", [4]), g("cx", [5], [4]), g("h", [6]), g("cx", [7], [6]),
        g("ry", [1], [], [-PI / 4]), // A: Alice 0, Bob π/4
        g("ry", [3], [], [PI / 4]), // B: Alice 0, Bob −π/4
        g("ry", [4], [], [-PI / 2]), g("ry", [5], [], [-PI / 4]), // C: Alice π/2, Bob π/4
        g("ry", [6], [], [-PI / 2]), g("ry", [7], [], [PI / 4]), // D: Alice π/2, Bob −π/4
      ],
    },
    observe: "Pairs A, B and C agree about 85% of the time (E ≈ +0.71); pair D disagrees about 85% of the time (E ≈ −0.71). The Bell score adds them up to about 2.83, comfortably above the classical limit of 2.",
    tryIt: [
      "Set every `Ry` angle to 0, so Alice and Bob always measure the same way. Predict S before you run.",
      "Turn Bob's angles up to ±π/2: give q1 and q5 `Ry(−π/2)`, and q3 and q7 `Ry(π/2)`. Does S grow or shrink? Why is π/4 the sweet spot?",
    ],
    check: { q: "What does a measured S of about 2.83 rule out?", options: ["Pairs carrying pre-agreed answers (local hidden variables)", "Quantum mechanics", "Any correlation between the qubits", "Randomness in each single result"], answer: 0, why: "Any hidden-instruction model scores at most 2, so measuring 2.83 means no such instruction sheet can explain the results. Each single result is still random, so the correlation can't be used to send a message." },
    predict: {
      q: "Hidden instruction sheets can score at most S = 2. What will these entangled pairs score?",
      options: ["Exactly 2, the same as instruction sheets", "About 2.83, above the classical limit", "4, the largest value the formula allows", "About 0, because every single result is random"],
      answer: 1,
      feedback: [
        "Instruction sheets top out at 2, but entanglement isn't an instruction sheet. These pairs go beyond it.",
        "Right. Each pair is individually random, yet the correlations reach 2√2 ≈ 2.83, which no pre-agreed answers can match.",
        "The formula allows 4, but quantum mechanics stops at 2√2 ≈ 2.83 (Tsirelson's bound). Reaching 4 would need correlations stranger than quantum ones.",
        "Each single result is random, but the pairs are strongly correlated. S measures the correlations, not the individual results.",
      ],
    },
    readout: { kind: "bell" },
  },
```

- [ ] **Step 5: Write the readout component**

`src/components/lab/LessonReadout.tsx`:
```tsx
import type { Readout } from "@/lib/curriculum";
import { bellScore } from "@/lib/explain";
import type { RunResult } from "@/lib/quantum";

const PAIRS = ["A (q0, q1)", "B (q2, q3)", "C (q4, q5)", "D (q6, q7)"];

/** Lesson-specific arithmetic on the measured counts, so the punchline is a number, not homework. */
export default function LessonReadout({ readout, result }: { readout: Readout; result: RunResult }) {
  if (readout.kind === "bell") {
    const { E, S } = bellScore(result.counts);
    return (
      <section className="rounded-xl bg-white/5 p-3 text-sm" aria-label="Bell score">
        <p className="font-semibold">🔔 Bell score</p>
        <ul className="mt-1 grid gap-1 sm:grid-cols-2">
          {E.map((e, p) => <li key={p}>Pair {PAIRS[p]}: E = {e.toFixed(2)}</li>)}
        </ul>
        <p role="status" className="mt-2">
          S = E(A) + E(B) + E(C) − E(D) = <b>{S.toFixed(2)}</b>.{" "}
          {S > 2.1
            ? "That's above 2: no hidden instruction sheet can produce these correlations."
            : "That's not clearly above 2 (results wobble by about ±0.1 from run to run), so hidden instruction sheets could still explain it. Check the angles, or noise may have washed out the entanglement."}
          {" "}Classical limit 2, quantum limit 2√2 ≈ 2.83.
        </p>
      </section>
    );
  }
  return null;
}
```

- [ ] **Step 6: Render it in both lesson views**

In `src/app/(platform)/learn/[module]/page.tsx`:
- Add the import `import LessonReadout from "@/components/lab/LessonReadout";`.
- Directly after the `<IdealVsMachine … />` line, add:
  ```tsx
              {m.readout && <LessonReadout readout={m.readout} result={result} />}
  ```

In `src/qollab/Player.tsx`:
- Add the same import.
- Directly after the `<IdealVsMachine … />` line inside `Lesson`, add the same line.

- [ ] **Step 7: Run the checks to verify they pass**

Run: `npm run check:lessons`
Expected: `js: all checks passed`, then `lessons: 20 circuits ran; physics checks passed`.

Then run: `npx tsc --noEmit && npm run lint && npm run build && npm run qollab:build`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/curriculum.ts src/lib/explain.ts src/components/lab/LessonReadout.tsx "src/app/(platform)/learn/[module]/page.tsx" src/qollab/Player.tsx backend/check_lessons.py scripts/check.ts package.json
git commit -m "Add BB84 and Bell test lessons with a Bell score readout"
```

---

### Task 9: Shor's algorithm lesson

**Files:**
- Modify: `src/lib/curriculum.ts`: widen `Readout`, and append module `r7` after `r6`
- Modify: `src/lib/explain.ts`: `registerCounts` and `shorFactors`, after `bellScore`
- Modify: `src/components/lab/LessonReadout.tsx`: the `shor` branch
- Modify: `src/lib/quantum.ts`: the `cswap` entry in `GATES` (not in `PALETTE`)
- Modify: `src/components/lab/CircuitEditor.tsx`: draw `cswap` like `swap`
- Modify: `backend/check_lessons.py`: the Shor physics check
- Modify: `scripts/check.ts`: the helper checks and predicted ids

**Interfaces:**
- Consumes: `Readout`, `LessonReadout` and `check_lessons.py` from Task 8.
- Produces:
  - `Readout = { kind: "bell" } | { kind: "shor"; a: number; N: number; counting: number[] }`
  - `registerCounts(counts: Record<string, number>, qubits: number[]): Record<number, number>`
  - `shorFactors(y: number, bits: number, a: number, N: number): { r: number | null; factors: [number, number] | null; note: string }`

Verified on the engine before writing this task: the counting register reads only 0, 4, 8 and 12, about 25% each. The work register takes the values {1, 4, 7, 13}. The ×7 and ×4 mod 15 blocks are correct for every y from 1 to 14.

- [ ] **Step 1: Write the failing checks**

In `scripts/check.ts`:
- Add `registerCounts` and `shorFactors` to the `@/lib/explain` import.
- Change the predicted-ids assertion to `["s2", "s4", "s5", "s7", "s8", "d4", "r3", "r7"]`.
- Add these lines before the `// Every lesson circuit` block:

```ts
assert.deepEqual(registerCounts({ "00010100": 3, "11110100": 2 }, [0, 1, 2, 3]), { 4: 5 });
assert.deepEqual(shorFactors(4, 4, 7, 15).factors, [3, 5]);
assert.deepEqual(shorFactors(12, 4, 7, 15).factors, [3, 5]);
assert.equal(shorFactors(8, 4, 7, 15).r, 2); // phase 1/2 suggests r = 2, but 7² mod 15 = 4, so it fails the check
assert.equal(shorFactors(8, 4, 7, 15).factors, null);
assert.equal(shorFactors(0, 4, 7, 15).r, null);
```

In `backend/check_lessons.py`, add before the final `print`:
```python
    # Shor, N = 15, a = 7: the counting register (q0..q3) reads only y = 0, 4, 8, 12, each about a quarter of the time.
    c = counts["r7"]
    reg = {}
    for k, v in c.items():
        y = sum(1 << q for q in range(4) if k[-1 - q] == "1")
        reg[y] = reg.get(y, 0) + v
    assert set(reg) == {0, 4, 8, 12}, reg
    assert all(0.2 < v / 4000 < 0.3 for v in reg.values()), reg
```

- [ ] **Step 2: Run the checks to verify they fail**

Run: `npm run check:lessons`
Expected: FAIL. esbuild reports `No matching export in "src/lib/explain.ts" for import "registerCounts"`.

- [ ] **Step 3: Add the helpers**

In `src/lib/explain.ts`, after `bellScore`, add:
```ts
/** How often each integer appeared in a register of `qubits` (qubits[0] is the register's lowest bit). */
export function registerCounts(counts: Record<string, number>, qubits: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    const y = qubits.reduce((acc, q, i) => acc + (k[k.length - 1 - q] === "1" ? 1 << i : 0), 0);
    out[y] = (out[y] ?? 0) + v;
  }
  return out;
}

const gcd = (x: number, y: number): number => (y ? gcd(y, x % y) : Math.abs(x));
const modPow = (a: number, e: number, n: number) => {
  let x = 1;
  for (let i = 0; i < e; i++) x = (x * a) % n;
  return x;
};

/** Shor's classical step for one measured value y of a `bits`-qubit counting register: phase → period r → factors. */
export function shorFactors(y: number, bits: number, a: number, N: number): { r: number | null; factors: [number, number] | null; note: string } {
  if (y === 0) return { r: null, factors: null, note: "Phase 0 says nothing about the period. Run again." };
  const phase = y / 2 ** bits;
  let r = 1;
  let best = Infinity;
  for (let d = 1; d < N; d++) {
    const err = Math.abs(phase - Math.round(phase * d) / d);
    if (err < best - 1e-12) {
      best = err;
      r = d;
    }
  }
  const ar = modPow(a, r, N);
  if (ar !== 1) return { r, factors: null, note: `${a}^${r} mod ${N} = ${ar}, not 1, so ${r} isn't the period. Run again.` };
  if (r % 2) return { r, factors: null, note: `r = ${r} is odd, so the gcd trick doesn't apply. Try another a.` };
  const f = gcd(modPow(a, r / 2, N) - 1, N);
  if (f === 1 || f === N) return { r, factors: null, note: `${a}^${r / 2} ≡ −1 mod ${N}, which gives only trivial factors. Try another a.` };
  return { r, factors: [f, N / f], note: `${N} = ${f} × ${N / f}` };
}
```

- [ ] **Step 4: Add the lesson**

In `src/lib/curriculum.ts`, change the `Readout` type to:
```ts
export type Readout = { kind: "bell" } | { kind: "shor"; a: number; N: number; counting: number[] };
```
Append this module after module `r6` (the last researcher module):
```ts
  {
    id: "r7", track: "researcher", title: "Shor's algorithm: factoring 15", minutes: 18, skill: "Shor's algorithm", requires: ["r4"],
    summary: "Factoring reduces to finding the period of aˣ mod N. Phase estimation finds that period, and a little classical number theory turns it into factors: 15 = 3 × 5.",
    sections: [
      { heading: "From factoring to a period", body: "To factor N, pick a number a that shares no factor with N and look at the sequence aˣ mod N. For N = 15 and a = 7:\n\n```\n7⁰ = 1, 7¹ = 7, 7² = 49 ≡ 4, 7³ ≡ 13, 7⁴ ≡ 1, …\n```\n\nIt repeats with **period r = 4**. When r is even, gcd(a^(r/2) − 1, N) and gcd(a^(r/2) + 1, N) are usually factors of N: gcd(48, 15) = 3 and gcd(50, 15) = 5. Finding r is the hard part for big N, and it's the only part the quantum computer does." },
      { heading: "Phase estimation finds the period", body: "Let U multiply a 4-qubit register by 7 mod 15. With the work register starting at |1⟩, phase estimation with U, U², U⁴ and U⁸ writes y/16 ≈ s/r into the counting register, for a random s. Here r = 4, so the counting register reads y = 0, 4, 8 or 12 (phases 0, ¼, ½, ¾), each about a quarter of the time. This is the QFT and phase estimation from earlier lessons, applied to modular multiplication." },
      { heading: "This circuit, and its shortcut", body: "Counting qubits are q0–q3; the work register is q4–q7, with q4 as its lowest bit, starting at |1⟩. Multiplying by 7 mod 15 takes three controlled `SWAP`s and four controlled `X`s. Multiplying by 4 (that's U²) takes two controlled `SWAP`s. Because 7⁴ ≡ 1, U⁴ and U⁸ do nothing, so they're left out.\n\nThat's a shortcut: we used the answer to build the circuit. Factoring a large number needs general modular-multiplication circuits that don't know r in advance, which is why breaking a 2048-bit RSA key needs a large, fault-tolerant quantum computer. The inverse QFT at the end turns the phase into a readable number." },
      { heading: "From measurement to factors", body: "Each run gives one y. Turn y/16 into the nearest fraction s/r with r < 15, check that 7ʳ ≡ 1 mod 15, and if r is even compute the gcds. y = 4 or 12 gives r = 4 and the factors 3 and 5. y = 8 suggests r = 2, which fails the check, and y = 0 says nothing. Either way you run again: Shor's algorithm succeeds with good probability on each run, not every time. The panel under the results does this arithmetic for the values you measured." },
    ],
    circuit: {
      qubits: 8,
      ops: [
        g("x", [4]), g("h", [0]), g("h", [1]), g("h", [2]), g("h", [3]),
        // U = ×7 mod 15, controlled by q0
        g("cswap", [4, 5], [0]), g("cswap", [5, 6], [0]), g("cswap", [6, 7], [0]),
        g("cx", [4], [0]), g("cx", [5], [0]), g("cx", [6], [0]), g("cx", [7], [0]),
        // U² = ×4 mod 15, controlled by q1. U⁴ = U⁸ = ×1, so q2 and q3 control nothing.
        g("cswap", [5, 7], [1]), g("cswap", [4, 6], [1]),
        // inverse QFT on q0–q3
        g("swap", [0, 3]), g("swap", [1, 2]),
        g("h", [0]),
        g("cp", [1], [0], [-PI / 2]), g("h", [1]),
        g("cp", [2], [0], [-PI / 4]), g("cp", [2], [1], [-PI / 2]), g("h", [2]),
        g("cp", [3], [0], [-PI / 8]), g("cp", [3], [1], [-PI / 4]), g("cp", [3], [2], [-PI / 2]), g("h", [3]),
      ],
    },
    observe: "Look at the right-most four bits of each outcome (the counting register, q3…q0): only 0000, 0100, 1000 and 1100 appear, each about a quarter of the time. That's y = 0, 4, 8 and 12. The panel below turns y = 4 and y = 12 into 15 = 3 × 5.",
    tryIt: [
      "Open the Qiskit tab and look at the transpiled CX count. That's what this tiny 15 = 3 × 5 needs. What does it suggest about a 2048-bit number?",
      "Run it with noise (the Lab's noise sliders, or an IBM or IonQ machine on Qollab). Do 0, 4, 8 and 12 still stand out, and does the panel still find 3 × 5?",
    ],
    check: { q: "Which part of Shor's algorithm needs the quantum computer?", options: ["Finding the period r of aˣ mod N", "Computing the gcds that give the factors", "Choosing the number a", "Checking that the factors multiply to N"], answer: 0, why: "Everything except period finding is fast on an ordinary computer. Phase estimation finds the period far faster than any known classical method, and that's the whole speed-up." },
    predict: {
      q: "The period of 7ˣ mod 15 is 4. What will the 4-bit counting register read?",
      options: ["Always 4 (0100)", "0, 4, 8 or 12, each about a quarter of the time", "Every value from 0 to 15 equally often", "The factors 3 and 5"],
      answer: 1,
      feedback: [
        "The register holds y/16 ≈ s/r for a random s, not r itself. With r = 4, s can be 0, 1, 2 or 3, giving y = 0, 4, 8 or 12.",
        "Right. y/16 lands on s/4 for s = 0, 1, 2 or 3. Two of those (y = 4 and 12) reveal r = 4 directly, and the classical step then finds 3 × 5.",
        "Interference cancels every phase that isn't a multiple of 1/4. That's the inverse QFT's job, and only four values survive.",
        "The quantum part only finds the period. The factors come afterwards, from an ordinary gcd calculation.",
      ],
    },
    readout: { kind: "shor", a: 7, N: 15, counting: [0, 1, 2, 3] },
  },
```

- [ ] **Step 5: Draw cswap and name it**

In `src/lib/quantum.ts`, add after the `swap` entry of `GATES`:
```ts
  cswap: { label: "CSWAP", name: "Controlled swap (Fredkin)", controls: 1, targets: 2, params: 0, color: "#b388ff", group: "Multi", about: "Swaps two qubits when the control is |1⟩. Used for modular multiplication in Shor's algorithm." },
```
Leave `PALETTE` unchanged.

In `src/components/lab/CircuitEditor.tsx`, change `) : o.gate === "swap" ? (` to `) : o.gate === "swap" || o.gate === "cswap" ? (`. The control dot and the connecting line are already drawn for every gate's `controls`.

- [ ] **Step 6: Add the Shor readout**

In `src/components/lab/LessonReadout.tsx`:
- Change the explain import to `import { bellScore, registerCounts, shorFactors } from "@/lib/explain";`.
- Replace the final `return null;` with:

```tsx
  const reg = registerCounts(result.counts, readout.counting);
  const bits = readout.counting.length;
  const top = Object.entries(reg).sort((x, y) => y[1] - x[1]).slice(0, 4);
  return (
    <section className="rounded-xl bg-white/5 p-3 text-sm" aria-label="Shor's classical step">
      <p className="font-semibold">🧮 From measurements to factors (a = {readout.a}, N = {readout.N})</p>
      <ul role="status" className="mt-1 flex flex-col gap-1">
        {top.map(([ys, n]) => {
          const f = shorFactors(Number(ys), bits, readout.a, readout.N);
          return (
            <li key={ys}>
              y = {ys} ({Math.round((100 * n) / result.shots)}% of shots) → phase {ys}/{2 ** bits}
              {f.r ? `, r = ${f.r}` : ""}: <b>{f.note}</b>
            </li>
          );
        })}
      </ul>
    </section>
  );
```

- [ ] **Step 7: Run the checks to verify they pass**

Run: `npm run check:lessons`
Expected: `js: all checks passed`, then `lessons: 21 circuits ran; physics checks passed`.

Then run: `npx tsc --noEmit && npm run lint && npm run build && npm run qollab:build`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add src/lib/curriculum.ts src/lib/explain.ts src/components/lab/LessonReadout.tsx src/lib/quantum.ts src/components/lab/CircuitEditor.tsx backend/check_lessons.py scripts/check.ts
git commit -m "Add Shor's algorithm lesson with a factor-finding readout"
```

---

### Task 10: Project page story (README)

The README becomes the Qollab project page, which is the first thing judges read. Judging covers novelty and creativity, technical execution, impact potential, and documentation quality. The page also has to state "what problem it explores".

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the lesson set from Tasks 6–9: 21 lessons, 8 with predictions, plus the Bell and Shor readouts.
- Produces: the project-page text that Task 5 uploads.

- [ ] **Step 1: Rewrite the top of the README**

Replace everything from the first line `# Quantum Quest` up to, but not including, the line `## Features` with:

```markdown
# Quantum Quest

**Learn quantum computing by experiment.** Predict what a circuit will do, run it on real Qiskit simulators (including models of IBM and IonQ machines), and explain the gap between what you expected and what happened. From an 8-year-old's first coin flip to Shor's algorithm.

*This effort is supported by Qollab & IonQ.*

## The problem

Quantum computing is usually taught in one of two ways: linear algebra on a whiteboard, or apps that animate qubits without running anything real. Either way, learners end up repeating slogans ("a qubit is 0 and 1 at the same time", "a quantum computer tries every answer at once") without being able to predict what a circuit will actually do. And almost nobody gets to see how real, noisy hardware changes the answer, even though noise is the main thing holding the field back today.

## How Quantum Quest teaches

- **Predict → Run → Explain.** Lessons ask for a prediction before you run. The wrong options are the common misconceptions, and each one gets a targeted explanation, so a wrong guess becomes a lesson.
- **Every number is real.** Every circuit runs on Qiskit: Aer in the web app, and on Qollab the built-in simulator, IBM device noise models, or IonQ's Aria and Forte simulators.
- **Ideal vs this machine.** Each result is compared with the exact ideal answer, so noise becomes something you can see and measure, not a footnote.
- **One path for everyone.** Four tracks teach the same honest physics at different depths, from no maths at all to density matrices.
- **Hard topics, hands on.** Error correction (and whether it actually helps on today's machines), BB84 quantum key distribution, the Bell test, teleportation, Grover's search and Shor's algorithm all run as circuits you can edit, with panels that do the arithmetic: the Bell score, and the factors Shor's algorithm finds.

| Track | For | Lessons |
|---|---|---|
| 🪐 Explorer | Ages 8–12, no maths | 7 planets of games with Qubit the Robot: coin flips, treasure clouds, entangled twins, a gate machine and a door race, all running real circuits |
| 🎓 Student | High school and first-year university | Qubits and measurement, superposition and interference, phase, Bell states, teleportation, Deutsch–Jozsa, BB84 key distribution, the Bell test |
| 💻 Developer | Programmers new to quantum | Qiskit and bit ordering, transpilation, shots and noise, Grover's search, the QFT, variational circuits |
| 🔬 Researcher | Graduate level | Density matrices, noise and mitigation, the bit-flip code, phase estimation, VQE and QAOA, benchmarking, Shor's algorithm |

The 21 Student, Developer and Researcher lessons run on Qollab. The Explorer games, community sharing and the Claude tutor need the full web app.

```

- [ ] **Step 2: Update the counts and credits**

- In `## Features`, change `**Course modules**: 18 lessons. Each has a runnable circuit, "what to look for" notes, experiments to try and a check question.` to `**Course modules**: 21 lessons. Each has a runnable circuit, "what to look for" notes, experiments to try and a check question, and eight start with a prediction.`
- In `## Run it on Qollab`, change `All 18 Student, Developer and Researcher lessons` to `All 21 Student, Developer and Researcher lessons`.
- In `## Disclosure`, replace the paragraph that starts `**Circuits.**` with:

```markdown
**Circuits.** The example circuits are standard, published constructions, not original algorithms: Bell and GHZ states, Grover search, Deutsch–Jozsa, teleportation, the QFT, phase estimation, the 3-qubit bit-flip code, BB84 (Bennett and Brassard, 1984), the CHSH Bell test (Clauser, Horne, Shimony and Holt, 1969) and Shor's algorithm (Shor, 1994). They follow the standard textbook treatments in Nielsen and Chuang's *Quantum Computation and Quantum Information*. The compiled ×7 and ×4 mod 15 circuits in the Shor lesson follow the construction in the Qiskit textbook. The lesson text, predictions and explanations are our own. Our contribution is the learning platform built around these circuits.
```

- [ ] **Step 3: Verify**

Run: `grep -n "18 lessons\|All 18" README.md`
Expected: no output.

Run: `npm run qollab:build`
Expected: the build succeeds, still with the `TODO(team)` warning until Task 5. Then `wc -c dist/qollab/README.md` must be under 65000, Qollab's write-up limit.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Tell the project story on the README / Qollab project page"
```

---

### Task 11: Wrap-up

**Files:**
- Delete: `scripts/qollab-smoke/` and the `qollab:smoke` script in `package.json`
- Modify: `HACKATHON.md`: section 7

- [ ] **Step 1: Remove the throwaway test**

```bash
git rm -r scripts/qollab-smoke
```
Delete the `"qollab:smoke"` line from `package.json`.

- [ ] **Step 2: Run the full check**

Run: `npm run check:py && npm run check:js && npx tsc --noEmit && npm run lint && npm run build && RELEASE=1 npm run qollab:build`
Expected: all pass.

- [ ] **Step 3: Re-publish if Task 6 or 7 shipped**

Upload `dist/qollab.zip` to the published project: Code tab, edit mode, **Erase first**, then Unpack. A re-upload skips `README.md`, so paste the README into the Project Card write-up. Then **Publish** the new version.

- [ ] **Step 4: Commit and hand off**

```bash
git add -A package.json HACKATHON.md
git commit -m "Remove Qollab bridge test; final checks"
```
Ask the user whether to push `qollab-lesson-player` and open a PR into `main`.
