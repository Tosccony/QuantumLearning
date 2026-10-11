import AskQubit from "@/components/AskQubit";
import KidsRail from "@/components/KidsRail";

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KidsRail />
      {children}
      <AskQubit />
    </>
  );
}
