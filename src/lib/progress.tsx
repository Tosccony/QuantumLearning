"use client";

import { MotionConfig } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type LevelStat = {
  completed: boolean;
  quizCorrect: number;
  quizTotal: number;
  timeSec: number;
  attempts: number;
  completedAt?: string;
};

export type Avatar = { suit: string; topper: string; face: string };

export type Settings = { narration: boolean; colorblind: boolean; bigText: boolean };

export type State = {
  name: string;
  avatar: Avatar;
  xp: number;
  badges: number[];
  levels: Record<number, LevelStat>;
  streak: number;
  lastDay: string;
  activity: Record<string, number>; // day -> xp earned that day
  minutes: Record<string, number>; // day -> minutes played
  settings: Settings;
  modules: Record<string, { completedAt: string; correct: boolean }>;
  labRuns: number;
  projects: string[]; // community project ids this learner published
  starred: string[];
};

const KEY = "quantum-quest-v1";

const initial: State = {
  name: "",
  avatar: { suit: "#7b6cff", topper: "🚀", face: "😄" },
  xp: 0,
  badges: [],
  levels: {},
  streak: 0,
  lastDay: "",
  activity: {},
  minutes: {},
  settings: { narration: false, colorblind: false, bigText: false },
  modules: {},
  labRuns: 0,
  projects: [],
  starred: [],
};

export const today = (d = new Date()) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
const yesterday = () => today(new Date(Date.now() - 864e5));

type Ctx = {
  state: State;
  ready: boolean;
  update: (fn: (s: State) => State) => void;
  addXp: (n: number) => void;
  completeLevel: (id: number, quizCorrect: number, quizTotal: number, timeSec: number) => void;
  logTime: (sec: number) => void;
  completeModule: (id: string, correct: boolean) => void;
  recordRun: () => void;
  recordShare: (projectId: string) => void;
  toggleStar: (projectId: string) => void;
  reset: () => void;
};

const ProgressCtx = createContext<Ctx | null>(null);

/** Records play for today and advances the daily streak. */
function touchDay(s: State): State {
  const t = today();
  if (s.lastDay === t) return s;
  return { ...s, lastDay: t, streak: s.lastDay === yesterday() ? s.streak + 1 : 1 };
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as State;
        // A missed day breaks the streak.
        if (saved.lastDay && saved.lastDay !== today() && saved.lastDay !== yesterday()) saved.streak = 0;
        setState({ ...initial, ...saved, settings: { ...initial.settings, ...saved.settings } });
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
    document.documentElement.dataset.cb = String(state.settings.colorblind);
    document.documentElement.dataset.big = String(state.settings.bigText);
  }, [state, ready]);

  const update = useCallback((fn: (s: State) => State) => setState(fn), []);

  const addXp = useCallback(
    (n: number) =>
      setState((s) => {
        const t = today();
        return touchDay({ ...s, xp: s.xp + n, activity: { ...s.activity, [t]: (s.activity[t] ?? 0) + n } });
      }),
    [],
  );

  const logTime = useCallback(
    (sec: number) =>
      setState((s) => {
        const t = today();
        return { ...s, minutes: { ...s.minutes, [t]: (s.minutes[t] ?? 0) + sec / 60 } };
      }),
    [],
  );

  const completeLevel = useCallback((id: number, quizCorrect: number, quizTotal: number, timeSec: number) => {
    setState((s) => {
      const prev = s.levels[id];
      const firstTime = !prev?.completed;
      const bonus = (firstTime ? 50 : 10) + quizCorrect * 10;
      const t = today();
      return touchDay({
        ...s,
        xp: s.xp + bonus,
        activity: { ...s.activity, [t]: (s.activity[t] ?? 0) + bonus },
        badges: s.badges.includes(id) ? s.badges : [...s.badges, id],
        levels: {
          ...s.levels,
          [id]: {
            completed: true,
            // Keep the best quiz score so replays never lower mastery.
            quizCorrect: Math.max(quizCorrect, prev?.quizCorrect ?? 0),
            quizTotal,
            timeSec: (prev?.timeSec ?? 0) + timeSec,
            attempts: (prev?.attempts ?? 0) + 1,
            completedAt: prev?.completedAt ?? new Date().toISOString(),
          },
        },
      });
    });
  }, []);

  const completeModule = useCallback((id: string, correct: boolean) => {
    setState((s) => {
      const first = !s.modules[id];
      const bonus = first ? 100 + (correct ? 25 : 0) : 0;
      const t = today();
      return touchDay({
        ...s,
        xp: s.xp + bonus,
        activity: { ...s.activity, [t]: (s.activity[t] ?? 0) + bonus },
        modules: { ...s.modules, [id]: { completedAt: s.modules[id]?.completedAt ?? new Date().toISOString(), correct: correct || !!s.modules[id]?.correct } },
      });
    });
  }, []);

  // Small XP for experimenting, capped so spamming Run doesn't farm points.
  const recordRun = useCallback(
    () =>
      setState((s) => {
        const t = today();
        const gain = (s.activity[t] ?? 0) < 400 ? 5 : 0;
        return touchDay({ ...s, labRuns: s.labRuns + 1, xp: s.xp + gain, activity: { ...s.activity, [t]: (s.activity[t] ?? 0) + gain } });
      }),
    [],
  );

  const recordShare = useCallback(
    (id: string) =>
      setState((s) => {
        const t = today();
        return touchDay({ ...s, projects: [id, ...s.projects], xp: s.xp + 50, activity: { ...s.activity, [t]: (s.activity[t] ?? 0) + 50 } });
      }),
    [],
  );

  const toggleStar = useCallback(
    (id: string) => setState((s) => ({ ...s, starred: s.starred.includes(id) ? s.starred.filter((x) => x !== id) : [...s.starred, id] })),
    [],
  );

  const reset = useCallback(() => setState(initial), []);

  const value = useMemo(
    () => ({ state, ready, update, addXp, completeLevel, logTime, completeModule, recordRun, recordShare, toggleStar, reset }),
    [state, ready, update, addXp, completeLevel, logTime, completeModule, recordRun, recordShare, toggleStar, reset],
  );

  return (
    <ProgressCtx.Provider value={value}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ProgressCtx.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressCtx);
  if (!ctx) throw new Error("useProgress must be inside ProgressProvider");
  return ctx;
}
