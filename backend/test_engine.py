"""Self-checks for engine.py. Run: backend/.venv/bin/python backend/test_engine.py"""

import gc
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
        assert set(circuit.count_ops()) - {"barrier"} <= set(engine.GENERIC_BASIS), circuit.count_ops()  # measure_all adds a barrier directive
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

    used = FakeIonQ()
    engine.run(used, BELL)
    del used
    gc.collect()
    engine.run(FakeIonQ(), BELL)  # a dropped, used backend must not block a fresh one

    engine.run(NoTarget(), {"qubits": 3, "ops": [g("initialize", [0], params=[1, 1]), g("x", [1]), g("ccx", [2], [0, 1])]})

    print("engine: all checks passed")


if __name__ == "__main__":
    main()
