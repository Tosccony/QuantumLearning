import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Saira_Condensed, Saira_Semi_Condensed } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";

const cond = Saira_Condensed({ variable: "--font-saira-cond", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const semi = Saira_Semi_Condensed({ variable: "--font-saira-semi", subsets: ["latin"], weight: ["400", "500", "600"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quantum Quest",
  description: "Learn, build, run, understand real quantum circuits, from first steps to research.",
};

export const viewport: Viewport = { themeColor: "#10294f" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${cond.variable} ${semi.variable} ${mono.variable} antialiased`}>
        <ProgressProvider>
          <div className="relative z-10 flex min-h-dvh flex-col">
            <div className="flex-1">{children}</div>
            <footer className="rail mt-10 print:hidden">
              <div className="perf" aria-hidden />
              <p className="label-sm px-4 py-3 text-center text-fog">This effort is supported by Qollab &amp; IonQ</p>
              <div className="perf" aria-hidden />
            </footer>
          </div>
        </ProgressProvider>
      </body>
    </html>
  );
}
