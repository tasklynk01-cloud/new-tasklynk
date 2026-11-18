#!/bin/bash
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
DB_URL=$(echo "$TURSO_CONNECTION_URL" | sed 's|^libsql://|https://|')

echo "=== PENDING_REGISTRATIONS TABLE STRUCTURE ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["PRAGMA table_info(pending_registrations)"]}' | jq -r '.[] | .results.rows[] | "\(.[1]): \(.[2])"'

echo -e "\n=== CHECK FOR mrwaacc@gmail.com ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["SELECT * FROM pending_registrations WHERE email = \"mrwaacc@gmail.com\""]}' | jq '.'
