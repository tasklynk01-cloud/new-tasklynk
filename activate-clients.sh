#!/bin/bash

# Activate All Client Accounts - Bash Script using Turso HTTP API
# This script uses curl to execute SQL directly against Turso database

set -e  # Exit on error

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TaskLynk - Bulk Client Account Activation Script"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Load environment variables
if [ -f .env ]; then
    echo "✓ Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
else
    echo "❌ ERROR: .env file not found"
    exit 1
fi

# Check required environment variables
if [ -z "$TURSO_CONNECTION_URL" ]; then
    echo "❌ ERROR: TURSO_CONNECTION_URL not set in .env"
    exit 1
fi

if [ -z "$TURSO_AUTH_TOKEN" ]; then
    echo "❌ ERROR: TURSO_AUTH_TOKEN not set in .env"
    exit 1
fi

# Extract database URL (remove libsql:// prefix and add https://)
DB_URL=$(echo "$TURSO_CONNECTION_URL" | sed 's|^libsql://|https://|')

echo "✓ Connected to database: $DB_URL"
echo ""

# Function to execute SQL via Turso HTTP API
execute_sql() {
    local sql="$1"
    curl -s -X POST "$DB_URL" \
        -H "Authorization: Bearer $TURSO_AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"statements\":[\"$sql\"]}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 1: Query Inactive Clients"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

QUERY_BEFORE="SELECT id, email, name, role, approved, status FROM users WHERE (role = 'client' OR role = 'account_owner') AND (approved = 0 OR status != 'approved')"

echo "Querying inactive client accounts..."
BEFORE_RESULT=$(execute_sql "$QUERY_BEFORE")
echo "$BEFORE_RESULT" | jq '.' 2>/dev/null || echo "$BEFORE_RESULT"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 2: Activate All Client Accounts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

UPDATE_SQL="UPDATE users SET approved = 1, status = 'approved', updated_at = datetime('now') WHERE (role = 'client' OR role = 'account_owner') AND (approved = 0 OR status != 'approved')"

echo "Executing bulk activation..."
UPDATE_RESULT=$(execute_sql "$UPDATE_SQL")
echo "$UPDATE_RESULT" | jq '.' 2>/dev/null || echo "$UPDATE_RESULT"
echo ""

echo "✅ Activation complete!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 3: Verify Activation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

QUERY_AFTER="SELECT id, email, name, role, approved, status FROM users WHERE role = 'client' OR role = 'account_owner' ORDER BY created_at DESC LIMIT 10"

echo "Showing last 10 client accounts (should all be active)..."
AFTER_RESULT=$(execute_sql "$QUERY_AFTER")
echo "$AFTER_RESULT" | jq '.' 2>/dev/null || echo "$AFTER_RESULT"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  STEP 4: Summary Statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

COUNT_SQL="SELECT COUNT(*) as total_clients FROM users WHERE role = 'client' OR role = 'account_owner'"
ACTIVE_SQL="SELECT COUNT(*) as active_clients FROM users WHERE (role = 'client' OR role = 'account_owner') AND approved = 1 AND status = 'approved'"

echo "Total clients:"
execute_sql "$COUNT_SQL" | jq '.' 2>/dev/null || execute_sql "$COUNT_SQL"
echo ""

echo "Active clients:"
execute_sql "$ACTIVE_SQL" | jq '.' 2>/dev/null || execute_sql "$ACTIVE_SQL"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ ACTIVATION COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "All existing client accounts have been activated and are ready to use."
echo "New clients will be auto-approved upon registration."
echo ""
