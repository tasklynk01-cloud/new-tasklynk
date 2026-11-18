# Update all files to use auth-context-v2

$srcPath = "d:\TaskLynk\TaskLynk\TaskLynkEdit\src"
$count = 0

# Find all tsx and ts files
Get-ChildItem -Path $srcPath -Recurse -Include *.tsx,*.ts | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw -ErrorAction SilentlyContinue
    
    if ($content -and ($content -match "@/lib/auth-context['""]" -and $content -notmatch "auth-context-v2")) {
        $updated = $content -replace "@/lib/auth-context'", "@/lib/auth-context-v2'"
        $updated = $updated -replace '@/lib/auth-context"', '@/lib/auth-context-v2"'
        
        if ($updated -ne $content) {
            Set-Content $filePath -Value $updated -NoNewline
            $relativePath = $filePath.Replace("$srcPath\", "")
            Write-Host "Updated: $relativePath"
            $count++
        }
    }
}

Write-Host "`nTotal files updated: $count"
Write-Host "Done!"
