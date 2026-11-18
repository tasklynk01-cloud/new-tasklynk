#!/bin/bash
# Deploy to Cloudflare Pages - Preparation Script

echo "🚀 Preparing TaskLynk for Cloudflare Pages deployment..."
echo ""

# Step 1: Check if bun is installed
echo "📦 Step 1: Checking for bun installation..."
if ! command -v bun &> /dev/null; then
    echo "❌ bun is not installed."
    echo "   Install it with: npm install -g bun"
    echo "   Or use npm instead (slower): npm install"
    echo ""
    read -p "Continue with npm? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Running npm install..."
        npm install
    else
        echo "⏸️  Skipping dependency update."
    fi
else
    echo "✅ bun is installed"
    echo "📦 Updating lockfile..."
    bun install
fi

echo ""
echo "✅ Step 1 Complete: Dependencies updated"
echo ""

# Step 2: Verify configuration files
echo "📝 Step 2: Verifying configuration files..."
files=("wrangler.toml" ".node-version" "CLOUDFLARE_DEPLOYMENT_GUIDE.md" "cloudflare-build.sh")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file exists"
    else
        echo "   ❌ $file missing!"
    fi
done

echo ""
echo "✅ Step 2 Complete: Configuration verified"
echo ""

# Step 3: Check for uncommitted changes
echo "🔍 Step 3: Checking git status..."
if git status --porcelain | grep -q .; then
    echo "📋 Uncommitted changes found:"
    git status --short
    echo ""
    echo "💡 To commit these changes, run:"
    echo "   git add ."
    echo "   git commit -m \"chore: prepare for Cloudflare Pages deployment\""
    echo "   git push origin fresh-main"
else
    echo "✅ No uncommitted changes"
fi

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Commit and push changes (if any):"
echo "   git add ."
echo "   git commit -m \"chore: prepare for Cloudflare Pages deployment\""
echo "   git push origin fresh-main"
echo ""
echo "2. Go to Cloudflare Pages dashboard:"
echo "   → Settings → Builds & deployments"
echo "   → Change build command to: npm run build:cloudflare"
echo ""
echo "3. Add environment variables:"
echo "   → Settings → Environment Variables"
echo "   → Copy from .env.production (see CLOUDFLARE_DEPLOYMENT_GUIDE.md)"
echo ""
echo "4. Trigger new deployment:"
echo "   → Deployments → Retry deployment"
echo ""
echo "📖 For detailed instructions, see: CLOUDFLARE_DEPLOYMENT_GUIDE.md"
echo ""
echo "✨ Preparation complete!"
