import { modulesOf, type TrackId } from "./curriculum";
import { PLANETS } from "./levels";
import { moduleStatus, type SkillStatus } from "./skills";
import type { State } from "./progress";

export type Resource = { title: string; url: string; kind: "Video" | "Reading"; provider: string; level: string };
export type RoadmapTopic = { id: string; title: string; summary: string; lesson: string; lab?: string; requires: string[]; minutes?: number; resources: Resource[]; challenge: string };
const intro: Resource = { title: "What is quantum computing?", url: "https://www.youtube.com/watch?v=lt4OsgmUTGI", kind: "Video", provider: "IBM Technology", level: "Introductory overview" };
const grover: Resource = { title: "Grover’s algorithm — lesson 08", url: "https://www.youtube.com/watch?v=hnpjC8WQVrQ", kind: "Video", provider: "Qiskit", level: "University" };
const basics: Resource = { title: "Basics of quantum information", url: "https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information", kind: "Reading", provider: "IBM Quantum", level: "Foundations · linear algebra recommended" };
const docs: Resource = { title: "Qiskit guides and tutorials", url: "https://quantum.cloud.ibm.com/docs/en/guides", kind: "Reading", provider: "IBM Quantum", level: "Programming" };
const correction: Resource = { title: "Foundations of quantum error correction", url: "https://quantum.cloud.ibm.com/learning/en/courses/foundations-of-quantum-error-correction", kind: "Reading", provider: "IBM Quantum", level: "Advanced" };
const teleport: Resource = { title: "Quantum teleportation classroom module", url: "https://quantum.cloud.ibm.com/learning/en/modules/computer-science/quantum-teleportation", kind: "Reading", provider: "IBM Quantum", level: "Foundations" };
const algorithms: Resource = { title: "Fundamentals of quantum algorithms", url: "https://quantum.cloud.ibm.com/learning/en/courses/fundamentals-of-quantum-algorithms", kind: "Reading", provider: "IBM Quantum", level: "University" };
const mixed: Resource = { title: "Density matrices and quantum channels", url: "https://quantum.cloud.ibm.com/learning/en/courses/general-formulation-of-quantum-information", kind: "Reading", provider: "IBM Quantum", level: "Advanced" };
const variational: Resource = { title: "Variational algorithm design", url: "https://quantum.cloud.ibm.com/learning/en/courses/variational-algorithm-design", kind: "Reading", provider: "IBM Quantum", level: "Advanced programming" };

const reading: Record<string, Resource> = { s5: teleport, s6: algorithms, d1: docs, d2: docs, d3: docs, d4: algorithms, d5: algorithms, d6: variational, r1: mixed, r2: mixed, r3: correction, r4: algorithms, r5: variational, r6: algorithms };

// Shared courses are labeled as broader resources rather than topic-specific videos.
export function roadmapTopics(track: TrackId): RoadmapTopic[] {
  if (track === "explorer") return PLANETS.map((p, i) => ({ id: `e${p.id}`, title: p.concept, summary: p.blurb, lesson: `/planet/${p.id}`, requires: i ? [`e${p.id - 1}`] : [], resources: [intro, basics], challenge: `Play ${p.name}, then explain ${p.concept.toLowerCase()} in your own words.` }));
  return modulesOf(track).map(m => ({ id: m.id, title: m.skill, summary: m.summary, lesson: `/learn/${m.id}`, lab: `/lab?module=${m.id}`, requires: m.requires, minutes: m.minutes, resources: [m.id === "d4" ? grover : intro, reading[m.id] ?? basics], challenge: m.tryIt[0] }));
}

export function topicStatus(state: State, topic: RoadmapTopic): SkillStatus {
  if (topic.id.startsWith("e")) {
    const id = Number(topic.id.slice(1));
    return state.levels[id]?.completed ? "done" : topic.requires.every(r => state.levels[Number(r.slice(1))]?.completed) ? "available" : "locked";
  }
  const lesson = modulesOf(topic.id.startsWith("s") ? "student" : topic.id.startsWith("d") ? "developer" : "researcher").find(m => m.id === topic.id)!;
  return moduleStatus(state, lesson);
}
