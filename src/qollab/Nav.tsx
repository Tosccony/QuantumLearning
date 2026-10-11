import Icon, { type IconName } from "@/components/ui/Icon";
import { Flag, Perf } from "@/components/ui/primitives";

export type Section = "start" | "learn" | "lab" | "roadmaps";

const LINKS: { id: Section; label: string; icon: IconName }[] = [
  { id: "start", label: "Start", icon: "home" },
  { id: "learn", label: "Learn", icon: "learn" },
  { id: "lab", label: "Lab", icon: "lab" },
  { id: "roadmaps", label: "Roadmaps", icon: "map" },
];

/** The web app's rail NavBar with buttons for links and no progress or profile controls. */
export default function Header({ section, backendName, onGo }: { section: Section; backendName: string; onGo: (s: Section) => void }) {
  const isHome = section === "start";
  return (
    <header className="rail sticky top-0 z-40 -mx-3 sm:-mx-4">
      <Perf />
      <nav className="flex flex-wrap items-stretch gap-0 px-2 sm:flex-nowrap sm:px-4" aria-label="Main">
        <button type="button" onClick={() => onGo("start")} className={`frame relative mr-2 flex min-h-11 shrink-0 items-center gap-2 px-3 sm:px-4 ${isHome ? "frame-active" : ""}`} aria-label="Quantum Quest, start">
          {isHome && <Flag className="absolute -top-[11px] left-2" width={18} />}
          <Icon name="atom" size={20} className="text-ice" />
          <span className="display text-base leading-none sm:text-lg">Quantum Quest</span>
        </button>
        <ul className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((l) => {
            const active = l.id === section;
            return (
              <li key={l.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onGo(l.id)}
                  aria-current={active ? "page" : undefined}
                  className={`frame relative flex h-full min-h-11 items-center gap-2 px-3 sm:px-4 ${active ? "frame-active text-paper" : "text-fog hover:text-paper"}`}
                >
                  {active && <Flag className="absolute -top-[11px] left-2" width={18} />}
                  <Icon name={l.icon} size={16} />
                  <span className="label">{l.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <span className="chip my-auto ml-2 shrink-0"><Icon name="chip" size={12} /> SIM · {backendName}</span>
      </nav>
      <Perf />
    </header>
  );
}
