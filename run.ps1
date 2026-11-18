$files = Get-ChildItem -Path "src\app" -Recurse -Filter "*.tsx"
foreach ($file in $files) {
    if ($file.FullName -like "*page.tsx" -or $file.FullName -like "*layout.tsx" -or $file.FullName -like "*component*.tsx") {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if ($content -match "\bfetch\s*\(") {
            $newContent = $content -replace "\bfetch\s*\((\s*['"`]\/api/)", "safeApiFetch($1"
            # It's safer to only replace fetch if it's calling /api/, to avoid replacing external fetch or third party calls
            # Wait, standard regex without lookahead:
            $newContent = [regex]::Replace($content, "\bfetch\s*\(\s*(?=['"`]\s*/api/)", "safeApiFetch(")
            
            if ($newContent -cne $content) {
                if ($newContent -notmatch "import.*safeApiFetch") {
                    $newContent = "import { safeApiFetch } from '@/lib/client-api-helpers';
" + $newContent
                }
                [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
                Write-Host "Updated $($file.Name)"
            }
        }
    }
}
