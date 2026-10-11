import NavBar from "@/components/NavBar";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavBar />
      <main id="main" className="mx-auto w-full max-w-[1400px] px-3 py-5 sm:px-4 lg:px-6 lg:py-8">{children}</main>
    </>
  );
}
