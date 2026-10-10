import type { Metadata, Viewport } from "next";
import { Fredoka, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";

const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Quantum Quest",
  description: "Learn, build, run, understand and share real quantum circuits — from first steps to research.",
};

export const viewport: Viewport = { themeColor: "#0b1033" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${inter.variable} ${mono.variable} antialiased`}>
        <div className="stars" aria-hidden />
        <ProgressProvider>
          <div className="relative z-10">{children}</div>
        </ProgressProvider>
      </body>
    </html>
  );
}
