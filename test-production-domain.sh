#!/bin/bash

# Quick Production Test for tasklynk.co.ke
# Tests order placement on live domain

DOMAIN="tasklynk.co.ke"
PROTOCOL="https"
BASE_URL="${PROTOCOL}://${DOMAIN}"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       TaskLynk Production Test - tasklynk.co.ke            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "Testing: $BASE_URL"
echo ""

# Test 1: DNS Resolution
echo "1. DNS Resolution Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if host $DOMAIN > /dev/null 2>&1; then
    IP=$(host $DOMAIN | grep "has address" | head -1 | awk '{print $NF}')
    print_success "Domain resolves to: $IP"
else
    print_error "Domain does not resolve"
    print_warning "Check DNS configuration"
fi

echo ""

# Test 2: Server Connectivity
echo "2. Server Connectivity Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200\|301\|302"; then
    print_success "Server is responding"
else
    print_error "Server is not responding"
    print_info "Try: http://${DOMAIN}:5000 if on development server"
fi

echo ""

# Test 3: HTTPS/SSL
echo "3. SSL/HTTPS Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s -I $BASE_URL | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
    print_success "HTTPS is working"
elif curl -s -I http://${DOMAIN}:5000 | grep -q "HTTP"; then
    print_warning "Server accessible on port 5000 (development mode)"
    print_info "Access at: http://${DOMAIN}:5000"
    BASE_URL="http://${DOMAIN}:5000"
else
    print_error "HTTPS not configured"
    print_info "Server may be on port 5000: http://${DOMAIN}:5000"
fi

echo ""

# Test 4: API Endpoints
echo "4. API Endpoints Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test health endpoint
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/api/health 2>/dev/null)
if [ "$HEALTH_CODE" = "200" ]; then
    print_success "API health endpoint responding"
else
    print_warning "API health endpoint returned: $HEALTH_CODE"
fi

echo ""

# Test 5: Page Accessibility
echo "5. Key Pages Accessibility"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

PAGES=(
    "/"
    "/login"
    "/client/new-job"
    "/test-order-placement-browser.html"
)

for page in "${PAGES[@]}"; do
    CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL$page 2>/dev/null)
    if [ "$CODE" = "200" ] || [ "$CODE" = "307" ] || [ "$CODE" = "308" ]; then
        print_success "$page - OK ($CODE)"
    else
        print_error "$page - Failed ($CODE)"
    fi
done

echo ""

# Test 6: Order Form Test
echo "6. Order Placement Test Instructions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "To test order placement:"
echo ""
echo "  Method 1 - Browser Console:"
echo "    1. Open: $BASE_URL/client/new-job"
echo "    2. Press F12 → Console tab"
echo "    3. Fill form and submit"
echo "    4. Watch for: [Order Placement] 🎉 SUCCESS!"
echo ""
echo "  Method 2 - Automated Test:"
echo "    1. Open: $BASE_URL/test-order-placement-browser.html"
echo "    2. Load token from localStorage"
echo "    3. Click 'Run All Tests'"
echo ""
echo "  Method 3 - Manual Test:"
echo "    1. Log in as: client@test.com / client123"
echo "    2. Go to: $BASE_URL/client/new-job"
echo "    3. Fill minimal form and submit"
echo "    4. Verify order appears in dashboard"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if curl -s -o /dev/null -w "%{http_code}" $BASE_URL | grep -q "200\|301\|302"; then
    print_success "Server is accessible and ready for testing"
    echo ""
    print_info "Next steps:"
    echo "  1. Open browser to: $BASE_URL"
    echo "  2. Test order placement using one of the methods above"
    echo "  3. Check console logs for debugging"
else
    print_error "Server is not accessible"
    echo ""
    print_info "Troubleshooting:"
    echo "  1. Ensure DNS points to server IP"
    echo "  2. Check server is running: npm run dev"
    echo "  3. Verify firewall allows traffic"
    echo "  4. Try direct access: http://${DOMAIN}:5000"
fi

echo ""
echo "For detailed debugging, run: ./production-readiness-check.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
