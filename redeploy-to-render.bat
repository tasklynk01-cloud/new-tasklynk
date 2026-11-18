@echo off
REM ============================================
REM TaskLynk Render Redeployment Script (Windows)
REM ============================================

echo.
echo ================================================
echo   TaskLynk Render Redeployment
echo ================================================
echo.

REM Check if git is available
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed
    exit /b 1
)

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Not a git repository
    exit /b 1
)

echo Git Status:
echo --------------
git status --short
echo.

REM Check if there are changes to commit
git diff-index --quiet HEAD --
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] No changes to commit
    echo.
    echo If you've already committed the fix, just push:
    echo   git push origin fresh-main
    exit /b 0
)

echo [OK] Changes detected
echo.

echo Modified files:
git diff --name-only
echo.

REM Ask for confirmation
set /p CONFIRM="Commit and push these changes? (y/n): "
if /i not "%CONFIRM%"=="y" (
    echo Aborted. No changes committed.
    exit /b 0
)

REM Add changes
echo.
echo Staging changes...
git add package.json RENDER_PORT_FIX.md RENDER_DEPLOYMENT_COMPLETE.md

REM Commit
echo Committing...
git commit -m "Fix: Use PORT environment variable for Render deployment" -m "- Updated package.json start script to use ${PORT:-5000}" -m "- Fixes port binding timeout on Render" -m "- App now binds to Render's PORT (10000) in production" -m "- Falls back to 5000 for local development"

REM Get current branch
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
echo.
echo Current branch: %BRANCH%
echo.

REM Push
echo Pushing to remote...
git push origin %BRANCH%

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] Successfully pushed to %BRANCH%
    echo.
    echo ================================================
    echo   Deployment Status
    echo ================================================
    echo.
    echo 1. Render will detect the push automatically
    echo 2. Build will start in ~30 seconds
    echo 3. Deployment takes 5-8 minutes
    echo.
    echo Monitor deployment at:
    echo   https://dashboard.render.com
    echo.
    echo Expected result:
    echo   - Port 10000 binding successful
    echo   - Service live and accessible
    echo.
) else (
    echo.
    echo [ERROR] Push failed
    echo.
    echo Possible causes:
    echo 1. No internet connection
    echo 2. Invalid git remote
    echo 3. Authentication required
    echo.
    echo Manual push:
    echo   git push origin %BRANCH%
    exit /b 1
)
