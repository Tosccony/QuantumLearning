"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { xpLevel } from "@/lib/levels";
import { useProgress } from "@/lib/progress";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/roadmaps", label: "Roadmaps" },
  { href: "/lab", label: "Lab" },
  { href: "/community", label: "Community" },
  { href: "/progress", label: "Progress" },
];

export default function NavBar() {
  const path = usePathname();
  const { state, ready, update } = useProgress();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-space/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg" aria-hidden>⚛</span>
          Quantum Quest
        </Link>
        <ul className="flex flex-wrap gap-x-1 gap-y-3 text-sm">
          {LINKS.map((l) => {
            const active = path === l.href || path.startsWith(`${l.href}/`) || (l.href === "/learn" && (path.startsWith("/tracks") || path.startsWith("/learn")));
            return (
              <li key={l.href}>
                <Link href={l.href} aria-current={active ? "page" : undefined} className={`rounded-lg px-3 py-1.5 ${active ? "bg-white/10 font-semibold" : "text-muted hover:text-ink"}`}>
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {ready && (
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">🔥 {state.streak} · ⭐ {state.xp} XP · Lv {xpLevel(state.xp)}</span>
            {editing || !state.name ? (
              <form
                className="flex gap-1"
                onSubmit={(e) => { e.preventDefault(); if (name.trim()) { update((s) => ({ ...s, name: name.trim().slice(0, 40) })); setEditing(false); } }}
              >
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" aria-label="Display name" className="w-32 rounded-lg bg-white/10 px-2 py-1 outline-none ring-1 ring-white/10 focus:ring-accent" />
                <button className="pbtn-ghost !py-1">Save</button>
              </form>
            ) : (
              <button onClick={() => { setName(state.name); setEditing(true); }} className="rounded-lg bg-white/10 px-3 py-1" title="Change display name">
                {state.name}
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
