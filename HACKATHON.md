# Hackathon Rules & Team Guidelines

The rules we follow for the **Qollab × IonQ Quantum Hackathon**. Everyone on the team reads this before pushing code. If this file and the official pages disagree, the official pages win. Tell the team and update this file.

Official sources:
- Overview: https://qollab.xyz/programs/hackathon
- How it works, judging, awards, FAQ: https://qollab.xyz/programs/hackathon/how-it-works
- Rules & terms: https://qollab.xyz/programs/hackathon/terms
- Questions: Slack, or hello@qollab.xyz

---

## 1. Key dates (Eastern Time)

| What | When |
|---|---|
| Build window opens | **Fri Oct 9, 19:00 ET** |
| **Build window closes and submissions are due** | **Sun Oct 11, 19:00 ET** (20:00 UTC−3, 23:00 UTC) |
| Local judging | Week of Oct 12 |
| Global winners announced | Week of Oct 19 |

The captain can edit the submission until the deadline. After it, the form locks: no edits and no new submissions.

**Internal target: finish everything by Oct 11, 15:00 ET.** That leaves 4 hours for the video, the Qollab page and the form.

---

## 2. Hard requirements (miss one and we can't win an award)

Our project must:

1. **Use Qiskit** and run on Qollab's free simulators, including IonQ's simulator. Judges open the Qollab project page and press **Run** on a free local simulator.
2. **Be published and runnable on qollab.xyz under the MIT license** before the deadline.
3. **Have a Qollab project page** that covers what it does, what problem it explores, and how to run it.
4. **Include a 2–3 minute demo video** at a public link that needs no sign-in (YouTube, Loom, Vimeo or Google Drive set to "anyone with the link"). A screen recording with voiceover is enough.
5. **Be built during the build window.** Existing code is allowed only as a disclosed starting point. Judges score only what we add during the window.
6. **Follow UI accessibility best practices.**
7. **Show the attribution text exactly:** `This effort is supported by Qollab & IonQ`
8. For this GitHub repo (our outside frontend and backend), it must:
   - be **public**, with no sign-in needed
   - be **MIT-licensed** (a `LICENSE` file at the root)
   - **list its dependencies** (`package.json`, `backend/requirements.txt`)
   - contain **no API keys or secrets**, anywhere in its git history
9. **Stay available on Qollab for 12 months** after the hackathon.

The captain submits from the registration page. A team can submit up to 5 projects, and each is judged separately.

---

## 3. Things that get us disqualified

- Submitting a pre-existing project, in whole or in large part, as new work.
- Using templates, forks, open-source libraries or tutorials **without disclosing them**.
- Copying code, circuit designs or written explanations from external sources without credit.
- Misrepresenting who wrote what.
- Another team submitting a project that is substantially the same as ours.

A judge can also score us **0** on a criterion if the work doesn't go beyond "a standard reference implementation or tutorial-level exercise". A Bell state, Grover or teleportation circuit on its own counts as tutorial-level. What judges will value is **what we built around those circuits**.

---

## 4. How we're judged

Judges use one rubric with four criteria. The weights aren't published, so treat them as equal.

| Criterion | What it means for us |
|---|---|
| **Novelty & creativity** | Lead with what's unusual: the kids' Explorer games running real circuits, an AI tutor grounded in actual run results, and step-through Bloch traces. |
| **Technical execution** | It runs on the first try for a judge. No broken buttons, no "start the backend first" errors on the Qollab page. |
| **Impact potential** | Who it helps (ages 8 to graduate level) and why that matters. |
| **Documentation quality** | A clear Qollab page and README, a how-to-run that works from a clean machine, and an honest disclosure section. "Best documentation" is also its own award. |

**Theme (declared at submission, can change until the deadline).** Our best fit is **Quantum Unlocked**: "teach a hard topic (error correction, fault tolerance, networking, algorithms) through an interactive demo". The demo and the Qollab page should lead with a *hard* topic, such as the 3-qubit bit-flip code with noise, or teleportation. The coin-flip games shouldn't be the lead.

---

## 5. Qollab platform constraints

These apply to the code that runs **on Qollab**:

- Saved data does **not** persist between runs. Ship any saved state as project files.
- Code can only make **GET** requests, and only to servers that allow CORS. Our `/run` endpoint (POST) and the Claude tutor won't work from inside Qollab.
- IonQ backends accept **one job per run**. Put everything an IonQ run measures into one circuit.
- Browsers: Chrome, Edge, Brave, Opera, or Firefox 153+. **Safari isn't supported.** Record the demo in Chrome.
- Judges run on a free local simulator. Using IonQ hardware earns no extra points.

**Verified:** the Qollab project format works (qollab.xyz, Oct 10, built-in simulator; lesson 1 returned the expected ~75/25 split). The bundle contents are listed in the checklist below.

---

## 6. How we work (team rules)

### Git and proof of work
1. **Commit small and often, with clear messages.** The git history is our evidence that the work happened during the window. Never squash it into one commit.
2. Work on branches and merge to `main` through PRs. **No force-pushes to `main`.**
3. **Run before you push:** `npm run lint`, `npx tsc --noEmit`, `npm run build`, plus a manual click-through of anything you touched.

### Disclosure and credit
4. **Anything that existed before Oct 9, 19:00 ET** (our own earlier code, templates, forks, tutorials, copied snippets) goes in the README's *Disclosure* section, with its source.
5. **AI tools are allowed, but we disclose them.** Name the tools used (for example "Claude Code was used for X") in the Disclosure section.
6. Don't paste explanations or circuit designs from textbooks, the Qiskit docs or other sites without a credit line next to them.

### Secrets and safety
7. **Never commit keys.** `ANTHROPIC_API_KEY` and any IonQ or Qollab tokens stay in `.env.local`, which is already ignored by `.gitignore`. If a key is ever pushed, revoke it immediately. Deleting the file doesn't remove it from history.
8. If we host the app publicly with a real Claude key, put a spend cap on the key. Otherwise leave the tutor in offline mode, since the app already falls back to it.

### Product quality
9. **Accessibility:** every interactive element is a real `<button>`, link or input with a label or `aria-label`; it works with the keyboard alone; text has enough contrast; it respects `prefers-reduced-motion`. Run Lighthouse or axe on `/`, `/lab` and `/explorer` before submitting.
10. **Correctness beats coverage.** One polished, correct lesson beats five shaky ones. If a number on screen comes from Qiskit, it has to match what Qiskit returns.
11. Keep the attribution line `This effort is supported by Qollab & IonQ` in the app footer, the README and the Qollab page.
12. New dependencies need a reason and an MIT-compatible license. Prefer what's already installed.

### Communication
13. Claim a task in the team channel before starting it, so two people don't build the same thing.
14. Blocked for more than 30 minutes? Ask the team, or a mentor on Slack.

---

## 7. Submission checklist

Tick these off as they're done. Status is as of Oct 11, 12:30 ET. Only items someone has verified are ticked.

**Repo (GitHub)**
- [x] Public, dependencies listed, builds cleanly (`npm run build`, lint and type-check all pass)
- [x] No secrets found in the code
- [x] `LICENSE` file (MIT) added
- [x] README *Disclosure* section filled in (pre-window work, starter template, every AI tool used)
- [x] Attribution line in the README and the app footer
- [ ] Git history shows work spread across the window, not one big commit (team to judge: `main` has 51 commits, the first at Oct 10, 12:13 ET, and that first commit is large)
- [x] README top table: fill the two `TODO(team)` links (Qollab project, demo video). `RELEASE=1 npm run qollab:build` refuses to build until they're filled.
- [ ] README *How to run* checked on a clean machine
- [x] Merge the redesign PR (#3) and the judge-facing changes (#4) into `main`; #5 closed, its lesson ported

**Qollab**
- [x] Qollab project format confirmed (verified on qollab.xyz, Oct 10, built-in simulator; `npm run qollab:build` → `dist/qollab.zip`: `index.html`, `main.js`, `main.css`, `requirements.txt`, `README.md`, `LICENSE`, `quantum/__init__.py`, `quantum/engine.py`, `docs/images/judge-start.png`)
- [ ] Upload the `RELEASE=1` zip and publish on qollab.xyz, MIT-licensed
- [ ] On the uploaded project, Judge Start runs on the **free local simulator**: X on q1 gives syndrome 11 and "Recovered"; two errors give 01 and "Logical flip"
- [ ] The same on an **IonQ simulator** (one job per Run: press Stop and Run between cases)
- [ ] Project page covers what it does, the problem, how to run it, a link to this repo, and the attribution (the README is the page; check it renders)

**Accessibility** (details in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md))
- [x] axe-core: 0 WCAG A/AA violations on the Qollab player and `/`, `/learn`, `/learn/r3`, `/lab`, `/roadmaps`, `/explorer`, at 1440 and 390 px
- [x] Keyboard-only run of Judge Start; circuit editor key map; dialogs trap focus and close on Escape
- [ ] Screen-reader pass (VoiceOver or NVDA with Chrome)
- [ ] Lighthouse accessibility scores for `/`, `/lab` and `/explorer` recorded

**Demo video**
- [ ] 2–3 minutes, recorded in Chrome, with voiceover. Suggested script: the three-minute path in the README (Judge Start → X on q1 → move the error → two errors → explainer), then 20 seconds each on the lessons, the Lab and the kids' Explorer
- [ ] Public link checked in an incognito window, and added to the README and the Qollab page

**Submission form (captain)**
- [ ] Theme declared: Quantum Unlocked (proposed)
- [ ] Submitted before Oct 11, 19:00 ET, and the submission confirmed on the registration page
