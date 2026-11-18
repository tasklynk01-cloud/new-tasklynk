#!/bin/bash

# Clean up console.log statements from source files
# Keeps console.error and console.warn for production debugging

echo "=================================================="
echo "Console.log Cleanup Script"
echo "=================================================="
echo ""

# Find all files with console.log
FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec grep -l "console\.log" {} \;)

if [ -z "$FILES" ]; then
    echo "✓ No console.log statements found in src/"
    exit 0
fi

COUNT=$(echo "$FILES" | wc -l)
echo "Found console.log statements in $COUNT files"
echo ""

# Count total console.log occurrences
TOTAL=$(echo "$FILES" | xargs grep -c "console\.log" | awk -F: '{sum+=$2} END {print sum}')
echo "Total console.log statements to remove: $TOTAL"
echo ""

# Backup before cleanup
BACKUP_DIR="backup-console-cleanup-$(date +%Y%m%d-%H%M%S)"
echo "Creating backup in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
echo "$FILES" | while read file; do
    if [ -f "$file" ]; then
        mkdir -p "$BACKUP_DIR/$(dirname "$file")"
        cp "$file" "$BACKUP_DIR/$file"
    fi
done
echo "✓ Backup created"
echo ""

# Remove console.log statements (but keep console.error and console.warn)
echo "Removing console.log statements..."
echo ""

REMOVED=0
echo "$FILES" | while read file; do
    if [ -f "$file" ]; then
        # Count console.log lines in this file
        FILE_COUNT=$(grep -c "console\.log" "$file" 2>/dev/null || echo "0")
        
        # Remove lines with console.log (entire line)
        sed -i '/console\.log/d' "$file"
        
        REMOVED=$((REMOVED + FILE_COUNT))
        echo "  ✓ $file ($FILE_COUNT removed)"
    fi
done

echo ""
echo "=================================================="
echo "Cleanup Complete!"
echo "=================================================="
echo "Total console.log statements removed: $TOTAL"
echo "Backup saved to: $BACKUP_DIR"
echo ""
echo "Note: console.error and console.warn statements were preserved"
echo "      for production debugging"
echo ""
