import { moduleById, modulesOf, type TrackId } from "./curriculum";
import { PLANETS } from "./levels";
import { moduleStatus, planetStatus, type SkillStatus } from "./skills";
import type { State } from "./progress";

export type Resource = { title: string; url: string; kind: "Video" | "Reading"; provider: string; level: string };
export type RoadmapTopic = { id: string; source: { kind: "planet"; id: number } | { kind: "module"; id: string }; title: string; summary: string; lesson: string; lab?: string; requires: string[]; minutes?: number; resources: Resource[]; challenge: string };
const intro: Resource = { title: "What is quantum computing?", url: "https://www.youtube.com/watch?v=lt4OsgmUTGI", kind: "Video", provider: "IBM Technology", level: "Introductory overview" };
const grover: Resource = { title: "Grover’s algorithm — lesson 08", url: "https://www.youtube.com/watch?v=hnpjC8WQVrQ", kind: "Video", provider: "Qiskit", level: "University" };
const basics: Resource = { title: "Basics of quantum information", url: "https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information", kind: "Reading", provider: "IBM Quantum", level: "Foundations · linear algebra recommended" };
const docs: Resource = { title: "Qiskit guides and tutorials", url: "https://quantum.cloud.ibm.com/docs/en/guides", kind: "Reading", provider: "IBM Quantum", level: "Programming" };
const correction: Resource = { title: "Foundations of quantum error correction", url: "https://quantum.cloud.ibm.com/learning/en/courses/foundations-of-quantum-error-correction", kind: "Reading", provider: "IBM Quantum", level: "Advanced" };
const teleport: Resource = { title: "Quantum teleportation classroom module", url: "https://quantum.cloud.ibm.com/learning/en/modules/computer-science/quantum-teleportation", kind: "Reading", provider: "IBM Quantum", level: "Foundations" };
const algorithms: Resource = { title: "Fundamentals of quantum algorithms", url: "https://quantum.cloud.ibm.com/learning/en/courses/fundamentals-of-quantum-algorithms", kind: "Reading", provider: "IBM Quantum", level: "University" };
const mixed: Resource = { title: "Density matrices and quantum channels", url: "https://quantum.cloud.ibm.com/learning/en/courses/general-formulation-of-quantum-information", kind: "Reading", provider: "IBM Quantum", level: "Advanced" };
const variational: Resource = { title: "Variational algorithm design", url: "https://quantum.cloud.ibm.com/learning/en/courses/variational-algorithm-design", kind: "Reading", provider: "IBM Quantum", level: "Advanced programming" };


// Shared courses are labeled as broader resources rather than topic-specific videos.
const reading: Record<string, Resource> = { s5: teleport, s6: algorithms, d1: docs, d2: docs, d3: docs, d4: algorithms, d5: algorithms, d6: variational, r1: mixed, r2: mixed, r3: correction, r4: algorithms, r5: variational, r6: algorithms };

function buildTopics(track: TrackId): RoadmapTopic[] {
  if (track === "explorer") return PLANETS.map((p, i) => ({ id: `e${p.id}`, source: { kind: "planet" as const, id: p.id }, title: p.concept, summary: p.blurb, lesson: `/planet/${p.id}`, requires: i ? [`e${p.id - 1}`] : [], resources: [intro, basics], challenge: `Play ${p.name}, then explain ${p.concept.toLowerCase()} in your own words.` }));
  return modulesOf(track).map(m => ({ id: m.id, source: { kind: "module" as const, id: m.id }, title: m.skill, summary: m.summary, lesson: `/learn/${m.id}`, lab: `/lab?module=${m.id}`, requires: m.requires, minutes: m.minutes, resources: [m.id === "d4" ? grover : intro, reading[m.id] ?? basics], challenge: m.tryIt[0] }));
}

// Topics derive only from constant curriculum data, so they're built once. Callers must not mutate them.
const topicCache = new Map<TrackId, RoadmapTopic[]>();
export function roadmapTopics(track: TrackId): RoadmapTopic[] {
  let topics = topicCache.get(track);
  if (!topics) topicCache.set(track, topics = buildTopics(track));
  return topics;
}

export function topicStatus(state: State, topic: RoadmapTopic): SkillStatus {
  return topic.source.kind === "planet" ? planetStatus(state, topic.source.id) : moduleStatus(state, moduleById(topic.source.id)!);
}

/** The first lesson the learner can start on the way to `id`: `id` itself if it's available, otherwise the first startable lesson among its unfinished prerequisites (depth-first, in `requires` order). Null if `id` is already done or nothing on its path is startable. */
export function firstStartable(state: State, id: string, seen = new Set<string>()): string | null {
  const lesson = moduleById(id);
  if (!lesson || seen.has(id) || state.modules[id]) return null;
  seen.add(id);
  if (moduleStatus(state, lesson) === "available") return id;
  for (const r of lesson.requires) {
    const found = firstStartable(state, r, seen);
    if (found) return found;
  }
  return null;
}

export const ROADMAP_STORAGE_KEY = "quantum-quest-roadmaps-v1";
export type Personal = Record<string, { bookmarked?: boolean; note?: string; started?: boolean; reviewed?: string[] }>;

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Keeps only well-typed fields of stored notes; anything malformed is dropped. */
export function sanitizePersonal(raw: unknown): Personal {
  const out: Personal = {};
  if (!isObject(raw)) return out;
  for (const [id, v] of Object.entries(raw)) {
    if (id === "__proto__" || id === "constructor" || id === "prototype" || !isObject(v)) continue;
    const e: Personal[string] = {};
    if (typeof v.bookmarked === "boolean") e.bookmarked = v.bookmarked;
    if (typeof v.started === "boolean") e.started = v.started;
    if (typeof v.note === "string") e.note = v.note;
    if (Array.isArray(v.reviewed)) e.reviewed = v.reviewed.filter((x): x is string => typeof x === "string");
    out[id] = e;
  }
  return out;
}
