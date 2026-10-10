// Runnable checks for the logic the Qollab player depends on. Run: npm run check:js
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { MODULES } from "@/lib/curriculum";
import { bellScore, onesRate, pairCorrelation, shotNoiseTvd, tvd } from "@/lib/explain";
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

const predicted = MODULES.filter((m) => m.predict);
assert.deepEqual(predicted.map((m) => m.id), ["s2", "s4", "s5", "s7", "s8", "d4", "r3"]);
for (const m of predicted) {
  const p = m.predict!;
  assert.equal(p.options.length, p.feedback.length, `${m.id}: one feedback line per option`);
  assert.ok(p.answer >= 0 && p.answer < p.options.length, `${m.id}: answer in range`);
}

assert.equal(tvd({ counts: { "0": 512, "1": 512 }, probabilities: { "0": 0.5, "1": 0.5 } }), 0);
// Outcomes the ideal machine never produces must count as distance (noise lands there).
assert.ok(Math.abs(tvd({ counts: { "00": 900, "01": 100 }, probabilities: { "00": 1 } }) - 0.1) < 1e-12);
// 5 qubits, uniform, 1024 shots: shot noise alone gives ~0.07 TVD, so a 0.05 cutoff would cry "noise".
const uniform = Object.fromEntries(Array.from({ length: 32 }, (_, i) => [i.toString(2).padStart(5, "0"), 1 / 32]));
assert.ok(shotNoiseTvd({ probabilities: uniform, shots: 1024 }) > 0.05);
assert.equal(onesRate({ "10": 30, "01": 70 }, 0), 0.7); // q0 is the last character
assert.equal(onesRate({ "10": 30, "01": 70 }, 1), 0.3);

assert.ok(Math.abs(pairCorrelation({ "00": 85, "01": 15 }, 0, 1) - 0.7) < 1e-12);
assert.equal(bellScore({ "00000000": 100 }).S, 2); // everyone agrees: exactly the classical limit
assert.equal(bellScore({ "10000000": 100 }).S, 4); // pair D always disagrees: the formula's maximum

// Every lesson circuit, for backend/check_lessons.py to run through the real engine.
mkdirSync("dist", { recursive: true });
writeFileSync("dist/lessons.json", JSON.stringify(Object.fromEntries(MODULES.map((m) => [m.id, m.circuit]))));

console.log("js: all checks passed");
