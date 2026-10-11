"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon, { type IconName } from "@/components/ui/Icon";
import { Flag, Perf } from "@/components/ui/primitives";
import { xpLevel } from "@/lib/levels";
import { useProgress } from "@/lib/progress";

const LINKS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/learn", label: "Learn", icon: "learn", match: (p) => p.startsWith("/learn") || p.startsWith("/tracks") || p.startsWith("/certificate") },
  { href: "/roadmaps", label: "Roadmaps", icon: "map", match: (p) => p.startsWith("/roadmaps") },
  { href: "/lab", label: "Lab", icon: "lab", match: (p) => p.startsWith("/lab") },
  { href: "/progress", label: "Progress", icon: "progress", match: (p) => p.startsWith("/progress") },
];

/** The rail: the nav is a strip of frames, the folded flag marks the page you are on. */
export default function NavBar() {
  const path = usePathname();
  const { state, ready, update } = useProgress();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [compact, setCompact] = useState(true);
  const isHome = path === "/";

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const apply = () => setCompact(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <header className="rail sticky top-0 z-40 print:hidden">
      <Perf />
      <nav className="mx-auto flex max-w-[1400px] flex-wrap items-stretch gap-0 px-2 sm:flex-nowrap sm:px-4" aria-label="Primary">
        <Link href="/" className={`frame relative mr-2 flex shrink-0 items-center gap-2 px-3 sm:px-4 ${isHome ? "frame-active" : ""}`} aria-current={isHome ? "page" : undefined}>
          {isHome && <Flag className="absolute -top-[11px] left-2" width={18} />}
          <Icon name="atom" size={20} className="text-ice" />
          <span className="display text-base leading-none sm:text-lg">Quantum Quest</span>
        </Link>
        <ul className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LINKS.map((l) => {
            const active = l.match(path);
            return (
              <li key={l.href} className="shrink-0">
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`frame relative flex h-full min-h-11 items-center gap-2 px-3 sm:px-4 ${active ? "frame-active text-paper" : "text-fog hover:text-paper"}`}
                >
                  {active && <Flag className="absolute -top-[11px] left-2" width={18} />}
                  <Icon name={l.icon} size={16} />
                  <span className="label">{l.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {ready && (
          <div className={`ml-2 flex shrink-0 items-center gap-2 ${editing ? "mt-2 basis-full sm:mt-0 sm:basis-auto" : ""}`}>
            <span className="label-sm hidden items-center gap-3 text-fog lg:flex" aria-label={`${state.streak} day streak, ${state.xp} XP, level ${xpLevel(state.xp)}`}>
              <span className="flex items-center gap-1"><Icon name="streak" size={14} /> {state.streak}</span>
              <span className="flex items-center gap-1"><Icon name="xp" size={14} /> {state.xp} XP</span>
              <span>LV {xpLevel(state.xp)}</span>
            </span>
            {editing || (!state.name && !compact) ? (
              <form
                className="flex items-stretch gap-1"
                onSubmit={(e) => { e.preventDefault(); if (name.trim()) { update((s) => ({ ...s, name: name.trim().slice(0, 40) })); setEditing(false); } }}
              >
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" aria-label="Display name" className="field w-28 py-1 text-sm sm:w-36" maxLength={40} />
                <button className="keycap !px-3 !py-1">Save</button>
              </form>
            ) : (
              <button onClick={() => { setName(state.name); setEditing(true); }} className="keycap !px-3 !py-1 max-w-36" title={state.name ? "Change display name" : "Set a display name"} aria-label={state.name ? `Display name ${state.name}, change` : "Set a display name"}>
                <Icon name="user" size={14} />
                <span className="hidden truncate sm:inline">{state.name || "Name"}</span>
              </button>
            )}
          </div>
        )}
      </nav>
      <Perf />
    </header>
  );
}
