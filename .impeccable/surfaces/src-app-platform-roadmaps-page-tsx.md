---
version: 1
slug: "src-app-platform-roadmaps-page-tsx"
primary_target: "src/app/(platform)/roadmaps/page.tsx"
related_targets: ["src/app/(platform)/roadmaps/[track]/page.tsx","src/components/roadmaps/RoadmapView.tsx"]
---

## Scope

`/roadmaps` (index) and `/roadmaps/[track]` (one roadmap), rendered by `RoadmapView`. Mode: Operate. The learner plans and tracks a path through the existing lessons and Explorer games; a judge sees the curriculum's shape in one screen. Inherits the Select Rail world from DESIGN.md; no system change.

## Audience, job, content

A learner (or judge) opens a roadmap, reads the path from first topic to certificate, presses a topic to read its summary, prerequisites, free resources and challenge, starts the lesson or opens its circuit in the Lab, marks Learning or Skipped, bookmarks, writes notes, shares a topic link, prints to PDF. Content: 28 topics across five tracks (Explorer 7, Student 6, Developer 6, Researcher 6, Concepts 3) from `src/lib/roadmaps.ts`; completion is verified by the lesson or game (Qiskit-run), never self-ticked; Learning, Skipped, bookmarks, reviewed resources and notes are personal and device-local (`quantum-quest-roadmaps-v1`). Constraints: keyboard-only, print, mobile from 360px, no new dependency.

## Direction contract

THESIS: A roadmap is a vertical spine of topic frames joined by ice connectors, read top to bottom like roadmap.sh, with one drawer for the topic you press. It refuses the two-column "list on the left, panel on the right" layout the previous build shipped and the dashboard of equal cards.

OWN-WORLD: The Select Rail unchanged: navy stock and deeper navy rails, punched paper windows, one ice ink, edge codes, folded flags, grease crosses, sprocket perforations, Saira Condensed caps, JetBrains Mono for codes. New here only as composition: SVG connector lines in ice between frames, dashed where a link is optional, branch nodes on hairlines, a legend frame, milestone notes between tiers, a drawer that slides from the right (a bottom sheet on phones).

STORY: The visitor sees the whole path at once, understands what is done, what is next and what is locked from the marks, presses a node, reads what it is and how to learn it, and leaves into a lesson or the Lab; progress shows in the bar as lessons are verified.

FIRST VIEWPORT: Platform rail. A title bar: track name as headline with its collar stripe, the progress bar (done · learning · skipped counts), Share and Download PDF keycaps, and the tabs Roadmap · Projects · Tutor. Below, the map fills the width: topic frames down a central spine with ice connectors; each topic's lesson, Lab circuit and resources branch left and right as smaller frames on hairlines; a legend frame at the top-left explains the marks. The first press opens the drawer on the right third with summary, prerequisites, resources, Learning / Skipped keycaps and notes.

FORM: Spine and Drawer, second on the round-two list of seven roadmap.sh-grounded structures; locked by the user on decision page 2cb29695 after a re-roll with the steer "use roadmap.sh feature"; seed key e0975a49 (round 2; round 1 key d5e1a38c, cards Projection Booth, Reel Shelf, Splice Map, all rejected by the re-roll).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, a DESIGN.md check, and every shipping raster carrying its provenance.

## Signature interaction

Pressing a node: the frame's flag folds down and the drawer slides in (one 180ms step, none under reduced motion); the connectors above the node light to ice to show the path travelled. Keyboard: arrow keys move along the spine, Enter opens the drawer, Escape closes it.

## Unresolved

The "Projects" tab lists each topic's Lab circuit (deep link) and the "Tutor" tab deep-links to the Lab tutor with the circuit loaded; neither adds server state.
