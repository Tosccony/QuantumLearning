---
name: "Quantum Quest · The Select Rail"
description: "Navy telemetry tape: perforated rails, square frames, punched paper windows and one ice ink."
colors:
  navy: "#16366a"
  navy-deep: "#10294f"
  navy-ink: "#0b1a33"
  ice: "#6fe6ff"
  ice-deep: "#2fb8d6"
  ice-hover: "#8aecff"
  ice-wash: "rgba(111, 230, 255, 0.14)"
  navy-hover: "#1c3561"
  paper: "#f5f7fa"
  paper-2: "#e4eaf3"
  paper-3: "#cdd7e6"
  paper-muted: "#46587a"
  paper-dash: "#9aa9c4"
  field-paper: "#ffffff"
  field-placeholder: "#5b6b8a"
  fog: "#b9c7e0"
  line: "rgba(245, 247, 250, 0.26)"
  line-strong: "rgba(245, 247, 250, 0.55)"
  scrim: "rgba(11, 26, 51, 0.72)"
  good: "#3ddc97"
  bad: "#ff7b7b"
  bad-ink: "#a52236"
  warn: "#ffd23f"
  t-explorer: "#ffd23f"
  t-student: "#7bdff2"
  t-developer: "#3ddc97"
  t-researcher: "#c9a0ff"
  on: "#ffd23f"
  off: "#3b4f7a"
  a: "#ff6fb5"
  b: "#3ddc97"
  cb-a: "#ff9f1c"
  cb-b: "#2ec4ff"
  cb-on: "#ffe066"
typography:
  display:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 7vw, 5.6rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.005em"
  headline:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.005em"
  title:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.005em"
  title-sm:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.005em"
  body:
    fontFamily: "Saira Semi Condensed, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  prose:
    fontFamily: "Saira Semi Condensed, system-ui, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.09em"
  label-sm:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "0.68rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.11em"
  keycap:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
  keycap-xl:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.06em"
  chip:
    fontFamily: "Saira Condensed, system-ui, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.08em"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
  edge-code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.62rem"
    letterSpacing: "0.12em"
  ruler:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "9px"
    letterSpacing: "0.08em"
rounded:
  square: "0px"
spacing:
  1: "4px"
  1-5: "6px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "28px"
  8: "32px"
  12: "48px"
  14: "56px"
  perf: "14px"
  cell: "56px"
components:
  button-primary:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.keycap}"
    rounded: "{rounded.square}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.ice-hover}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ice}"
    typography: "{typography.keycap}"
    rounded: "{rounded.square}"
    padding: "12px 20px"
  button-outline-hover:
    backgroundColor: "{colors.ice-wash}"
  button-paper:
    backgroundColor: "transparent"
    textColor: "{colors.navy-ink}"
    typography: "{typography.keycap}"
    rounded: "{rounded.square}"
    padding: "12px 20px"
  button-paper-hover:
    backgroundColor: "{colors.paper-2}"
  button-paper-primary:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.paper}"
    typography: "{typography.keycap}"
    rounded: "{rounded.square}"
    padding: "12px 20px"
  button-paper-primary-hover:
    backgroundColor: "{colors.navy-hover}"
  button-xl:
    typography: "{typography.keycap-xl}"
    padding: "16px 28px"
    height: "56px"
  field:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "8px 12px"
    height: "44px"
  field-paper:
    backgroundColor: "{colors.field-paper}"
    textColor: "{colors.navy-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.square}"
    padding: "8px 12px"
    height: "44px"
  chip:
    textColor: "{colors.paper}"
    typography: "{typography.chip}"
    rounded: "{rounded.square}"
    padding: "4px 8px"
  chip-paper:
    textColor: "{colors.navy-ink}"
    typography: "{typography.chip}"
    rounded: "{rounded.square}"
    padding: "4px 8px"
  rail:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.paper}"
  perf:
    backgroundColor: "{colors.navy-ink}"
    height: "{spacing.perf}"
  frame:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.paper}"
    rounded: "{rounded.square}"
  window:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.square}"
  navigation:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.fog}"
    typography: "{typography.label}"
    height: "44px"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.square}"
    padding: "12px 20px 20px"
  scrub:
    backgroundColor: "transparent"
    height: "44px"
  ruler:
    backgroundColor: "{colors.navy-deep}"
    textColor: "{colors.fog}"
    typography: "{typography.ruler}"
    height: "40px"
  histogram-paper:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-muted}"
    height: "224px"
  readout:
    textColor: "{colors.paper}"
    typography: "{typography.title-sm}"
  avatar:
    rounded: "{rounded.square}"
    size: "72px"
---

# Design System: Quantum Quest

## Overview

**Creative North Star: "The Select Rail · Navy Telemetry (lifted)"**

Quantum Quest is a strip of navy film stock. Every page runs as frames on a perforated rail: navigation is a row of framed links between sprocket bands, circuits are 56px frames with edge codes, the step-through is a ruler with a folded flag that snaps to gate pitch, and anything meant to be read for more than a sentence is punched out as a white paper window. The stock itself is lifted navy with fine static grain painted into the body background, so the texture scrolls with the page rather than floating over it.

One ice ink does all the pointing: actions, the folded flag on the current page or step, active frame strokes, measured bars on navy. Everything else that looks like a colour is content or identity, not state. Completion is a grease cross, availability is an outlined square, locked is a padlock and a punched corner, stale is a warning mark; the hue never carries the meaning on its own. Type follows the same split: condensed capitals stamp labels and headings, semi-condensed text reads, monospace reports bitstrings, codes and shot counts with tabular figures.

The bench is flat and square. There are no shadows, no glass, no decorative gradients and no rounded cards; depth comes from navy-to-paper contrast, hairlines, inset strokes and the punched geometry of the material. Source evidence: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/primitives.tsx`, `NavBar.tsx`, `KidsRail.tsx`, `FlowSteps.tsx`, `ui/Dialog.tsx`, `ui/Icon.tsx`, `lab/CircuitEditor.tsx`, `lab/Histogram.tsx` and the home, lab, lesson, progress and explorer routes.

**Key Characteristics:**
- Perforated navy rails (14px sprocket bands) and square 1px-hairline frames on a 56px circuit pitch.
- Punched paper windows for reading, results and dialogs.
- One ice ink for actions and position; track stripes and game pairs are the only other hues, each with a stated meaning.
- State is a mark (cross, flag, square, lock, warning, punched corner), never a hue.
- Condensed capitals for labels and headings, semi-condensed reading text, monospaced telemetry.

## Colors

Lifted navy stock, near-white paper and one bright ice ink; every other colour is a labelled piece of content. Frontmatter values are normative and keep the stylesheet's hex and rgba formats.

### Primary
- **Ice Ink** (`ice`): primary keycaps, folded flags, active frame borders and inset strokes, measured bars on navy, scrollbar thumb, selection and caret. The only colour allowed to mean "act here" or "you are here".
- **Pressed Ice** (`ice-deep`): the fold band at the top of every flag, and the exact-probability tick on paper histograms.
- **Ice Hover** (`ice-hover`) and **Ice Wash** (`ice-wash`): hover fills for the solid and outline keycaps respectively; the wash is also the hover of the circuit strip's gate palette.

### Secondary
Content colours. None competes with ice for attention and none is used for interface state.
- **Track collars** (`t-explorer`, `t-student`, `t-developer`, `t-researcher`): a 4px stripe on a track's frames, cards and lesson headers, and the 1px inset on filled progress cells. The one cited departure from the single ink.
- **Game pairs** (`on`, `off`, `a`, `b`): the states Explorer learners compare (light on/off, twin A/B). Gate-family stripes in the editor palette draw from the same content palette. Colour-blind mode (`[data-cb="true"]`) swaps to `cb-a`, `cb-b`, `cb-on` and reuses them for good/bad, so every pair becomes blue/orange.
- **Feedback inks** (`good`, `bad`, `warn`): notice borders and icons, always beside text and an icon. **Paper Error Ink** (`bad-ink`) is the error foreground inside windows, where `bad` would fail contrast.
- Avatar suits and the 3D fridge's metals are user or model content, not palette.

### Neutral
- **Navy Film** (`navy`): page ground under the grain; also the viewport theme and the punched-corner mask.
- **Deep Bench** (`navy-deep`): rails, frames, strip background, dialog frames.
- **Near-Navy Ink** (`navy-ink`): sprocket holes, paper text, paper keycaps, paper histogram bars, the Bloch and gate plates.
- **Punched Paper** (`paper`): windows and primary text on navy. **Secondary Paper** (`paper-2`): inset surfaces, avatar face, paper hover. **Paper Rule** (`paper-3`): dividers and field borders on paper.
- **Paper Muted** (`paper-muted`): secondary text on paper (captions, axis labels, legends, empty states). **Paper Dash** (`paper-dash`): dashed placeholders on paper (zero-count bars, empty histogram baseline, phase dial rings).
- **Fog** (`fog`): secondary text on navy; inactive nav labels; edge codes; ruler text.
- **Rail Hairline** / **Strong Hairline** (`line`, `line-strong`): frame borders and dividers; strong is the ruler baseline, field border and hover border.
- **Field Paper** / **Field Placeholder**: white field interiors and their placeholder ink inside windows.
- **Scrim** (`scrim`): the full-viewport translucent near-navy behind the native dialog.

`--accent`, `--ink` and `--muted` alias ice, paper and fog; they are not extra colours. `paper-muted` and `paper-dash` exist only as literals in the stylesheet and components, not as root custom properties; they are recorded because the build reuses them consistently.

**The One Ice Ink Rule.** Ice means act or here. If a new surface needs a second accent, it is either a track collar, a labelled game pair or a feedback ink with a word next to it; never a new hue for interface state.

**The Mark Before Hue Rule.** Every state has a shape: cross for done, flag for current, outlined square for available, lock for locked, warning for stale, punched corner for unavailable. Colour may accompany the mark; it never replaces it.

## Typography

**Display Font:** Saira Condensed (system-ui, sans-serif fallback). Loaded weights 500, 600, 700, 800; the build uses 600 for labels and controls and 700 for headings.
**Body Font:** Saira Semi Condensed (system-ui, sans-serif fallback). Loaded weights 400, 500, 600.
**Label/Mono Font:** JetBrains Mono (ui-monospace, monospace fallback) for code, bitstrings, edge codes, ruler and telemetry readouts, always with tabular numerals.

**Character:** The condensed face stamps the rail like a label gun: uppercase, tight leading, almost no tracking. Reading text stays mixed case and loose. Monospace is the telemetry voice and never decorates.

### Hierarchy
- **Display** (700, `clamp(2.6rem, 7vw, 5.6rem)`, 0.95): the home headline only, uppercase, balanced, capped at 14ch. A display option, not a heading default.
- **Headline** (700, 1.875rem, 0.95): page and section headings (`Heading` primitive from the 40rem breakpoint, lab and home section titles). Steps down to Title below 40rem; some section titles go up to 2.25rem.
- **Title** (700, 1.5rem, 0.95): the default `Heading` size, dialog titles, window headings, track names and readout values.
- **Title Small** (700, 1.25rem, 0.95): card and planet titles, telemetry readout values.
- **Body** (400, 1rem, 1.55): default reading voice on navy and paper. **Prose** (400, 1.02rem, 1.65): lesson copy inside windows, measure 68ch, square list markers, mono code chips.
- **Label** (600, 0.78rem, 0.09em, uppercase): nav links, control captions, group labels on the strip. **Label Small** (600, 0.68rem, 0.11em, uppercase): readout captions, flow steps, the footer credit.
- **Keycap** (600, 0.875rem, 0.08em, uppercase) and **Keycap XL** (600, 1.125rem, 0.06em): button text. **Chip** (600, 0.7rem, 0.08em): metadata tags.
- **Code**: size set by context (0.65–0.875rem in charts and lists, 11–14px in strip SVG). **Edge Code** (0.62rem, 0.12em, uppercase, fog): frame references such as F01, P03, C02. **Ruler** (9px, 0.08em): the STEP label and frame numbers drawn in SVG.

**The Three Voices Rule.** Saira Condensed for anything stamped (headings, labels, keycaps, chips), Saira Semi Condensed for anything read, JetBrains Mono for anything measured or addressed (bitstrings, counts, codes, angles). Do not let a fourth face or a system fallback become the identity.

**The Edge Code Rule.** Edge codes are addresses in the perforation margin (F01, P03, C02), set in mono at 0.62rem in fog. They sit beside a heading, never above it as an eyebrow, and never carry the only copy of an instruction.

## Layout

The hard unit is the circuit frame: 56px (`--cell`), matching the editor's `CELL` and its 56px left gutter for wire labels. Columns of the strip, the ruler ticks and the home demo's group labels all align to it. Everything else uses the 4px rhythm (4, 8, 12, 16, 20, 24, 28, 32, 48) with 6px gaps for icon-and-text pairs.

The platform container caps at 1400px; main content pads 12px then 16px at 40rem and 24px at 64rem horizontally, 20px then 32px at 64rem vertically. The platform rail is sticky at the top with its links scrolling horizontally on narrow screens; link frames are at least 44px tall. The Explorer uses a 64rem rail and a 72rem page. Home places the result window as a 400px column from 80rem; the lab and lesson routes use 380px and 360px side columns from 64rem. These are per-surface compositions, not a global grid.

Horizontal scrolling preserves pitch: the circuit strip, histogram, track cards (snap-x, 78vw up to 320px each) and the Explorer mission tape all scroll locally rather than compressing. Histogram bitstring labels rotate vertical below 40rem. Breakpoints in use: 40rem, 48rem, 64rem, 80rem. `--rail-h` (64px) is declared but nothing reads it; rails are sized by their content and perforations.

Dialogs cap at 28rem, 36rem or 48rem wide and `min(92dvh, 900px)` tall, with 12px (24px from 40rem) of viewport padding; the sheet variant bottom-aligns below 40rem.

## Elevation & Depth

Flat. The system uses no cast or ambient shadows anywhere. Depth is tonal and material: navy ground, deeper navy rails and frames, paper windows punched out of the stock, 1px hairlines, and a 1px inset ice stroke (`inset 0 0 0 1px var(--ice)`) that marks the active frame alongside its ice border. Focus is a 2px outline offset 2px, ice on navy and near-navy inside windows; the circuit strip and the ruler draw the same 2px ice outline when focused.

Grain is in the stock, not over it: `public/film-grain.png` (160×160 RGBA tile, white pixels at alpha 0–28, about 5.5% average, seed 42, MIT; provenance in `public/film-grain.png.json`) repeats as the body background image over the navy background colour, so it scrolls with the page. Print removes it and switches to white on black.

The native dialog sits in the browser top layer on a full-viewport scrim; there is no custom `::backdrop` and no blur. Motion is brief and mechanical: `strike` (180ms, three steps) for results landing, `rise` (520ms, ease-out) for bars, `blink` (1s, two steps) for activity, and a 520ms cubic ease-out count on the shots scale bar. Keycaps transition colour and transform over 150ms and press down 1px. Reduced motion disables the keyframes, keeps keycaps to colour and shows the final shot count immediately.

**The Flat Bench Rule.** Separate surfaces with contrast, hairlines and inset strokes. No shadows, glow, glass or blur on any surface; the one rounded, ringed element in the system is the community pin head.

## Shapes

Square corners everywhere; the only radius is on the sprocket holes themselves. A frame is a 1px hairline on deep navy; active adds the ice border and inset stroke; ghost uses a dashed hairline. Windows are paper with no border of their own. The folded flag is a pointed tape tab, 22px wide by default (18px on nav frames, 16px on the ruler and track cards, 14px over the active strip column, 12px on flow steps), ice with a pressed-ice fold.

Perforations are a 14px band of 14×10px holes with 2.2px corners on a 24px pitch (`.perf`); vertical perforations (`.perf-v`) are 14px wide with 7×12px holes on a 20px pitch; `.perf-ice` punches the holes in ice at 55%. The scrub track carries its own smaller 12×7px perforation. Locked or unavailable frames get a 16px punched corner, a hard-stop diagonal of page navy over the top-right. Graticules are 1px rules at 10% × 25%. Icons are drawn single-stroke on a 24px grid at 1.75px with round caps; avatar symbols use the same grid at 1.6px. Circles appear only inside content: icon paths, Bloch spheres, planet discs, phase dials and the pin head.

## Components

### Buttons
Keycaps: square, condensed uppercase, 1px border, 12px 20px padding, 44px minimum width and height, 1px press, opacity 0.45 when disabled.
- **Primary** (`button-primary`): ice fill, near-navy text; hover lightens to Ice Hover. The RUN control.
- **Outline** (`button-outline`): ice text and border on transparency; hover washes with Ice Wash. Secondary actions on the rail, including the nav name editor at reduced padding.
- **Paper** (`button-paper`) and **Paper Primary** (`button-paper-primary`): near-navy outline or near-navy fill inside windows; hovers to Secondary Paper and Navy Hover.
- **XL** (`button-xl`): a size-only modifier (1.125rem, 56px minimum height, 16px 28px padding, 0.06em tracking) stacked on a paper-primary keycap for Explorer and lesson-advance controls. It changes no colour.
- A destructive one-off: the strip's Delete keycap borders and tints with `bad`.

### Chips
Noninteractive metadata: strong hairline and paper text on navy, Paper Rule border and near-navy text inside windows, 4px 8px padding, 12px icon. A completed chip swaps its border to ice and carries a cross.

### Cards / Containers
- **Rail** (`rail`): deep navy with a perforation band above and below; contents pad 8–16px. Nav, footer, telemetry line, track and claims rows, mission tape.
- **Frame** (`frame`): the cell. Padding is per composition, commonly 16px; cards hover to the strong hairline, Explorer planet frames hover to ice. Track frames wear their collar stripe at the top and an edge code at the top right.
- **Window** (`window`): paper with near-navy text; often opens with a perforation band and pads 16px. The base primitive sets only the surface.
- Progress and XP cells are small bordered rectangles (8–12px tall, 16px wide) filled ice, with a 1px inset of the track collar when filled.

### Inputs / Fields
44px minimum height, 8px 12px padding, square. Transparent with a strong hairline and fog placeholder on navy; white with a Paper Rule border and a darker placeholder on paper. Focus swaps the border to ice (near-navy on paper) with the outline offset collapsed. Invalid angle fields border in `bad` with `aria-invalid`.

### Scrub and STEP ruler
The scrub (`scrub`) is a real range input, 44px tall, with a 10px perforated track and an 18×28px pointed ice thumb outlined in near-navy; Firefox gets a plain track and square thumb. On the circuit strip it becomes the STEP ruler (`ruler`): a 40px band above the wires with a strong-hairline baseline, one 1.5px tick per gate at its frame column (ticks sharing a column spread inside it), ticks lit ice and taller once passed, a 9px mono STEP label in fog, and a 16px folded flag as the handle. Pointer drags snap to the nearest tick; the hidden native range input keeps keyboard control and announces "After gate n of m". The `scrub-ruler` variant clears the track so the drawn ticks show through.

### Navigation
Platform rail: brand frame plus four framed links between perforations, labels in fog that brighten to paper on hover, the current page framed active with a folded flag breaking the top perforation and `aria-current="page"`. Links scroll sideways on narrow screens; XP, streak and level appear as a label-small telemetry string from 64rem; the display-name field and Save keycap wrap to a second row when editing on mobile. The Explorer rail uses the same frames at a 48px minimum height with Map, Grown-ups and All-tracks exits.

### Dialog
A native `<dialog>` opened with `showModal()`: body scroll locked, focus returned to the opener, Escape and scrim mouse-down close it, a 44×44px labelled close keycap in the header. Paper window by default, navy frame as a variant, both opening with a perforation band; title in Title size, content padded 12px 20px 20px. The sheet variant only changes alignment; there is no slide animation.

### Histogram
Measured counts are bars (near-navy on paper, ice on navy), exact probabilities are separate 3px ticks (pressed ice outlined in near-navy on paper, paper on navy), zero outcomes are a dashed 3px placeholder. The plot sits on a graticule behind a 1px left and bottom axis, 224px tall by default, with a mono percentage axis that rescales to 100/50/25%, mono bitstring labels, the heaviest label on the most-measured outcome, a legend, a 40×8px bracket scale bar counting shots, and a truncation note beyond 32 outcomes. Bars rise on mount; counts tabulate over 520ms.

### Telemetry readout line
Readouts run on a rail as one wrapped row: a 16px ice icon, the value in condensed Title-Small with tabular numerals in paper, the unit as a label-small, and an optional mono note from 40rem. The home results window uses the same voice as a three-cell `<dl>` with hairline gutters. The `Readout` primitive in `primitives.tsx` (label over a Title value) is exported but not used by any route.

### Flow steps
Five 36px frames with negative margin overlap: current frame is active with a 12px flag, done frames show an ice cross instead of their icon, labels appear from 40rem, `aria-current="step"`.

### State marks and avatar
`Mark` renders done (ice cross), locked (padlock at 70%), current (flag), stale (warn icon), available (outlined square at 0.6 of the mark size), each with an accessible name. The Explorer avatar is a 72px square suit plate with a 3px paper border, a Secondary Paper face inset 18% and a paper topper tab; faces and toppers render as drawn SVG paths keyed by the stored emoji strings.

## Do's and Don'ts

### Do:
- **Do** keep the product name Quantum Quest and the exact footer credit, "This effort is supported by Qollab & IonQ", on a perforated rail in label-small fog.
- **Do** build new surfaces from rails, frames and windows: perforation above and below a rail, 1px hairline frames on the 56px pitch, paper windows for anything read at length.
- **Do** mark state with a shape (cross, flag, square, lock, warning, punched corner) and a label; use ice only for actions and position.
- **Do** keep every control a real button, link or input at 44px minimum (56px for Explorer XL keycaps), with the 2px ice or near-navy focus outline visible.
- **Do** show measured bars and exact ticks as separate encodings with a legend and the shots scale bar, and print backend and Qiskit version beside results.
- **Do** honour reduced motion, the colour-blind pair swap, bigger-text mode and captions on every new surface.
- **Do** carry `public/film-grain.png` with its provenance sidecar when the stock is reused.

### Don't:
- **Don't** add rounded cards, shadows, glow, blur or glass; the bench is flat and square.
- **Don't** introduce a new hue for interface state; collars, game pairs and feedback inks already have meanings.
- **Don't** use emoji or font glyphs as icons; draw them on the 24px single-stroke grid.
- **Don't** promote an edge code into a kicker or eyebrow above a heading.
- **Don't** let system fallback fonts carry the display identity or set reading copy in condensed capitals.
- **Don't** fabricate results; sample values in the sidecar are labelled illustrative and are not Qiskit runs.
- **Don't** replace the native dialog with a styled generic overlay.

Not canonized or repaired: emoji appear in Explorer mascot speech copy (Qubit lines, AskQubit answers, quiz prompts), which the direction contract refuses; the `Readout` primitive and `--rail-h` are declared but unused; Saira Condensed 800 is loaded but never set; `paper-muted` is written 63 times as a literal rather than a token; the histogram's shot tooltip is hover-only; the paper scrub styling and the pointed thumb are WebKit-only; the Level 6 door glow is a `color-mix` toward `on` driven by real probability and is game content, not a surface effect. This pass changes no source and certifies no whole-app accessibility.
