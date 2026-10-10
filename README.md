# Quantum Quest

A quantum computing learning platform: think Brilliant-style lessons, Coursera-style tracks and certificates, and GitHub-style project sharing. Every experiment is a real Qiskit circuit.

*This effort is supported by Qollab & IonQ.*

**Learn → Build → Run → Understand → Share**

| Track | Audience | Content |
|---|---|---|
| 🪐 Explorer | Ages 8–12 | 7 planets of games with Qubit the Robot. The coin flips, treasure clouds, entangled twins, gate machine and door race all run real circuits. |
| 🎓 Student | High school / first-year undergrad | Qubits & measurement, H & interference, phase, Bell states, teleportation, Deutsch–Jozsa |
| 💻 Developer | Programmers | Qiskit and bit ordering, transpilation, shots & noise, Grover, QFT, variational circuits |
| 🔬 Researcher | Graduate | Density matrices, noise & mitigation, the 3-qubit bit-flip code, phase estimation, VQE/QAOA, benchmarking |

## Features

- **Learning roadmaps** (`/roadmaps`): four prerequisite-aware paths connecting the existing lessons and Explorer games to circuit experiments, credited external resources, bookmarks, notes, and completion progress. Resource review is separate from assessed lesson completion. See [ROADMAPS.md](ROADMAPS.md) for implemented features and remaining phases.
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

## Disclosure

This project was built for the Qollab × IonQ Quantum Hackathon. The build window ran from Oct 9, 19:00 ET to Oct 11, 19:00 ET, and only work done in that window is judged.

**Before the build window**

> **TODO(team): replace this line before submitting.** Either list what existed before Oct 9, 19:00 ET (code, designs, lesson text) and where it came from, or write "Nothing: all code and content were written during the build window."

**Starter template.** The app was scaffolded with `create-next-app`. The config files (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`) started from that template, and the SVGs in `public/` are its unused defaults.

**AI tools**

- At runtime, the in-app tutor calls Claude (`claude-opus-5-5`) through the Anthropic API.
- On Oct 10, Claude Code reviewed the project against the hackathon rules. It added this disclosure, the MIT license and the attribution, and fixed the noise model so noisy runs no longer optimise away gates.
- On Oct 10, OpenAI Codex implemented the roadmap interface, resource catalog, navigation links, device-local bookmarks and notes, sharing, and print support; it checked the build, lint, types, and selected browser interactions. Codex also reviewed the roadmap changes against the official hackathon pages and updated this disclosure. Team review of educational content and final submission remains required.
- **TODO(team):** list any other AI tools used to write code or lesson text, and what they were used for.

**Roadmap inspiration and resources.** The roadmap browsing and topic-panel concept was inspired by [roadmap.sh](https://roadmap.sh/). This implementation uses our existing curriculum and progress model; no roadmap.sh source code, diagrams, or lesson content was imported. External videos and reading remain linked to their original IBM Technology, Qiskit, and IBM Quantum sources, with provider credit shown in each topic panel. These third-party resources are not our original educational contribution and are not relicensed by this repository's MIT license.

**Circuits.** The example circuits are standard textbook constructions, not original algorithms: Bell and GHZ states, Grover search, Deutsch–Jozsa, teleportation, the QFT and the 3-qubit bit-flip code. Our contribution is the learning platform built around them.

**Third-party libraries.** All of these are used as unmodified dependencies.

| Library | License | Used for |
|---|---|---|
| [Qiskit](https://github.com/Qiskit/qiskit) | Apache-2.0 | Building circuits, statevectors and partial traces, transpiling |
| [Qiskit Aer](https://github.com/Qiskit/qiskit-aer) | Apache-2.0 | Shot-based simulation and the noise model |
| FastAPI, Uvicorn, NumPy | MIT, BSD-3-Clause, BSD-3-Clause | The Qiskit service |
| Next.js, React, Tailwind CSS | MIT | The web app |
| Three.js, Framer Motion | MIT | 3D Bloch spheres and animation |
| Anthropic TypeScript SDK | MIT | The tutor's API calls |

## License

[MIT](LICENSE). This effort is supported by Qollab & IonQ.
