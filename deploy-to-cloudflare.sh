#!/bin/bash

# ============================================
# Cloudflare Pages Quick Deploy Script
# ============================================

echo "🌐 TaskLynk Cloudflare Pages Deployment"
echo "========================================"
echo ""
echo "⚠️  WARNING: Cloudflare Pages has MAJOR limitations for this app!"
echo ""
echo "Features that WON'T work:"
echo "  ❌ File uploads (Cloudinary)"
echo "  ❌ Database writes (complex queries)"
echo "  ❌ Email sending (SMTP)"
echo "  ❌ Order creation"
echo "  ❌ Payment processing"
echo "  ❌ Admin dashboard"
echo ""
read -p "Are you sure you want to deploy to Cloudflare? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "✅ Smart choice! Use Render instead:"
    echo "   bash redeploy-to-render.sh"
    exit 0
fi

echo ""
echo "📝 Proceeding with Cloudflare Pages deployment..."
echo ""

# Check for git
if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install git."
    exit 1
fi

# Add and commit changes
echo "📦 Committing build configuration..."
git add package.json cloudflare-build.sh CLOUDFLARE_PAGES_FIX_AND_LIMITATIONS.md
git commit -m "Fix: Cloudflare Pages build configuration with adapter"

# Push to trigger deployment
echo "🚀 Pushing to repository..."
BRANCH=$(git branch --show-current)
git push origin "$BRANCH"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Changes pushed successfully!"
    echo ""
    echo "📋 Next steps in Cloudflare Dashboard:"
    echo "======================================"
    echo ""
    echo "1. Go to: https://dash.cloudflare.com"
    echo "2. Select: Pages → tasklynk-academic-space22"
    echo "3. Go to: Settings → Build & Deploy"
    echo ""
    echo "4. Set Build Command to:"
    echo "   npx @cloudflare/next-on-pages"
    echo ""
    echo "5. Set Build Output Directory to:"
    echo "   .vercel/output/static"
    echo ""
    echo "6. Go to: Deployments → Retry Deployment"
    echo ""
    echo "7. Wait 3-5 minutes for build"
    echo ""
    echo "⚠️  Remember: Most features won't work!"
    echo ""
    echo "📖 See: CLOUDFLARE_PAGES_FIX_AND_LIMITATIONS.md"
    echo ""
else
    echo ""
    echo "❌ Push failed. Try manually:"
    echo "   git push origin $BRANCH"
    exit 1
fi
