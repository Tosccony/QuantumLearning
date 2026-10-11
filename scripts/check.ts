// Runnable checks for the logic the Qollab player depends on. Run: npm run check:js
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { codeCircuit, DEFAULT_INJECTION, expected, explainProof, INJECTIONS, readProof, START } from "@/lib/breakTheCode";
import { MODULES, moduleById, R3_CORRECT, R3_ENCODE, R3_ERROR, TRACKS } from "@/lib/curriculum";
import { angleCircuit, banknoteCircuit, correctProb, exactCorrectDist, lockCircuit, p1 } from "@/lib/quantumMoney";
import { firstStartable, roadmapTopics, sanitizePersonal, topicStatus } from "@/lib/roadmaps";
import type { State } from "@/lib/progress";
import { planetStatus, trackProgress } from "@/lib/skills";
import { bellScore, bitOf, noiseVisible, onesRate, pairCorrelation, registerCounts, shorFactors, shotNoiseTvd, tvd } from "@/lib/explain";
import { QuantumServiceError, type RunResult } from "@/lib/quantum";
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

// Break the Code: the r3 circuit is its "X on q1" case, and the syndromes follow the lesson's table.
assert.deepEqual(codeCircuit(INJECTIONS.find((i) => i.id === "q1")!), moduleById("r3")!.circuit);
assert.deepEqual(INJECTIONS.map((i) => [expected(i).syndrome, expected(i).fixes, expected(i).recovered]), [
  ["00", null, true], ["10", 0, true], ["11", 1, true], ["01", 2, true], ["01", 2, false], // two errors look like one on q2
]);
// Bitstrings are q4 q3 q2 q1 q0: the syndrome is (q3, q4), the majority reading wins under noise.
const fake = { counts: { "11000": 90, "11001": 10, "01000": 4 }, probabilities: { "11000": 0.85, "11001": 0.15 }, shots: 104, bloch: [START], transpiled: { gate_counts: { cx: 22 } } } as unknown as RunResult;
const proof = readProof(fake);
assert.equal(proof.syndrome, "11");
assert.equal(proof.fixes, 1);
assert.equal(proof.recovered, true);
assert.ok(Math.abs(proof.exactOne - 0.15) < 1e-12 && Math.abs(proof.measuredOne - 10 / 104) < 1e-12);
// The syndrome share divides by the counts' own total, not by `shots`.
assert.equal(readProof({ ...fake, shots: 1024 }).syndromeShare, 100 / 104);
assert.deepEqual(moduleById("r3")!.circuit.ops, [...R3_ENCODE, ...R3_ERROR, ...R3_CORRECT]);
assert.equal(moduleById("r3")!.extra, "breakTheCode");
assert.equal(DEFAULT_INJECTION, INJECTIONS[2]);
assert.equal(bitOf("10110", 0), "0"); // little-endian: q0 is the last character
assert.equal(bitOf("10110", 4), "1");
// Offline explainer: the expected chain, the noise caveat only when the measured syndrome differs, and level detail.
const noisy = { ...fake, counts: { "01000": 60, "11000": 40 }, shots: 100 } as unknown as RunResult;
assert.match(explainProof(DEFAULT_INJECTION, fake, "beginner"), /syndrome reads 11/);
assert.doesNotMatch(explainProof(DEFAULT_INJECTION, fake, "beginner"), /noise/);
assert.match(explainProof(DEFAULT_INJECTION, noisy, "beginner"), /most common measured syndrome was 10[\s\S]*noise[\s\S]*X on q0/);
assert.match(explainProof(DEFAULT_INJECTION, fake, "intermediate"), /Bloch/);
assert.match(explainProof(DEFAULT_INJECTION, fake, "advanced"), /Z₀Z₁[\s\S]*Z₁Z₂[\s\S]*distance-3[\s\S]*TVD/);
assert.match(explainProof(INJECTIONS[4], fake, "beginner"), /syndrome reads 01/);
assert.equal(readProof({ ...fake, bloch: [[START[0], 0, -START[2]]] } as RunResult).recovered, false);

// The s7 lesson: a 6-qubit banknote with barriers between the phases, three demos, and the predict/check placed inline.
const s7 = moduleById("s7")!;
assert.equal(s7.track, "concepts");
assert.equal(s7.circuit.qubits, 6);
assert.equal(s7.circuit.ops.filter((o) => o.gate === "barrier").length, 2);
assert.deepEqual(s7.sections.map((s) => s.demo), ["qm-angle", "qm-lock", "qm-multi", undefined]);
assert.equal(s7.circuitPanel, false);
assert.ok(s7.sections.some((s) => s.predictHere) && s7.sections.some((s) => s.checkHere) && s7.sidebarNote);

// Quantum money demos: structure of each generated circuit.
const PI = Math.PI;
const opsOf = (c: ReturnType<typeof banknoteCircuit>, gate: string, params?: number[]) =>
  c.ops.filter((o) => o.gate === gate && (!params || o.params?.[0] === params[0])).map((o) => o.targets[0]);
const barrierAt = (c: ReturnType<typeof banknoteCircuit>) => c.ops.flatMap((o, i) => (o.gate === "barrier" ? [i] : []));
const bill = [1, 0, 1, 1, 0, 0, 1, 0], key = [1, 0, 0, 1, 1, 0, 1, 0], guess = [0, 0, 1, 1, 0, 1, 0, 0];
const bn = banknoteCircuit(bill, key, guess);
assert.equal(bn.qubits, 8);
assert.deepEqual(opsOf(bn, "x"), [0, 2, 3, 6]); // X exactly where a bill bit is 1
assert.deepEqual(opsOf(bn, "ry", [PI / 2]), [0, 3, 4, 6]); // Ry(π/2) where a key bit is 1
assert.deepEqual(opsOf(bn, "ry", [-PI / 2]), [2, 3, 5]); // Ry(−π/2) where a guessed bit is 1
assert.equal(bn.ops.filter((o) => o.gate === "ry").length, 7);
const bars = barrierAt(bn);
assert.equal(bars.length, 2); // set | lock | unlock
assert.ok(bn.ops.slice(0, bars[0]).every((o) => o.gate === "x"));
assert.ok(bn.ops.slice(bars[0] + 1, bars[1]).every((o) => o.gate === "ry" && o.params![0] === PI / 2));
assert.ok(bn.ops.slice(bars[1] + 1).every((o) => o.gate === "ry" && o.params![0] === -PI / 2));
assert.deepEqual(bn.ops[bars[0]].targets, [0, 1, 2, 3, 4, 5, 6, 7]); // a barrier spans every qubit
const lk = lockCircuit(1, 1, 0);
assert.equal(lk.qubits, 1);
assert.deepEqual(lk.ops.map((o) => o.gate), ["x", "barrier", "ry", "barrier"]);
assert.deepEqual(lockCircuit(0, 0, 1).ops.map((o) => o.gate), ["barrier", "barrier", "ry"]);
assert.deepEqual(angleCircuit(90).ops.map((o) => [o.gate, o.params]), [["ry", [PI / 2]]]);
assert.ok(Math.abs(p1(0)) < 1e-12 && Math.abs(p1(90) - 0.5) < 1e-12 && Math.abs(p1(180) - 1) < 1e-12 && Math.abs(p1(270) - 0.5) < 1e-12);
assert.ok(Math.abs(p1(60) - 0.25) < 1e-12);
// A matching key bit is always right; a mismatch is a coin flip.
assert.equal(correctProb(key, guess, 2), 0.5);
assert.equal(correctProb(key, guess, 3), 1);
const dist = exactCorrectDist(key, guess);
assert.equal(dist.length, 9);
assert.ok(Math.abs(dist.reduce((a, b) => a + b, 0) - 1) < 1e-12);
assert.deepEqual(exactCorrectDist([1, 0], [1, 0]), [0, 0, 1]); // right key: always all correct
assert.deepEqual(exactCorrectDist([1], [0]), [0.5, 0.5]);
// Circuits for backend/check_lessons.py: the right key, and the same bill with qubit 4's guess flipped.
const rightKey = banknoteCircuit(bill, key, key);
const wrongKey = banknoteCircuit(bill, key, key.map((b, i) => (i === 4 ? 1 - b : b)));

// Every lesson circuit and Break the Code case, for backend/check_lessons.py to run through the real engine.
mkdirSync("dist", { recursive: true });
writeFileSync("dist/lessons.json", JSON.stringify(Object.fromEntries([
  ...MODULES.map((m) => [m.id, m.circuit]),
  ...INJECTIONS.map((i) => [`btc-${i.id}`, codeCircuit(i)]),
  ["qm-right", rightKey],
  ["qm-wrong", wrongKey],
])));

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

// Explorer unlock rules live in planetStatus; roadmap topics point at their source instead of parsing ids.
const planet1Done = { ...emptyProgress, levels: { 1: { completed: true } } } as unknown as State;
assert.equal(planetStatus(emptyProgress, 1), "available");
assert.equal(planetStatus(emptyProgress, 2), "locked");
assert.equal(planetStatus(planet1Done, 1), "done");
assert.equal(planetStatus(planet1Done, 2), "available");
assert.equal(planetStatus(planet1Done, 3), "locked");
const onlyPlanet2 = { ...emptyProgress, levels: { 2: { completed: true } } } as unknown as State;
assert.equal(planetStatus(onlyPlanet2, 1), "available");
assert.equal(planetStatus(onlyPlanet2, 2), "done");
assert.equal(planetStatus(onlyPlanet2, 3), "available");
for (const st of [emptyProgress, planet1Done])
  for (const topic of roadmapTopics("explorer")) {
    assert.equal(topic.source.kind, "planet");
    if (topic.source.kind === "planet") assert.equal(topicStatus(st, topic), planetStatus(st, topic.source.id));
  }
assert.equal(roadmapTopics("student"), roadmapTopics("student")); // built once
for (const t of TRACKS)
  for (const topic of roadmapTopics(t.id)) {
    assert.equal(topic.source.kind, t.id === "explorer" ? "planet" : "module");
    if (topic.source.kind === "module") assert.ok(moduleById(topic.source.id), `${topic.id}: module source resolves`);
  }
// Roadmap done counts agree with the shared trackProgress.
const sample = { ...doneThrough(["s1", "s2", "d1"]), levels: { 1: { completed: true } } } as unknown as State;
const sample2 = { ...doneThrough(["s1", "s2", "s3", "s4", "r1"]), levels: { 1: { completed: true }, 2: { completed: true }, 3: { completed: true } } } as unknown as State;
for (const st of [sample, sample2])
  for (const t of TRACKS)
    assert.equal(roadmapTopics(t.id).filter(x => topicStatus(st, x) === "done").length, trackProgress(st, t.id).done, `${t.id}: done count`);

// Malformed stored notes are dropped, never thrown.
assert.deepEqual(sanitizePersonal({ s1: { reviewed: 5, note: 3, bookmarked: true } }), { s1: { bookmarked: true } });
assert.deepEqual(sanitizePersonal([1]), {});
assert.deepEqual(sanitizePersonal(null), {});
assert.deepEqual(sanitizePersonal({ s1: { reviewed: ["a", 2] } }), { s1: { reviewed: ["a"] } });

const poisoned = sanitizePersonal(JSON.parse('{"__proto__":{"bookmarked":true},"s1":{"started":true}}'));
assert.deepEqual(poisoned, { s1: { started: true } });
assert.equal(Object.getPrototypeOf(poisoned), Object.prototype);

console.log("js: all checks passed");
