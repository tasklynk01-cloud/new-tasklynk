#!/bin/bash
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
DB_URL=$(echo "$TURSO_CONNECTION_URL" | sed 's|^libsql://|https://|')

echo "=== JOBS TABLE SCHEMA ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["PRAGMA table_info(jobs)"]}' | jq -r '.[] | .results.rows[] | @csv'

echo -e "\n=== CHECK ID FIELD ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["PRAGMA table_info(jobs)"]}' | jq -r '.[] | .results.rows[] | select(.[1] == "id")'

echo -e "\n=== CHECK AUTOINCREMENT ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["SELECT sql FROM sqlite_master WHERE type=\"table\" AND name=\"jobs\""]}' | jq -r '.[] | .results.rows[0][0]' | head -20
