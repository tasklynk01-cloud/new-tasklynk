@echo off
REM Deploy to Cloudflare Pages - Preparation Script (Windows)

echo.
echo 🚀 Preparing TaskLynk for Cloudflare Pages deployment...
echo.

REM Step 1: Check if bun is installed
echo 📦 Step 1: Checking for bun installation...
where bun >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ bun is not installed.
    echo    Install it with: npm install -g bun
    echo    Or use npm instead ^(slower^): npm install
    echo.
    set /p "response=Continue with npm? (y/n): "
    if /i "%response%"=="y" (
        echo 📦 Running npm install...
        npm install
    ) else (
        echo ⏸️  Skipping dependency update.
    )
) else (
    echo ✅ bun is installed
    echo 📦 Updating lockfile...
    bun install
)

echo.
echo ✅ Step 1 Complete: Dependencies updated
echo.

REM Step 2: Verify configuration files
echo 📝 Step 2: Verifying configuration files...
for %%f in (wrangler.toml .node-version CLOUDFLARE_DEPLOYMENT_GUIDE.md cloudflare-build.sh) do (
    if exist "%%f" (
        echo    ✅ %%f exists
    ) else (
        echo    ❌ %%f missing!
    )
)

echo.
echo ✅ Step 2 Complete: Configuration verified
echo.

REM Step 3: Check for uncommitted changes
echo 🔍 Step 3: Checking git status...
git status --porcelain > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    git status --short | findstr /r "." > nul
    if %ERRORLEVEL% EQU 0 (
        echo 📋 Uncommitted changes found:
        git status --short
        echo.
        echo 💡 To commit these changes, run:
        echo    git add .
        echo    git commit -m "chore: prepare for Cloudflare Pages deployment"
        echo    git push origin fresh-main
    ) else (
        echo ✅ No uncommitted changes
    )
)

echo.
echo 🎯 Next Steps:
echo.
echo 1. Commit and push changes ^(if any^):
echo    git add .
echo    git commit -m "chore: prepare for Cloudflare Pages deployment"
echo    git push origin fresh-main
echo.
echo 2. Go to Cloudflare Pages dashboard:
echo    → Settings → Builds ^& deployments
echo    → Change build command to: npm run build:cloudflare
echo.
echo 3. Add environment variables:
echo    → Settings → Environment Variables
echo    → Copy from .env.production ^(see CLOUDFLARE_DEPLOYMENT_GUIDE.md^)
echo.
echo 4. Trigger new deployment:
echo    → Deployments → Retry deployment
echo.
echo 📖 For detailed instructions, see: CLOUDFLARE_DEPLOYMENT_GUIDE.md
echo.
echo ✨ Preparation complete!
echo.
pause
