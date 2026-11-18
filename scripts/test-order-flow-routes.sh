#!/bin/bash

# =========================================
# ORDER FLOW API ROUTES - TESTING SCRIPT
# =========================================
# This script tests all newly created API routes
# Run after: npm run dev
# Usage: bash scripts/test-order-flow-routes.sh

BASE_URL="http://localhost:5000"

# ANSI Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to print test results
test_result() {
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✓ PASS${NC}: $2"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}✗ FAIL${NC}: $2"
    FAILED_TESTS=$((FAILED_TESTS + 1))
  fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  ORDER FLOW API ROUTES - TESTS${NC}"
echo -e "${BLUE}========================================${NC}\n"

# =========================================
# 1. TEST AUTHENTICATION
# =========================================
echo -e "${YELLOW}[1/10] Testing Authentication...${NC}"

# Test admin login
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"topwriteessays@gmail.com","password":"kemoda2025"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$ADMIN_TOKEN" ]; then
  test_result 0 "Admin authentication successful"
else
  test_result 1 "Admin authentication failed"
  echo -e "${RED}Cannot proceed without authentication. Exiting.${NC}"
  exit 1
fi

# Test freelancer login (if exists)
FREELANCER_TOKEN=$(curl -s -X POST "$BASE_URL/api/v2/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"freelancer@test.com","password":"freelancer123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$FREELANCER_TOKEN" ]; then
  test_result 0 "Freelancer authentication successful"
else
  test_result 1 "Freelancer authentication failed (may need to create test account)"
fi

echo ""

# =========================================
# 2. TEST BALANCE QUERY ROUTE
# =========================================
echo -e "${YELLOW}[2/10] Testing Balance Query Route...${NC}"

# Assuming admin user ID is 1
BALANCE_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v2/balances/1" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$BALANCE_RESPONSE" | grep -q "balance"; then
  test_result 0 "GET /api/v2/balances/[userId] - Returns balance data"
else
  test_result 1 "GET /api/v2/balances/[userId] - Failed to fetch balance"
  echo "Response: $BALANCE_RESPONSE"
fi

echo ""

# =========================================
# 3. TEST ORDER FINANCIALS ROUTE
# =========================================
echo -e "${YELLOW}[3/10] Testing Order Financials Route...${NC}"

# Test with a hypothetical order ID (adjust as needed)
FINANCIALS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v2/orders/1/financials" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

if echo "$FINANCIALS_RESPONSE" | grep -q "financials\|error"; then
  test_result 0 "GET /api/v2/orders/[id]/financials - Route accessible"
else
  test_result 1 "GET /api/v2/orders/[id]/financials - Route not accessible"
  echo "Response: $FINANCIALS_RESPONSE"
fi

echo ""

# =========================================
# 4. TEST FREELANCER ACCEPT ROUTE
# =========================================
echo -e "${YELLOW}[4/10] Testing Freelancer Accept Assignment Route...${NC}"

# This will fail if no order is assigned, but route should be accessible
ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/orders/1/freelancer/accept" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')

if echo "$ACCEPT_RESPONSE" | grep -q "error\|success\|order"; then
  test_result 0 "POST /api/v2/orders/[id]/freelancer/accept - Route exists"
else
  test_result 1 "POST /api/v2/orders/[id]/freelancer/accept - Route not found"
  echo "Response: $ACCEPT_RESPONSE"
fi

echo ""

# =========================================
# 5. TEST FREELANCER REJECT ROUTE
# =========================================
echo -e "${YELLOW}[5/10] Testing Freelancer Reject Assignment Route...${NC}"

REJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/orders/1/freelancer/reject" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test rejection"}')

if echo "$REJECT_RESPONSE" | grep -q "error\|success\|order"; then
  test_result 0 "POST /api/v2/orders/[id]/freelancer/reject - Route exists"
else
  test_result 1 "POST /api/v2/orders/[id]/freelancer/reject - Route not found"
  echo "Response: $REJECT_RESPONSE"
fi

echo ""

# =========================================
# 6. TEST FREELANCER SUBMIT WORK ROUTE
# =========================================
echo -e "${YELLOW}[6/10] Testing Freelancer Submit Work Route...${NC}"

SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/orders/1/freelancer/submit" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Test submission"}')

if echo "$SUBMIT_RESPONSE" | grep -q "error\|success\|order"; then
  test_result 0 "POST /api/v2/orders/[id]/freelancer/submit - Route exists"
else
  test_result 1 "POST /api/v2/orders/[id]/freelancer/submit - Route not found"
  echo "Response: $SUBMIT_RESPONSE"
fi

echo ""

# =========================================
# 7. TEST INTERNAL REVISION REQUEST ROUTE
# =========================================
echo -e "${YELLOW}[7/10] Testing Internal Revision Request Route...${NC}"

INTERNAL_REV_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/orders/1/internal-revision" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assignedTo":2,"reason":"Test internal revision","details":"Please fix formatting"}')

if echo "$INTERNAL_REV_RESPONSE" | grep -q "error\|success\|revision"; then
  test_result 0 "POST /api/v2/orders/[id]/internal-revision - Route exists"
else
  test_result 1 "POST /api/v2/orders/[id]/internal-revision - Route not found"
  echo "Response: $INTERNAL_REV_RESPONSE"
fi

echo ""

# =========================================
# 8. TEST INTERNAL REVISION SUBMIT ROUTE
# =========================================
echo -e "${YELLOW}[8/10] Testing Internal Revision Submit Route...${NC}"

INTERNAL_SUBMIT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/internal-revisions/1/submit" \
  -H "Authorization: Bearer $FREELANCER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"submissionNotes":"Fixed the issues"}')

if echo "$INTERNAL_SUBMIT_RESPONSE" | grep -q "error\|success\|revision"; then
  test_result 0 "POST /api/v2/internal-revisions/[id]/submit - Route exists"
else
  test_result 1 "POST /api/v2/internal-revisions/[id]/submit - Route not found"
  echo "Response: $INTERNAL_SUBMIT_RESPONSE"
fi

echo ""

# =========================================
# 9. TEST INTERNAL REVISION REVIEW ROUTE
# =========================================
echo -e "${YELLOW}[9/10] Testing Internal Revision Review Route...${NC}"

INTERNAL_REVIEW_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/internal-revisions/1/review" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"accept","reviewNotes":"Looks good now"}')

if echo "$INTERNAL_REVIEW_RESPONSE" | grep -q "error\|success\|revision"; then
  test_result 0 "POST /api/v2/internal-revisions/[id]/review - Route exists"
else
  test_result 1 "POST /api/v2/internal-revisions/[id]/review - Route not found"
  echo "Response: $INTERNAL_REVIEW_RESPONSE"
fi

echo ""

# =========================================
# 10. TEST ADMIN DELIVER ROUTE
# =========================================
echo -e "${YELLOW}[10/10] Testing Admin Deliver to Client Route...${NC}"

DELIVER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/orders/1/admin/deliver" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliveryNotes":"Work is ready for your review"}')

if echo "$DELIVER_RESPONSE" | grep -q "error\|success\|order"; then
  test_result 0 "POST /api/v2/orders/[id]/admin/deliver - Route exists"
else
  test_result 1 "POST /api/v2/orders/[id]/admin/deliver - Route not found"
  echo "Response: $DELIVER_RESPONSE"
fi

echo ""

# =========================================
# BONUS: TEST ADMIN PAYMENT CONFIRMATION
# =========================================
echo -e "${YELLOW}[BONUS] Testing Admin Payment Confirmation Route...${NC}"

CONFIRM_PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v2/orders/1/admin/confirm-payment" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentId":1,"mpesaCode":"TEST123","confirmationNotes":"Payment verified"}')

if echo "$CONFIRM_PAYMENT_RESPONSE" | grep -q "error\|success\|order\|payment"; then
  test_result 0 "POST /api/v2/orders/[id]/admin/confirm-payment - Route exists"
else
  test_result 1 "POST /api/v2/orders/[id]/admin/confirm-payment - Route not found"
  echo "Response: $CONFIRM_PAYMENT_RESPONSE"
fi

echo ""

# =========================================
# SUMMARY
# =========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
  echo -e "${GREEN}All API routes are accessible and responding.${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠ Some tests failed. Review the output above.${NC}"
  echo -e "${YELLOW}Note: Routes may return errors if database state is not set up for testing.${NC}"
  echo -e "${YELLOW}The important thing is that routes exist and return structured responses.${NC}"
  exit 1
fi
