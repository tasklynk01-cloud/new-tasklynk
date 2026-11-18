#!/bin/bash

# ========================================
# TaskLynk Render Storage Verification
# ========================================
# Verifies Cloudinary storage configuration in Render deployment

echo "🔍 TaskLynk Storage Verification for Render Deployment"
echo "========================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Your Render deployment URL
RENDER_URL="${1:-https://tasklynk.co.ke}"

echo "📍 Testing endpoint: $RENDER_URL"
echo ""

# Function to check HTTP status
check_endpoint() {
    local endpoint=$1
    local name=$2
    
    echo -n "Testing $name... "
    response=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL$endpoint")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ OK (Status: $response)${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED (Status: $response)${NC}"
        return 1
    fi
}

# Function to check health endpoint
check_health() {
    echo "🏥 Health Check:"
    echo "---------------"
    
    health_response=$(curl -s "$RENDER_URL/api/health")
    
    if [ $? -eq 0 ]; then
        echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"
        
        # Check if storage is configured
        storage_status=$(echo "$health_response" | jq -r '.services.storage.status' 2>/dev/null)
        
        if [ "$storage_status" = "configured" ]; then
            echo -e "${GREEN}✅ Storage (Cloudinary) is configured${NC}"
        else
            echo -e "${RED}❌ Storage (Cloudinary) is NOT configured${NC}"
            echo ""
            echo "⚠️  ACTION REQUIRED:"
            echo "   Add Cloudinary environment variables in Render Dashboard:"
            echo "   1. Go to: https://dashboard.render.com"
            echo "   2. Select your service"
            echo "   3. Navigate to: Environment → Environment Variables"
            echo "   4. Add the following variables:"
            echo ""
            echo "   CLOUDINARY_CLOUD_NAME=<your-cloud-name>"
            echo "   CLOUDINARY_API_KEY=<your-api-key>"
            echo "   CLOUDINARY_API_SECRET=<your-api-secret>"
            echo ""
        fi
    else
        echo -e "${RED}❌ Unable to connect to health endpoint${NC}"
    fi
    echo ""
}

# Function to test file upload
test_upload() {
    echo "📤 Testing File Upload Capability:"
    echo "----------------------------------"
    
    # Check if upload endpoint is accessible (requires auth, so 401 is expected)
    upload_response=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL/api/cloudinary/upload")
    
    if [ "$upload_response" = "401" ] || [ "$upload_response" = "405" ]; then
        echo -e "${GREEN}✅ Upload endpoint is accessible (Status: $upload_response)${NC}"
    else
        echo -e "${YELLOW}⚠️  Upload endpoint status: $upload_response${NC}"
    fi
    echo ""
}

# Run all checks
echo "🚀 Starting verification..."
echo ""

# 1. Check main page
check_endpoint "/" "Main Page"
echo ""

# 2. Check health endpoint
check_health

# 3. Check API endpoints
echo "🔌 API Endpoints:"
echo "----------------"
check_endpoint "/api/health" "Health Check API"
echo ""

# 4. Test upload capability
test_upload

# 5. Check authentication endpoints
echo "🔐 Authentication Endpoints:"
echo "---------------------------"
check_endpoint "/api/v2/auth/login" "Login API"
check_endpoint "/api/v2/auth/logout" "Logout API"
echo ""

# Summary
echo "📊 Verification Summary:"
echo "======================="
echo ""
echo "✅ Deployment is live at: $RENDER_URL"
echo ""
echo "Next Steps:"
echo "1. Verify environment variables in Render Dashboard"
echo "2. Test file upload through the application UI"
echo "3. Monitor logs for any storage errors"
echo ""
echo "📖 Full documentation: RENDER_DEPLOYMENT_COMPLETE.md"
