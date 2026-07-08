#!/bin/sh
# Creates the two RLS test users and seeds two rows for userA (SOW-KH-002 T7).
# Run ON the EC2 host from bite-one/supabase (needs .env for the service key):
#   cd ~/bite-one/supabase && sh ../scripts/seed-test-users.sh
# Test-only credentials; the backend holds seed data only, never real data.
set -e

BASE_URL=$(grep '^SUPABASE_PUBLIC_URL=' .env | cut -d= -f2)
SERVICE_KEY=$(grep '^SERVICE_ROLE_KEY=' .env | cut -d= -f2)
ANON_KEY=$(grep '^ANON_KEY=' .env | cut -d= -f2)

USERA_EMAIL="usera@biteone.test"
USERB_EMAIL="userb@biteone.test"
USERA_PASS="biteone-testA-2026"
USERB_PASS="biteone-testB-2026"

create_user() {
  email=$1; pass=$2
  resp=$(curl -s "$BASE_URL/auth/v1/admin/users" \
    -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$pass\",\"email_confirm\":true}")
  case "$resp" in
    *email_exists*|*already*) echo "$email: already exists" ;;
    *\"id\"*) echo "$email: created" ;;
    *) echo "$email: UNEXPECTED: $resp" && exit 1 ;;
  esac
}

create_user "$USERA_EMAIL" "$USERA_PASS"
create_user "$USERB_EMAIL" "$USERB_PASS"

# login as userA and seed two rows (idempotent: only if fewer than 2 exist)
TOKEN_A=$(curl -s "$BASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d "{\"email\":\"$USERA_EMAIL\",\"password\":\"$USERA_PASS\"}" \
  | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
[ -n "$TOKEN_A" ] || { echo "userA login failed"; exit 1; }

COUNT=$(curl -s "$BASE_URL/rest/v1/notes?select=id" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $TOKEN_A" | grep -o '"id"' | wc -l)
if [ "$COUNT" -lt 2 ]; then
  curl -s "$BASE_URL/rest/v1/notes" \
    -H "apikey: $ANON_KEY" -H "Authorization: Bearer $TOKEN_A" \
    -H "Content-Type: application/json" -H "Prefer: return=minimal" \
    -d '[{"content":"userA seed note 1"},{"content":"userA seed note 2"}]'
  echo "seeded 2 rows for userA"
else
  echo "userA already has $COUNT rows"
fi
echo "SEED_OK"
