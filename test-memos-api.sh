#!/bin/bash
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
DB_URL=$(echo "$TURSO_CONNECTION_URL" | sed 's|^libsql://|https://|')

echo "=== TEST MEMOS QUERY ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["SELECT m.* FROM memos m WHERE (m.target_role = \"admin\" OR m.target_role = \"all\") AND (m.expires_at IS NULL OR datetime(m.expires_at) > datetime(\"now\")) AND m.is_active = 1 LIMIT 1"]}' | jq '.'
