-- Supabase default privileges grant EXECUTE to anon on new public functions; `revoke ... from public` does not remove that.
-- Applied to live 2026-11-20. These functions all need a signed-in caller anyway; this removes the anon path.
revoke execute on function public.create_league(text), public.join_league(text), public.league_leaderboard(uuid), public.is_league_member(uuid), public.has_freeze_in_month(integer) from anon;
