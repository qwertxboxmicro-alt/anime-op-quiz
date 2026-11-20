"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { cloudEnabled, sb } from "@/platform/cloud";
import { useSupporter } from "@/platform/useSupporter";

type League = { id: string; name: string; invite_code: string; owner_id: string };
type Row = { label: string; is_me: boolean; games: number; wins: number; avg_tries: number | null };

// Friend leagues: Supporter-only. Server enforces membership (RLS + RPCs); the Supporter check here is UI-only.
export function Leagues({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { isSupporter, loading } = useSupporter();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [boards, setBoards] = useState<Record<string, Row[]>>({});
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    const c = sb();
    if (!c) return;
    const { data, error } = await c.from("leagues").select("id,name,invite_code,owner_id").order("created_at");
    if (error) return setMsg(error.message);
    const ls = (data ?? []) as League[];
    setLeagues(ls);
    const entries = await Promise.all(
      ls.map(async (l) => [l.id, ((await c.rpc("league_leaderboard", { league_id: l.id })).data ?? []) as Row[]] as const),
    );
    setBoards(Object.fromEntries(entries));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user && isSupporter) load();
  }, [user, isSupporter]);

  // Runs an RPC, reports the outcome, and refreshes the list on success.
  const act = async (fn: string, args: Record<string, string>, ok: string) => {
    const { error } = await sb()!.rpc(fn, args);
    setMsg(error ? error.message : ok);
    if (!error) await load();
    return !error;
  };

  const leave = async (id: string) => {
    const { error } = await sb()!.from("league_members").delete().eq("league_id", id).eq("user_id", user!.id);
    setMsg(error ? error.message : "Left league.");
    if (!error) await load();
  };

  const copy = async (c: string) => {
    try {
      await navigator.clipboard.writeText(c);
      setMsg("Invite code copied.");
    } catch {
      setMsg(`Code: ${c}`);
    }
  };

  let body;
  if (!cloudEnabled || !user) {
    body = <p>Sign in from Account to use friend leagues.</p>;
  } else if (loading) {
    body = <p>Checking Supporter status…</p>;
  } else if (!isSupporter) {
    body = (
      <>
        <p>Friend leagues are a Supporter perk: private leaderboards with your friends.</p>
        <p>The daily puzzle, your stats and streak stay free.</p>
        <button className="primary" disabled>Become a Supporter (coming soon)</button>
      </>
    );
  } else {
    body = (
      <>
        <form onSubmit={(e) => { e.preventDefault(); act("create_league", { p_name: name }, "League created.").then((ok) => ok && setName("")); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="League name" aria-label="League name" />
          <button className="primary" disabled={!name.trim()}>Create</button>
        </form>
        <form onSubmit={(e) => { e.preventDefault(); act("join_league", { code }, "Joined league.").then((ok) => ok && setCode("")); }}>
          <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={10} placeholder="Invite code" aria-label="Invite code" />
          <button className="primary" disabled={!code.trim()}>Join</button>
        </form>
        {leagues.length === 0 && <p>No leagues yet.</p>}
        {leagues.map((l) => (
          <section key={l.id}>
            <h3>{l.name}</h3>
            <p>
              Invite code: <b>{l.invite_code}</b>{" "}
              <button onClick={() => copy(l.invite_code)}>Copy</button>
            </p>
            <table>
              <thead>
                <tr><th>Player</th><th>Wins</th><th>Games</th><th>Avg tries</th></tr>
              </thead>
              <tbody>
                {(boards[l.id] ?? []).map((r) => (
                  <tr key={r.label} className={r.is_me ? "on" : ""}>
                    <td>{r.label}{r.is_me ? " (you)" : ""}</td>
                    <td>{r.wins}</td>
                    <td>{r.games}</td>
                    <td>{r.avg_tries ?? "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => leave(l.id)}>Leave league</button>
          </section>
        ))}
      </>
    );
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Friend leagues" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        <h2>Friend leagues</h2>
        {body}
        {msg && <p role="status">{msg}</p>}
      </div>
    </div>
  );
}
