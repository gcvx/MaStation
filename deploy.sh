#!/bin/bash

# Deployment script for GitHub Pages
# This script configures the app for standalone deployment without GitHub Spark dependencies

echo "🚀 Configuring app for GitHub Pages deployment..."

# Check if required files exist
if [ ! -f "vite.config.standalone.ts" ]; then
    echo "❌ Error: vite.config.standalone.ts not found"
    exit 1
fi

if [ ! -f "src/App.standalone.tsx" ]; then
    echo "❌ Error: src/App.standalone.tsx not found"
    exit 1
fi

if [ ! -f "src/main.standalone.tsx" ]; then
    echo "❌ Error: src/main.standalone.tsx not found"
    exit 1
fi

# Backup original files
echo "📋 Creating backups of original files..."
cp vite.config.ts vite.config.spark.ts 2>/dev/null || echo "No existing vite.config.ts found"
cp src/main.tsx src/main.spark.tsx 2>/dev/null || echo "No existing src/main.tsx found"
cp src/App.tsx src/App.spark.tsx 2>/dev/null || echo "No existing src/App.tsx found"

# Copy standalone versions
echo "🔄 Switching to standalone configuration..."
cp vite.config.standalone.ts vite.config.ts
cp src/main.standalone.tsx src/main.tsx
cp src/App.standalone.tsx src/App.tsx

echo "✅ Configuration complete!"
echo ""
echo "📝 Next steps:"
echo "1. Install dependencies: npm install"
echo "2. Test locally: npm run dev"
echo "3. Build for production: npm run build"
echo "4. Deploy to GitHub Pages: npm run deploy"
echo ""
echo "🌐 After pushing to GitHub, your app will be available at:"
echo "https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/"
echo ""
echo "📚 For detailed instructions, see README-DEPLOYMENT.md"