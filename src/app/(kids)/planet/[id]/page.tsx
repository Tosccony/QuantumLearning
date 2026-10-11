"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { Perf, Window } from "@/components/ui/primitives";
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

  if (!Level) return <Center icon="researcher">This planet hasn&apos;t been discovered yet!</Center>;
  if (!ready) return null;
  // Planets unlock in order so each idea builds on the last.
  if (n > 1 && !state.levels[n - 1]?.completed) return <Center icon="lock">Finish Planet {n - 1} first to unlock this one!</Center>;
  return <Level />;
}

function Center({ children, icon }: { children: React.ReactNode; icon: IconName }) {
  return (
    <main className="flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center p-4 sm:p-6">
      <Window className="flex w-full max-w-md flex-col items-center gap-5 p-6 text-center sm:p-8">
        <Perf className="-mx-6 -mt-6 w-[calc(100%+3rem)] sm:-mx-8 sm:-mt-8 sm:w-[calc(100%+4rem)]" />
        <Icon name={icon} size={40} className="text-navy-ink" />
        <p className="text-2xl">{children}</p>
        <Link href="/explorer" className="keycap-xl keycap-paper-primary">
          <Icon name="map" size={20} />
          Back to the map
        </Link>
      </Window>
    </main>
  );
}
