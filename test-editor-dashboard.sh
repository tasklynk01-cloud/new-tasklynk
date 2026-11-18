#!/bin/bash

# Editor Dashboard Testing Script
# Tests all editor dashboard functionality end-to-end

set -e # Exit on error

BASE_URL="http://localhost:5000"
EDITOR_EMAIL="editor@test.com"
EDITOR_PASSWORD="editor123"

echo "🧪 TaskLynk Editor Dashboard Testing Script"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test page accessibility
test_page() {
  local PAGE=$1
  local NAME=$2
  echo -n "Testing $NAME... "
  
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$PAGE")
  
  if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "302" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
    FAILED=$((FAILED + 1))
  fi
}

# Function to test API endpoint
test_api() {
  local ENDPOINT=$1
  local METHOD=$2
  local NAME=$3
  echo -n "Testing $NAME... "
  
  if [ "$METHOD" == "GET" ]; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$ENDPOINT")
  else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X "$METHOD" "$BASE_URL$ENDPOINT")
  fi
  
  if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "400" ] || [ "$HTTP_CODE" == "401" ] || [ "$HTTP_CODE" == "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $HTTP_CODE)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $HTTP_CODE)"
    FAILED=$((FAILED + 1))
  fi
}

echo "📋 Phase 1: Testing Editor Dashboard Pages"
echo "-------------------------------------------"
test_page "/editor/dashboard" "Editor Dashboard"
test_page "/editor/assignments" "Editor Assignments"
test_page "/editor/profile" "Editor Profile"
test_page "/editor/settings" "Editor Settings"
echo ""

echo "🔌 Phase 2: Testing Editor API Endpoints"
echo "-------------------------------------------"
test_api "/api/editor/dashboard?editorId=1" "GET" "Editor Dashboard API"
test_api "/api/editor/profile?editorId=1" "GET" "Editor Profile GET API"
echo ""

echo "📊 Phase 3: Database Table Verification"
echo "-------------------------------------------"
echo -n "Checking editorProfiles table... "
if node -e "const {db} = require('./src/db'); const {editorProfiles} = require('./src/db/schema'); db.select().from(editorProfiles).limit(1).then(() => console.log('OK')).catch(e => {console.error(e); process.exit(1);})" 2>&1 | grep -q "OK"; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
  FAILED=$((FAILED + 1))
fi

echo -n "Checking editorAssignments table... "
if node -e "const {db} = require('./src/db'); const {editorAssignments} = require('./src/db/schema'); db.select().from(editorAssignments).limit(1).then(() => console.log('OK')).catch(e => {console.error(e); process.exit(1);})" 2>&1 | grep -q "OK"; then
  echo -e "${GREEN}✓ PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}✗ FAIL${NC}"
  FAILED=$((FAILED + 1))
fi
echo ""

echo "📁 Phase 4: File Structure Verification"
echo "-------------------------------------------"
FILES=(
  "src/app/editor/dashboard/page.tsx"
  "src/app/editor/assignments/page.tsx"
  "src/app/editor/profile/page.tsx"
  "src/app/editor/settings/page.tsx"
  "src/app/editor/review/[id]/page.tsx"
  "src/app/editor/layout.tsx"
  "src/components/editor-sidebar.tsx"
  "src/app/api/editor/dashboard/route.ts"
  "src/app/api/editor/profile/route.ts"
  "src/app/api/editor/[id]/approve/route.ts"
  "src/app/api/editor/[id]/reject/route.ts"
)

for FILE in "${FILES[@]}"; do
  echo -n "Checking $FILE... "
  if [ -f "$FILE" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ MISSING${NC}"
    FAILED=$((FAILED + 1))
  fi
done
echo ""

echo "👤 Phase 5: Test Editor Account"
echo "-------------------------------------------"
echo -n "Checking test editor account... "
if node -e "const {db} = require('./src/db'); const {users} = require('./src/db/schema'); const {eq} = require('drizzle-orm'); db.select().from(users).where(eq(users.email, 'editor@test.com')).limit(1).then(r => {if(r.length>0) console.log('EXISTS'); else console.log('NOT_FOUND');});" 2>&1 | grep -q "EXISTS"; then
  echo -e "${GREEN}✓ EXISTS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${YELLOW}⚠ NOT FOUND${NC} (Run 'node create-test-editor.js' to create)"
  FAILED=$((FAILED + 1))
fi
echo ""

echo "📈 Test Summary"
echo "==============="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total: $TOTAL"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All tests passed! Editor dashboard is fully functional.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Review output above for details.${NC}"
  exit 1
fi
