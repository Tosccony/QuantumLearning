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

**Still to confirm:** what a Qollab project actually contains (files, Python runtime, whether `qiskit_aer` is available). Someone needs to log in and open a template before we build the Qollab version.

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

Tick these off as they're done. Status is as of the Oct 10 review.

**Repo (GitHub)**
- [x] Public, dependencies listed, builds cleanly (`npm run build`, lint and type-check all pass)
- [x] No secrets found in the code
- [x] `LICENSE` file (MIT) added
- [ ] README *Disclosure* section: drafted, but the team must fill in the two `TODO(team)` lines (pre-window work, other AI tools)
- [ ] README *How to run* checked on a clean machine
- [x] Attribution line in the README and the app footer
- [ ] Git history shows work spread across the window, not one big commit

**Qollab**
- [ ] Qollab project format confirmed
- [ ] Qiskit project published on qollab.xyz, MIT-licensed
- [ ] **Run** works on the free local simulator and on IonQ's simulator
- [ ] Project page covers what it does, the problem, how to run it, a link to this repo, and the attribution

**Demo video**
- [ ] 2–3 minutes, recorded in Chrome, with voiceover
- [ ] Public link checked in an incognito window

**Submission form (captain)**
- [ ] Theme declared: Quantum Unlocked (proposed)
- [ ] Submitted before Oct 11, 19:00 ET, and the submission confirmed on the registration page
