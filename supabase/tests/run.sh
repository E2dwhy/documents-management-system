#!/usr/bin/env bash
# =============================================================================
# Runs the SQL migrations + RLS policies + RPC test matrix against a
# throwaway local Postgres cluster. Does NOT touch your real Supabase
# project — everything happens in a temp data directory that's deleted on
# exit (success or failure).
#
# Requires local Postgres binaries (initdb/pg_ctl/psql/pg_isready) on PATH —
# e.g. `brew install postgresql@17` on macOS. This is a plain-Postgres stand-
# in for Supabase (see 00_auth_stub.sql), not a substitute for testing
# against a real Supabase project before going to production.
#
# Usage: ./supabase/tests/run.sh
# =============================================================================
set -euo pipefail

for bin in initdb pg_ctl psql pg_isready; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "✗ '$bin' not found on PATH. Install local Postgres (e.g. brew install postgresql@17) to run this test suite." >&2
    exit 1
  fi
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORK_DIR="$(mktemp -d /tmp/dms_pg_test.XXXXXX)"
export PGDATA="$WORK_DIR/data"
export PGHOST="$WORK_DIR/sock"
export PGPORT=5544
export PGUSER=postgres
DB_NAME=dms_migration_test

mkdir -p "$PGHOST"

cleanup() {
  pg_ctl -D "$PGDATA" stop -m fast >/dev/null 2>&1 || true
  rm -rf "$WORK_DIR"
}
trap cleanup EXIT

echo "→ Initializing throwaway Postgres cluster in $WORK_DIR"
initdb -D "$PGDATA" -U postgres -A trust --no-locale -E UTF8 >/dev/null

echo "→ Starting Postgres on $PGHOST:$PGPORT"
pg_ctl -D "$PGDATA" -l "$WORK_DIR/postgres.log" -o "-p $PGPORT -k $PGHOST -h ''" start >/dev/null
for _ in $(seq 1 20); do
  pg_isready -h "$PGHOST" -p "$PGPORT" >/dev/null 2>&1 && break
  sleep 0.5
done

createdb -h "$PGHOST" -p "$PGPORT" -U postgres "$DB_NAME"

run_sql() {
  psql -h "$PGHOST" -p "$PGPORT" -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$1"
}

echo "→ Applying Supabase auth stub"
run_sql "$SCRIPT_DIR/00_auth_stub.sql" >/dev/null

echo "→ Applying migrations"
for f in "$REPO_ROOT"/supabase/migrations/*.sql; do
  echo "  - $(basename "$f")"
  run_sql "$f" >/dev/null
done

echo "→ Applying reference-data seed"
run_sql "$REPO_ROOT/supabase/seed.sql" >/dev/null

echo "→ Running test matrix"
run_sql "$SCRIPT_DIR/01_seed_test_users.sql"
run_sql "$SCRIPT_DIR/02_rpc_and_rls.sql"
run_sql "$SCRIPT_DIR/03_extra_checks.sql"

echo ""
echo "✓ All Phase 2 data-layer tests passed."
