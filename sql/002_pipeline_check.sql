-- 002: harmless marker proving the merge -> auto-apply pipeline end to end.
-- Applied automatically by scripts/apply-migrations.sh via the EC2 cron.
comment on table public.notes is
  'QuickNotes user notes - owner-only RLS. Migrations auto-applied from sql/ on merge to master.';
