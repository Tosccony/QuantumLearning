import Icon, { type IconName } from "@/components/ui/Icon";
import { EdgeCode, Heading, Perf, Stripe } from "@/components/ui/primitives";
import { topicCode } from "@/components/roadmaps/RoadmapSpine";
import { modulesOf, type Track, type TrackId } from "@/lib/curriculum";
import { roadmapTopics } from "@/lib/roadmaps";
import { LESSON_TRACKS } from "./tracks";

const minutes = (t: Track) => modulesOf(t.id).reduce((a, m) => a + m.minutes, 0);
// Stretched button: the whole frame is the hit area, and the heading stays outside the button.
const hit = "text-left after:absolute after:inset-0 after:content-['']";
const LOOP: { icon: IconName; label: string; text: string }[] = [
  { icon: "learn", label: "Learn", text: "the idea" },
  { icon: "chip", label: "Build", text: "the circuit" },
  { icon: "run", label: "Run", text: "it on Qiskit" },
  { icon: "tutor", label: "Understand", text: "with the explainer" },
];
const HOW = [
  { icon: "map", title: "Follow the path", text: "Topics run down a spine in the order they build on each other." },
  { icon: "learn", title: "Learn your way", text: "Each topic is one of our lessons, with free videos and reading beside it." },
  { icon: "lab", title: "Put it into practice", text: "Run the topic's circuit on Qiskit, or open it in the Lab and change it." },
] as const;

/** The catalogue: one frame per track on a perforated rail. */
export function LearnPage({ onOpenTrack, onOpenRoadmaps }: { onOpenTrack: (id: TrackId) => void; onOpenRoadmaps: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Heading as="h1">Choose your track</Heading>
          <p className="max-w-prose text-fog">Three paths from first steps to research, plus Concepts deep dives. Every lesson ends with a real circuit you run on the simulator you picked in Select QPU.</p>
        </div>
        <button type="button" className="keycap w-fit" onClick={onOpenRoadmaps}><Icon name="map" size={14} /> Interactive roadmaps</button>
      </header>

      <section className="rail -mx-3 sm:-mx-4" aria-label="Tracks">
        <Perf />
        <ul className="grid gap-2 px-3 py-3 sm:grid-cols-2 sm:px-4 xl:grid-cols-4">
          {LESSON_TRACKS.map((t, i) => (
            <li key={t.id} className="frame relative flex flex-col hover:bg-navy">
              <Stripe track={t.id} />
              <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--line-strong)] text-ice" aria-hidden>
                    <Icon name={t.id} size={26} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <EdgeCode>T{String(i + 1).padStart(2, "0")}</EdgeCode>
                      <span className="code text-xs text-fog">{modulesOf(t.id).length} modules · {minutes(t)} min</span>
                    </div>
                    <h2 className="display text-2xl sm:text-3xl">{t.name}</h2>
                    <p className="text-sm text-fog">{t.audience}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{t.tagline}</p>
                <button type="button" onClick={() => onOpenTrack(t.id)} className={`label-sm mt-auto flex min-h-11 items-center gap-1 border-t border-[var(--line)] pt-3 text-ice ${hit}`}>
                  Open the {t.name} track <Icon name="next" size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <Perf />
      </section>
      <p className="text-sm text-fog">The Explorer games, your progress and certificates are in the web app.</p>
    </div>
  );
}

/** A track is a strip of module frames stacked on the rail. */
export function TrackPage({ track: t, onOpenLesson, onBack }: { track: Track; onOpenLesson: (id: string) => void; onBack: () => void }) {
  const mods = modulesOf(t.id);
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-col gap-3">
          <button type="button" onClick={onBack} className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-fog hover:text-paper">
            <Icon name="back" size={16} /> All tracks
          </button>
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-[var(--line-strong)] text-ice" aria-hidden>
              <Icon name={t.id} size={26} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <Heading as="h1" code={`${mods.length} MODULES · ${minutes(t)} MIN`}>{t.name} track</Heading>
              <p className="text-sm text-fog">{t.audience}</p>
            </div>
          </div>
          <p className="max-w-prose text-fog">{t.tagline}</p>
        </header>

        <section className="rail -mx-3 sm:-mx-4 lg:mx-0" aria-label={`${t.name} modules`}>
          <Perf />
          <ol className="flex flex-col gap-2 px-3 py-3 sm:px-4 lg:px-3">
            {mods.map((m, i) => (
              <li key={m.id} className="frame">
                <Stripe track={t.id} />
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-5">
                  <div className="sm:w-14">
                    <EdgeCode className="!text-paper">F{String(i + 1).padStart(2, "0")}</EdgeCode>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="display text-xl sm:text-2xl">{m.title}</h2>
                      <span className="code shrink-0 text-xs text-fog">{m.minutes} min</span>
                    </div>
                    <p className="mt-1 text-sm text-fog">{m.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="chip"><Icon name="badge" size={12} /> {m.skill}</span>
                      <span className="chip"><Icon name="qubit" size={12} /> {m.circuit.qubits}-qubit circuit</span>
                    </div>
                  </div>
                  <button type="button" className="keycap-primary shrink-0" onClick={() => onOpenLesson(m.id)}>Start →<span className="sr-only"> {m.title}</span></button>
                </div>
              </li>
            ))}
          </ol>
          <Perf />
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <section className="frame p-4" aria-label="How a module works">
          <p className="label-sm mb-3 text-fog">Every module follows the same loop</p>
          <ol className="flex flex-col gap-1">
            {LOOP.map((s, i) => (
              <li key={s.label} className="frame flex min-h-11 items-center gap-3 px-3 py-2">
                <EdgeCode>{String(i + 1).padStart(2, "0")}</EdgeCode>
                <Icon name={s.icon} size={16} className="shrink-0 text-ice" />
                <span className="text-sm"><span className="label">{s.label}</span> <span className="text-fog">{s.text}</span></span>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}

/** The roadmaps catalogue: one frame per track, each with the first topics of its spine. */
export function RoadmapsPage({ onOpenRoadmap }: { onOpenRoadmap: (id: TrackId) => void }) {
  const total = LESSON_TRACKS.reduce((a, t) => a + roadmapTopics(t.id).length, 0);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Heading as="h1" code={`${LESSON_TRACKS.length} ROADMAPS · ${total} TOPICS`}>Roadmaps</Heading>
        <p className="max-w-prose text-fog">Paths from curious learner to researcher. Every topic is one of our lessons, with free videos and reading beside it. Press a topic to see what it needs and where it leads.</p>
      </header>

      <section className="rail -mx-3 sm:-mx-4" aria-label="Learning roadmaps">
        <Perf />
        <ul className="grid gap-2 px-3 py-3 sm:grid-cols-2 sm:px-4 xl:grid-cols-4">
          {LESSON_TRACKS.map((t) => {
            const topics = roadmapTopics(t.id);
            const preview = topics.slice(0, 4);
            return (
              <li key={t.id} className="frame relative flex flex-col hover:bg-navy">
                <Stripe track={t.id} />
                <div className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-center gap-2">
                    <Icon name={t.id} size={22} className="text-ice" />
                    <h2 className="display text-2xl">{t.name}</h2>
                    <EdgeCode className="ml-auto">{t.id.slice(0, 3)}</EdgeCode>
                  </div>
                  <p className="label-sm text-fog">{t.audience}</p>
                  <ol className="flex flex-col" aria-label={`First topics of the ${t.name} roadmap`}>
                    {preview.map((n, i) => (
                      <li key={n.id} className="flex flex-col">
                        <span className="flex items-center gap-2 border border-[var(--line)] px-2 py-1.5 text-xs">
                          <span className="code text-fog">{topicCode(n.id)}</span>
                          <span className="min-w-0 flex-1 truncate">{n.title}</span>
                        </span>
                        {i < preview.length - 1 && <span className="ml-5 block h-3 w-0 border-l-2 border-[var(--line-strong)]" aria-hidden />}
                      </li>
                    ))}
                    {topics.length > preview.length && <li className="code mt-1 pl-5 text-[0.62rem] uppercase tracking-[0.12em] text-fog">+{topics.length - preview.length} more</li>}
                  </ol>
                  <button type="button" onClick={() => onOpenRoadmap(t.id)} className={`label-sm mt-auto flex min-h-11 items-center justify-between gap-3 border-t border-[var(--line)] pt-3 text-ice ${hit}`} aria-label={`${t.name} roadmap: ${topics.length} topics`}>
                    <span className="code text-xs text-fog">{topics.length} topics</span>
                    <span className="flex items-center gap-1">Explore path <Icon name="next" size={12} /></span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <Perf />
      </section>

      <section aria-labelledby="how-title" className="flex flex-col gap-3">
        <h2 id="how-title" className="display text-2xl sm:text-3xl">How a roadmap works</h2>
        <ol className="frame flex flex-col divide-y divide-[var(--line)]">
          {HOW.map((h) => (
            <li key={h.title} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <span className="flex shrink-0 items-center gap-2 sm:w-56"><Icon name={h.icon} size={16} className="text-ice" /><span className="display text-lg">{h.title}</span></span>
              <span className="text-sm leading-relaxed text-fog">{h.text}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-fog">Progress and notes are saved only in the web app.</p>
      </section>
    </div>
  );
}
