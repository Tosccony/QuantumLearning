"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProgress } from "@/lib/progress";

const LEVELS = [
  dynamic(() => import("@/levels/Level1"), { ssr: false }),
  dynamic(() => import("@/levels/Level2"), { ssr: false }),
  dynamic(() => import("@/levels/Level3"), { ssr: false }),
  dynamic(() => import("@/levels/Level4"), { ssr: false }),
  dynamic(() => import("@/levels/Level5"), { ssr: false }),
  dynamic(() => import("@/levels/Level6"), { ssr: false }),
  dynamic(() => import("@/levels/Level7"), { ssr: false }),
];

export default function PlanetPage() {
  const { id } = useParams<{ id: string }>();
  const n = Number(id);
  const { state, ready } = useProgress();
  const Level = LEVELS[n - 1];

  if (!Level) return <Center>This planet hasn&apos;t been discovered yet! 🔭</Center>;
  if (!ready) return null;
  // Planets unlock in order so each idea builds on the last.
  if (n > 1 && !state.levels[n - 1]?.completed) return <Center>🔒 Finish Planet {n - 1} first to unlock this one!</Center>;
  return <Level />;
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center text-2xl">
      <p>{children}</p>
      <Link href="/explorer" className="btn-primary">🗺️ Back to the map</Link>
    </main>
  );
}
