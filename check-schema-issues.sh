#!/bin/bash
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
DB_URL=$(echo "$TURSO_CONNECTION_URL" | sed 's|^libsql://|https://|')

echo "=== CHECKING TABLE EXISTENCE ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["SELECT name FROM sqlite_master WHERE type=\"table\" AND name IN (\"memos\", \"memo_reads\", \"job_messages\", \"jobs\", \"users\") ORDER BY name"]}' | jq -r '.[] | .results.rows'

echo -e "\n=== CHECKING USERS TABLE STRUCTURE ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["PRAGMA table_info(users)"]}' | jq -r '.[] | .results.rows[] | @csv'

echo -e "\n=== CHECKING FOR CLIENT/ACCOUNT_OWNER DATA ISSUES ==="
curl -s -X POST "$DB_URL" -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -H "Content-Type: application/json" \
  -d '{"statements":["SELECT COUNT(*) as total, SUM(CASE WHEN approved=1 AND status=\"approved\" THEN 1 ELSE 0 END) as active FROM users WHERE role IN (\"client\", \"account_owner\")"]}' | jq '.'
