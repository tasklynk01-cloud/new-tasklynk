#!/bin/bash

# Order Placement Testing Script
# Quick commands to help debug order placement issues

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         TaskLynk Order Placement Testing Script           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
    echo "Please create .env from .env.example"
    exit 1
fi

# Menu
echo "Select a test to run:"
echo ""
echo "  1) Start dev server"
echo "  2) Test database connection"
echo "  3) Open browser test tool"
echo "  4) Check environment variables"
echo "  5) View recent orders in database"
echo "  6) Clear dev cache and restart"
echo "  7) Open order placement page"
echo "  8) Check TypeScript errors"
echo "  9) View console logs guide"
echo "  0) Exit"
echo ""
read -p "Enter choice [0-9]: " choice

case $choice in
    1)
        print_info "Starting dev server..."
        npm run dev
        ;;
    2)
        print_info "Testing database connection..."
        node test-order-placement.js
        ;;
    3)
        print_info "Opening browser test tool..."
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:5000/test-order-placement-browser.html"
        elif command -v open &> /dev/null; then
            open "http://localhost:5000/test-order-placement-browser.html"
        else
            print_warning "Could not auto-open browser"
            echo "Please manually open: http://localhost:5000/test-order-placement-browser.html"
        fi
        ;;
    4)
        print_info "Checking environment variables..."
        echo ""
        echo "Critical variables:"
        if [ -n "$JWT_SECRET" ]; then
            print_success "JWT_SECRET is set"
        else
            print_error "JWT_SECRET is NOT set"
        fi
        
        if [ -n "$TURSO_CONNECTION_URL" ]; then
            print_success "TURSO_CONNECTION_URL is set"
        else
            print_error "TURSO_CONNECTION_URL is NOT set"
        fi
        
        if [ -n "$TURSO_AUTH_TOKEN" ]; then
            print_success "TURSO_AUTH_TOKEN is set"
        else
            print_error "TURSO_AUTH_TOKEN is NOT set"
        fi
        
        if [ -n "$CLOUDINARY_CLOUD_NAME" ]; then
            print_success "CLOUDINARY_CLOUD_NAME is set"
        else
            print_error "CLOUDINARY_CLOUD_NAME is NOT set"
        fi
        
        if [ -n "$CLOUDINARY_API_KEY" ]; then
            print_success "CLOUDINARY_API_KEY is set"
        else
            print_error "CLOUDINARY_API_KEY is NOT set"
        fi
        
        if [ -n "$CLOUDINARY_API_SECRET" ]; then
            print_success "CLOUDINARY_API_SECRET is set"
        else
            print_error "CLOUDINARY_API_SECRET is NOT set"
        fi
        ;;
    5)
        print_info "Fetching recent orders from database..."
        node test-order-placement.js
        ;;
    6)
        print_info "Clearing dev cache and restarting..."
        npm run dev:clean
        ;;
    7)
        print_info "Opening order placement page..."
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:5000/client/new-job"
        elif command -v open &> /dev/null; then
            open "http://localhost:5000/client/new-job"
        else
            print_warning "Could not auto-open browser"
            echo "Please manually open: http://localhost:5000/client/new-job"
        fi
        ;;
    8)
        print_info "Checking TypeScript errors..."
        echo ""
        npx tsc --noEmit --pretty
        ;;
    9)
        print_info "Console Logs Guide:"
        echo ""
        echo "When testing order placement, look for these logs in browser console:"
        echo ""
        echo "SUCCESS PATTERN:"
        echo "  [Order Placement] 🚀 Starting order submission..."
        echo "  [Order Placement] 📊 Form Data: {...}"
        echo "  [Order Placement] 🔐 Authentication: { hasToken: true }"
        echo "  [Order Placement] 📦 Sending order payload: {...}"
        echo "  [Order Placement] 📡 API Response: { status: 200, ok: true }"
        echo "  [Order Placement] ✅ Job created successfully"
        echo "  [Order Placement] 🎉 SUCCESS!"
        echo ""
        echo "ERROR PATTERN:"
        echo "  [Order Placement] ❌ Invalid quantity: 0"
        echo "  [Order Placement] ❌ API Error: { error: 'message' }"
        echo "  [Order Placement] ❌ CRITICAL ERROR: ..."
        echo ""
        echo "To filter logs in browser console:"
        echo "  Type: [Order Placement]"
        echo ""
        ;;
    0)
        print_info "Exiting..."
        exit 0
        ;;
    *)
        print_error "Invalid choice!"
        exit 1
        ;;
esac

echo ""
print_success "Done!"
