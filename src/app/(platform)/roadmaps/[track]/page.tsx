import { notFound } from "next/navigation";
import { TRACKS } from "@/lib/curriculum";
import RoadmapView from "@/components/roadmaps/RoadmapView";

export function generateStaticParams() { return TRACKS.map(t => ({ track: t.id })); }
export default async function RoadmapPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const selected = TRACKS.find(t => t.id === track);
  if (!selected) notFound();
  return <RoadmapView track={selected} />;
}
