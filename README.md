# Quantum Quest

A quantum computing learning platform: think Brilliant-style lessons, Coursera-style tracks and certificates, and GitHub-style project sharing. Every experiment is a real Qiskit circuit.

**Learn → Build → Run → Understand → Share**

| Track | Audience | Content |
|---|---|---|
| 🪐 Explorer | Ages 8–12 | 7 planets of games with Qubit the Robot. The coin flips, treasure clouds, entangled twins, gate machine and door race all run real circuits. |
| 🎓 Student | High school / first-year undergrad | Qubits & measurement, H & interference, phase, Bell states, teleportation, Deutsch–Jozsa |
| 💻 Developer | Programmers | Qiskit and bit ordering, transpilation, shots & noise, Grover, QFT, variational circuits |
| 🔬 Researcher | Graduate | Density matrices, noise & mitigation, the 3-qubit bit-flip code, phase estimation, VQE/QAOA, benchmarking |

## Features

- **Quantum Lab** (`/lab`): visual circuit builder with 19 gates (click or drag, multi-qubit and parameterised gates), adjustable shots, and a Qiskit Aer noise model.
- **Results**: a histogram of the shot counts with exact probabilities overlaid, interactive per-qubit Bloch spheres (reduced states with purity), a statevector table, and step-through Bloch vectors after each gate. The Qiskit tab shows Python code, OpenQASM, a text diagram and transpiled depth/CX counts.
- **AI tutor**: beginner, intermediate and advanced explanations from Claude, grounded in the actual run results. Without an API key it falls back to a deterministic explainer built from those same results.
- **Course modules**: 18 lessons. Each has a runnable circuit, "what to look for" notes, experiments to try and a check question.
- **Community** (`/community`): publish circuits, then search, star and fork them. Publishing re-runs the circuit on the server, so shared results are always verified.
- **Progress**: XP, streaks, a skill tree with cross-track links, and printable certificates for each track.

## Run it

You need Node 20+ and Python 3.10+.

```bash
npm install
npm run backend:setup   # creates backend/.venv with qiskit, qiskit-aer, fastapi
npm run backend         # Qiskit service on :8000
npm run dev             # web app on :3000 (proxies /api/qiskit/* to :8000)
```

To enable the Claude tutor, set `ANTHROPIC_API_KEY` in the environment of `npm run dev` (it uses `claude-opus-5-5`). If the Qiskit service runs somewhere other than localhost, set `QISKIT_URL`.

## Architecture

```
Next.js (TypeScript, Tailwind, Framer Motion, Three.js)
 ├─ /api/tutor ─────────────► Claude API (streamed; offline fallback in the browser)
 └─ /api/qiskit/* (rewrite) ─► backend/main.py (FastAPI)
                                ├─ POST /run       build QuantumCircuit → Aer sampling (+noise)
                                │                  → Statevector, partial traces, transpile
                                └─ /projects       community store (SQLite), re-runs on publish
```

- `src/lib/quantum.ts` contains the circuit types, gate catalog, API client and Qiskit code export.
- `src/lib/curriculum.ts` holds tracks, modules and the circuits behind the Explorer games.
- `src/components/lab/` has the editor, histogram, Bloch sphere, statevector table and tutor.
- Learner progress is stored in `localStorage` (`src/lib/progress.tsx`). Community projects are stored on the server.

## Not yet built

- Accounts (Supabase). Progress and certificates are per-device for now, and certificate IDs aren't server-verifiable.
- Running on real IBM Quantum hardware. Everything runs on the Qiskit Aer simulator, optionally with noise.
- The Explorer teacher dashboard is still single-learner, and there's no adaptive difficulty yet.
