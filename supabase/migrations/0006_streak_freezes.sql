-- Streak freeze (Supporter feature). A supporter gets one freeze per calendar month: it bridges one missed day so the streak survives.
-- The client inserts a row when it auto-consumes a freeze; the RLS check below enforces the rules. NOT applied to live Supabase yet.
create table public.streak_freezes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day     integer not null check (day between 20774 and 80000),  -- UTC days since 1970, same as results.day
  used_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.streak_freezes enable row level security;

-- Users can read only their own freezes.
create policy "read own freezes" on public.streak_freezes
  for select to authenticated using (user_id = (select auth.uid()));

-- Month check lives in a security definer function: a policy that selects from its own table recurses infinitely.
create or replace function public.has_freeze_in_month(p_day integer)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.streak_freezes f
    where f.user_id = auth.uid()
      and to_char(timestamp 'epoch' + f.day * interval '1 day', 'YYYY-MM')
        = to_char(timestamp 'epoch' + p_day * interval '1 day', 'YYYY-MM')
  );
$$;
revoke all on function public.has_freeze_in_month(integer) from public;
grant execute on function public.has_freeze_in_month(integer) to authenticated;

-- Insert only. Allowed when: own row, active supporter, the frozen day is in the past, the user has no result for that day
-- (it really was missed), and the user has no other freeze in the same calendar month as that day.
create policy "insert own freeze" on public.streak_freezes
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.supporters s
      where s.user_id = (select auth.uid())
        and s.active
        and (s.current_period_end is null or s.current_period_end > now())
    )
    and streak_freezes.day < floor(extract(epoch from now()) / 86400)
    and not exists (
      select 1 from public.results r
      where r.user_id = (select auth.uid()) and r.day = streak_freezes.day
    )
    and not public.has_freeze_in_month(streak_freezes.day)
  );

-- No update or delete. Account deletion removes rows via the cascade.
revoke all on public.streak_freezes from anon, authenticated;
grant select, insert on public.streak_freezes to authenticated;
