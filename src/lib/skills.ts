import { MODULES, modulesOf, TRACKS, type Module, type TrackId } from "./curriculum";
import { PLANETS } from "./levels";
import type { State } from "./progress";

export type SkillStatus = "done" | "available" | "locked";

export const moduleStatus = (s: State, m: Module): SkillStatus =>
  s.modules[m.id] ? "done" : m.requires.every((r) => s.modules[r]) ? "available" : "locked";

/** Explorer planets unlock in order: the first is always open, and each later one opens once the planet before it is completed. */
export const planetStatus = (s: State, id: number): SkillStatus =>
  s.levels[id]?.completed ? "done" : id === PLANETS[0].id || s.levels[id - 1]?.completed ? "available" : "locked";

export function trackProgress(s: State, t: TrackId) {
  if (t === "explorer") {
    const done = PLANETS.filter((p) => s.levels[p.id]?.completed).length;
    return { done, total: PLANETS.length };
  }
  const ms = modulesOf(t);
  return { done: ms.filter((m) => s.modules[m.id]).length, total: ms.length };
}

export function certificate(s: State, t: TrackId) {
  const { done, total } = trackProgress(s, t);
  if (done < total) return null;
  const dates = t === "explorer" ? PLANETS.map((p) => s.levels[p.id]?.completedAt ?? "") : modulesOf(t).map((m) => s.modules[m.id].completedAt);
  const issued = dates.sort().at(-1) ?? new Date().toISOString();
  return { track: TRACKS.find((x) => x.id === t)!, issued, id: certId(`${s.name}|${t}|${issued}`) };
}

/** Short, stable credential ID derived from learner, track and completion time (FNV-1a). */
function certId(input: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const a = (h >>> 0).toString(36).toUpperCase().padStart(7, "0");
  return `QQ-${a.slice(0, 4)}-${a.slice(4)}`;
}

/** The next thing to study: first available module, in track order. */
export function nextModule(s: State, t?: TrackId): Module | undefined {
  return MODULES.find((m) => (!t || m.track === t) && moduleStatus(s, m) === "available");
}
