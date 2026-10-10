# Quantum learning roadmaps

## Implemented

- `/roadmaps`: search four audience paths and their topic titles.
- `/roadmaps/[track]`: 25 curriculum topics, connected path and list views, zoom,
  prerequisite navigation, next lesson, progress, bookmarks and personal notes.
- Every node links to its existing lesson/game, external video and reading;
  all 18 adult modules deep-link their exact circuit into the Quantum Lab.
- Resource review tracking is separate from assessed lesson completion and XP.
- Share links preserve the selected topic without sharing private notes/progress.
- Browser print / save as PDF, mobile layout and keyboard-accessible controls.
- Existing XP, streaks, certificates, community and lab tutor remain linked.

Notes/bookmarks/resource reviews use `quantum-quest-roadmaps-v1` in localStorage.
Existing lesson progress retains its original storage and completion semantics.
The resource catalog is in `src/lib/roadmaps.ts`. Broader overview videos and
course links are explicitly labeled; they are not represented as specific
lectures for every topic. Sources were checked on 2026-10-10.

## Remaining phases (not implemented)

This release does not claim full roadmap.sh parity.

1. Expand the curated catalog with individual videos/readings for every topic,
   estimated resource duration, accessibility metadata and link health checks.
2. Add dedicated project packs, additional assessments and skill-based paths
   (Qiskit, algorithms, quantum error correction) beyond the existing curriculum.
3. Extend the tutor with explicit roadmap context, personal goal planning and
   recommendations. The current tutor is available inside the linked lab.
4. Add authentication and a persistent learner database for device sync,
   server-verifiable certificates and user profiles.
5. Build a custom roadmap editor, versioning, forks and community publishing,
   including ownership, moderation and sharing permissions.
6. Add teacher/team memberships, assignments, progress reports and skill gaps.

No new credentials or services are needed for this release. Later account and
teacher features require an authentication provider/database and product decisions
about roles. AI personalization uses the existing provider configuration but needs
prompt/API changes and usage limits. There is no billing or newsletter system.
