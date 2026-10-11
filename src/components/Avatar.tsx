"use client";

import type { Avatar as A } from "@/lib/progress";

export const SUITS = ["#7b6cff", "#ff5fa2", "#3ddc97", "#ff9f1c", "#2ec4ff", "#ffd23f"];
export const TOPPERS = ["🚀", "⭐", "🌈", "🐱", "🦄", "👑", "🛸", "🌙"];
export const FACES = ["😄", "😎", "🤩", "🤓", "😺", "🤖"];

export const AVATAR_LABELS: Record<string, string> = {
  "🚀": "Rocket", "⭐": "Star", "🌈": "Rainbow", "🐱": "Cat", "🦄": "Unicorn", "👑": "Crown", "🛸": "Flying saucer", "🌙": "Moon",
  "😄": "Smiling", "😎": "Sunglasses", "🤩": "Star eyes", "🤓": "Glasses", "😺": "Cat face", "🤖": "Robot",
};

const SYMBOLS: Record<string, string> = {
  "🚀": "M8 16C6 10 12 3 20 3c0 8-7 14-13 13l-3 4 1-6 3 2M13 7l4 4M9 12l-5 1 3-5 4-1M12 15l-1 5 5-3 1-4",
  "⭐": "m12 3 3 6 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z",
  "🌈": "M2 19v-5a10 10 0 0 1 20 0v5M6 19v-5a6 6 0 0 1 12 0v5M10 19v-5a2 2 0 0 1 4 0v5",
  "🐱": "M4 12V3l6 5h4l6-5v9c0 11-16 11-16 0M8 12h1m6 0h1m-6 4 2 2 2-2M2 15l5 1m10 0 5-1",
  "🦄": "M5 21V11l5-5 1-4 3 5 5 4-1 5h-5l-2 5M15 5l4-4-2 8M12 11h1M5 12l-3 7",
  "👑": "m3 6 5 5 4-8 4 8 5-5-2 14H5zM5 16h14",
  "🛸": "M7 11a5 5 0 0 1 10 0M2 13l10-4 10 4-10 5zM7 21l1-3m4 4v-4m5 3-1-3",
  "🌙": "M18 3a9 9 0 1 0 3 14A9 9 0 0 1 18 3z",
  "😄": "M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M7 10l2-1 1 1m4 0 1-1 2 1M7 14c2 5 8 5 10 0z",
  "😎": "M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M4 9h6v4H5zm10 0h6l-1 4h-5zM10 10h4M8 16q4 3 8 0",
  "🤩": "M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0m3-3 2-1 1-2 1 2 2 1-2 1-1 2-1-2zm8 0 2-1 1-2 1 2 2 1-2 1-1 2-1-2zM8 16q4 3 8 0",
  "🤓": "M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M5 11a3 3 0 1 0 6 0 3 3 0 1 0-6 0m8 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M11 11h2M8 17h8",
  "😺": "M4 12V3l6 5h4l6-5v9c0 11-16 11-16 0M8 12h1m6 0h1m-6 4 2 2 2-2M2 15l5 1m10 0 5-1",
  "🤖": "M4 7h16v14H4zM12 7V2M9 2h6M7 11h2v2H7zm8 0h2v2h-2zM8 17h8M1 11v6m22-6v6",
};

export function AvatarSymbol({ value, size = 32 }: { value: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={SYMBOLS[value] ?? SYMBOLS["🤖"]} /></svg>;
}

/** Square explorer avatar: a suit-coloured plate with a paper border, face and topper. */
export default function Avatar({ avatar, size = 72 }: { avatar: A; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label="Your explorer avatar">
      <div className="absolute inset-0 border-[3px] border-paper" style={{ background: avatar.suit }} />
      <div className="absolute inset-[18%] flex items-center justify-center bg-paper-2 leading-none text-navy-ink" style={{ fontSize: size * 0.4 }}>
        <AvatarSymbol value={avatar.face} size={size * 0.5} />
      </div>
      <span className="absolute -right-1 -top-2 bg-paper p-0.5 text-navy-ink"><AvatarSymbol value={avatar.topper} size={size * 0.32} /></span>
    </div>
  );
}
