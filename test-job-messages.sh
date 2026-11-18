#!/bin/bash
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
DB_URL=$(echo "$TURSO_CONNECTION_URL" | sed 's|^libsql://|https://|')

echo "=== CHECKING JOB_MESSAGES TABLE ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["SELECT COUNT(*) as total FROM job_messages"]}' | jq '.'

echo -e "\n=== CHECKING IF SENDER_ID COLUMN EXISTS ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["PRAGMA table_info(job_messages)"]}' | jq -r '.[] | .results.rows[] | select(.[1] == "senderId" or .[1] == "sender_id")'
