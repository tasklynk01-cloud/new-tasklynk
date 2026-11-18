# TaskLynk Vercel Deployment Script
# Automated deployment helper for Windows PowerShell
# Date: March 14, 2026

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TaskLynk Vercel Deployment Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "[+] Git is installed" -ForegroundColor Green
} else {
    Write-Host "[X] Git is not installed" -ForegroundColor Red
    exit 1
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    $npmVersion = npm --version
    Write-Host "[+] npm version: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "[X] npm is not installed" -ForegroundColor Red
    exit 1
}

if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "[+] Node.js version: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[X] Node.js is not installed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check environment file
Write-Host "Step 2: Checking environment configuration..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path ".env") {
    Write-Host "[+] .env file exists" -ForegroundColor Green
    $envVars = Get-Content .env | Where-Object { $_ -match "^[A-Z_]+=.+" }
    $envCount = $envVars.Count
    Write-Host "[+] Found $envCount environment variables" -ForegroundColor Green
} else {
    Write-Host "[X] .env file not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Git status
Write-Host "Step 3: Checking Git status..." -ForegroundColor Yellow
Write-Host ""

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "[!] You have uncommitted changes" -ForegroundColor Yellow
    git status --short
} else {
    Write-Host "[+] Working directory is clean" -ForegroundColor Green
}

Write-Host ""

# Step 4: Display deployment instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ready for Vercel Deployment!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Visit: https://vercel.com/new" -ForegroundColor White
Write-Host "2. Import your GitHub repository" -ForegroundColor White
Write-Host "3. Configure project settings:" -ForegroundColor White
Write-Host "   - Framework: Next.js (auto-detected)" -ForegroundColor Gray
Write-Host "   - Build Command: npm run build" -ForegroundColor Gray
Write-Host "   - Output Directory: .next" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Add Environment Variables (CRITICAL!):" -ForegroundColor Yellow
Write-Host ""

# Display critical environment variables
$criticalVars = @(
    "JWT_SECRET",
    "NODE_ENV",
    "TURSO_CONNECTION_URL",
    "TURSO_AUTH_TOKEN",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "SMTP_HOST",
    "SMTP_USER",  
    "SMTP_PASSWORD",
    "PAYSTACK_SECRET_KEY",
    "NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY"
)

Write-Host "   Copy all variables from .env to Vercel:" -ForegroundColor Cyan
Write-Host "   (Including these critical ones)" -ForegroundColor Gray
Write-Host ""

foreach ($var in $criticalVars) {
    Write-Host "   - $var" -ForegroundColor White
}

Write-Host ""
Write-Host "5. Click 'Deploy' and wait 2-3 minutes" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - Full Guide: VERCEL_DEPLOYMENT_QUICKSTART_2026.md" -ForegroundColor White
Write-Host "  - Troubleshooting: 00_START_HERE_PROBLEM_RESOLUTION.md" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Good luck with your deployment! " -ForegroundColor Green
Write-Host ""
