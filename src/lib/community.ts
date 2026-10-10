import type { Circuit, RunResult } from "./quantum";
import { QuantumServiceError } from "./quantum";

export type Project = {
  id: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  stars: number;
  forks: number;
  forked_from: string | null;
  created_at: string;
  circuit: Circuit;
  counts: Record<string, number>;
  shots: number;
  results?: RunResult; // only on the detail endpoint
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/qiskit${path}`, { ...init, headers: { "content-type": "application/json" } });
  } catch {
    throw new QuantumServiceError("Can't reach the Qiskit service. Start it with `npm run backend`.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new QuantumServiceError(
      typeof body?.detail === "string" ? body.detail : res.status >= 500 ? "The Qiskit service isn't running. Start it with `npm run backend`." : `Request failed (${res.status})`,
    );
  }
  return res.json();
}

export const listProjects = (sort: "stars" | "new", q = "") => call<Project[]>(`/projects?sort=${sort}&q=${encodeURIComponent(q)}`);
export const getProject = (id: string) => call<Project>(`/projects/${encodeURIComponent(id)}`);
export const starProject = (id: string, on: boolean) => call<{ ok: boolean }>(`/projects/${encodeURIComponent(id)}/star?delta=${on ? 1 : -1}`, { method: "POST" });
export const createProject = (p: { title: string; description: string; author: string; tags: string[]; circuit: Circuit; shots: number; forked_from?: string | null }) =>
  call<{ id: string }>("/projects", { method: "POST", body: JSON.stringify(p) });
