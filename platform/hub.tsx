"use client";
// The one surface games and hub pages use to talk to the platform (HUB-PLAN.md "Game contract").
// P1: wraps the existing auth + supporter code. Friends and chat are demo data until P4/P5.
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { onUser, RETURN_KEY } from "@/platform/cloud";
import { useSupporter } from "@/platform/useSupporter";

export type Friend = { name: string; status: "online" | "playing" | "offline"; game?: string };

type Hub = { user: User | null; ready: boolean; isSupporter: boolean; name: string; friends: Friend[]; demo: boolean };

// ponytail: demo friends until the friendships table exists (P4); `demo` lets pages label them.
export const DEMO_FRIENDS: Friend[] = [
  { name: "mochi_beats", status: "playing", game: "kikoe" },
  { name: "Tsubasa", status: "online" },
  { name: "lofi_ren", status: "playing", game: "kikoe" },
  { name: "kaito.exe", status: "online" },
  { name: "Hana", status: "offline" },
  { name: "Sorairo", status: "offline" },
  { name: "pixelnami", status: "offline" },
  { name: "Juniper", status: "offline" },
];

const Ctx = createContext<Hub>({ user: null, ready: false, isSupporter: false, name: "Guest", friends: DEMO_FRIENDS, demo: true });

export function HubProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const { isSupporter } = useSupporter();
  // Also consumes a session returning from Google/Discord/email sign-in (redirect lands on the site root).
  useEffect(() => onUser((u) => {
    setUser(u);
    setReady(true);
    if (!u) return;
    try {
      const r = JSON.parse(localStorage.getItem(RETURN_KEY) || "null") as { p?: string; t?: number } | null;
      localStorage.removeItem(RETURN_KEY);
      // Same-site paths only, and only for a sign-in started in the last hour.
      if (r?.p?.startsWith("/") && !r.p.startsWith("//") && r.p !== location.pathname + location.search && Date.now() - (r.t ?? 0) < 36e5) location.replace(r.p);
    } catch {}
  }), []);
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Guest";
  return <Ctx.Provider value={{ user, ready, isSupporter, name, friends: DEMO_FRIENDS, demo: true }}>{children}</Ctx.Provider>;
}

export const useHub = () => useContext(Ctx);
