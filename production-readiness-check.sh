#!/bin/bash

# Production Readiness Check Script for tasklynk.co.ke
# Verifies configuration and tests critical functionality

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       TaskLynk Production Readiness Check                 ║"
echo "║              tasklynk.co.ke                                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if .env exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    echo "Please create .env file first"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo "═══════════════════════════════════════════════════════════"
echo "1. Environment Variables Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Critical variables
CRITICAL_VARS=(
    "JWT_SECRET"
    "TURSO_CONNECTION_URL"
    "TURSO_AUTH_TOKEN"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
    "SMTP_HOST"
    "SMTP_USER"
    "SMTP_PASSWORD"
    "NEXT_PUBLIC_APP_URL"
)

all_vars_set=true
for var in "${CRITICAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "$var is NOT set"
        all_vars_set=false
    else
        print_success "$var is set"
    fi
done

echo ""

# Check production URL
if [ "$NEXT_PUBLIC_APP_URL" = "https://tasklynk.co.ke" ] || [ "$NEXT_PUBLIC_APP_URL" = "https://www.tasklynk.co.ke" ]; then
    print_success "NEXT_PUBLIC_APP_URL configured for production: $NEXT_PUBLIC_APP_URL"
else
    print_warning "NEXT_PUBLIC_APP_URL is: $NEXT_PUBLIC_APP_URL"
    print_warning "Expected: https://tasklynk.co.ke or https://www.tasklynk.co.ke"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "2. Database Connection Test"
echo "═══════════════════════════════════════════════════════════"
echo ""

if command -v node &> /dev/null; then
    print_info "Testing database connection..."
    if node test-order-placement.js 2>&1 | grep -q "✅ Connection to Turso: Active"; then
        print_success "Database connection successful"
    else
        print_error "Database connection failed"
        echo "Run: node test-order-placement.js for details"
    fi
else
    print_warning "Node.js not found - skipping database test"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "3. Next.js Configuration Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ -f "package.json" ]; then
    print_success "package.json found"
    
    # Check if dev script binds to 0.0.0.0
    if grep -q "0.0.0.0" package.json; then
        print_success "Dev server configured to bind to 0.0.0.0 (accessible externally)"
    else
        print_warning "Dev server may not be accessible externally"
    fi
    
    # Check port
    if grep -q "5000" package.json; then
        print_success "Port 5000 configured"
    else
        print_warning "Non-standard port configuration"
    fi
else
    print_error "package.json not found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "4. Hardcoded URL Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

print_info "Scanning for hardcoded localhost URLs..."

localhost_count=$(grep -r "localhost" src/ 2>/dev/null | grep -v "node_modules" | grep -v ".next" | wc -l)

if [ "$localhost_count" -gt 0 ]; then
    print_warning "Found $localhost_count references to 'localhost' in src/"
    print_info "These should use process.env.NEXT_PUBLIC_APP_URL instead"
    echo ""
    echo "Locations:"
    grep -rn "localhost" src/ 2>/dev/null | grep -v "node_modules" | grep -v ".next" | head -5
    if [ "$localhost_count" -gt 5 ]; then
        echo "... and $(($localhost_count - 5)) more"
    fi
else
    print_success "No hardcoded localhost URLs found"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "5. Order Placement Test"
echo "═══════════════════════════════════════════════════════════"
echo ""

print_info "Order placement can be tested at:"
echo "  • Browser Console: https://tasklynk.co.ke/client/new-job"
echo "  • Test Tool: https://tasklynk.co.ke/test-order-placement-browser.html"
echo ""
print_info "To test now, you can:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Access via: http://tasklynk.co.ke:5000 (if DNS configured)"
echo "  3. Or use port forwarding/tunnel to test externally"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "6. Production Build Test"
echo "═══════════════════════════════════════════════════════════"
echo ""

print_info "Testing production build..."
if npm run build 2>&1 | grep -q "Compiled successfully"; then
    print_success "Production build successful"
else
    print_warning "Production build needs attention"
    echo "Run: npm run build to see details"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "7. Security Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# JWT Secret length check
jwt_length=${#JWT_SECRET}
if [ "$jwt_length" -ge 32 ]; then
    print_success "JWT_SECRET length is adequate ($jwt_length characters)"
else
    print_error "JWT_SECRET too short ($jwt_length characters) - minimum 32 required"
fi

# Check NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
    print_success "NODE_ENV set to production"
else
    print_warning "NODE_ENV is: $NODE_ENV (should be 'production' for live)"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "8. Email Service Test"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ ! -z "$SMTP_HOST" ] && [ ! -z "$SMTP_USER" ] && [ ! -z "$SMTP_PASSWORD" ]; then
    print_success "SMTP credentials configured"
    print_info "Host: $SMTP_HOST"
    print_info "User: $SMTP_USER"
else
    print_error "SMTP credentials incomplete"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "9. File Upload Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ ! -z "$CLOUDINARY_CLOUD_NAME" ]; then
    print_success "Cloudinary configured: $CLOUDINARY_CLOUD_NAME"
else
    print_error "Cloudinary not configured"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "═══════════════════════════════════════════════════════════"
echo ""

if [ "$all_vars_set" = true ]; then
    print_success "All critical environment variables are set"
else
    print_error "Some critical environment variables are missing"
fi

echo ""
print_info "Next Steps:"
echo ""
echo "  To run in production mode:"
echo "    1. npm run build"
echo "    2. npm start"
echo ""
echo "  To run in development mode on tasklynk.co.ke:"
echo "    1. npm run dev"
echo "    2. Access via domain (ensure DNS points to server)"
echo ""
echo "  To test order placement:"
echo "    1. ./test-order-placement.sh"
echo "    2. Or open browser console at /client/new-job"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "Check complete!"
echo "═══════════════════════════════════════════════════════════"
