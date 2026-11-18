@echo off
REM Pesapal Quick Setup Script for Windows
REM This script helps configure Pesapal environment variables

echo =========================================
echo   PESAPAL CONFIGURATION SETUP
echo =========================================
echo.

REM Check if .env file exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Creating .env from .env.example...
    copy .env.example .env
    echo [OK] Created .env file
    echo.
)

REM Backup existing .env
copy .env .env.backup >nul
echo [OK] Backup created: .env.backup
echo.

REM Your credentials
set CONSUMER_KEY=mQHar5k8QPNFTzfy6tJc77baFchUn48t
set CONSUMER_SECRET=sXoImQmH0WQMtoUvlFjKluKlVQs=
set IPN_ID=a0dc42d6-ee78-4bcf-9d98-db00bffce0fc
set BASE_URL=https://pay.pesapal.com

echo Configuring Pesapal credentials...
echo.

REM Create temporary PowerShell script to update .env
powershell -Command ^
"$env_file = '.env'; " ^
"$content = Get-Content $env_file; " ^
"$content = $content -replace '^PESAPAL_CONSUMER_KEY=.*', 'PESAPAL_CONSUMER_KEY=\"%CONSUMER_KEY%\"'; " ^
"$content = $content -replace '^#PESAPAL_CONSUMER_KEY=.*', 'PESAPAL_CONSUMER_KEY=\"%CONSUMER_KEY%\"'; " ^
"$content = $content -replace '^PESAPAL_CONSUMER_SECRET=.*', 'PESAPAL_CONSUMER_SECRET=\"%CONSUMER_SECRET%\"'; " ^
"$content = $content -replace '^#PESAPAL_CONSUMER_SECRET=.*', 'PESAPAL_CONSUMER_SECRET=\"%CONSUMER_SECRET%\"'; " ^
"$content = $content -replace '^PESAPAL_IPN_ID=.*', 'PESAPAL_IPN_ID=\"%IPN_ID%\"'; " ^
"$content = $content -replace '^#PESAPAL_IPN_ID=.*', 'PESAPAL_IPN_ID=\"%IPN_ID%\"'; " ^
"$content = $content -replace '^PESAPAL_BASE_URL=.*', 'PESAPAL_BASE_URL=\"%BASE_URL%\"'; " ^
"$content = $content -replace '^#PESAPAL_BASE_URL=.*', 'PESAPAL_BASE_URL=\"%BASE_URL%\"'; " ^
"Set-Content $env_file $content"

if %ERRORLEVEL% EQU 0 (
    echo   [OK] Updated PESAPAL_CONSUMER_KEY
    echo   [OK] Updated PESAPAL_CONSUMER_SECRET
    echo   [OK] Updated PESAPAL_IPN_ID
    echo   [OK] Updated PESAPAL_BASE_URL
) else (
    echo   [ERROR] Failed to update .env file
)

echo.
echo =========================================
echo   CONFIGURATION COMPLETE
echo =========================================
echo.
echo Configured:
echo   * PESAPAL_CONSUMER_KEY
echo   * PESAPAL_CONSUMER_SECRET
echo   * PESAPAL_IPN_ID
echo   * PESAPAL_BASE_URL
echo.
echo Optional (for production):
echo   * PESAPAL_WEBHOOK_SECRET (generate secure random string)
echo.
echo IPN URL (already registered):
echo   https://tasklynk.co.ke/api/v2/payments/pesapal/ipn
echo.
echo Callback URL:
echo   https://tasklynk.co.ke/api/v2/payments/pesapal/callback
echo.
echo Next steps:
echo   1. Review .env file
echo   2. Generate webhook secret (optional but recommended)
echo   3. Add webhook secret to .env:
echo      PESAPAL_WEBHOOK_SECRET="your-secret-here"
echo   4. Configure webhook secret in Pesapal dashboard
echo   5. Test payment flow: npm run dev
echo.
echo Documentation: PESAPAL_COMPLETE_SETUP_GUIDE.md
echo.
pause
