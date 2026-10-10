import { g, groverCircuit, type Circuit } from "./quantum";

export type TrackId = "explorer" | "student" | "developer" | "researcher";

export type Track = {
  id: TrackId;
  name: string;
  icon: string;
  color: string;
  audience: string;
  tagline: string;
  certificate: string;
};

export const TRACKS: Track[] = [
  { id: "explorer", name: "Explorer", icon: "🪐", color: "#ffd23f", audience: "Ages 8–12 · no maths", tagline: "Seven planets of games and stories with Qubit the Robot.", certificate: "Quantum Explorer" },
  { id: "student", name: "Student", icon: "🎓", color: "#7bdff2", audience: "High school & first-year university", tagline: "States, gates, entanglement and your first algorithms, with just enough maths.", certificate: "Quantum Foundations" },
  { id: "developer", name: "Developer", icon: "💻", color: "#3ddc97", audience: "Programmers new to quantum", tagline: "Qiskit, transpilation, shots and noise, and building Grover, QFT and variational circuits.", certificate: "Quantum Software Developer" },
  { id: "researcher", name: "Researcher", icon: "🔬", color: "#b388ff", audience: "Graduate level", tagline: "Density matrices, noise and mitigation, error correction, phase estimation and advantage.", certificate: "Quantum Research Practitioner" },
];

export type Check = { q: string; options: string[]; answer: number; why: string };

/** A prediction made before running. Each wrong option is a common misconception, answered in `feedback`. */
export type Predict = { q: string; options: string[]; answer: number; feedback: string[] };

export type Module = {
  id: string;
  track: Exclude<TrackId, "explorer">;
  title: string;
  minutes: number;
  summary: string;
  skill: string;
  requires: string[];
  sections: { heading: string; body: string }[];
  circuit: Circuit;
  observe: string; // what to look for after running
  tryIt: string[];
  check: Check;
  predict?: Predict;
  compare?: Circuit;
};

const PI = Math.PI;

export const MODULES: Module[] = [
  // ------------------------------------------------------------------ Student
  {
    id: "s1", track: "student", title: "Qubits, states and measurement", minutes: 8, skill: "Qubit states", requires: [],
    summary: "A qubit is a unit vector α|0⟩ + β|1⟩. Measuring it gives 0 with probability |α|² and 1 with probability |β|².",
    sections: [
      { heading: "From bits to qubits", body: "A classical bit is always 0 or 1. A qubit's state is a combination of two basis states:\n\n```\n|ψ⟩ = α|0⟩ + β|1⟩,   |α|² + |β|² = 1\n```\n\nThe numbers α and β are **amplitudes**. They can be negative, or even complex, and that is what makes quantum computing different from just flipping coins." },
      { heading: "The Born rule", body: "You never see α or β directly. Measuring gives **0** with probability |α|² and **1** with probability |β|², and afterwards the qubit *is* the state you saw. To estimate the probabilities, you prepare and measure the same circuit many times. Each repetition is called a **shot**." },
      { heading: "This circuit", body: "`Ry(θ)` rotates |0⟩ into cos(θ/2)|0⟩ + sin(θ/2)|1⟩. With θ = 2π/3 that is ½|0⟩ + (√3/2)|1⟩, so you should see 1 about 75% of the time." },
    ],
    circuit: { qubits: 1, ops: [g("ry", [0], [], [(2 * PI) / 3])] },
    observe: "Compare the histogram (sampled shots) with the exact probabilities. Run it again and watch the counts wobble around 25% / 75%.",
    tryIt: ["Change θ to π/2. What split do you expect?", "Set θ = π. Which outcome is now certain?"],
    check: { q: "A qubit is in (1/√2)|0⟩ − (1/√2)|1⟩. What is P(1)?", options: ["0", "1/2", "−1/2", "1/√2"], answer: 1, why: "P(1) = |−1/√2|² = 1/2. The minus sign changes the phase, not the probability." },
  },
  {
    id: "s2", track: "student", title: "Superposition and the Hadamard gate", minutes: 8, skill: "Superposition", requires: ["s1"],
    summary: "H turns |0⟩ into |+⟩ = (|0⟩+|1⟩)/√2. Applying H twice brings you back, which is interference in action.",
    sections: [
      { heading: "The Hadamard gate", body: "```\nH|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩\nH|1⟩ = (|0⟩ − |1⟩)/√2 = |−⟩\n```\n\nBoth |+⟩ and |−⟩ give 50/50 measurement results, but they are **different states**. On the Bloch sphere |+⟩ points along +x and |−⟩ along −x." },
      { heading: "Interference", body: "Apply H to |+⟩ and the two paths into |1⟩ carry amplitudes +½ and −½, so they **cancel**. The paths into |0⟩ add up. The result is exactly |0⟩ again. Quantum algorithms are engineered so that wrong answers cancel and right answers reinforce." },
      { heading: "This circuit", body: "H then H on one qubit. Despite the superposition in the middle, every shot measures 0. Use the step-through slider in the Lab to watch the Bloch vector go from +z to +x and back to +z." },
    ],
    circuit: { qubits: 1, ops: [g("h", [0]), g("h", [0])] },
    observe: "100% |0⟩. If H just randomised the qubit, you would see 50/50. Interference is what brings it back.",
    tryIt: ["Delete the second H. What changes?", "Insert a Z between the two H gates. Predict the result first."],
    check: { q: "What does H·H|1⟩ equal?", options: ["|0⟩", "|1⟩", "|+⟩", "A random bit"], answer: 1, why: "H is its own inverse (H² = I), so any state comes back unchanged." },
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
  },
  {
    id: "s3", track: "student", title: "Phase: Z, S and T gates", minutes: 9, skill: "Phase", requires: ["s2"],
    summary: "Phase gates rotate about the Bloch sphere's z-axis. They don't change Z-basis probabilities, but they change what interference does.",
    sections: [
      { heading: "Invisible but important", body: "`Z` maps |1⟩ → −|1⟩. On its own it changes no measurement probabilities. `S` (a quarter turn) and `T` (an eighth turn) add the phases i and e^{iπ/4}. All three are rotations about the z-axis of the Bloch sphere." },
      { heading: "Making phase visible", body: "Sandwich a phase between Hadamards. H moves the phase into a different basis, where it becomes a bit difference:\n\n```\nH Z H = X\n```\n\nThis **basis change** trick is at the heart of phase kickback, Deutsch–Jozsa and phase estimation." },
      { heading: "This circuit", body: "H · Z · H on |0⟩. The Z flips |+⟩ to |−⟩, and the final H turns |−⟩ into |1⟩. You should measure 1 every time." },
    ],
    circuit: { qubits: 1, ops: [g("h", [0]), g("z", [0]), g("h", [0])] },
    observe: "Always 1. Step through it: the Bloch vector goes +z → +x → −x → −z.",
    tryIt: ["Replace Z with S. Where does the Bloch vector end up before the final H?", "Use two T gates in place of S. Is the result the same?"],
    check: { q: "Which gate sequence equals X?", options: ["H Z H", "Z Z", "S S", "H H"], answer: 0, why: "Conjugating Z by H swaps the X and Z axes: HZH = X." },
  },
  {
    id: "s4", track: "student", title: "Entanglement and Bell states", minutes: 10, skill: "Entanglement", requires: ["s3"],
    summary: "H then CNOT makes (|00⟩+|11⟩)/√2. The two qubits' results are perfectly correlated, and neither qubit has a state of its own.",
    sections: [
      { heading: "CNOT", body: "CNOT flips its target when its control is |1⟩. Feed it a control in superposition:\n\n```\n(|0⟩+|1⟩)/√2 ⊗ |0⟩  →  (|00⟩ + |11⟩)/√2\n```\n\nThat result cannot be written as (state of q0) ⊗ (state of q1). It is **entangled**." },
      { heading: "Correlation, not communication", body: "Each qubit on its own gives a random 0 or 1, but the two results always agree. Entanglement can't send a message, because you can't choose the outcome. It is still a stronger correlation than any classical one, as Bell tests show." },
      { heading: "Seeing it on the Bloch sphere", body: "The Lab draws each qubit's **reduced state**. For a Bell pair both Bloch vectors shrink to the centre (length 0) and their **purity** drops to ½. The single-qubit picture has lost the information, because it now lives in the correlations." },
    ],
    circuit: { qubits: 2, ops: [g("h", [0]), g("cx", [1], [0])] },
    observe: "Only 00 and 11 appear. Both Bloch vectors collapse to the centre, and the entanglement badge lights up.",
    tryIt: ["Add an X on q1 before the CNOT. Which Bell state do you get?", "Add a third qubit with another CNOT from q1 to make a GHZ state."],
    check: { q: "What is the purity of either qubit in a Bell state?", options: ["1", "½", "0", "√2/2"], answer: 1, why: "Each reduced state is maximally mixed, I/2, and Tr[(I/2)²] = ½." },
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
  },
  {
    id: "s5", track: "student", title: "Quantum teleportation", minutes: 12, skill: "Teleportation", requires: ["s4"],
    summary: "Teleportation moves an unknown qubit state using one Bell pair and two classical bits. Here the classical corrections are replaced by controlled gates.",
    sections: [
      { heading: "The protocol", body: "1. Alice and Bob share a Bell pair (q1, q2).\n2. Alice entangles her unknown state q0 with q1 (CNOT, then H).\n3. She measures q0 and q1 and sends the two bits.\n4. Bob applies X and/or Z to q2 depending on the bits, and q2 becomes the original state." },
      { heading: "Deferred measurement", body: "Measuring and then classically controlling a gate is equivalent to applying a **controlled gate** and measuring later. The Lab uses that form (CX from q1, CZ from q0), so you can check q2's Bloch vector directly." },
      { heading: "This circuit", body: "q0 starts as Ry(1.1)|0⟩, with Bloch vector (sin 1.1, 0, cos 1.1) ≈ (0.89, 0, 0.45). After the protocol, look at q2's Bloch sphere: it should match exactly, while q0 and q1 are left in |+⟩." },
    ],
    circuit: { qubits: 3, ops: [g("ry", [0], [], [1.1]), g("h", [1]), g("cx", [2], [1]), g("cx", [1], [0]), g("h", [0]), g("cx", [2], [1]), g("cz", [2], [0])] },
    observe: "q2's Bloch vector ≈ (0.89, 0, 0.45), the same as the Ry(1.1) state you prepared on q0.",
    tryIt: ["Change the Ry angle on q0 and confirm q2 follows.", "Remove the CZ correction. Which component of q2's Bloch vector goes wrong?"],
    check: { q: "Why doesn't teleportation allow faster-than-light messages?", options: ["Bob needs Alice's two classical bits to fix his qubit", "The Bell pair decays", "Measurement is slow", "It only works for |0⟩"], answer: 0, why: "Without the classical bits, Bob's qubit is maximally mixed and carries no information." },
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
  },
  {
    id: "s6", track: "student", title: "Your first algorithm: Deutsch–Jozsa", minutes: 10, skill: "Oracles", requires: ["s5"],
    summary: "Decide whether f is constant or balanced with one query, using phase kickback and interference.",
    sections: [
      { heading: "The problem", body: "You get a black-box f: {0,1}ⁿ → {0,1} that is either **constant** (same output everywhere) or **balanced** (0 on exactly half the inputs). Classically you might need 2ⁿ⁻¹ + 1 queries to be sure. Quantumly, you need one." },
      { heading: "Phase kickback", body: "Put an ancilla in |−⟩. Then an oracle that flips the ancilla when f(x)=1 instead multiplies |x⟩ by (−1)^{f(x)}. The answer is written into the **phase** of the input register." },
      { heading: "This circuit", body: "Two input qubits and an ancilla q2. The oracle is f(x) = x₀ ⊕ x₁ (balanced), built from two CNOTs into the ancilla. After the final Hadamards the input qubits read **11**, and never 00. All-zero would have meant constant." },
    ],
    circuit: { qubits: 3, ops: [g("x", [2]), g("h", [0]), g("h", [1]), g("h", [2]), g("cx", [2], [0]), g("cx", [2], [1]), g("h", [0]), g("h", [1])] },
    observe: "The inputs (the right-most two bits of each bitstring) are always 11. The ancilla bit stays random, which is expected.",
    tryIt: ["Delete both oracle CNOTs to get a constant function. What do q0, q1 read now?", "Keep only one CNOT. Is f still balanced?"],
    check: { q: "If Deutsch–Jozsa measures all zeros on the input register, the function is…", options: ["Constant", "Balanced", "Undetermined", "Both"], answer: 0, why: "Only a constant function makes every amplitude interfere constructively back to |0…0⟩." },
  },

  // ------------------------------------------------------------------ Developer
  {
    id: "d1", track: "developer", title: "Qiskit fundamentals and bit ordering", minutes: 8, skill: "Qiskit basics", requires: [],
    summary: "Build circuits with QuantumCircuit, run them on AerSimulator, and read Qiskit's little-endian bitstrings correctly.",
    sections: [
      { heading: "A first program", body: "```python\nfrom qiskit import QuantumCircuit\nfrom qiskit_aer import AerSimulator\n\nqc = QuantumCircuit(3)\nqc.x(0)\nqc.measure_all()\ncounts = AerSimulator().run(qc, shots=1024).result().get_counts()\n```\n\nEvery Lab circuit has an **Export → Qiskit** tab that generates exactly this kind of code." },
      { heading: "Little-endian bitstrings", body: "Qiskit prints qubit 0 as the **right-most** character. Flipping q0 in a 3-qubit circuit gives `'001'`, not `'100'`. Most off-by-one bugs in quantum code come from this convention." },
      { heading: "This circuit", body: "X on q0 of a 3-qubit register. Predict the bitstring before you run it." },
    ],
    circuit: { qubits: 3, ops: [g("x", [0])] },
    observe: "Exactly one outcome: 001. The 1 is on the right because that position is q0.",
    tryIt: ["Move the X to q2. What bitstring appears?", "Add H on q1 and predict both outcomes."],
    check: { q: "In a 4-qubit Qiskit circuit you apply X to q1. Which bitstring is measured?", options: ["0010", "0100", "1000", "0001"], answer: 0, why: "Little-endian: the positions from the right are q0, q1, q2, q3, so q1 is second from the right." },
  },
  {
    id: "d2", track: "developer", title: "Transpilation and native gates", minutes: 10, skill: "Transpilation", requires: ["d1"],
    summary: "Hardware runs a small native gate set. The transpiler rewrites your circuit into it, which often multiplies depth.",
    sections: [
      { heading: "Native gates", body: "IBM-style devices run `rz`, `sx`, `x` and `cx` (or `ecr`). Everything else is decomposed. A Toffoli (`ccx`) needs **six CNOTs** plus single-qubit gates." },
      { heading: "Why depth matters", body: "Qubits lose coherence over time, and every two-qubit gate adds error. `transpile(qc, basis_gates=[...], optimization_level=1..3)` merges rotations and cancels redundant gates, but it can't beat the cost of the algorithm itself." },
      { heading: "This circuit", body: "A single Toffoli on |110⟩, which flips the target to give |111⟩. Open the **Qiskit** results tab and compare the logical depth with the transpiled depth and gate counts." },
    ],
    circuit: { qubits: 3, ops: [g("x", [0]), g("x", [1]), g("ccx", [2], [0, 1])] },
    observe: "Output 111. The transpiled view shows about 6 CX gates and a much larger depth than the 2 logical layers.",
    tryIt: ["Replace the CCX with a CZ and compare the transpiled CX count.", "Add H, H on q0. Does the transpiler cancel them?"],
    check: { q: "Roughly how many CNOTs does a standard Toffoli decomposition use?", options: ["1", "3", "6", "12"], answer: 2, why: "The textbook decomposition uses 6 CNOTs. That is why multi-controlled gates are expensive on hardware." },
  },
  {
    id: "d3", track: "developer", title: "Shots, sampling and noise", minutes: 10, skill: "Sampling & noise", requires: ["d2"],
    summary: "Results are samples. Shot noise shrinks like 1/√N, while device noise adds systematic errors that more shots can't remove.",
    sections: [
      { heading: "Shot noise", body: "With N shots, an outcome of true probability p is estimated with standard error √(p(1−p)/N). For p = ½ that is ~1.6% at 1,000 shots and ~0.5% at 10,000." },
      { heading: "Device noise", body: "Real qubits suffer **gate errors** (modelled here as depolarising noise) and **readout errors** (a 0 reported as 1, or the reverse). Turn on *Noise* in the Lab run panel. Aer then runs your circuit through a Qiskit `NoiseModel`." },
      { heading: "This circuit", body: "A Bell pair. Run it ideal, then with noise (2-qubit error 5%, readout 3%). The 'impossible' outcomes 01 and 10 appear, and their total share is your error rate." },
    ],
    circuit: { qubits: 2, ops: [g("h", [0]), g("cx", [1], [0])] },
    observe: "Ideal: only 00/11. Noisy: roughly 5–10% of shots land on 01/10.",
    tryIt: ["Raise shots from 1,024 to 10,000 with noise on. Does the error rate go away?", "Set only readout error and compare with only gate error."],
    check: { q: "Increasing shots from 1k to 100k reduces which error?", options: ["Statistical (shot) noise", "Readout error", "Gate depolarisation", "All of them"], answer: 0, why: "More samples narrow the estimate, but the noisy distribution is still the noisy distribution." },
  },
  {
    id: "d4", track: "developer", title: "Grover's search", minutes: 12, skill: "Grover", requires: ["d3"],
    summary: "An oracle marks the answer with a phase. The diffuser amplifies it, and about (π/4)√N iterations find it with high probability.",
    sections: [
      { heading: "Oracle and diffuser", body: "The **oracle** flips the sign of the marked state. The **diffuser** (H, X, multi-controlled Z, X, H) reflects every amplitude about the mean. Together they rotate the state toward the answer by a fixed angle each round." },
      { heading: "How many iterations?", body: "For N items and one marked: about (π/4)√N rounds. With 2 qubits (N=4), **one** round is exact. With 4 qubits (N=16), 3 rounds reach ~96%. Too many rounds overshoot and the probability goes down again." },
      { heading: "This circuit", body: "Two-qubit Grover marking |11⟩: H on both, oracle = CZ, then the diffuser." },
    ],
    circuit: { qubits: 2, ops: [g("h", [0]), g("h", [1]), g("cz", [1], [0]), g("h", [0]), g("h", [1]), g("x", [0]), g("x", [1]), g("cz", [1], [0]), g("x", [0]), g("x", [1]), g("h", [0]), g("h", [1])] },
    observe: "100% |11⟩ after a single query to the oracle.",
    tryIt: ["Mark |01⟩ instead: wrap the oracle CZ with X on q1.", "Open the 16-door race on Explorer Planet 6. It runs the 4-qubit version of this circuit."],
    check: { q: "Approximately how many Grover iterations for N = 1,000,000?", options: ["~785", "~1,000,000", "~20", "~500,000"], answer: 0, why: "(π/4)·√10⁶ ≈ 785. A classical search needs ~500,000 checks on average." },
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
  },
  {
    id: "d5", track: "developer", title: "The Quantum Fourier Transform", minutes: 12, skill: "QFT", requires: ["d4"],
    summary: "The QFT maps basis states to phase gradients using Hadamards and controlled phases. It is the engine of Shor's algorithm and phase estimation.",
    sections: [
      { heading: "Definition", body: "```\nQFT|x⟩ = (1/√N) Σ_k e^{2πi·xk/N} |k⟩\n```\n\nEvery output has the same magnitude, and the information lives entirely in the **phases**. Measuring straight after a QFT gives a uniform distribution, so the statevector view is where you see it." },
      { heading: "Circuit", body: "For each qubit (most significant first): H, then controlled-phase rotations of π/2, π/4, … from the less significant qubits, then reverse the order with SWAPs. That is O(n²) gates, compared with O(n·2ⁿ) for a classical FFT on the amplitudes." },
      { heading: "This circuit", body: "A 2-qubit QFT of |01⟩. Measured: uniform. Statevector: amplitudes ½ with phases 1, i, −1, −i." },
    ],
    circuit: { qubits: 2, ops: [g("x", [0]), g("h", [1]), g("cp", [0], [1], [PI / 2]), g("h", [0]), g("swap", [0, 1])] },
    observe: "The histogram is flat. In the statevector tab, all four magnitudes are 0.5 and the phases advance by 90°.",
    tryIt: ["Start from |10⟩ (X on q1). How fast do the phases advance?", "Remove the SWAP. Which outputs get relabelled?"],
    check: { q: "Measuring directly after a QFT of a basis state gives…", options: ["A uniform distribution", "The input back", "Always zero", "A Gaussian"], answer: 0, why: "All output amplitudes have magnitude 1/√N. The information is in the phases." },
  },
  {
    id: "d6", track: "developer", title: "Parameterised and variational circuits", minutes: 10, skill: "Variational", requires: ["d5"],
    summary: "Circuits with tunable angles (ansätze) are optimised by a classical loop. This is the basis of VQE, QAOA and quantum machine learning.",
    sections: [
      { heading: "Ansatz", body: "An **ansatz** is a circuit template with parameters θ. A classical optimiser proposes θ, the quantum computer estimates a cost from shots, and the loop repeats. In Qiskit you'd use `Parameter('θ')` and `assign_parameters`." },
      { heading: "Estimating an observable", body: "To estimate ⟨Z₀Z₁⟩ from counts, give +1 to outcomes with even parity (00, 11) and −1 to odd (01, 10), then average. Energies in VQE are sums of terms like this." },
      { heading: "This circuit", body: "A hardware-efficient ansatz: Ry(θ₀) and Ry(θ₁), then CNOT. With θ = (π/2, 0) you get a Bell state and ⟨ZZ⟩ = +1." },
    ],
    circuit: { qubits: 2, ops: [g("ry", [0], [], [PI / 2]), g("ry", [1], [], [0]), g("cx", [1], [0])] },
    observe: "Only even-parity outcomes, so ⟨ZZ⟩ = +1. Change θ₁ and watch odd-parity outcomes grow.",
    tryIt: ["Set θ₁ = π. What is ⟨ZZ⟩ now?", "Ask the AI tutor to compute ⟨ZZ⟩ from your counts."],
    check: { q: "Counts: 00→400, 01→100, 10→100, 11→400. What is ⟨Z₀Z₁⟩?", options: ["0.6", "0.8", "0.4", "1.0"], answer: 0, why: "(400+400−100−100)/1000 = 0.6." },
  },

  // ------------------------------------------------------------------ Researcher
  {
    id: "r1", track: "researcher", title: "Density matrices and purity", minutes: 12, skill: "Mixed states", requires: [],
    summary: "Subsystems of entangled states are mixed. Reduced density matrices, purity and Bloch-vector length quantify this.",
    sections: [
      { heading: "Density operators", body: "ρ = Σᵢ pᵢ |ψᵢ⟩⟨ψᵢ|. For one qubit, ρ = (I + r·σ)/2 with Bloch vector **r** and |r| ≤ 1. Pure states lie on the sphere's surface and mixed states inside it." },
      { heading: "Partial trace", body: "For a bipartite pure state |ψ⟩_{AB}, ρ_A = Tr_B |ψ⟩⟨ψ|. The state is entangled iff ρ_A is mixed, that is iff purity Tr ρ_A² < 1. For two qubits, the entanglement entropy S(ρ_A) is the entanglement measure." },
      { heading: "This circuit", body: "A *partially* entangled state: Ry(π/3) on q0, then CNOT. The Lab computes each qubit's reduced state with `qiskit.quantum_info.partial_trace`. Expect Bloch vectors of length cos(π/3) = 0.5 along z, and purity (1 + 0.25)/2 = 0.625." },
    ],
    circuit: { qubits: 2, ops: [g("ry", [0], [], [PI / 3]), g("cx", [1], [0])] },
    observe: "Bloch vectors (0, 0, 0.5) on both qubits and purity 0.625. That is between a product state (1) and a Bell state (0.5).",
    tryIt: ["Sweep the Ry angle from 0 to π/2 and plot purity.", "Add Rz on q0 after the CNOT. Does purity change? Why not?"],
    check: { q: "A single-qubit reduced state has Bloch vector length 0.6. Its purity is…", options: ["0.68", "0.6", "0.36", "0.8"], answer: 0, why: "Tr ρ² = (1 + |r|²)/2 = (1 + 0.36)/2 = 0.68." },
  },
  {
    id: "r2", track: "researcher", title: "Noise channels and error mitigation", minutes: 14, skill: "Error mitigation", requires: ["r1"],
    summary: "Depolarising and readout channels distort results. Mitigation (readout inversion, zero-noise extrapolation) recovers estimates without extra qubits.",
    sections: [
      { heading: "Channels", body: "The depolarising channel is ε(ρ) = (1−p)ρ + p·I/d. Readout error is a classical confusion matrix M with M_{ij} = P(read i | prepared j). Both are available in the Lab's noise model, built with Qiskit Aer's `NoiseModel`." },
      { heading: "Mitigation", body: "**Readout mitigation:** calibrate M by preparing basis states, then apply M⁻¹ (or a constrained least-squares fit) to measured distributions.\n\n**Zero-noise extrapolation:** run at amplified noise levels (gate folding G G† G) and extrapolate the observable back to zero noise.\n\nNeither needs extra qubits, but both increase sampling cost." },
      { heading: "This circuit", body: "A 3-qubit GHZ state. Run it ideal, then noisy. The GHZ fidelity proxy P(000)+P(111) drops with noise. Try p₂ at 0.02, 0.04 and 0.06 and extrapolate the line back to p₂ = 0." },
    ],
    circuit: { qubits: 3, ops: [g("h", [0]), g("cx", [1], [0]), g("cx", [2], [1])] },
    observe: "Ideal: P(000)+P(111) = 1. With noise it falls roughly linearly in p₂ for small p₂.",
    tryIt: ["Record the fidelity at three noise levels and fit a line (that is ZNE by hand).", "Turn on readout error alone and estimate the confusion matrix from |000⟩ runs."],
    check: { q: "Zero-noise extrapolation primarily trades…", options: ["More circuit executions for lower bias", "More qubits for lower noise", "Deeper circuits for fewer shots", "Nothing; it is free"], answer: 0, why: "ZNE runs extra noise-amplified circuits (and more shots) to reduce bias in the estimated expectation value." },
  },
  {
    id: "r3", track: "researcher", title: "Error correction: the 3-qubit bit-flip code", minutes: 15, skill: "Error correction", requires: ["r2"],
    summary: "Encode one logical qubit in three, measure parities with ancillas without learning the data, and correct any single X error.",
    sections: [
      { heading: "Encoding and syndromes", body: "α|0⟩+β|1⟩ ↦ α|000⟩+β|111⟩. The stabilisers Z₀Z₁ and Z₁Z₂ are measured into two ancillas. The syndrome (s₀, s₁) identifies which qubit flipped, and it reveals nothing about α or β." },
      { heading: "Correction (deferred)", body: "| syndrome | error |\n- (1,0) → X on q0\n- (1,1) → X on q1\n- (0,1) → X on q2\n\nHere the corrections are Toffolis controlled by the ancillas, which is the deferred-measurement form. After decoding, q0 should hold the original state exactly." },
      { heading: "This circuit", body: "Data Ry(0.8)|0⟩ on q0, encode into q0..q2, inject **X on q1**, extract the syndrome into q3, q4, correct, then decode. Check q0's Bloch vector: (sin 0.8, 0, cos 0.8) ≈ (0.717, 0, 0.697)." },
    ],
    circuit: {
      qubits: 5,
      ops: [
        g("ry", [0], [], [0.8]), g("cx", [1], [0]), g("cx", [2], [0]),
        g("x", [1]), // the error
        g("cx", [3], [0]), g("cx", [3], [1]), g("cx", [4], [1]), g("cx", [4], [2]),
        g("ccx", [1], [3, 4]),
        g("x", [4]), g("ccx", [0], [3, 4]), g("x", [4]),
        g("x", [3]), g("ccx", [2], [3, 4]), g("x", [3]),
        g("cx", [2], [0]), g("cx", [1], [0]),
      ],
    },
    observe: "q0's Bloch vector returns to ≈ (0.717, 0, 0.697) even though an X error hit the codeword. Ancillas q3, q4 always read 11, the syndrome for 'q1 flipped'.",
    tryIt: ["Move the injected X to q0 or q2. Which syndrome appears?", "Inject two X errors. Does the code still recover?"],
    check: { q: "Why can the syndrome be measured without destroying the encoded superposition?", options: ["It measures parities that are identical for |000⟩ and |111⟩", "Ancillas are classical", "Measurement is delayed", "Errors are always X"], answer: 0, why: "Z₀Z₁ and Z₁Z₂ have the same eigenvalue on both codewords, so the measurement gives no information about α, β." },
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
  },
  {
    id: "r4", track: "researcher", title: "Quantum phase estimation", minutes: 15, skill: "Phase estimation", requires: ["r3"],
    summary: "Estimate the eigenphase φ of a unitary with t counting qubits: controlled powers of U, then an inverse QFT.",
    sections: [
      { heading: "Algorithm", body: "For U|u⟩ = e^{2πiφ}|u⟩: put t counting qubits in |+⟩, apply controlled-U^{2^k} from counting qubit k, then QFT† on the counting register. Measuring gives the t-bit binary fraction of φ, exactly when φ = m/2^t." },
      { heading: "Why it matters", body: "QPE is the core of Shor's algorithm (order finding), quantum chemistry energy estimation and HHL. Its cost, which scales with the circuit depth of controlled-U^{2^k}, is why fault tolerance is needed for these applications." },
      { heading: "This circuit", body: "U = P(2π·¼), eigenstate |1⟩ on q3 and t = 3 counting qubits (q0..q2). φ = 0.010₂, so the counting register should read **010** and the full bitstring is 1010." },
    ],
    circuit: {
      qubits: 4,
      ops: [
        g("x", [3]), g("h", [0]), g("h", [1]), g("h", [2]),
        g("cp", [3], [0], [PI / 2]), g("cp", [3], [1], [PI]), g("cp", [3], [2], [2 * PI]),
        g("swap", [0, 2]),
        g("h", [0]), g("cp", [1], [0], [-PI / 2]), g("h", [1]), g("cp", [2], [0], [-PI / 4]), g("cp", [2], [1], [-PI / 2]), g("h", [2]),
      ],
    },
    observe: "A single outcome, 1010: counting register = 010 = 2, so φ = 2/8 = ¼.",
    tryIt: ["Change the three phases to φ = 3/8 (angles 3π/4, 3π/2, 3π). Which register value appears?", "Try φ = 0.3, which isn't exactly representable. How does the distribution spread?"],
    check: { q: "With t counting qubits and exact φ = m/2ᵗ, QPE returns m with probability…", options: ["1", "1/2", "4/π²", "1/t"], answer: 0, why: "Exactly representable phases are recovered deterministically. Otherwise the success probability is ≥ 4/π²." },
  },
  {
    id: "r5", track: "researcher", title: "Variational algorithms: VQE and QAOA", minutes: 14, skill: "VQE & QAOA", requires: ["r4"],
    summary: "Hybrid loops minimise ⟨H⟩ over a parameterised circuit. Barren plateaus, shot noise and ansatz expressivity set the limits.",
    sections: [
      { heading: "VQE", body: "Write H = Σᵢ cᵢ Pᵢ (Pauli strings). Estimate each ⟨Pᵢ⟩ from shots in the right measurement basis and minimise E(θ) = Σ cᵢ⟨Pᵢ⟩_θ. By the variational principle, E(θ) ≥ E₀." },
      { heading: "QAOA", body: "For a cost Hamiltonian H_C (e.g. MaxCut, Σ ½(1 − ZᵢZⱼ)), alternate e^{−iγH_C} (a ZZ rotation via CX·Rz·CX) and the mixer e^{−iβΣX} (Rx). Depth p = 1 already gives nontrivial approximation ratios on some graphs." },
      { heading: "This circuit", body: "Single-edge MaxCut with p = 1 QAOA. Start with H on both qubits. The cost unitary e^{−iγC} with C = ½(1 − Z₀Z₁) equals e^{+iγZ₀Z₁/2} up to a global phase. A `CX · Rz(θ) · CX` sandwich implements e^{−iθZZ/2}, so θ = −γ. With γ = π/2 that is Rz(−π/2). Finish with the mixer Rx(2β), β = π/8." },
    ],
    circuit: { qubits: 2, ops: [g("h", [0]), g("h", [1]), g("cx", [1], [0]), g("rz", [1], [], [-PI / 2]), g("cx", [1], [0]), g("rx", [0], [], [PI / 4]), g("rx", [1], [], [PI / 4])] },
    observe: "Every shot lands on 01 or 10. For a single edge, p = 1 QAOA reaches the optimal cut, compared with an expected cut of 0.5 for random guessing.",
    tryIt: ["Change the mixer angle to π/2 (β = π/4). What happens to the expected cut?", "Flip the sign of the Rz angle. Why do you now get 00/11, the worst cut?"],
    check: { q: "A key scaling obstacle for deep random ansätze is…", options: ["Barren plateaus: gradients vanish exponentially", "Too few parameters", "The QFT", "Readout error only"], answer: 0, why: "For sufficiently random circuits, gradient variance decays exponentially with qubit count." },
  },
  {
    id: "r6", track: "researcher", title: "Benchmarking and quantum advantage", minutes: 12, skill: "Benchmarking", requires: ["r5"],
    summary: "How do we know a device is good, or better than classical? GHZ fidelity, randomized benchmarking, quantum volume and sampling-based advantage.",
    sections: [
      { heading: "Benchmarks", body: "**Randomized benchmarking** fits the decay of random Clifford sequences to get an average gate error. **Quantum volume** finds the largest square random circuit a device runs with heavy-output probability > ⅔. **GHZ fidelity** tests multi-qubit coherence directly." },
      { heading: "Advantage claims", body: "Random-circuit-sampling experiments argue that classical simulation cost grows exponentially. Each claim invites better classical algorithms (tensor networks, noise exploitation). Problems with **verifiable** advantage, like factoring, need fault tolerance." },
      { heading: "This circuit", body: "A 4-qubit GHZ state under noise. Its fidelity proxy P(0000)+P(1111) falls off quickly with qubit count and depth. Compare it with the 3-qubit version from module R2 at the same noise." },
    ],
    circuit: { qubits: 4, ops: [g("h", [0]), g("cx", [1], [0]), g("cx", [2], [1]), g("cx", [3], [2])] },
    observe: "Ideal: 0000/1111 only. With noise, compute the fidelity and compare it with 3 qubits.",
    tryIt: ["Fit fidelity against qubit count (2 → 6) at fixed noise.", "Rewrite the GHZ preparation as a log-depth tree. Does fidelity improve?"],
    check: { q: "Quantum volume primarily measures…", options: ["The largest square random circuit run reliably", "Qubit count", "T₁ time", "Gate speed"], answer: 0, why: "QV combines width, depth, connectivity and error into a single 'largest reliable square circuit'." },
  },
];

export const moduleById = (id: string) => MODULES.find((m) => m.id === id);
export const modulesOf = (t: TrackId) => MODULES.filter((m) => m.track === t);

/** Explorer planets map onto real circuits too: this is what each kids' game runs behind the scenes. */
export const EXPLORER_CIRCUITS: Record<number, Circuit> = {
  2: { qubits: 1, ops: [g("h", [0])] },
  3: { qubits: 3, ops: [g("initialize", [0, 1, 2], [], [0.63, 0.5, 0.39, 0.35, 0.28, 0, 0, 0])] },
  4: { qubits: 2, ops: [g("h", [0]), g("cx", [1], [0])] },
  5: { qubits: 1, ops: [g("h", [0]), g("z", [0]), g("h", [0])] },
  6: groverCircuit(4, 5, 3),
};
