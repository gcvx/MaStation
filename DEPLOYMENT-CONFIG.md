# GitHub Pages Deployment Configuration

This file contains all the necessary configurations to deploy this app to GitHub Pages.

## Quick Start Commands

### 1. Install gh-pages if not already installed
```bash
npm install --save-dev gh-pages
```

### 2. Configure for standalone deployment
```bash
# Copy standalone files
cp vite.config.standalone.ts vite.config.ts
cp src/main.standalone.tsx src/main.tsx  
cp src/App.standalone.tsx src/App.tsx
```

### 3. Build and deploy
```bash
npm run build
npm run deploy
```

## Automatic Deployment

The `.github/workflows/deploy.yml` file is already configured for automatic deployment when you push to the `main` branch.

## Manual Configuration Steps

1. **Repository Settings**
   - Go to your GitHub repository Settings
   - Navigate to Pages
   - Under Source, select "GitHub Actions"

2. **Update Base URL (if needed)**
   - Edit `vite.config.standalone.ts`
   - Change the `base` property to match your repository name
   - Example: `base: '/my-fuel-app/'`

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

## Files Created for Deployment

- `vite.config.standalone.ts` - Standalone Vite configuration
- `src/App.standalone.tsx` - Standalone app component  
- `src/main.standalone.tsx` - Standalone entry point
- `src/hooks/useKV.ts` - localStorage-based persistence hook
- `.github/workflows/deploy.yml` - GitHub Actions workflow

## Troubleshooting

### App doesn't load
- Check GitHub Pages is enabled
- Verify the base URL matches your repo name
- Check the Actions tab for deployment errors

### Map not working
- Ensure Leaflet CSS is loaded in index.html
- Check browser console for errors

### Data not loading
- The app uses CORS proxies for data fetching
- Check network tab for failed requests