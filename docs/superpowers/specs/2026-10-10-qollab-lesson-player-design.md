# Qollab Lesson Player: design

**Date:** 2026-10-10 · **Deadline:** Oct 11, 19:00 ET (internal target 15:00 ET) · **Status:** approved in chat, awaiting spec review

## Goal

Make Quantum Quest's lessons runnable on qollab.xyz with Qollab's free simulators. This is the hackathon's eligibility requirement. Then, time permitting, add two learning features that help nearly anyone understand: **Predict → Run → Explain** and **Ideal vs this machine**.

**Success means:**
1. A judge opens our Qollab project, presses **Run**, picks a simulator, and works through any of the 18 lessons (Student, Developer and Researcher tracks).
2. The web app keeps working exactly as before.
3. Stretch: 5 lessons have predictions, and every result shows how far the chosen machine is from ideal.

## Qollab facts this design relies on

From the Qollab docs: [JS / Qiskit projects](https://qollab.xyz/learn/docs/js-qiskit-projects), [runtime](https://qollab.xyz/learn/docs/runtime-environment), [backends](https://qollab.xyz/learn/docs/compute-backends) and [uploads](https://qollab.xyz/learn/docs/upload-your-files).

- **Project shape.** A top-level `index.html` plus `main.js` makes a JS project, with an optional `main.css`. JS imports our Python by dotted name (`import * as engine from 'quantum.engine'`) and calls it with `fn.callPromising(backend, ...)`. A plain call fails on IonQ.
- **Backend.** `backend` is a pre-created global for the simulator picked in **Select QPU**. A new one is created on every Run.
- **Runtime.** Pyodide runs in the browser. Qiskit (≥2.5.2), NumPy and SciPy are available. `qiskit-aer` is only available through the PQCA library option, and we don't need it there.
- **Simulators.** The built-in simulator is ideal (24 qubits). There are 8 IBM noise-model simulators, which run locally in the browser. The IonQ Aria and Forte noise simulators run in the cloud and accept **one job per Run**.
- **Limits.** No POST requests and no browser storage. Nothing persists between runs. Projects allow 100 files of up to 2 MB each. A top-level `README.md` uploaded with a new project becomes the project page (up to 65,000 characters).

## Architecture

```
backend/engine.py   NEW, the shared Qiskit core (pure qiskit + numpy)
 ├─ backend/main.py   FastAPI. Validates with pydantic, runs on AerSimulator(+noise). API unchanged.
 └─ quantum/engine.py The same file, copied into the Qollab bundle. Runs on Qollab's `backend`.

src/lib/quantum.ts   runCircuit() calls a swappable transport: HTTP by default, the Python bridge on Qollab
src/qollab/          NEW: index.html and main.tsx (the lesson player entry point)
scripts/build-qollab.sh  NEW: builds dist/qollab/ and dist/qollab.zip
```

### `backend/engine.py`
This file is moved out of `main.py`, not rewritten. `build`, the state analysis (`statevector_of`, `bloch_vectors`, `unitary_part`) and the body of `execute` move here. Aer noise models stay in `main.py`, since the Qollab simulators bring their own noise.

- `build(circuit: dict) -> QuantumCircuit` raises `ValueError` on a bad op. `main.py` maps that to HTTP 400 with the same message as today.
- `run(backend, req: dict, label: str | None = None) -> dict` returns the same keys as today's `/run` response. It:
  - computes the statevector analysis locally
  - measures, transpiles with `optimization_level=0` for `backend`, and samples with `backend.run(tqc, shots=...)`
  - passes `memory` and `seed_simulator` only when the request asks for them
  - sets `"backend"` to `label` if given, otherwise `backend.name`
- `run_json(backend, req_json: str) -> str` is a JSON-in, JSON-out wrapper for the Qollab bridge, which avoids converting proxy objects.
- `main.py` keeps its pydantic models, the 8-qubit, 200-op and 20,000-shot limits, Aer noise models and the community endpoints. It calls `engine.run(AerSimulator(...), req.model_dump(), label=...)`.

### Transport seam (`src/lib/quantum.ts`)
```ts
export type Transport = (body: object) => Promise<RunResult>;
export function setTransport(t: Transport): void;  // default: the existing fetch("/api/qiskit/run")
```
`runCircuit` builds the same body as today and calls the transport. No component changes.

### Qollab entry (`src/qollab/main.tsx`)
- Sets the transport to `body => engine.run_json.callPromising(backend, JSON.stringify(body)).then(JSON.parse)`.
- Renders a lesson player:
  - track and lesson picker (all 18 `MODULES`)
  - lesson text (`Markdown`)
  - `CircuitEditor`, which is editable, so the "Try it" ideas can be done on the spot
  - Run, then `ResultsPanel`
  - "What to look for", the check question, and the offline `Tutor` explanation
- Shows the active simulator name (`backend.name`).
- On an IonQ backend, after one job it says "IonQ allows one job per Run: press Stop then Run, or pick a local simulator".
- Progress is kept for the session only. The AI tutor's network mode is off (POST is blocked), so `offlineExplain` is used.
- Shows the footer attribution "This effort is supported by Qollab & IonQ".
- The Explorer kids' track, Community and certificates stay web-only. The player links to the web app for them.

### Build (`scripts/build-qollab.sh`, run with `npm run qollab:build`)
- `esbuild src/qollab/main.tsx --bundle --format=esm --external:quantum.engine` produces `main.js`. esbuild resolves the `@/` alias from `tsconfig.json`.
- `@tailwindcss/cli` produces `main.css`. It takes `src/app/globals.css` as input so the theme tokens match the web app. The Next font variables fall back to system fonts.
- Copies `index.html`, `backend/engine.py` (as `quantum/engine.py`, plus an empty `quantum/__init__.py`), `README.md` and `LICENSE`.
- Fails if there are more than 100 files or any file is over 2 MB. Writes `dist/qollab.zip`.
- New dev dependencies: `esbuild` and `@tailwindcss/cli`. Neither can be replaced by a few lines of code. `dist/` is gitignored.

## Learning features (stretch, step 4)

### Predict → Run → Explain
- Data, added in `curriculum.ts`:
  ```ts
  export type Predict = { q: string; options: string[]; answer: number; feedback: string[] };
  Module.predict?: Predict
  ```
  Each `feedback[i]` explains option *i*. Wrong options are named misconceptions.
- `src/components/lab/Predict.tsx` sits above the lesson circuit. Run is enabled once the learner picks an option or presses "Skip, just show me". After the run, it shows their pick, whether it was right, and `feedback[pick]`.
- It's used by both the web lesson page (`learn/[module]/page.tsx`) and the Qollab player. Lessons without `predict` behave as they do today.
- Content for 5 lessons: s2 (interference), s4 (entanglement), s5 (teleportation), d4 (Grover), r3 (bit-flip code). The team reviews the physics before merge.

### Ideal vs this machine
- `src/components/lab/IdealVsMachine.tsx` sits inside the results. It computes the total-variation distance between `counts/shots` and `probabilities`, both of which are already in `RunResult`. It shows a one-line plain reading and adds a prompt to try an IBM or IonQ machine on the next Run.
  - Below 0.05 it reads "matches ideal within shot noise".
  - Above that, it reads "noise is visible".
- It compares within one run only (exact ideal vs the chosen machine), so no cross-run storage is needed.
- **Bit-flip comparison:** an r3 variant circuit with a bare qubit (q0) next to the encoded logical qubit (q1–q3, ancillas q4–q5), 6 qubits in one circuit, so it fits IonQ's one-job rule. Both start in |0⟩ with no injected error. The callout reports each one's error rate.
  - On the ideal simulator both are 0, so the lesson says to pick a noisy machine.
  - With realistic noise the code may lose because of its extra gates. We show whichever happens and explain the threshold idea (fault tolerance).

## Build order (cut from the bottom, never above step 3)

1. **Qollab test (≤1h).** Upload a throwaway project: `index.html`, `main.js` and `quantum/engine.py` running a Bell circuit and the r3 circuit through `run_json`, on the built-in simulator, one IBM simulator and one IonQ simulator. This confirms the bridge works, and whether `initialize`, `mcx` and `ccx` and `optimization_level=0` transpiling are accepted. **If the bridge fails, fall back to a hand-written vanilla JS player that uses the same engine.**
2. **Engine extraction.** Move the code into `engine.py` and add `backend/test_engine.py`. Web behaviour stays the same.
3. **Qollab bundle.** Build the transport seam, the Qollab entry and the build script. Upload, run all 18 lessons on the built-in simulator, and spot-check on IBM and IonQ. Publish with the MIT license and the README as the project page. **← eligibility reached**
4. **Stretch.** Predict (component plus content for 5 lessons), then Ideal vs this machine with the bit-flip comparison.

## Testing

- `backend/test_engine.py` uses asserts and runs with `backend/.venv/bin/python backend/test_engine.py`. It checks:
  - a Bell circuit gives only `00` and `11`, with purity 0.5
  - with Aer noise, 10 CX gates are not optimised away (counts aren't all `00`)
  - a bad op raises `ValueError`
  - `run_json` round-trips
  - the bit-flip comparison circuit gives logical 0 on an ideal backend
- The web app must still pass `npm run lint`, `npx tsc --noEmit` and `npm run build`, plus the existing backend smoke checks (Bell, noisy, initialize/mcz/trace, bad-op 400s).
- On Qollab: run every lesson on the built-in simulator, two lessons on an IBM simulator, and one lesson on an IonQ simulator. Record the results in the PR.

## Risks

| Risk | Mitigation |
|---|---|
| The JS-to-Python bridge or Pyodide behaves differently from the docs | Step 1 tests it first. Fallback is a vanilla JS player using the same engine. |
| IonQ rejects `initialize`, `mcx` or `ccx` | The engine transpiles to standard gates before `backend.run` (confirmed in step 1). |
| IBM noise simulators are slow at high shot counts | The Qollab player defaults to 1024 shots. |
| The bundle goes over 2 MB | Check the size in the build script. Three.js is the largest dependency; tree-shake it, or drop the 3D Bloch sphere on Qollab. |
| A circuit is too big for a backend | All lessons use 8 qubits or fewer, well under every backend's limit. |

## Out of scope (roadmap)

- A no-maths track for adults
- Predictions for the other 13 lessons
- Spaced review
- The AI tutor on Qollab
- Explorer games and Community on Qollab
