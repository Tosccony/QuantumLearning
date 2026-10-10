import NavBar from "@/components/NavBar";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </>
  );
}
