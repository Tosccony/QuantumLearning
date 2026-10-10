// Runnable checks for the logic the Qollab player depends on. Run: npm run check:js
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { MODULES } from "@/lib/curriculum";
import { firstStartable, roadmapTopics, sanitizePersonal, topicStatus } from "@/lib/roadmaps";
import type { State } from "@/lib/progress";
import { bellScore, noiseVisible, onesRate, pairCorrelation, registerCounts, shorFactors, shotNoiseTvd, tvd } from "@/lib/explain";
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
assert.deepEqual(predicted.map((m) => m.id), ["s2", "s4", "s5", "s7", "s8", "d4", "r3", "r7"]);
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
assert.equal(noiseVisible({ counts: { "00": 500, "11": 490, "01": 34 }, probabilities: { "00": 0.5, "11": 0.5 }, shots: 1024 }), true); // a leaked outcome is decisive
assert.equal(noiseVisible({ counts: { "00": 512, "11": 512 }, probabilities: { "00": 0.5, "11": 0.5 }, shots: 1024 }), false);
assert.equal(noiseVisible({ counts: Object.fromEntries(Object.keys(uniform).map((k) => [k, 32])), probabilities: uniform, shots: 1024 }), false);
assert.equal(onesRate({ "10": 30, "01": 70 }, 0), 0.7); // q0 is the last character
assert.equal(onesRate({ "10": 30, "01": 70 }, 1), 0.3);

assert.ok(Math.abs(pairCorrelation({ "00": 85, "01": 15 }, 0, 1) - 0.7) < 1e-12);
assert.equal(bellScore({ "00000000": 100 }).S, 2); // everyone agrees: exactly the classical limit
assert.equal(bellScore({ "10000000": 100 }).S, 4); // pair D always disagrees: the formula's maximum

assert.deepEqual(registerCounts({ "00010100": 3, "11110100": 2 }, [0, 1, 2, 3]), { 4: 5 });
assert.deepEqual(shorFactors(4, 4, 7, 15).factors, [3, 5]);
assert.deepEqual(shorFactors(12, 4, 7, 15).factors, [3, 5]);
assert.equal(shorFactors(8, 4, 7, 15).r, 2); // phase 1/2 suggests r = 2, but 7² mod 15 = 4, so it fails the check
assert.equal(shorFactors(8, 4, 7, 15).factors, null);
assert.equal(shorFactors(0, 4, 7, 15).r, null);
assert.equal(shorFactors(2, 4, 7, 15).r, 8); // phase 1/8 → r = 8, a multiple of the true period 4
assert.equal(shorFactors(2, 4, 7, 15).factors, null);
assert.match(shorFactors(2, 4, 7, 15).note, /multiple of the true period/);
assert.match(shorFactors(8, 4, 14, 15).note, /≡ −1/); // a = 14 ≡ −1: r = 2 and 14¹ ≡ −1 mod 15

// Every lesson circuit, for backend/check_lessons.py to run through the real engine.
mkdirSync("dist", { recursive: true });
writeFileSync("dist/lessons.json", JSON.stringify(Object.fromEntries(MODULES.map((m) => [m.id, m.circuit]))));

// Concepts IDs retain their original prefixes, and prerequisites cross tracks.
// Neither must prevent the roadmap from rendering or unlocking correctly.
const concepts = roadmapTopics("concepts");
assert.deepEqual(concepts.map(t => t.id), ["s7", "s8", "r7"]);
const emptyProgress = { modules: {}, levels: {} } as State;
for (const topic of concepts) {
  assert.equal(topicStatus(emptyProgress, topic), "locked");
  const prerequisiteProgress = { ...emptyProgress, modules: Object.fromEntries(topic.requires.map(id => [id, { completedAt: "2026-10-10", correct: true }])) };
  assert.equal(topicStatus(prerequisiteProgress, topic), "available");
  const completedProgress = { ...prerequisiteProgress, modules: { ...prerequisiteProgress.modules, [topic.id]: { completedAt: "2026-10-10", correct: true } } };
  assert.equal(topicStatus(completedProgress, topic), "done");
}

// "Start prerequisites" lands on the first lesson actually startable on the way to the blocker.
assert.equal(firstStartable(emptyProgress, "r4"), "r1");
assert.equal(firstStartable(emptyProgress, "s3"), "s1");
const doneThrough = (ids: string[]) => ({ ...emptyProgress, modules: Object.fromEntries(ids.map(id => [id, { completedAt: "2026-10-10", correct: true }])) }) as State;
assert.equal(firstStartable(doneThrough(["s1", "s2", "s3"]), "s3"), null);
assert.equal(firstStartable(doneThrough(["s1", "s2", "s3"]), "s4"), "s4");

// Malformed stored notes are dropped, never thrown.
assert.deepEqual(sanitizePersonal({ s1: { reviewed: 5, note: 3, bookmarked: true } }), { s1: { bookmarked: true } });
assert.deepEqual(sanitizePersonal([1]), {});
assert.deepEqual(sanitizePersonal(null), {});
assert.deepEqual(sanitizePersonal({ s1: { reviewed: ["a", 2] } }), { s1: { reviewed: ["a"] } });

const poisoned = sanitizePersonal(JSON.parse('{"__proto__":{"bookmarked":true},"s1":{"started":true}}'));
assert.deepEqual(poisoned, { s1: { started: true } });
assert.equal(Object.getPrototypeOf(poisoned), Object.prototype);

console.log("js: all checks passed");
