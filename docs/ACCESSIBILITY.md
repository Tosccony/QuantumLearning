# Accessibility checks

The hackathon requires UI accessibility best practices (HACKATHON.md, rule 9). This file records what was checked, how, and what is still open. Re-run the checks after UI changes and update the dates.

## Automated: axe-core (WCAG 2.0, 2.1 and 2.2, levels A and AA)

Run with `@axe-core/playwright` in headless Chromium at 1440 px and 390 px wide, on Oct 11, 2026.

| Screen | 1440 px | 390 px |
|---|---|---|
| Qollab player, Judge Start, after a Break the Code run | 0 violations | 0 violations |
| `/` home | 0 | 0 |
| `/learn` | 0 | 0 |
| `/learn/r3`, after a Break the Code run | 0 | 0 |
| `/lab` | 0 | 0 |
| `/roadmaps` | 0 | 0 |
| `/explorer` | 0 | 0 |

The first Qollab scan found an underline-free link inside footer text (`link-in-text-block`). It was fixed before the results above.

The Qollab player was scanned in a local harness that bundles `src/qollab/Player.tsx` with the Qiskit service as its transport, because a Qollab project page can't be scanned from outside the platform.

## Keyboard

Checked with scripted key presses in Chromium, plus the editor's own key map:

- **Judge Start (Qollab):** with Tab, Enter and Space only, from a fresh page load: pick an error, make a prediction, press Run and read the proof. The first Tab lands on "Judge start", and the result is announced through a live region ("Syndrome 10. q0 recovered.").
- **Tab order on pages with the tutor:** the tutor used to scroll its log into view on mount, which moved Chromium's Tab starting point to the tutor. It now scrolls only its own log, so the first Tab lands on the page header on `/lab`, `/learn/*` and the Qollab player.
- **Circuit editor:** focus the strip, then use the arrow keys to move, Enter to place or select, Delete to remove, `[` and `]` to move a gate, and Esc to cancel (see the comment in `src/components/lab/CircuitEditor.tsx`).
- **Dialogs** use the native `<dialog>` element, so focus stays inside them and Escape closes them.
- Interactive controls are native buttons, links or inputs, and the main controls meet the 44 px touch target. Known exceptions: the roadmap prerequisite chips and phone-size branch frames are slightly smaller.

## Motion and contrast

- `prefers-reduced-motion` turns off the strike, rise, blink and drawer animations and the keycap transforms (`src/app/globals.css`).
- Body text on navy uses `--fog` (#b9c7e0, about 7:1 on the rail). Text in paper windows uses #46587a or darker.

## Still to do (team)

- [ ] **Screen reader pass.** VoiceOver (Safari isn't supported by Qollab, so use VoiceOver with Chrome) or NVDA with Chrome: read Judge Start top to bottom, run a case, and confirm the proof panel and the "Explain" window are announced in a sensible order.
- [ ] **Lighthouse.** Run Chrome DevTools › Lighthouse › Accessibility on `/`, `/lab` and `/explorer` (HACKATHON.md rule 9) and paste the scores here.
