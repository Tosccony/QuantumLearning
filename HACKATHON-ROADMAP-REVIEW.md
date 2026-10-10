# Roadmap feature: hackathon alignment review

Reviewed on October 10, 2026 against the live official overview, judging and terms pages:
- https://qollab.xyz/programs/hackathon
- https://qollab.xyz/programs/hackathon/how-it-works
- https://qollab.xyz/programs/hackathon/terms

## Assessment

The roadmap feature is aligned with the educational Quantum Unlocked theme as
part of Quantum Quest. It is not sufficient by itself to demonstrate the required
beyond-tutorial contribution. Judges assess the complete submitted project;
eligibility and award outcomes cannot be certified from this repository alone.

| Published criterion | Feature contribution | Evidence still needed |
| --- | --- | --- |
| Novelty & creativity | A guided route from prerequisites to lessons, experiments and reflection | Demonstrate the project's original explanation/visualization of a hard quantum concept; do not present roadmap.sh-inspired browsing or external courses as novel work |
| Technical execution | Curriculum-driven links, current completion states, device-local preferences and responsive navigation | End-to-end lesson and circuit run, accessibility audit and free Qollab/IonQ simulator runs |
| Impact potential | Four audience paths and credited learning resources | Clearly identify the learners and show how the guided experiment improves understanding; do not claim measured learning outcomes without evidence |
| Documentation quality | Feature scope, device storage limitations, external provider credits and AI disclosure | Complete the pre-window disclosure, clean-machine run instructions, Qollab project page and public demo video |

The official rubric lists these four criteria but does not publish numerical
weights. Their equal weighting is not an official rule.

## Verified for the added feature

- Uses the existing curriculum and Qiskit lab rather than substituting videos for
  the quantum implementation. All 18 adult lesson nodes deep-link their circuit.
- Resource reviews/bookmarks do not grant lesson completion, XP or certificates.
- Provider attribution is visible. README now credits roadmap.sh inspiration and
  OpenAI Codex's role. No roadmap.sh assets or source were imported.
- No new dependencies, credentials or API keys were added by the roadmap commit.
- Existing MIT license and support attribution remain in place.
- Production build, lint and type checks passed in the implementation turn.
  Browser checks covered searching, selected-topic links, notes/bookmark persistence
  and mobile overflow. These checks are not a complete WCAG audit or backend test.

## Submission blockers / items requiring evidence

1. Publish a Qiskit project on Qollab under MIT and demonstrate it runs on both
   a free local simulator and IonQ's simulator. The external Next.js/FastAPI app
   alone does not establish this requirement. Qollab project URL and run results
   were not supplied or verified in this review.
2. Supply a public 2–3 minute demo with no sign-in. Lead with quantum error
   correction, teleportation or another hard concept. Show roadmap → lesson →
   circuit → result → explanation, then briefly show progress/resources.
3. Fill the README pre-window work TODO truthfully and disclose other AI tools.
   Git timestamps document commits, not the full provenance of prior work.
4. Audit keyboard navigation, focus visibility, contrast, zoom/reflow and screen
   reader behavior on roadmaps and the linked learning experience.
5. Publish the changes before submission and check every judge-facing URL.
   The roadmap commit is currently local; previous GitHub writes returned 403.
6. The captain must submit by October 11, 2026, 19:00 Eastern / 20:00 Halifax,
   unless organizers officially extend the deadline. Keep the project available
   on Qollab for 12 months and include the exact support attribution there.

## Recommended demo (2–3 minutes)

- 0:00–0:20: learner problem and the chosen hard quantum concept.
- 0:20–0:45: roadmap prerequisites and the selected error-correction or
  teleportation node; show internal lesson and credited resources.
- 0:45–1:55: interactive lesson, actual circuit execution and result explanation;
  show the original educational/technical contribution clearly.
- 1:55–2:30: completion progress, notes and next steps; identify audience,
  limitations and how judges run the published Qollab project.

Do not claim real-hardware execution, cross-device sync, custom roadmap editing,
team dashboards, measured learning gains or full roadmap.sh parity: these are not
implemented or substantiated by this feature release.
