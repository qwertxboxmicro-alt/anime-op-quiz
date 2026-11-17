"use client";
import { useMemo } from "react";
import { readStats } from "@/lib/stats";

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function HowTo({ onClose }: { onClose: () => void }) {
  return (
    <Shell title="How to play" onClose={onClose}>
      <ul className="how">
        <li>Hit play and name the <b>anime</b> from its opening.</li>
        <li>You get 6 tries. The first clip is only <b>0.1 seconds</b>.</li>
        <li>Each miss or skip unlocks a longer clip.</li>
        <li>A new opening drops every day. Want more? Try <b>Endless</b>.</li>
      </ul>
      <button className="primary" onClick={onClose}>Got it</button>
    </Shell>
  );
}

export function StatsModal({ onClose }: { onClose: () => void }) {
  const s = useMemo(() => readStats(), []);
  const max = Math.max(1, ...s.dist);
  return (
    <Shell title="Stats" onClose={onClose}>
      <div className="nums">
        <div><b>{s.played}</b>Played</div>
        <div><b>{s.played ? Math.round((s.wins / s.played) * 100) : 0}</b>Win %</div>
        <div><b>{s.streak}</b>Streak</div>
        <div><b>{s.best}</b>Best</div>
      </div>
      <ol className="dist">
        {s.dist.map((n, i) => (
          <li key={i}>
            <span>{i + 1}</span>
            <i style={{ width: `${Math.max((n / max) * 100, 6)}%` }}>{n}</i>
          </li>
        ))}
      </ol>
    </Shell>
  );
}
