#!/bin/bash

# GitHub Pages Deployment Validation Script
# This script validates that all necessary files exist for standalone deployment

echo "🔍 Validating GitHub Pages deployment setup..."
echo ""

# Check if required standalone files exist
FILES=(
  "vite.config.standalone.ts"
  "src/App.standalone.tsx"
  "src/main.standalone.tsx"
  "src/hooks/useKV.ts"
  ".github/workflows/deploy.yml"
)

MISSING_FILES=()

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file - EXISTS"
  else
    echo "❌ $file - MISSING"
    MISSING_FILES+=("$file")
  fi
done

echo ""

# Check if package.json has required scripts
if grep -q '"deploy":' package.json && grep -q '"predeploy":' package.json; then
  echo "✅ package.json deployment scripts - OK"
else
  echo "❌ package.json deployment scripts - MISSING"
  MISSING_FILES+=("package.json scripts")
fi

# Check if gh-pages is installed
if grep -q '"gh-pages":' package.json; then
  echo "✅ gh-pages dependency - OK"
else
  echo "❌ gh-pages dependency - MISSING"
  MISSING_FILES+=("gh-pages dependency")
fi

echo ""

if [ ${#MISSING_FILES[@]} -eq 0 ]; then
  echo "🎉 All deployment files are ready!"
  echo ""
  echo "📝 To deploy to GitHub Pages:"
  echo "1. Copy standalone files:"
  echo "   cp vite.config.standalone.ts vite.config.ts"
  echo "   cp src/main.standalone.tsx src/main.tsx"
  echo "   cp src/App.standalone.tsx src/App.tsx"
  echo ""
  echo "2. Build and deploy:"
  echo "   npm run build"
  echo "   npm run deploy"
  echo ""
  echo "3. Or push to GitHub for automatic deployment via GitHub Actions"
else
  echo "⚠️  Some files are missing for deployment:"
  for file in "${MISSING_FILES[@]}"; do
    echo "   - $file"
  done
  echo ""
  echo "Please create the missing files before deploying."
fi

echo ""
echo "📚 See README-NEW.md for complete deployment instructions"