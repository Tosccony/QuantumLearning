"""Quantum Quest Qiskit service.

The circuit work lives in engine.py, which the Qollab project shares. This service adds request
validation and an optional Qiskit Aer noise model (depolarising + readout).
"""

from __future__ import annotations

from typing import Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from qiskit_aer import AerSimulator
from qiskit_aer.noise import NoiseModel, ReadoutError, depolarizing_error

import engine
from engine import MAX_OPS, MAX_QUBITS, MAX_SHOTS

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
