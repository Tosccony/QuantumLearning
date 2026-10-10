import AskQubit from "@/components/AskQubit";

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-kid">
      {children}
      <AskQubit />
    </div>
  );
}
