"use client";
// Cloudflare Turnstile widget. Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset.
// Tokens are single-use: remount (change `key`) to get a fresh one after each sign-in attempt.
import { useEffect, useRef } from "react";

export const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type TS = { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void };
const SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function load(): Promise<TS> {
  const w = window as unknown as { turnstile?: TS };
  if (w.turnstile) return Promise.resolve(w.turnstile);
  return new Promise((res, rej) => {
    let s = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => res(w.turnstile!));
    s.addEventListener("error", () => rej(new Error("turnstile load failed")));
  });
}

export function Turnstile({ onToken }: { onToken: (t: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!turnstileSiteKey || !ref.current) return;
    let id: string | undefined;
    let ts: TS | undefined;
    let dead = false;
    load().then((t) => {
      if (dead || !ref.current) return;
      ts = t;
      id = t.render(ref.current, {
        sitekey: turnstileSiteKey,
        callback: (tok: string) => onToken(tok),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    }).catch(() => onToken(null));
    return () => { dead = true; onToken(null); if (id && ts) ts.remove(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return turnstileSiteKey ? <div ref={ref} /> : null;
}
