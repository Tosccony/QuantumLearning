"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/ui/Icon";
import { Flag, Perf } from "@/components/ui/primitives";

/** One icon per planet, used wherever a badge is drawn in the Explorer world. */
export const PLANET_ICON: Record<number, IconName> = { 1: "bit", 2: "qubit", 3: "wave", 4: "twins", 5: "gear", 6: "wand", 7: "rocket" };

function RailLink({ href, active, children, className = "", title }: { href: string; active?: boolean; children: ReactNode; className?: string; title?: string }) {
  return (
    <Link
      href={href}
      title={title}
      aria-current={active ? "page" : undefined}
      className={`frame relative flex min-h-12 shrink-0 items-center gap-2 px-3 text-base sm:px-4 ${active ? "frame-active text-paper" : "text-fog hover:text-paper"} ${className}`}
    >
      {active && <Flag className="absolute -top-[11px] left-2" width={18} />}
      {children}
    </Link>
  );
}

/** The Explorer rail: brand, a way back to the mission map, and the two exits. */
export default function KidsRail() {
  const path = usePathname();
  const onPlanet = path.startsWith("/planet/");
  const isMap = path === "/explorer";
  const isGrownups = path.startsWith("/grownups");

  return (
    <header className="rail sticky top-0 z-40 print:hidden">
      <Perf />
      <nav className="mx-auto flex max-w-5xl items-stretch gap-1 px-2 py-1 sm:px-4" aria-label="Explorer">
        <RailLink href="/explorer" active={isMap} className="mr-1">
          <Icon name="explorer" size={20} className="text-ice" />
          <span className="display text-lg leading-none">Quantum Quest</span>
        </RailLink>
        {onPlanet && (
          <RailLink href="/explorer" title="Back to the mission map">
            <Icon name="map" size={18} />
            <span className="label">Map</span>
          </RailLink>
        )}
        <span className="flex-1" />
        <RailLink href="/grownups" active={isGrownups}>
          <Icon name="grownups" size={18} />
          <span className="label hidden sm:inline">Grown-ups</span>
          <span className="sr-only sm:hidden">Grown-ups</span>
        </RailLink>
        <RailLink href="/" title="All tracks, the Lab and the community">
          <Icon name="atom" size={18} />
          <span className="label hidden sm:inline">All tracks</span>
          <span className="sr-only sm:hidden">All tracks</span>
        </RailLink>
      </nav>
      <Perf />
    </header>
  );
}
