import { useEffect, useRef, useState } from "react";
import { Perf } from "@/components/ui/primitives";
import { moduleById, modulesOf, TRACKS, type TrackId } from "@/lib/curriculum";
import type { Circuit } from "@/lib/quantum";
import { LearnPage, RoadmapsPage, TrackPage } from "./Catalog";
import Lab from "./Lab";
import Lesson from "./Lesson";
import Header, { type Section } from "./Nav";
import RoadmapPage from "./RoadmapPage";
import JudgeStart from "./Start";

const REPO = "https://github.com/Tosccony/QuantumLearning";

type From = "track" | "roadmap";
type View =
  | { name: "start" }
  | { name: "learn" }
  | { name: "track"; trackId: TrackId }
  | { name: "lesson"; id: string; from: From }
  | { name: "lab"; start: Circuit; n: number }
  | { name: "roadmaps" }
  | { name: "roadmap"; trackId: TrackId };

const trackOf = (id: TrackId) => TRACKS.find((t) => t.id === id)!;

/** Quantum Quest's lessons on Qollab: every run goes to the simulator picked in "Select QPU". Opens on Judge Start. */
export default function Player({ backendName }: { backendName: string }) {
  const [view, setView] = useState<View>({ name: "start" });
  const isIonQ = /ionq/i.test(backendName);
  // `n` re-keys the Lab, so opening it from a lesson or roadmap starts fresh with that circuit.
  const n = useRef(0);
  const openLab = (start: Circuit) => setView({ name: "lab", start, n: ++n.current });
  const openLesson = (id: string, from: From) => setView({ name: "lesson", id, from });
  const main = useRef<HTMLElement>(null);
  // Land in the new view: top of the page, focus on its heading.
  const first = useRef(true);
  useEffect(() => {
    // Skip the first mount: scrolling or focusing then could move the host page inside Qollab's iframe.
    if (first.current) { first.current = false; return; }
    window.scrollTo(0, 0);
    const h = main.current?.querySelector<HTMLElement>("h1");
    if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }, [view]);

  const section: Section =
    view.name === "start" ? "start"
    : view.name === "lab" ? "lab"
    : view.name === "roadmaps" || view.name === "roadmap" || (view.name === "lesson" && view.from === "roadmap") ? "roadmaps"
    : "learn";
  const go = (s: Section) => {
    if (s === "lab") { if (view.name !== "lab") openLab({ qubits: 2, ops: [] }); }
    else if (view.name !== s) setView(s === "start" ? { name: "start" } : s === "learn" ? { name: "learn" } : { name: "roadmaps" }); // the active nav item is a no-op, so it does not re-scroll
  };

  let body;
  if (view.name === "start") body = <JudgeStart isIonQ={isIonQ} onOpenLab={openLab} onLesson={() => openLesson("r3", "track")} onLearn={() => setView({ name: "learn" })} />;
  else if (view.name === "learn") body = <LearnPage onOpenTrack={(trackId) => setView({ name: "track", trackId })} onOpenRoadmaps={() => setView({ name: "roadmaps" })} />;
  else if (view.name === "track") body = <TrackPage track={trackOf(view.trackId)} onOpenLesson={(id) => openLesson(id, "track")} onBack={() => setView({ name: "learn" })} />;
  else if (view.name === "lab") body = <Lab key={view.n} start={view.start} isIonQ={isIonQ} />;
  else if (view.name === "lesson") {
    const m = moduleById(view.id)!;
    const t = trackOf(m.track);
    const mods = modulesOf(m.track);
    const nx = mods[mods.findIndex((x) => x.id === m.id) + 1];
    body = (
      <Lesson
        key={m.id}
        m={m}
        isIonQ={isIonQ}
        onOpenLab={openLab}
        breadcrumb={view.from === "roadmap" ? { label: `${t.name} roadmap`, onClick: () => setView({ name: "roadmap", trackId: m.track }) } : { label: `${t.name} track`, onClick: () => setView({ name: "track", trackId: m.track }) }}
        next={nx && { title: nx.title, onClick: () => openLesson(nx.id, view.from) }}
      />
    );
  } else if (view.name === "roadmaps") body = <RoadmapsPage onOpenRoadmap={(trackId) => setView({ name: "roadmap", trackId })} />;
  else body = <RoadmapPage key={view.trackId} track={trackOf(view.trackId)} onOpenLesson={(id) => openLesson(id, "roadmap")} onOpenLab={openLab} onBack={() => setView({ name: "roadmaps" })} />;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 pb-4 sm:px-4">
      <Header section={section} backendName={backendName} onGo={go} />
      <main ref={main} className="flex flex-col gap-6">{body}</main>
      <footer className="rail -mx-3 sm:-mx-4">
        <Perf />
        <div className="flex flex-col items-center gap-1 px-4 py-3 text-center text-xs text-fog">
          <p>Kids&apos; Explorer games and the AI tutor live in the full web app: <a className="text-ice underline underline-offset-4 hover:text-paper" href={REPO}>{REPO}</a>. MIT licensed.</p>
          <p className="label-sm">This effort is supported by Qollab &amp; IonQ</p>
        </div>
        <Perf />
      </footer>
    </div>
  );
}
