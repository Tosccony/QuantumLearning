// Runnable checks for the logic the Qollab player depends on. Run: npm run check:js
import assert from "node:assert/strict";
import { MODULES } from "@/lib/curriculum";
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
assert.deepEqual(predicted.map((m) => m.id), ["s2", "s4", "s5", "d4", "r3"]);
for (const m of predicted) {
  const p = m.predict!;
  assert.equal(p.options.length, p.feedback.length, `${m.id}: one feedback line per option`);
  assert.ok(p.answer >= 0 && p.answer < p.options.length, `${m.id}: answer in range`);
}

console.log("js: all checks passed");
