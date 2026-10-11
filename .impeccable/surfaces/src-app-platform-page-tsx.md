---
version: 1
slug: "src-app-platform-page-tsx"
primary_target: "src/app/(platform)/page.tsx"
related_targets: ["src/app/(platform)/lab/page.tsx","src/app/(kids)/explorer/page.tsx","src/app/layout.tsx"]
---

# Quantum Quest · full-app redesign

Scope: every route. Visitor mode: Persuade on `/`, Operate on `/lab`, Read on lessons, Experience on Explorer. Audience: hackathon judges first, then learners age 8 to graduate. Job: run the hardest demo on the first try, understand the real result, see the range.

## Direction contract

THESIS: Every page is one strip of frames on a perforated rail at a fixed height; circuits are frames, the step-through is a scrub snapping to gate pitch, copy lives in punched white windows, state is a mark never a hue. Refuses the dark dashboard of rounded cards, emoji and a purple glow.

OWN-WORLD: Navy film stock (#16366a) lifted to a readable blue with fine grain, deeper navy rail and bench (#10294f), one ice ink (#6fe6ff) for flags and actions, punched white windows (#f5f7fa) with near-navy text (#0b1a33). Sprocket perforations, edge codes, folded flags, pins and bin, grease crosses, punched corners. Saira Condensed caps for labels and headlines, Saira Semi Condensed for reading, JetBrains Mono for bitstrings and code. Drawn single-stroke icons. No glow, gradient or glass.

STORY: A judge sees "every result here is a real Qiskit run", presses RUN WITH NOISE on the bit-flip code, watches shots count up and the logical qubit recover, then sees four tracks on the rail and the community hanging on pins.

FIRST VIEWPORT: Rail across the top with nav frames and a folded flag on the current page. Headline across twelve cells. Demo strip left two-thirds: bit-flip code gates as frames with edge codes and the scrub handle. Right third: punched window with the histogram (ink bars measured, hairline ticks exact, scale bar counting shots) and the RUN control as an ice frame in the rail. Caption under the strip. Tracks rail below.

FORM: The Select Rail (cutting bench challenger, user-pinned over the roll's chip micrograph, recoloured navy and lifted); seed key 5f0b3e75, round 4.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Citations

- Per-track stripe colours (Explorer, Student, Developer, Researcher) are the one departure from the single ice ink. Source: the written brief the user approved before the build ("The four tracks each get one stripe colour, used only as a collar stripe on their frames"), approved in chat on 2026-10-10. Gate-family stripes in the editor are earned by the preserved colour-blind palette truth in PRODUCT.md.
- Seed key 5f0b3e75: printed by `impeccable concept-seed --scope direction --mode persuade` on 2026-10-10; the user locked the lead card of round 4 (re-rolls 1–3 steered: sci-fi, cutting bench in navy, lifted navy) on decision page key 36c4b267. Telemetry ping sent with `--kind assigned --from 5f0b3e75`.
- The step-through scrub lives on the strip as a ruler (one tick per gate) in `CircuitEditor` via the `scrub` prop; the Lab and the home demo both use it.
