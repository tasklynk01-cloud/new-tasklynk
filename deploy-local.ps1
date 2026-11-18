# TaskLynk Local Production Deployment Script (Windows)
# Run: .\deploy-local.ps1

Write-Host "🚀 TaskLynk Local Production Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Warning: .env file not found!" -ForegroundColor Yellow
    Write-Host "   Make sure you have configured your environment variables." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Install dependencies if needed
Write-Host ""
Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

# Build the application
Write-Host ""
Write-Host "🏗️  Building production version..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Please fix errors before deploying." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Ask if user wants to start the server
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Production build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is ready to run." -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the production server, run:" -ForegroundColor Yellow
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "The app will be available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:5000" -ForegroundColor White
Write-Host "  http://0.0.0.0:5000" -ForegroundColor White
Write-Host ""
Write-Host "To access from other devices on your network:" -ForegroundColor Cyan
Write-Host "  http://<your-computer-ip>:5000" -ForegroundColor White
Write-Host ""

$startNow = Read-Host "Start the production server now? (y/n)"

if ($startNow -eq "y") {
    Write-Host ""
    Write-Host "🚀 Starting production server..." -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    npm start
} else {
    Write-Host ""
    Write-Host "Run 'npm start' when you are ready to start the server." -ForegroundColor Cyan
}

