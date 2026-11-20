"use client";
// Supporter cosmetics: colour themes. Pure CSS (globals.css sets vars per [data-theme]); no gameplay effect.
// Non-supporters always get "default". Stored choice survives a lapse, it just isn't applied.
import { useEffect, useState } from "react";

export const THEMES = [
  { id: "default", name: "Neon Green", free: true, swatch: "#22e06b" },
  { id: "ember", name: "Ember", free: false, swatch: "#ff8a3d" },
  { id: "ocean", name: "Ocean", free: false, swatch: "#38bdf8" },
  { id: "violet", name: "Violet", free: false, swatch: "#c084fc" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
const KEY = "opq-theme";

function readStored(): ThemeId {
  try {
    const v = localStorage.getItem(KEY);
    if (THEMES.some((t) => t.id === v)) return v as ThemeId;
  } catch {}
  return "default";
}

function writeStored(id: ThemeId) {
  try {
    localStorage.setItem(KEY, id);
  } catch {}
}

// Returns the saved choice and a setter. Applies the theme to <html data-theme> only when supporter.
export function useTheme(isSupporter: boolean): [ThemeId, (id: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>("default");
  // eslint-disable-next-line react-hooks/set-state-in-effect -- read after mount to avoid a hydration mismatch
  useEffect(() => setTheme(readStored()), []);
  useEffect(() => {
    const applied = isSupporter ? theme : "default";
    document.documentElement.dataset.theme = applied;
  }, [theme, isSupporter]);
  const set = (id: ThemeId) => {
    writeStored(id);
    setTheme(id);
  };
  return [theme, set];
}
