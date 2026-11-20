"use client";
import { useState } from "react";
import { THEMES, type ThemeId } from "@/platform/themes";
import { startSupporterCheckout } from "@/platform/useSupporter";

// Theme picker. Locked themes show an upgrade prompt for non-supporters.
export function ThemePicker({ isSupporter, theme, onPick }: { isSupporter: boolean; theme: ThemeId; onPick: (id: ThemeId) => void }) {
  const [locked, setLocked] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  // Busy guard: a double click would otherwise create two Razorpay subscriptions (no supporters row exists until the webhook lands).
  const upgrade = async () => {
    setBusy(true);
    const r = await startSupporterCheckout();
    if (r.url) { window.location.href = r.url; return; }
    setErr(r.needsSignIn ? "Sign in to become a Supporter." : r.error ?? "Could not start subscription.");
    setBusy(false);
  };
  return (
    <div className="themes">
      <span className="how">Theme</span>
      <div className="swatches" role="radiogroup" aria-label="Theme">
        {THEMES.map((t) => {
          const isLocked = !t.free && !isSupporter;
          return (
            <button
              key={t.id}
              role="radio"
              aria-checked={theme === t.id}
              aria-label={isLocked ? `${t.name} (Supporter only)` : t.name}
              className={`swatch ${theme === t.id ? "on" : ""}`}
              style={{ background: t.swatch }}
              onClick={() => (isLocked ? setLocked(true) : onPick(t.id))}
            >
              {isLocked && "🔒"}
            </button>
          );
        })}
      </div>
      {locked && !isSupporter && (
        <div className="upgrade">
          <p className="how">Supporter themes are locked. Support the game to unlock them.</p>
          <button className="primary" disabled={busy} onClick={upgrade}>Become a Supporter</button>
          {err && <p className="how" role="alert">{err}</p>}
        </div>
      )}
    </div>
  );
}
