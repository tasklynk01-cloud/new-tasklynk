#!/bin/bash
# Admin Button Functionality Test Script
# Tests all critical admin buttons and API endpoints

echo "🧪 TaskLynk Admin Button Functionality Test"
echo "=========================================="
echo ""

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:5000}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "⚠️  Warning: ADMIN_TOKEN not set. Some tests will fail."
  echo "   Set token: export ADMIN_TOKEN='your_bearer_token'"
  echo ""
fi

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test function
test_endpoint() {
  local test_name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -n "Testing: $test_name ... "
  
  if [ -z "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      "${API_BASE_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "${API_BASE_URL}${endpoint}")
  fi
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
    echo "   Response: $body"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

echo "📋 Testing User Management Endpoints"
echo "------------------------------------"

# Test 1: Get all users
test_endpoint "GET All Users" "GET" "/api/users" "" "200"

# Test 2: Get user by role
test_endpoint "GET Users by Role (client)" "GET" "/api/users?role=client" "" "200"

# Test 3: Check client activation status
test_endpoint "GET Client Activation Status" "GET" "/api/admin/fix-client-activation" "" "200"

echo ""
echo "🔧 Testing User Action Endpoints"
echo "--------------------------------"

# Note: These tests use placeholder IDs - replace with actual user IDs in production
TEST_USER_ID=999999  # Use a test user ID that doesn't exist (should return 404)

# Test 4: Approve user (should fail with 404 for non-existent user)
test_endpoint "POST Approve User (404 test)" "POST" "/api/users/$TEST_USER_ID/approve" "" "404"

# Test 5: Reject user (should fail with 404 for non-existent user)
test_endpoint "POST Reject User (404 test)" "POST" "/api/users/$TEST_USER_ID/reject" '{"reason":"Test rejection"}' "404"

# Test 6: Suspend user (should fail with 404 for non-existent user)
test_endpoint "PATCH Suspend User (404 test)" "PATCH" "/api/users/$TEST_USER_ID/suspend" '{"duration":7,"reason":"Test suspension"}' "404"

# Test 7: Update tier (should fail with 404 for non-existent user)
test_endpoint "POST Update Tier (404 test)" "POST" "/api/users/$TEST_USER_ID/tier" '{"tier":"premium"}' "404"

# Test 8: Update badge (should fail with 404 for non-existent user)
test_endpoint "POST Update Badge (404 test)" "POST" "/api/users/$TEST_USER_ID/badge" '{"badge":"gold"}' "404"

echo ""
echo "📊 Testing Manager Endpoints"
echo "----------------------------"

# Test 9: Get managers
test_endpoint "GET Managers" "GET" "/api/users?role=manager" "" "200"

# Test 10: Invite manager (validate required fields)
test_endpoint "POST Invite Manager (no email)" "POST" "/api/admin/invite-manager" '{}' "400"

echo ""
echo "📈 Summary"
echo "=========="
echo "Total Tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some tests failed. Please review the output above.${NC}"
  exit 1
fi
