-- Supabase default privileges grant authenticated full table access; 0001's `grant select, insert`
-- does not remove them. RLS already blocks update/delete (no policy), this removes the grant too.
revoke update, delete, truncate, references, trigger on public.results from authenticated;
