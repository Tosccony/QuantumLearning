"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo } from "react";
import { PLANETS, type Planet } from "@/lib/levels";
import Qubit from "./Qubit";

const CONFETTI = ["#ffd23f", "#ff8fab", "#7bdff2", "#b388ff", "#3ddc97", "#ff9f1c"];

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
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex flex-col items-center gap-5 overflow-hidden py-6 text-center">
      <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
        {bits.map((b, k) => (
          <motion.span
            key={k}
            className="absolute block h-3 w-2 rounded-sm"
            style={{ background: b.c }}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: b.x, y: [0, b.y, 400], rotate: b.r, opacity: [1, 1, 0] }}
            transition={{ duration: 2.4 * b.d, ease: "easeOut" }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 160, damping: 10, delay: 0.2 }}
        className="flex h-44 w-44 items-center justify-center rounded-full text-7xl shadow-[0_0_60px] ring-8 ring-white/30"
        style={{ background: planet.color, color: planet.color }}
      >
        <span aria-hidden>{planet.badgeIcon}</span>
      </motion.div>
      <h2 className="text-3xl font-bold sm:text-4xl">{planet.badge} Badge!</h2>
      <p className="text-xl text-muted">
        Quiz: {score} / {total} ⭐ · XP collected!
      </p>

      <div className="w-full max-w-xl text-left">
        <Qubit text={`Amazing, explorer! Can you explain ${planet.concept.toLowerCase()} to a friend in your own words? That's the real superpower! 💪`} />
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/explorer" className="btn-ghost">🗺️ Galaxy map</Link>
        {nextPlanet && (
          <Link href={`/planet/${nextPlanet.id}`} className="btn-primary">
            Fly to {nextPlanet.name} 🚀
          </Link>
        )}
      </div>
    </motion.section>
  );
}
