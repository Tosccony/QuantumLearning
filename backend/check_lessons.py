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

    # Quantum money: q0, q1 (bank's own check) and q2, q3 (thief's lucky all-0 guess) come back deterministic;
    # q4, q5 (thief's all-0 guess against a real key of 1) are coin flips.
    c = counts["s7"]
    assert [ones(c, q) for q in (0, 1, 2, 3)] == [1, 0, 1, 0], c
    assert all(0.4 < ones(c, q) < 0.6 for q in (4, 5)), c

    # Bell test: E ≈ +0.71, +0.71, +0.71, -0.71, so S ≈ 2.83 (classical limit 2).
    c = counts["s8"]
    E = [corr(c, 2 * p, 2 * p + 1) for p in range(4)]
    S = E[0] + E[1] + E[2] - E[3]
    assert 2.7 < S < 2.95, (E, S)

    # Shor, N = 15, a = 7: the counting register (q0..q3) reads only y = 0, 4, 8, 12, each about a quarter of the time.
    c = counts["r7"]
    reg = {}
    for k, v in c.items():
        y = sum(1 << q for q in range(4) if k[-1 - q] == "1")
        reg[y] = reg.get(y, 0) + v
    assert set(reg) == {0, 4, 8, 12}, reg
    assert all(0.2 < v / 4000 < 0.3 for v in reg.values()), reg

    print(f"lessons: {len(counts)} circuits ran; physics checks passed")


if __name__ == "__main__":
    main(sys.argv[1])
