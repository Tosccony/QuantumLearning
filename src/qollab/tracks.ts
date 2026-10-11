import { TRACKS } from "@/lib/curriculum";

// Concepts first, right under the Lab: the hard topics are what judges and curious learners look for.
// Explorer is games, so it stays in the web app.
export const LESSON_TRACKS = [...TRACKS.filter((t) => t.id === "concepts"), ...TRACKS.filter((t) => t.id !== "explorer" && t.id !== "concepts")];
