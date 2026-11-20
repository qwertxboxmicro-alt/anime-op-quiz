-- Private friend leagues (Supporter feature). NOT applied to live Supabase yet.
-- Writes go only through security definer RPCs (create_league, join_league, league_leaderboard).
-- Clients never insert into these tables directly; leaving is an own-row delete.

create table public.leagues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 40),
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  owner_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table public.league_members (
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

create index league_members_user_idx on public.league_members (user_id);

-- Membership check used by RLS. security definer so the league_members policy does not recurse into itself.
create or replace function public.is_league_member(lid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.league_members m
    where m.league_id = lid and m.user_id = auth.uid()
  );
$$;

alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

-- Members read their own leagues and the member list of those leagues. No direct writes.
create policy "members read league" on public.leagues
  for select to authenticated using (public.is_league_member(id));

create policy "members read roster" on public.league_members
  for select to authenticated using (public.is_league_member(league_id));

create policy "leave own row" on public.league_members
  for delete to authenticated using (user_id = (select auth.uid()));

-- Create a league and add the caller as its first member. Max 40-char name, caller must be signed in.
-- ponytail: no cap on leagues per user; add when it's abused.
create or replace function public.create_league(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  if not exists (
    select 1 from public.supporters s
    where s.user_id = auth.uid() and s.active and (s.current_period_end is null or s.current_period_end > now())
  ) then raise exception 'supporter required'; end if;
  insert into public.leagues (name)
  values (btrim(p_name))
  returning id into v_id;
  insert into public.league_members (league_id, user_id) values (v_id, auth.uid());
  return v_id;
end;
$$;

-- Join by invite code. Row lock on the league serialises joins so the 20-member cap holds.
-- Joining twice is a no-op. Invalid code gives a generic error.
create or replace function public.join_league(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_count integer;
begin
  if auth.uid() is null then raise exception 'sign in required'; end if;
  if not exists (
    select 1 from public.supporters s
    where s.user_id = auth.uid() and s.active and (s.current_period_end is null or s.current_period_end > now())
  ) then raise exception 'supporter required'; end if;
  select l.id into v_id from public.leagues l
  where l.invite_code = upper(btrim(code))
  for update;
  if v_id is null then raise exception 'invalid invite code'; end if;
  if exists (select 1 from public.league_members m where m.league_id = v_id and m.user_id = auth.uid()) then
    return v_id;
  end if;
  select count(*) into v_count from public.league_members m where m.league_id = v_id;
  if v_count >= 20 then raise exception 'league is full (20 members)'; end if;
  insert into public.league_members (league_id, user_id) values (v_id, auth.uid());
  return v_id;
end;
$$;

-- Leaderboard for one league. Caller must be a member. Returns no emails and no raw result rows.
-- label is "Player N" by join order (no display names exist yet).
create or replace function public.league_leaderboard(league_id uuid)
returns table (label text, is_me boolean, games bigint, wins bigint, avg_tries numeric)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_league_member(league_leaderboard.league_id) then
    raise exception 'not a member of this league';
  end if;
  return query
  select
    ('Player ' || row_number() over (order by m.joined_at, m.user_id))::text,
    (m.user_id = auth.uid()),
    count(r.day),
    count(r.day) filter (where r.won),
    round(avg(r.tries), 2)
  from public.league_members m
  left join public.results r on r.user_id = m.user_id
  where m.league_id = league_leaderboard.league_id
  group by m.user_id, m.joined_at
  order by count(r.day) filter (where r.won) desc, avg(r.tries) asc nulls last;
end;
$$;

-- Grants. Supabase default privileges give authenticated full access, so revoke first, then grant back only what is used.
revoke all on public.leagues, public.league_members from anon, authenticated;
grant select on public.leagues to authenticated;
grant select, delete on public.league_members to authenticated;

revoke all on function public.is_league_member(uuid) from public;
revoke all on function public.create_league(text) from public;
revoke all on function public.join_league(text) from public;
revoke all on function public.league_leaderboard(uuid) from public;
grant execute on function public.is_league_member(uuid) to authenticated;
grant execute on function public.create_league(text) to authenticated;
grant execute on function public.join_league(text) to authenticated;
grant execute on function public.league_leaderboard(uuid) to authenticated;
