#!/bin/bash
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
DB_URL=$(echo "$TURSO_CONNECTION_URL" | sed 's|^libsql://|https://|')

echo "=== CHECKING USER: mrwaacc@gmail.com ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["SELECT id, email, name, role, approved, status, password FROM users WHERE email = \"mrwaacc@gmail.com\""]}' | jq '.'

echo -e "\n=== CHECKING PENDING REGISTRATIONS ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["SELECT email, role, verified FROM pending_registrations WHERE email = \"mrwaacc@gmail.com\""]}' | jq '.'
