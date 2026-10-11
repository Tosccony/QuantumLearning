# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (confirmed): hackathon judges and first-time visitors.** They open the app cold, with roughly three minutes, from the Qollab project page or the demo video. They are quantum-literate reviewers scoring novelty, technical execution, impact and documentation. Their job: understand in one screen what this is, press Run on something hard and see it work on the first try, then verify the breadth (ages 8 to graduate) without getting lost.

Secondary audiences, all real and all preserved:

- **Explorer learners, ages 8–12**, playing seven planet games with a guide character and optional voice narration, on a tablet or shared family laptop, often with a parent or teacher nearby. No maths. Progress is per device.
- **Students** (high school and first-year university) and **Developers** (programmers new to quantum) working through short lessons, each ending in a runnable circuit, a check question and an AI tutor.
- **Researchers** (graduate level) using the same lesson loop for density matrices, noise, error correction, phase estimation, VQE/QAOA and benchmarking.
- **Parents and teachers** opening the gated Grown-ups dashboard to read mastery, weekly minutes and offline activities, print a report or download CSV.

## Product Purpose

Quantum Quest is a quantum computing learning platform where every experiment is a real Qiskit circuit executed on a Qiskit Aer backend (ideal or with a noise model). It exists so that a learner at any level, from a child flipping a light switch to a graduate student watching the 3-qubit bit-flip code recover from noise, learns from genuine results rather than canned animations.

Success for this build: a judge runs the flagship demo on the first try, sees the real numbers (counts, exact probabilities, Bloch vectors, purity, transpiled depth), understands why they look that way, and sees the range of audiences the same engine serves. Success for a learner: finishing a module, running their own variation in the Lab, understanding the result with the tutor, and sharing it.

## Positioning

The mechanism nobody nearby can truthfully copy: **every number on screen comes back from Qiskit, including the kids' games**, and the **AI tutor is grounded in those actual run results** (counts, Bloch vectors, purity, transpiled depth), not in generic textbook text. Step-through Bloch traces after each gate are computed by Qiskit for each circuit prefix.

Submission theme: **Quantum Unlocked** (teach a hard topic through an interactive demo). **Confirmed: the home page leads with quantum error correction, the 3-qubit bit-flip code with noise, as the flagship runnable demo.** The coin-flip games are not the lead.

## Operating Context

- Judges reach the app from the Qollab project page and a 2–3 minute demo video recorded in Chrome. Browser targets: Chrome, Edge, Brave, Opera, Firefox 153+. Safari is not a supported target for the Qollab side.
- The web app (Next.js) talks to a FastAPI Qiskit service on port 8000 via `/api/qiskit/*`. If the service is down, the Lab and lessons' Run buttons are unavailable and the UI must say so plainly (the message tells the user to run `npm run backend`).
- The Claude tutor streams from `/api/tutor` when `ANTHROPIC_API_KEY` is set; otherwise a deterministic offline explainer built from the same Qiskit results answers. The offline state is normal, not an error.
- Learner progress (name, XP, streak, badges, module completion, lab runs, projects, stars, settings) lives in `localStorage` per device. Certificates are issued from that state and are not server-verifiable.
- The Grown-ups dashboard is gated by a multiplication question, has Parent and Teacher tabs, prints, and downloads CSV.
- Kids' settings: voice narration (Web Speech), colour-blind palette (blue/orange pairs instead of pink/green, and colour names in game copy follow it), bigger text. Captions are always on.

## Capabilities and Constraints

Routes to preserve, with their content and behaviour:

- `/` home
- `/learn` track catalogue; `/tracks/[track]` module list for student, developer, researcher; `/learn/[module]` lesson (sections, runnable read-only circuit, "what to look for", try-it list, check question, tutor, next/certificate)
- `/lab` circuit builder: 1–8 qubits, 19 palette gates (single, rotation with angle input accepting `pi/2`-style expressions, multi-qubit incl. CCX and multi-controlled Z), click or drag placement, move/delete, load examples from any module, `?c=` encoded circuits, `?module=`, draft autosave, shots 100–10000, noise model with three sliders, step-through slider, results tabs (histogram with exact-probability ticks, Bloch spheres per qubit with purity, statevector table with phase dials, Qiskit tab with Python/OpenQASM/text diagram and transpile stats)
- `/progress` (stats, skill tree with in-track prerequisites and cross-track bridges, certificates), `/certificate/[track]` (printable)
- `/explorer` galaxy map (welcome/name entry, HUD, avatar editor, settings, badge collection), `/planet/[id]` seven games in sequence with quiz and reward, `/grownups`
- `/api/tutor` (Claude streaming) and the `/api/qiskit/*` rewrite

Terminology in use: tracks, modules, skills, planets, badges, XP, rank/level, streak, certificate, Lab, shots, noise model, step-through.

Technical constraints: Next.js 15 App Router, React 19, Tailwind CSS 4, Framer Motion, Three.js (one 3D fridge model), JetBrains Mono for code. Every interactive element must be a real button, link or input with a label; everything must work keyboard-only; `prefers-reduced-motion` is respected. No new dependency without a reason and an MIT-compatible licence. Backend API shape is not to change.

Known open items, not to be invented around: no accounts (Supabase planned), no real hardware execution, no adaptive difficulty, teacher dashboard is single-learner.

## Brand Commitments

- **Binding: the product name "Quantum Quest".**
- Not binding (confirmed): the Qubit the Robot mascot and its drawing, the planet and badge names, and the four-step "Learn → Build → Run → Understand" framing may be reworked or replaced, as long as the underlying games, lessons and functions survive.
- Required text, exact: `This effort is supported by Qollab & IonQ` in the app footer, the README and the Qollab page.
- Required files untouched in substance: `LICENSE` (MIT), `HACKATHON.md`, the README's Disclosure section (attribution and AI disclosure).

## Evidence on Hand

- 18 written lesson modules with circuits, observe notes, try-it lists and check questions in `src/lib/curriculum.ts`.
- Seven Explorer games in `src/levels/`, five of which run real circuits (coin, treasure, twins, gate machine, door race).
- Real Qiskit results for every run: counts, probabilities, statevector, Bloch vectors, purity, entanglement flag, diagram, QASM, transpile stats, elapsed ms, Qiskit version.
- No testimonials, customers, press, benchmarks or pricing exist. Do not fabricate any. Google Willow and Microsoft Majorana facts in Planet 7 are the only external claims, already in the content.

## Product Principles

1. **Real results are the product.** Nothing on screen pretends; if a number is shown it came from Qiskit, and the interface should make that provenance visible.
2. **Lead with the hard thing.** The first screen earns a judge's attention with error correction under noise, then opens out to the full range.
3. **One engine, four doors.** The same circuit and results machinery serves an eight-year-old and a graduate student; each audience gets its own register, not a watered-down copy.
4. **Understanding, not completion.** Progress, badges and certificates exist to pull learners through the loop; the explanation grounded in their own run is the payoff.
5. **Works on the first try, keyboard-only, on a phone.** Technical execution is a judged criterion; broken buttons and inaccessible controls cost more than any flourish gains.

## Accessibility & Inclusion

Hackathon hard requirement: follow UI accessibility best practices. Concretely for this product: keyboard operability of the circuit editor (gate placement, selection, move, delete), WCAG AA contrast on all text, 44px minimum touch targets for kids' and mobile controls, dialogs that trap focus and close on Escape, `prefers-reduced-motion` honoured, colour-blind palette mode and bigger-text mode retained for Explorer, captions for all narration, `aria-live` for game feedback.
