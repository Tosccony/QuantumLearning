/** Reads text aloud with the browser's built-in voice. Emoji are stripped so they aren't spelled out. */
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const clean = text.replace(/[\p{Extended_Pictographic}\u{FE0F}]/gu, "").trim();
  window.speechSynthesis.cancel();
  if (!clean) return;
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 0.95;
  u.pitch = 1.25;
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
