-- One row per user per daily puzzle. Stats (streak, win %, distribution) are derived from these rows.
create table public.results (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day        integer not null check (day between 20774 and 80000),  -- UTC days since 1970; 20774 = puzzle #1
  won        boolean not null,
  tries      smallint not null check (tries between 1 and 6),
  created_at timestamptz not null default now(),
  primary key (user_id, day),
  check (won or tries = 6)  -- a loss always uses all six tries
);

alter table public.results enable row level security;

-- Users can read and add only their own rows. No update/delete: a result is final once recorded
-- (account deletion removes rows via the cascade above).
create policy "read own results" on public.results
  for select to authenticated using (user_id = (select auth.uid()));

create policy "insert own results" on public.results
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Nothing for anon: signed-out requests get no rows and cannot write.
revoke all on public.results from anon;
grant select, insert on public.results to authenticated;
