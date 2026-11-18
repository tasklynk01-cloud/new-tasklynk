#!/bin/bash

# Freelancer Frontend Debug Script
# Tests all frontend pages and API connections

echo "🔍 FREELANCER FRONTEND DEBUG"
echo "============================="
echo ""

BASE_URL="http://localhost:5000"

echo "1. Checking if dev server is running..."
if curl -s "${BASE_URL}" > /dev/null 2>&1; then
  echo "   ✓ Dev server is running"
else
  echo "   ❌ Dev server is NOT running"
  echo "   Run: npm run dev"
  exit 1
fi
echo ""

echo "2. Testing Freelancer Frontend Pages..."
echo ""

# Test pages array
declare -a pages=(
  "/freelancer/dashboard:Dashboard"
  "/freelancer/orders:Available Orders"
  "/freelancer/bids:My Bids"
  "/freelancer/in-progress:In Progress"
  "/freelancer/delivered:Delivered"
  "/freelancer/editing:Editing"
  "/freelancer/revision:Revision"
  "/freelancer/completed:Completed"
  "/freelancer/earnings:Earnings"
  "/freelancer/messages:Messages"
  "/freelancer/settings:Settings"
  "/freelancer/financial-overview:Financial Overview"
)

for page in "${pages[@]}"; do
  IFS=':' read -ra PARTS <<< "$page"
  path="${PARTS[0]}"
  name="${PARTS[1]}"
  
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${path}")
  
  if [ "$status_code" -eq "200" ]; then
    echo "   ✓ ${name} (${path})"
  elif [ "$status_code" -eq "401" ]; then
    echo "   ⚠️  ${name} (${path}) - Requires auth"
  else
    echo "   ❌ ${name} (${path}) - Status: ${status_code}"
  fi
done

echo ""
echo "3. Testing API Endpoints..."
echo ""

# Test API endpoints (these should return 401 without auth - that's expected)
declare -a apis=(
  "/api/freelancer/balance?userId=28:Balance API"
  "/api/freelancer/earnings?userId=28:Earnings API"
  "/api/v2/orders?userId=28&role=freelancer:Orders API"
  "/api/bids?freelancerId=28:Bids API"
  "/api/v2/freelancers/cpp?freelancerId=28:CPP Progress API"
  "/api/v2/balances/28:Balance Widget API"
)

for api in "${apis[@]}"; do
  IFS=':' read -ra PARTS <<< "$api"
  path="${PARTS[0]}"
  name="${PARTS[1]}"
  
  status_code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${path}")
  
  if [ "$status_code" -eq "200" ]; then
    echo "   ✓ ${name}"
  elif [ "$status_code" -eq "401" ] || [ "$status_code" -eq "403" ]; then
    echo "   ✓ ${name} (Auth required - expected)"
  else
    echo "   ❌ ${name} - Status: ${status_code}"
  fi
done

echo ""
echo "4. Component Structure..."
echo ""

# Check if key components exist
components=(
  "src/components/freelancer-sidebar.tsx"
  "src/components/BalanceWidget.tsx"
  "src/components/CPPProgressWidget.tsx"
  "src/components/freelancer/BlockingOrderConfirmationModal.tsx"
  "src/components/AssignmentPopup.tsx"
)

for component in "${components[@]}"; do
  if [ -f "$component" ]; then
    echo "   ✓ $(basename $component)"
  else
    echo "   ❌ $(basename $component) - NOT FOUND"
  fi
done

echo ""
echo "============================="
echo "✅ FRONTEND DEBUG COMPLETE"
echo ""
echo "Issues Found:"
echo "- Check browser console for React errors"
echo "- Test with authenticated freelancer session"
echo "- Verify widgets load data correctly"
echo ""
echo "To test with authentication:"
echo "1. Open browser: ${BASE_URL}/freelancer/dashboard"
echo "2. Login with approved freelancer"
echo "3. Check browser DevTools Console for errors"
