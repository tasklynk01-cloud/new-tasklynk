#!/bin/bash

# Comprehensive Website Audit Script
# This script checks for common issues across all pages

echo "==================================="
echo "TASKLYNK WEBSITE AUDIT"
echo "==================================="
echo ""

# Check for broken imports
echo "1. Checking for broken imports..."
grep -r "from '@/" --include="*.tsx" --include="*.ts" src/app | grep -v "node_modules" | wc -l
echo "   Total import statements found"
echo ""

# Check for console.log statements (should be removed in production)
echo "2. Checking for console.log statements..."
grep -r "console.log" --include="*.tsx" --include="*.ts" src/app | grep -v "console.error" | wc -l
echo "   Debug console.log statements found"
echo ""

# Check for TODO comments
echo "3. Checking for TODO/FIXME comments..."
grep -r "TODO\|FIXME" --include="*.tsx" --include="*.ts" src/app | wc -l
echo "   TODO/FIXME comments found"
echo ""

# Check for hardcoded values
echo "4. Checking for hardcoded localhost URLs..."
grep -r "localhost:3000\|localhost:5000" --include="*.tsx" --include="*.ts" src/app | wc -l
echo "   Hardcoded localhost URLs found"
echo ""

# Check messaging components
echo "5. Checking messaging system..."
find src -name "*message*.tsx" -o -name "*chat*.tsx" | wc -l
echo "   Message/chat components found"
echo ""

# Check for tier/budget/priority fields in user management
echo "6. Checking user management fields..."
grep -r "tier\|priority\|budget" --include="*.tsx" src/app/admin/user-management | wc -l
echo "   Tier/priority/budget references found"
echo ""

# Check for CPP level references
echo "7. Checking CPP level system..."
grep -r "cppLevel\|cpp_level\|cppNonTechnical" --include="*.tsx" --include="*.ts" src | wc -l
echo "   CPP level references found"
echo ""

echo "==================================="
echo "AUDIT COMPLETE"
echo "==================================="
