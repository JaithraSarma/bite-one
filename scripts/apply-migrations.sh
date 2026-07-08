#!/bin/bash
# Auto-applies database migrations from sql/ (SOW-KH-002, step-4 automation).
# Runs ON the EC2 host (cron pulls master every 2 min, then runs this).
# Convention: sql/NNN_name.sql, applied in filename order, each exactly once,
# tracked in public._migrations. Files must be idempotent-safe anyway
# (IF NOT EXISTS / DROP POLICY IF EXISTS) as a second line of defense.
set -euo pipefail
cd "$(dirname "$0")/.."

PSQL="docker exec -i supabase-db psql -U postgres -d postgres -v ON_ERROR_STOP=1"

$PSQL -qc "create table if not exists public._migrations (
             filename text primary key,
             applied_at timestamptz not null default now());
           revoke all on public._migrations from anon, authenticated;" >/dev/null

for f in $(ls sql/*.sql 2>/dev/null | sort); do
  name=$(basename "$f")
  applied=$(docker exec supabase-db psql -U postgres -d postgres -tAc \
    "select 1 from public._migrations where filename = '$name'")
  if [ "$applied" != "1" ]; then
    echo "$(date -Is) applying $name"
    $PSQL --single-transaction < "$f"
    docker exec supabase-db psql -U postgres -d postgres -qc \
      "insert into public._migrations(filename) values ('$name')"
  fi
done
