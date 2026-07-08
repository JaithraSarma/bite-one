-- D4: user-owned notes table + owner-only RLS (SOW-KH-002 T7)
-- Apply with: sudo docker exec -i supabase-db psql -U postgres -d postgres < sql/001_notes_rls.sql

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  -- default auth.uid() so clients never need to (and can't usefully) supply it
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

-- Owner only: SELECT/INSERT/UPDATE/DELETE restricted to auth.uid() = user_id.
-- auth.uid() is wrapped in a scalar subquery so Postgres caches it per
-- statement instead of re-evaluating per row.
drop policy if exists notes_select_own on public.notes;
create policy notes_select_own on public.notes
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists notes_insert_own on public.notes;
create policy notes_insert_own on public.notes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists notes_update_own on public.notes;
create policy notes_update_own on public.notes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);  -- prevents reassigning user_id

drop policy if exists notes_delete_own on public.notes;
create policy notes_delete_own on public.notes
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Table privileges: authenticated users only. anon gets nothing at all,
-- so unauthenticated requests cannot even address the table.
revoke all on public.notes from anon;
grant select, insert, update, delete on public.notes to authenticated;

-- PostgREST reloads its schema cache on NOTIFY
notify pgrst, 'reload schema';
