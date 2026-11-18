#!/bin/bash
# Fix incomplete console.log statements

# Find files with patterns like "  field: value," without console.log wrapper
# These are typically inside object literals that should be console.log arguments

echo "Finding files with potential incomplete console.log statements..."

# Search for patterns that indicate incomplete console.logs
grep -rn "^[[:space:]]*[a-zA-Z_][a-zA-Z0-9_]*:[[:space:]]" src/ --include="*.ts" --include="*.tsx" | \
  grep -v "interface " | \
  grep -v "type " | \
  grep -v "const " | \
  grep -v "let " | \
  grep -v "var " | \
  grep -v "console.log" | \
  head -50

echo -e "\n===== ANALYSIS COMPLETE ====="
echo "Total affected files need manual review."
echo "Common pattern: Object literals missing console.log() wrapper"
