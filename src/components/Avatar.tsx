"use client";

import type { Avatar as A } from "@/lib/progress";

export const SUITS = ["#7b6cff", "#ff5fa2", "#3ddc97", "#ff9f1c", "#2ec4ff", "#ffd23f"];
export const TOPPERS = ["🚀", "⭐", "🌈", "🐱", "🦄", "👑", "🛸", "🌙"];
export const FACES = ["😄", "😎", "🤩", "🤓", "😺", "🤖"];

export default function Avatar({ avatar, size = 72 }: { avatar: A; size?: number }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label="Your explorer avatar">
      <div className="absolute inset-0 rounded-full border-4 border-white/70" style={{ background: avatar.suit }} />
      <div className="absolute inset-[18%] flex items-center justify-center rounded-full bg-[#cfe9ff]/90" style={{ fontSize: size * 0.4 }}>
        {avatar.face}
      </div>
      <span className="absolute -right-1 -top-2" style={{ fontSize: size * 0.32 }}>{avatar.topper}</span>
    </div>
  );
}
