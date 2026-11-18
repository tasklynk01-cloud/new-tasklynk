#!/bin/bash

# Quick verification script for freelancer order counts implementation

echo "🔍 Verifying Freelancer Order Counts Implementation..."
echo ""

# Check if hook file exists
if [ -f "src/hooks/use-freelancer-order-counts.ts" ]; then
  echo "✅ Custom hook created: use-freelancer-order-counts.ts"
else
  echo "❌ Custom hook missing!"
  exit 1
fi

# Check each page for the hook import
pages=(
  "src/app/freelancer/available/page.tsx"
  "src/app/freelancer/in-progress/page.tsx"
  "src/app/freelancer/editing/page.tsx"
  "src/app/freelancer/delivered/page.tsx"
  "src/app/freelancer/revision/page.tsx"
  "src/app/freelancer/on-hold/page.tsx"
  "src/app/freelancer/completed/page.tsx"
  "src/app/freelancer/cancelled/page.tsx"
)

echo ""
echo "📄 Checking pages for hook import..."
for page in "${pages[@]}"; do
  if grep -q "useFreelancerOrderCounts" "$page"; then
    echo "✅ $page"
  else
    echo "❌ $page - missing hook import"
  fi
done

echo ""
echo "📊 Checking pages for count display..."
for page in "${pages[@]}"; do
  if grep -q "counts\." "$page"; then
    echo "✅ $page - displays counts"
  else
    echo "❌ $page - missing count display"
  fi
done

echo ""
echo "🎯 Checking submission panel..."
if [ -f "src/components/freelancer-submission-panel.tsx" ]; then
  echo "✅ FreelancerSubmissionPanel component exists"
  if grep -q "FileUploadWithClassification" "src/components/freelancer-submission-panel.tsx"; then
    echo "✅ Uses FileUploadWithClassification"
  fi
  if grep -q "/api/v2/orders/" "src/components/freelancer-submission-panel.tsx"; then
    echo "✅ Uses correct API endpoints"
  fi
else
  echo "❌ FreelancerSubmissionPanel missing"
fi

echo ""
echo "🔗 Checking submission panel integration..."
if [ -f "src/app/freelancer/orders/[id]/page.tsx" ]; then
  if grep -q "FreelancerSubmissionPanel" "src/app/freelancer/orders/[id]/page.tsx"; then
    echo "✅ FreelancerSubmissionPanel integrated in order detail page"
  else
    echo "❌ FreelancerSubmissionPanel not imported in order detail page"
  fi
else
  echo "❌ Order detail page not found"
fi

echo ""
echo "✨ Verification complete!"
echo ""
echo "To test manually:"
echo "1. Start dev server: npm run dev"
echo "2. Login as freelancer (freelancer@test.com / freelancer123)"
echo "3. Navigate to different order pages and verify counts display"
echo "4. Open an assigned order and verify submission panel appears"
echo "5. Try uploading a file and submitting"
