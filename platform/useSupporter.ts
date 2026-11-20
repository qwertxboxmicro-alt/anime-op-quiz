"use client";
// Supporter entitlement for the signed-in user. Reads ONLY the user's own `supporters` row (RLS allows nothing else).
// Writes happen server-side via the Razorpay webhook. Signed out or unconfigured = not a supporter.
import { useEffect, useState } from "react";
import { onUser, sb } from "@/platform/cloud";

export function useSupporter(): { isSupporter: boolean; loading: boolean } {
  const [isSupporter, setIsSupporter] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const off = onUser(async (u) => {
      if (!u) {
        if (alive) { setIsSupporter(false); setLoading(false); }
        return;
      }
      const c = sb();
      const { data } = (await c?.from("supporters").select("active,current_period_end").eq("user_id", u.id).maybeSingle()) ?? { data: null };
      const end = data?.current_period_end ? Date.parse(data.current_period_end) : null;
      const ok = !!data?.active && (end === null || end > Date.now());
      if (alive) { setIsSupporter(ok); setLoading(false); }
    });
    return () => { alive = false; off(); };
  }, []);

  return { isSupporter, loading };
}

// Starts a Razorpay subscription for the signed-in user and returns the hosted checkout URL (or an error message).
export async function startSupporterCheckout(): Promise<{ url?: string; error?: string; needsSignIn?: boolean }> {
  const token = (await sb()?.auth.getSession())?.data.session?.access_token;
  if (!token) return { needsSignIn: true };
  try {
    const r = await fetch("/api/razorpay/subscribe", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    const j = (await r.json().catch(() => null)) as { short_url?: string; error?: string } | null;
    if (!r.ok || !j?.short_url) return { error: j?.error ?? "Could not start subscription." };
    return { url: j.short_url };
  } catch {
    return { error: "Could not start subscription." };
  }
}
