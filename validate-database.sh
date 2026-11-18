#!/bin/bash

# Comprehensive Database Validation Script
# Tests client/account_owner data integrity and order placement functionality

set -e
export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
DB_URL=$(echo "$TURSO_CONNECTION_URL" | sed 's|^libsql://|https://|')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TaskLynk Database Integrity Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to execute SQL
execute_sql() {
    local sql="$1"
    curl -s -X POST "$DB_URL" \
        -H "Authorization: Bearer $TURSO_AUTH_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"statements\":[\"$sql\"]}"
}

echo "┌─ STEP 1: CLIENT & ACCOUNT_OWNER VALIDATION ─────────────────┐"
echo "│"

echo "│ 1.1 Check Total Clients..."
CLIENT_COUNT=$(execute_sql "SELECT COUNT(*) as total FROM users WHERE role IN ('client', 'account_owner')")
echo "$CLIENT_COUNT" | jq -r '.[] | .results.rows[0][0] as $total | "│   Total Clients: \($total)"'

echo "│"
echo "│ 1.2 Check Approved Clients..."
APPROVED=$(execute_sql "SELECT COUNT(*) as approved FROM users WHERE role IN ('client', 'account_owner') AND approved = 1 AND status = 'approved'")
echo "$APPROVED" | jq -r '.[] | .results.rows[0][0] as $approved | "│   Approved Clients: \($approved)"'

echo "│"
echo "│ 1.3 Check Pending/Problematic Clients..."
PENDING=$(execute_sql "SELECT email, name, role, approved, status FROM users WHERE role IN ('client', 'account_owner') AND (approved = 0 OR status != 'approved') LIMIT 5")
echo "│   Problematic Clients:"
echo "$PENDING" | jq -r '.[] | .results.rows[] | "│     - \(.[1]): approved=\(.[3]), status=\(.[4])"'

echo "│"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ STEP 2: ACCOUNT RELATIONSHIPS VALIDATION ──────────────────┐"
echo "│"

echo "│ 2.1 Check Account Owners with Client Relationships..."
ACCOUNT_OWNERS=$(execute_sql "SELECT u.id, u.name, u.account_name, COUNT(c.id) as client_count FROM users u LEFT JOIN users c ON c.account_id = u.id WHERE u.role = 'account_owner' GROUP BY u.id")
echo "$ACCOUNT_OWNERS" | jq -r '.[] | .results.rows[] | "│   \(.[1]) (\(.[2])): \(.[3]) linked clients"'

echo "│"
echo "│ 2.2 Check Clients with Account ID..."
LINKED_CLIENTS=$(execute_sql "SELECT COUNT(*) as total FROM users WHERE role = 'client' AND account_id IS NOT NULL")
echo "$LINKED_CLIENTS" | jq -r '.[] | .results.rows[0][0] as $total | "│   Clients with account_id: \($total)"'

echo "│"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ STEP 3: ORDER PLACEMENT READINESS CHECK ───────────────────┐"
echo "│"

echo "│ 3.1 Check Jobs Table Structure..."
JOBS_COUNT=$(execute_sql "SELECT COUNT(*) as total FROM jobs")
echo "$JOBS_COUNT" | jq -r '.[] | .results.rows[0][0] as $total | "│   Total Orders: \($total)"'

echo "│"
echo "│ 3.2 Check Orders by Client Type..."
CLIENT_ORDERS=$(execute_sql "SELECT u.role, COUNT(j.id) as order_count FROM users u LEFT JOIN jobs j ON j.client_id = u.id WHERE u.role IN ('client', 'account_owner') GROUP BY u.role")
echo "$CLIENT_ORDERS" | jq -r '.[] | .results.rows[] | "│   \(.[0]) orders: \(.[1])"'

echo "│"
echo "│ 3.3 Check Recent Order Placement Issues..."
RECENT_ORDERS=$(execute_sql "SELECT j.id, j.display_id, u.email, u.role, j.status, j.created_at FROM jobs j JOIN users u ON j.client_id = u.id WHERE u.role IN ('client', 'account_owner') ORDER BY j.created_at DESC LIMIT 5")
echo "│   Last 5 Orders:"
echo "$RECENT_ORDERS" | jq -r '.[] | .results.rows[] | "│     Order \(.[1]): \(.[2]) (\(.[3])) - \(.[4])"'

echo "│"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ STEP 4: FOREIGN KEY RELATIONSHIPS ──────────────────────────┐"
echo "│"

echo "│ 4.1 Check Orphaned Orders (invalid client_id)..."
ORPHANED_ORDERS=$(execute_sql "SELECT j.id, j.display_id, j.client_id FROM jobs j LEFT JOIN users u ON j.client_id = u.id WHERE u.id IS NULL")
ORPHAN_COUNT=$(echo "$ORPHANED_ORDERS" | jq -r '.[] | .results.rows | length')
echo "│   Orphaned Orders: $ORPHAN_COUNT"

if [ "$ORPHAN_COUNT" -gt 0 ]; then
    echo "$ORPHANED_ORDERS" | jq -r '.[] | .results.rows[] | "│     ⚠️  Order \(.[1]): Invalid client_id=\(.[2])"'
fi

echo "│"
echo "│ 4.2 Check Orphaned Payments..."
ORPHANED_PAYMENTS=$(execute_sql "SELECT p.id, p.job_id FROM payments p LEFT JOIN jobs j ON p.job_id = j.id WHERE j.id IS NULL")
PAYMENT_ORPHAN_COUNT=$(echo "$ORPHANED_PAYMENTS" | jq -r '.[] | .results.rows | length')
echo "│   Orphaned Payments: $PAYMENT_ORPHAN_COUNT"

echo "│"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ STEP 5: INVITATION SYSTEM CHECK ────────────────────────────┐"
echo "│"

echo "│ 5.1 Check Manager Invitations..."
INVITATIONS=$(execute_sql "SELECT COUNT(*) as total, SUM(CASE WHEN used = 0 THEN 1 ELSE 0 END) as unused FROM manager_invitations")
echo "$INVITATIONS" | jq -r '.[] | .results.rows[0] as $row | "│   Total Invitations: \($row[0]), Unused: \($row[1])"'

echo "│"
echo "│ 5.2 Check Client/Account Owner Invitations..."
CLIENT_INV=$(execute_sql "SELECT COUNT(*) as total FROM invitations WHERE role IN ('client', 'account_owner')")
echo "$CLIENT_INV" | jq -r '.[] | .results.rows[0][0] as $total | "│   Client/Account Invitations: \($total)"'

echo "│"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""

echo "┌─ STEP 6: CRITICAL ISSUES SUMMARY ────────────────────────────┐"
echo "│"

# Count critical issues
CRITICAL_COUNT=0

# Check unapproved clients
UNAPPROVED=$(execute_sql "SELECT COUNT(*) FROM users WHERE role IN ('client', 'account_owner') AND approved = 0")
UNAPPROVED_COUNT=$(echo "$UNAPPROVED" | jq -r '.[] | .results.rows[0][0]')
if [ "$UNAPPROVED_COUNT" -gt 0 ]; then
    echo "│ ⚠️  $UNAPPROVED_COUNT clients need approval"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
fi

# Check orphaned records
if [ "$ORPHAN_COUNT" -gt 0 ]; then
    echo "│ ⚠️  $ORPHAN_COUNT orphaned orders found"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
fi

if [ "$PAYMENT_ORPHAN_COUNT" -gt 0 ]; then
    echo "│ ⚠️  $PAYMENT_ORPHAN_COUNT orphaned payments found"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
fi

# Check for wrong status values
WRONG_STATUS=$(execute_sql "SELECT COUNT(*) FROM users WHERE status NOT IN ('pending', 'approved', 'rejected', 'suspended', 'blacklisted')")
WRONG_STATUS_COUNT=$(echo "$WRONG_STATUS" | jq -r '.[] | .results.rows[0][0]')
if [ "$WRONG_STATUS_COUNT" -gt 0 ]; then
    echo "│ ⚠️  $WRONG_STATUS_COUNT users have invalid status values"
    CRITICAL_COUNT=$((CRITICAL_COUNT + 1))
fi

if [ "$CRITICAL_COUNT" -eq 0 ]; then
    echo "│ ✅ No critical issues found!"
else
    echo "│"
    echo "│ Total Critical Issues: $CRITICAL_COUNT"
fi

echo "│"
echo "└──────────────────────────────────────────────────────────────┘"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Validation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
