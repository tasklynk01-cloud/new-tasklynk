#!/bin/bash

# Test Order Placement - LibSQL ID Fix Verification
echo "🚀 Testing Order Placement"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Wait for server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 3

# Test 1: Login
echo "🔐 Step 1: Login as test client..."
LOGIN_RESPONSE=$(curl -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"client123"}' \
  -s)

echo "$LOGIN_RESPONSE" | grep -q '"token"'
if [ $? -eq 0 ]; then
  echo "✅ Login successful"
  TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  USER_NAME=$(echo "$LOGIN_RESPONSE" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   User: $USER_NAME (ID: $USER_ID)"
else
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo ""

# Test 2: Place Order
echo "📝 Step 2: Placing test order..."

# Calculate deadline (48 hours from now)
DEADLINE=$(date -u -d "+48 hours" +"%Y-%m-%dT%H:%M:%S.000Z" 2>/dev/null || date -u -v+48H +"%Y-%m-%dT%H:%M:%S.000Z")

ORDER_DATA=$(cat <<EOF
{
  "clientId": $USER_ID,
  "title": "Test Order - LibSQL ID Fix Verification $(date +%s)",
  "instructions": "This test order verifies that the LibSQL id field null insertion bug has been fixed. The order should be created successfully without any database errors.",
  "workType": "Essay",
  "pages": 5,
  "amount": 1200,
  "deadline": "$DEADLINE",
  "requestDraft": false,
  "requestPrintableSources": false,
  "singleSpaced": false,
  "baseCpp": 240,
  "effectiveCpp": 240
}
EOF
)

echo "   Sending order request..."
ORDER_RESPONSE=$(curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$ORDER_DATA" \
  -s)

echo "$ORDER_RESPONSE" | grep -q '"job"'
if [ $? -eq 0 ]; then
  echo "✅ Order placed successfully!"
  ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
  DISPLAY_ID=$(echo "$ORDER_RESPONSE" | grep -o '"displayId":"[^"]*"' | head -1 | cut -d'"' -f4)
  ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | grep -o '"orderNumber":"[^"]*"' | head -1 | cut -d'"' -f4)
  ORDER_STATUS=$(echo "$ORDER_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  echo "   Order ID: $ORDER_ID"
  echo "   Display ID: $DISPLAY_ID"
  echo "   Order Number: $ORDER_NUMBER"
  echo "   Status: $ORDER_STATUS"
else
  echo "❌ Order placement failed!"
  echo "Response:"
  echo "$ORDER_RESPONSE" | head -c 500
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ ALL TESTS PASSED!"
echo "✅ Order placement is working correctly"
echo "✅ LibSQL ID field null insertion bug is FIXED"
echo "═══════════════════════════════════════════════════════════"
