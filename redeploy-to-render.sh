#!/bin/bash

# ============================================
# TaskLynk Render Redeployment Script
# ============================================
# Run this after fixing the port binding issue

echo "🚀 TaskLynk Render Redeployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if git is available
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not a git repository${NC}"
    exit 1
fi

echo "📝 Git Status:"
echo "--------------"
git status --short
echo ""

# Check if there are changes to commit
if [[ -z $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    echo ""
    echo "If you've already committed the fix, just push:"
    echo "  git push origin fresh-main"
    exit 0
fi

echo -e "${GREEN}✅ Changes detected${NC}"
echo ""

# Show what changed
echo "📄 Modified files:"
git diff --name-only
echo ""

# Ask for confirmation
read -p "Commit and push these changes? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted. No changes committed."
    exit 0
fi

# Add changes
echo "📦 Staging changes..."
git add package.json RENDER_PORT_FIX.md RENDER_DEPLOYMENT_COMPLETE.md

# Commit
echo "💾 Committing..."
git commit -m "Fix: Use PORT environment variable for Render deployment

- Updated package.json start script to use \${PORT:-5000}
- Fixes port binding timeout on Render
- App now binds to Render's PORT (10000) in production
- Falls back to 5000 for local development"

# Check current branch
BRANCH=$(git branch --show-current)
echo ""
echo "📍 Current branch: $BRANCH"
echo ""

# Push
echo "🚀 Pushing to remote..."
if git push origin "$BRANCH"; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to $BRANCH${NC}"
    echo ""
    echo "📊 Deployment Status:"
    echo "-------------------"
    echo "1. Render will detect the push automatically"
    echo "2. Build will start in ~30 seconds"
    echo "3. Deployment takes 5-8 minutes"
    echo ""
    echo "🔍 Monitor deployment:"
    echo "   https://dashboard.render.com"
    echo ""
    echo "✅ Expected result:"
    echo "   Port 10000 binding successful"
    echo "   Service live and accessible"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Push failed${NC}"
    echo ""
    echo "Possible causes:"
    echo "1. No internet connection"
    echo "2. Invalid git remote"
    echo "3. Authentication required"
    echo ""
    echo "Manual push:"
    echo "  git push origin $BRANCH"
    exit 1
fi
