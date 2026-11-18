@echo off
REM ============================================
REM Cloudflare Pages Quick Deploy Script (Windows)
REM ============================================

echo.
echo ============================================
echo   TaskLynk Cloudflare Pages Deployment
echo ============================================
echo.
echo [WARNING] Cloudflare Pages has MAJOR limitations!
echo.
echo Features that WON'T work:
echo   X File uploads (Cloudinary)
echo   X Database writes (complex queries)
echo   X Email sending (SMTP)
echo   X Order creation
echo   X Payment processing
echo   X Admin dashboard
echo.
set /p CONFIRM="Are you sure? Use Render instead! (y/n): "

if /i not "%CONFIRM%"=="y" (
    echo.
    echo [SMART CHOICE] Use Render instead:
    echo   redeploy-to-render.bat
    exit /b 0
)

echo.
echo Proceeding with Cloudflare Pages deployment...
echo.

REM Check for git
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git not found
    exit /b 1
)

REM Commit changes
echo Committing build configuration...
git add package.json cloudflare-build.sh CLOUDFLARE_PAGES_FIX_AND_LIMITATIONS.md
git commit -m "Fix: Cloudflare Pages build configuration with adapter"

REM Push
echo Pushing to repository...
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
git push origin %BRANCH%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Changes pushed!
    echo.
    echo ============================================
    echo   Next Steps in Cloudflare Dashboard
    echo ============================================
    echo.
    echo 1. Go to: https://dash.cloudflare.com
    echo 2. Select: Pages - tasklynk-academic-space22
    echo 3. Go to: Settings - Build and Deploy
    echo.
    echo 4. Set Build Command to:
    echo    npx @cloudflare/next-on-pages
    echo.
    echo 5. Set Build Output Directory to:
    echo    .vercel/output/static
    echo.
    echo 6. Go to: Deployments - Retry Deployment
    echo 7. Wait 3-5 minutes for build
    echo.
    echo [WARNING] Most features won't work!
    echo.
    echo See: CLOUDFLARE_PAGES_FIX_AND_LIMITATIONS.md
    echo.
) else (
    echo.
    echo [ERROR] Push failed
    echo Try manually: git push origin %BRANCH%
    exit /b 1
)
