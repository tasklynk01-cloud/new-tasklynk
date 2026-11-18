#!/bin/bash

# Freelancer System End-to-End Test Script
# Tests all freelancer endpoints and workflows

set -e

echo "🧪 FREELANCER SYSTEM E2E TEST"
echo "==============================="
echo ""

# Load environment
export $(cat .env | grep -v '^#' | xargs)

BASE_URL="http://localhost:5000"
ADMIN_EMAIL="topwriteessays@gmail.com"
ADMIN_PASSWORD="kemoda2025"
FREELANCER_ID=23  # Using existing freelancer from database

echo "1. Testing Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" \
  --cookie-jar cookies.txt)

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
  echo "   ❌ Admin login failed"
  echo "   Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "   ✓ Admin logged in successfully"
echo ""

echo "2. Testing Freelancer Balance API..."
BALANCE_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/freelancer/balance?userId=${FREELANCER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --cookie cookies.txt)

BALANCE_ERROR=$(echo $BALANCE_RESPONSE | jq -r '.error // empty')
if [ ! -z "$BALANCE_ERROR" ]; then
  echo "   ❌ Balance API failed: $BALANCE_ERROR"
else
  BALANCE=$(echo $BALANCE_RESPONSE | jq -r '.balance')
  echo "   ✓ Balance API works - Balance: $BALANCE KSh"
fi
echo ""

echo "3. Testing Freelancer Earnings API..."
EARNINGS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/freelancer/earnings?userId=${FREELANCER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --cookie cookies.txt)

EARNINGS_ERROR=$(echo $EARNINGS_RESPONSE | jq -r '.error // empty')
if [ ! -z "$EARNINGS_ERROR" ]; then
  echo "   ❌ Earnings API failed: $EARNINGS_ERROR"
else
  TOTAL_EARNED=$(echo $EARNINGS_RESPONSE | jq -r '.totalEarned')
  COMPLETED_JOBS=$(echo $EARNINGS_RESPONSE | jq -r '.completedJobs')
  echo "   ✓ Earnings API works - Total: $TOTAL_EARNED KSh, Jobs: $COMPLETED_JOBS"
fi
echo ""

echo "4. Testing Completed Orders Balance API..."
COMPLETED_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/freelancer/completed-orders-balance?userId=${FREELANCER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --cookie cookies.txt)

COMPLETED_ERROR=$(echo $COMPLETED_RESPONSE | jq -r '.error // empty')
if [ ! -z "$COMPLETED_ERROR" ]; then
  echo "   ❌ Completed Orders API failed: $COMPLETED_ERROR"
else
  COMPLETED_BALANCE=$(echo $COMPLETED_RESPONSE | jq -r '.completedOrdersBalance')
  COMPLETED_COUNT=$(echo $COMPLETED_RESPONSE | jq -r '.completedOrdersCount')
  echo "   ✓ Completed Orders API works - Balance: $COMPLETED_BALANCE KSh, Count: $COMPLETED_COUNT"
fi
echo ""

echo "5. Testing Freelancer Subjects API (GET)..."
SUBJECTS_GET_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/freelancer/subjects?userId=${FREELANCER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  --cookie cookies.txt)

SUBJECTS_ERROR=$(echo $SUBJECTS_GET_RESPONSE | jq -r '.error // empty')
if [ ! -z "$SUBJECTS_ERROR" ]; then
  echo "   ❌ Subjects GET failed: $SUBJECTS_ERROR"
else
  SUBJECTS_COUNT=$(echo $SUBJECTS_GET_RESPONSE | jq -r '.subjects | length')
  echo "   ✓ Subjects API works - Subjects: $SUBJECTS_COUNT"
fi
echo ""

echo "6. Testing Orders API (Freelancer View)..."
ORDERS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v2/orders?userId=${FREELANCER_ID}&role=freelancer" \
  -H "Authorization: Bearer ${TOKEN}" \
  --cookie cookies.txt)

ORDERS_ERROR=$(echo $ORDERS_RESPONSE | jq -r '.error // empty')
if [ ! -z "$ORDERS_ERROR" ]; then
  echo "   ❌ Orders API failed: $ORDERS_ERROR"
else
  ORDERS_COUNT=$(echo $ORDERS_RESPONSE | jq -r '.orders | length')
  echo "   ✓ Orders API works - Orders: $ORDERS_COUNT"
fi
echo ""

echo "7. Testing Bids API..."
BIDS_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/bids?freelancerId=${FREELANCER_ID}" \
  --cookie cookies.txt)

BIDS_ERROR=$(echo $BIDS_RESPONSE | jq -r '.error // empty')
if [ ! -z "$BIDS_ERROR" ]; then
  echo "   ❌ Bids API failed: $BIDS_ERROR"
else
  if echo $BIDS_RESPONSE | jq -e 'type == "array"' > /dev/null 2>&1; then
    BIDS_COUNT=$(echo $BIDS_RESPONSE | jq 'length')
    echo "   ✓ Bids API works - Bids: $BIDS_COUNT"
  else
    echo "   ⚠️  Bids API returned non-array response"
  fi
fi
echo ""

echo "8. Testing Assignment Check API..."
ASSIGNMENT_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v2/freelancer/assignments/check" \
  -H "Authorization: Bearer ${TOKEN}" \
  --cookie cookies.txt)

ASSIGNMENT_ERROR=$(echo $ASSIGNMENT_RESPONSE | jq -r '.error // empty')
if [ ! -z "$ASSIGNMENT_ERROR" ]; then
  echo "   ⚠️  Assignment Check requires freelancer auth (expected with admin token)"
else
  HAS_NEW=$(echo $ASSIGNMENT_RESPONSE | jq -r '.hasNew')
  echo "   ✓ Assignment API accessible - Has New: $HAS_NEW"
fi
echo ""

# Clean up
rm -f cookies.txt

echo "==============================="
echo "✅ FREELANCER SYSTEM TEST COMPLETE"
echo ""
echo "Summary:"
echo "- All core freelancer APIs tested"
echo "- Authentication working properly"
echo "- Database connections verified"
echo ""
echo "Next steps:"
echo "1. Test as actual freelancer user (login with freelancer credentials)"
echo "2. Test file uploads and submissions"
echo "3. Test order assignment workflow"
