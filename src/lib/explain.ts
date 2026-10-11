import { formatAngle, GATES, type Circuit, type RunResult } from "./quantum";

export type Level = "beginner" | "intermediate" | "advanced";

/** Everything the AI tutor knows about the learner's current experiment, as plain text. */
export function labContext(c: Circuit, r: RunResult | null, extra = ""): string {
  const ops = c.ops
    .map((o, i) => `${i + 1}. ${o.gate}${o.params?.length ? `(${o.params.map(formatAngle).join(", ")})` : ""} ${o.controls?.length ? `controls=[${o.controls}] ` : ""}targets=[${o.targets}]`)
    .join("\n");
  const parts = [`Circuit: ${c.qubits} qubit(s), ${c.ops.length} op(s)\n${ops || "(empty)"}`];
  if (r) {
    const top = Object.entries(r.counts).sort((a, b) => b[1] - a[1]).slice(0, 16);
    parts.push(
      `Backend: ${r.backend}, ${r.shots} shots, Qiskit ${r.qiskit_version}`,
      `Diagram:\n${r.diagram}`,
      `Counts (top): ${top.map(([k, v]) => `${k}:${v}`).join(", ")}`,
      `Exact probabilities: ${Object.entries(r.probabilities).slice(0, 16).map(([k, v]) => `${k}:${v.toFixed(4)}`).join(", ")}`,
      `Bloch vectors (x,y,z) per qubit: ${r.bloch.map((b, q) => `q${q}=(${b.map((n) => n.toFixed(3)).join(",")})`).join(" ")}`,
      `Purity per qubit: ${r.purity.map((p, q) => `q${q}=${p.toFixed(3)}`).join(" ")}; entangled=${r.entangled}`,
      `Depth ${r.depth}; transpiled to ${r.transpiled.basis.join(",")}: depth ${r.transpiled.depth}, gates ${JSON.stringify(r.transpiled.gate_counts)}`,
    );
  } else parts.push("Not run yet.");
  if (extra) parts.push(extra);
  return parts.join("\n\n");
}

/** Qiskit bitstrings are little-endian: qubit q is the character q from the right. */
export const bitOf = (k: string, q: number) => k[k.length - 1 - q];

export const pct = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;
const pctAuto = (x: number) => pct(x, x < 0.1 ? 1 : 0);

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

/** Outcomes this run produced that a perfect machine never would (noise lands here first). */
export const leakedOutcomes = (r: Pick<RunResult, "counts" | "probabilities">) => Object.keys(r.counts).filter((k) => !(k in r.probabilities));

/** Noise beyond shot-to-shot wobble: an outcome a perfect machine never gives, or a TVD well above what finite shots explain. */
export function noiseVisible(r: Pick<RunResult, "counts" | "probabilities" | "shots">): boolean {
  return leakedOutcomes(r).length > 0 || tvd(r) > 3 * shotNoiseTvd(r) + 0.01;
}

/** Fraction of shots where qubit q read 1. Qiskit bitstrings are little-endian: q0 is the last character. */
export function onesRate(counts: Record<string, number>, q: number): number {
  let ones = 0;
  let shots = 0;
  for (const [k, v] of Object.entries(counts)) {
    shots += v;
    if (bitOf(k, q) === "1") ones += v;
  }
  return shots ? ones / shots : 0;
}

/** Agreement score E = P(same) − P(different) for qubits a and b: +1 always agree, −1 always disagree. */
export function pairCorrelation(counts: Record<string, number>, a: number, b: number): number {
  let shots = 0;
  let score = 0;
  for (const [k, v] of Object.entries(counts)) {
    shots += v;
    score += bitOf(k, a) === bitOf(k, b) ? v : -v;
  }
  return shots ? score / shots : 0;
}

/** CHSH score for the Bell-test lesson: pairs (q0,q1) (q2,q3) (q4,q5) (q6,q7), S = E₀ + E₁ + E₂ − E₃. */
export function bellScore(counts: Record<string, number>): { E: number[]; S: number } {
  const E = [0, 1, 2, 3].map((p) => pairCorrelation(counts, 2 * p, 2 * p + 1));
  return { E, S: E[0] + E[1] + E[2] - E[3] };
}

/** How often each integer appeared in a register of `qubits` (qubits[0] is the register's lowest bit). */
export function registerCounts(counts: Record<string, number>, qubits: number[]): Record<number, number> {
  const out: Record<number, number> = {};
  for (const [k, v] of Object.entries(counts)) {
    const y = qubits.reduce((acc, q, i) => acc + (bitOf(k, q) === "1" ? 1 << i : 0), 0);
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
  const half = modPow(a, r / 2, N);
  if (half === 1) return { r, factors: null, note: `${a}^${r / 2} mod ${N} is already 1, so r = ${r} is a multiple of the true period and gives only trivial factors. Run again.` };
  if (half === N - 1) return { r, factors: null, note: `${a}^${r / 2} ≡ −1 mod ${N}, which gives only trivial factors. Try another a.` };
  // a^r ≡ 1 with a^(r/2) ≢ ±1 guarantees gcd(a^(r/2) − 1, N) is a non-trivial factor.
  const f = gcd(half - 1, N);
  return { r, factors: [f, N / f], note: `${N} = ${f} × ${N / f}` };
}

/**
 * Deterministic explanation built from the real Qiskit results. Used when no Claude API
 * credentials are configured, so the "Understand" step always works.
 */
export function offlineExplain(c: Circuit, r: RunResult | null, level: Level): string {
  if (!c.ops.length) return "The circuit is empty. Every qubit starts in |0⟩, so measuring gives all zeros. Add an `H` gate to create your first superposition.";
  if (!r) return "Press **Run** first. I explain using the actual Qiskit results, not guesses.";

  const used = Array.from(new Set(c.ops.map((o) => o.gate)));
  const probs = Object.entries(r.probabilities).sort((a, b) => b[1] - a[1]);
  const hasH = used.some((g) => ["h", "ry", "rx", "sx", "initialize"].includes(g));
  const hasPhase = used.some((g) => ["z", "s", "t", "sdg", "tdg", "rz", "p", "cz", "cp", "crz"].includes(g));
  const two = used.filter((g) => (GATES[g]?.controls ?? 0) !== 0 || g === "swap");
  const shots = Object.values(r.counts).reduce((a, b) => a + b, 0);
  const totalShotDev = tvd(r); // includes outcomes the ideal machine never produces, which is where noise lands
  const noisy = noiseVisible(r);
  const idealCertain = probs.length === 1;
  const allSame = Object.keys(r.counts).length === 1;
  const out: string[] = [];

  if (level === "beginner") {
    out.push(`Your circuit uses ${used.map((g) => `\`${GATES[g]?.label ?? g}\``).join(", ")} on ${c.qubits} qubit${c.qubits > 1 ? "s" : ""}.`);
    if (idealCertain && allSame) out.push(`Every single shot gave **${probs[0][0]}**. The circuit sends the qubits to one definite answer${hasH ? ". The superposition in the middle was undone by interference, a bit like waves cancelling out" : ""}.`);
    else if (idealCertain) out.push(`A perfect machine would give **${probs[0][0]}** on every shot${hasH ? ", because interference cancels every other answer" : ""}. This run gave it on ${pctAuto((r.counts[probs[0][0]] ?? 0) / shots)} of shots, and the rest comes from noise in the machine.`);
    else out.push(`Results are spread over ${probs.length} answers. The most likely is **${probs[0][0]}** (${pctAuto(probs[0][1])}). Each run is like a fresh coin toss with these odds.${noisy ? " Some of the spread comes from noise in the machine, not just quantum randomness." : ""}`);
    if (r.entangled) out.push("The qubits are **entangled**: their answers are linked, so looking at one tells you about the other. That's why the Bloch arrows shrank toward the centre.");
    out.push(idealCertain ? "**Try:** remove one gate and predict what changes before you run it." : "**Try:** run it again. The counts wobble but stay close to the tick marks, which show the exact odds.");
  } else if (level === "intermediate") {
    out.push(`Statevector support: ${probs.slice(0, 6).map(([k, p]) => `|${k}⟩ (${p.toFixed(3)})`).join(", ")}${probs.length > 6 ? ", …" : ""}.`);
    if (hasH && idealCertain) out.push("You created superposition and then ended in a basis state. That is **interference**: amplitudes into the other outcomes cancelled.");
    if (hasPhase) out.push("Phase gates (`Z`, `S`, `T`, `Rz`, `CZ`, `CP`) don't change Z-basis probabilities directly. Their effect shows up only after a later basis change such as `H`.");
    out.push(`Bloch vectors: ${r.bloch.map((b, q) => `q${q} (${b.map((n) => n.toFixed(2)).join(", ")}), |r| = ${Math.hypot(...b).toFixed(2)}`).join("; ")}.`);
    if (r.entangled) out.push(`Some reduced states are mixed (purity ${r.purity.map((p) => p.toFixed(2)).join(", ")}). That signals entanglement created by ${two.map((g) => `\`${g}\``).join(", ") || "multi-qubit gates"}.`);
    out.push(
      noisy
        ? `Sampling: total-variation distance to the exact probabilities is ${totalShotDev.toFixed(3)} at ${shots} shots, more than shot noise explains, so the machine's noise is showing.`
        : `Sampling: total-variation distance between counts and exact probabilities is ${totalShotDev.toFixed(3)} at ${shots} shots. Expect it to shrink like 1/√shots.`,
    );
  } else {
    out.push(`Logical depth ${r.depth}, transpiled to {${r.transpiled.basis.join(", ")}}: depth ${r.transpiled.depth} with ${r.transpiled.gate_counts.cx ?? 0} CX. On hardware, two-qubit error rates of ~10⁻³–10⁻² per CX make that count the main fidelity driver.`);
    out.push(`Reduced-state purities: ${r.purity.map((p, q) => `q${q}: ${p.toFixed(3)}`).join(", ")}. ${r.entangled ? "Purity < 1 for a globally pure state means nonzero entanglement entropy across that cut." : "All marginals are pure, so the state is a product state (no entanglement)."}`);
    out.push(`Empirical TVD to the ideal distribution: ${totalShotDev.toFixed(3)} (${shots} shots${noisy ? ", noisy model, so this includes systematic error, not just shot noise" : ""}).`);
    if (noisy) out.push("To separate shot noise from model error, compare against the ideal run at higher shot counts. For mitigation, try readout-matrix inversion or zero-noise extrapolation over 2–3 noise levels.");
    out.push("**Next:** step through the circuit and watch where purity first drops. That is the gate that creates the correlations.");
  }
  return out.join("\n\n");
}
