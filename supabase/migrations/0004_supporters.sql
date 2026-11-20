-- Supporter entitlement, one row per user. Written ONLY by the Razorpay webhook (service role key, bypasses RLS).
-- Clients may read their own row; nothing else. No client insert/update/delete path exists.
create table public.supporters (
  user_id                  uuid primary key references auth.users (id) on delete cascade,
  active                   boolean not null default false,
  plan                     text,
  razorpay_subscription_id text,
  current_period_end       timestamptz,
  updated_at               timestamptz not null default now()
);

alter table public.supporters enable row level security;

-- Users can read only their own entitlement row.
create policy "read own supporter row" on public.supporters
  for select to authenticated using (user_id = (select auth.uid()));

-- Nothing for anon. No insert/update/delete policies: only the service role writes.
-- Supabase default privileges grant anon/authenticated full access, so revoke everything, then grant read back.
revoke all on public.supporters from anon, authenticated;
grant select on public.supporters to authenticated;
