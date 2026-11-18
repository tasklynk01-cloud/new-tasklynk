$ErrorActionPreference = "Stop"

# Read .env.production
$envVars = @{}
Get-Content ".env.production" | ForEach-Object {
    $line = $_.Trim()
    if ($line -and !$line.StartsWith("#")) {
        $parts = $line.Split('=', 2)
        if ($parts.Count -eq 2) {
            $envVars[$parts[0].Trim()] = $parts[1].Trim()
        }
    }
}

Write-Host "Loaded $($envVars.Count) environment variables" -ForegroundColor Green

# Build --env args
$envArgs = @()
foreach ($key in $envVars.Keys) {
    $envArgs += "--env"
    $envArgs += "$key=$($envVars[$key])"
}

# Also add build env
$buildEnvArgs = @("--build-env", "NODE_ENV=production")

# Deploy
$allArgs = @("--name", "tasklynkpaidaded", "--prod", "--yes") + $envArgs + $buildEnvArgs

Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
& npx vercel @allArgs 2>&1