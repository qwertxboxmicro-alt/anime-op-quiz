-- Aggregate-only stats for one daily puzzle across all users. Exposes counts, never user_id or rows.
-- security definer bypasses RLS on results inside this function only; RLS/policies on the table are unchanged.
create or replace function public.global_day_stats(p_day integer)
returns table (played bigint, wins bigint, dist integer[])
language sql
stable
security definer
set search_path = ''
as $$
  with agg as (
    select count(*) as played,
           count(*) filter (where r.won) as wins,
           array[
             count(*) filter (where r.won and r.tries = 1)::int,
             count(*) filter (where r.won and r.tries = 2)::int,
             count(*) filter (where r.won and r.tries = 3)::int,
             count(*) filter (where r.won and r.tries = 4)::int,
             count(*) filter (where r.won and r.tries = 5)::int,
             count(*) filter (where r.won and r.tries = 6)::int
           ] as dist
    from public.results r
    where r.day = p_day
  )
  -- Hide tiny samples so a lone player's result cannot be inferred.
  select a.played, a.wins, a.dist from agg a where a.played >= 5;
$$;

revoke all on function public.global_day_stats(integer) from public;
grant execute on function public.global_day_stats(integer) to anon, authenticated;
