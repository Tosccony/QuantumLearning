"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import Icon from "@/components/ui/Icon";
import { PLANETS, type Planet } from "@/lib/levels";
import { PLANET_ICON } from "./KidsRail";
import Qubit from "./Qubit";

/* Square confetti bits in the functional game colours (they follow colour-blind mode). */
const CONFETTI = ["var(--on)", "var(--a)", "var(--b)", "var(--good)", "var(--ice)", "var(--paper)"];

export default function Reward({ planet, score, total }: { planet: Planet; score: number; total: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 40 }, (_, k) => ({
        x: (Math.random() - 0.5) * 700,
        y: -200 - Math.random() * 300,
        r: Math.random() * 720,
        c: CONFETTI[k % CONFETTI.length],
        d: 0.6 + Math.random() * 0.8,
      })),
    [],
  );
  const nextPlanet = PLANETS[planet.id];

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex flex-col items-center gap-6 overflow-hidden py-6 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
        {bits.map((b, k) => (
          <motion.span
            key={k}
            className="absolute block h-3 w-3"
            style={{ background: b.c }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: b.x, y: [0, b.y, 400], rotate: b.r, opacity: [1, 1, 0] }}
            transition={{ duration: 2.4 * b.d, ease: "easeOut" }}
          />
        ))}
      </div>

      {/* Badge: a planet-coloured plate with a punched navy cell carrying the planet's icon in ice. */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.2 }}
        className="relative grid h-44 w-44 place-items-center border border-[var(--line-strong)]"
        style={{ background: planet.color }}
        role="img"
        aria-label={`${planet.badge} badge`}
      >
        <span className="grid h-28 w-28 place-items-center bg-navy-ink">
          <Icon name={PLANET_ICON[planet.id]} size={64} className="text-ice" />
        </span>
      </motion.div>

      <div className="flex flex-col items-center gap-2">
        <h2 className="display text-4xl sm:text-5xl">{planet.badge} Badge</h2>
        <p className="text-xl text-fog">
          Quiz <span className="code text-paper">{score} / {total}</span> · XP collected
        </p>
      </div>

      <div className="w-full max-w-xl text-left">
        <Qubit text={`Amazing, explorer! Can you explain ${planet.concept.toLowerCase()} to a friend in your own words? That's the real superpower! 💪`} mood="wow" />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/explorer" className="keycap keycap-xl">
          <Icon name="map" size={20} />
          Mission map
        </Link>
        {nextPlanet && (
          <Link href={`/planet/${nextPlanet.id}`} className="keycap-xl keycap-primary">
            Fly to {nextPlanet.name}
            <Icon name="rocket" size={20} />
          </Link>
        )}
      </div>
    </motion.section>
  );
}
