# Deploying to GitHub Pages

This document explains how to deploy the GitHub Copilot Premium Requests Usage Analyzer to GitHub Pages.

## Automated Deployment with GitHub Actions

This project includes a GitHub Actions workflow that automatically builds and deploys the application to GitHub Pages without requiring the Spark dependencies.

### How It Works

1. The workflow `.github/workflows/deploy-to-pages.yml` is triggered on pushes to the `main` branch or manually from the Actions tab.
2. It creates a simplified build configuration that:
   - Removes dependencies on the GitHub Spark modules
   - Creates shims for necessary functionality
   - Sets the correct base path for GitHub Pages
3. The built application is deployed to GitHub Pages automatically.

### Setting Up GitHub Pages

To set up GitHub Pages deployment for this repository:

1. Go to your repository on GitHub
2. Click on "Settings"
3. Navigate to "Pages" in the left sidebar
4. Under "Build and deployment" > "Source", select "GitHub Actions"
5. The workflow will now be able to deploy to GitHub Pages

### Running the Workflow Manually

You can trigger the deployment workflow manually:

1. Go to the "Actions" tab in your repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button (branch: main)
4. Wait for the workflow to complete

## Manual Deployment

For manual deployment, follow these steps:

### Step 1: Create a Simplified Build

Since the Spark dependencies are not available outside the GitHub environment, we need to create a simplified version of the app for GitHub Pages:

1. Create a new temporary directory:
   ```bash
   mkdir -p temp_build
   cd temp_build
   ```

2. Copy source files:
   ```bash
   cp -r ../src .
   cp ../index.html .
   cp ../tailwind.config.js .
   ```

3. Create a simplified vite.config.js:
   ```javascript
   import { defineConfig } from "vite";
   import react from "@vitejs/plugin-react";
   import { resolve } from 'path';

   export default defineConfig({
     plugins: [react()],
     build: {
       base: "/your-repo-name/", // Change to your repository name
       outDir: 'dist'
     },
     resolve: {
       alias: {
         '@': resolve(__dirname, 'src')
       }
     }
   });
   ```

4. Create a simplified package.json with only the necessary dependencies:
   ```json
   {
     "name": "github-copilot-usage-analyzer",
     "private": true,
     "version": "1.0.0",
     "type": "module",
     "scripts": {
       "build": "vite build",
       "preview": "vite preview"
     },
     "dependencies": {
       "@phosphor-icons/react": "^2.0.15",
       "clsx": "^2.1.0",
       "react": "^18.2.0",
       "react-dom": "^18.2.0",
       "recharts": "^2.10.3",
       "sonner": "^1.2.4",
       "tailwind-merge": "^2.2.0"
     },
     "devDependencies": {
       "@types/react": "^18.2.46",
       "@types/react-dom": "^18.2.18",
       "@vitejs/plugin-react": "^4.2.1",
       "autoprefixer": "^10.4.16",
       "postcss": "^8.4.32",
       "tailwindcss": "^3.4.0",
       "typescript": "^5.3.3",
       "vite": "^5.0.10"
     }
   }
   ```

5. Create a shim for Spark hooks:
   ```javascript
   // src/spark-shims/hooks.js
   import { useState } from 'react';

   // Simple localStorage-based shim for useKV hook
   export function useKV(key, initialValue) {
     const storageKey = `kv-${key}`;
     
     // Get from localStorage
     const stored = localStorage.getItem(storageKey);
     const initial = stored !== null ? JSON.parse(stored) : initialValue;
     
     const [value, setValue] = useState(initial);
     
     const setValueAndStore = (newValue) => {
       const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
       setValue(valueToStore);
       localStorage.setItem(storageKey, JSON.stringify(valueToStore));
     };
     
     const deleteValue = () => {
       setValue(null);
       localStorage.removeItem(storageKey);
     };
     
     return [value, setValueAndStore, deleteValue];
   }
   ```

6. Update imports in your code:
   ```bash
   # Replace imports from @github/spark/hooks with our shim
   find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import {.*} from "@github\/spark\/hooks"/import { useKV } from "..\/spark-shims\/hooks"/g'
   ```

7. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

### Step 2: Deploy to GitHub Pages

1. Create a gh-pages branch (if it doesn't exist):
   ```bash
   git checkout --orphan gh-pages
   ```

2. Remove existing files:
   ```bash
   git rm -rf .
   ```

3. Copy build files:
   ```bash
   cp -r temp_build/dist/* .
   ```

4. Create a .nojekyll file (important for proper GitHub Pages rendering):
   ```bash
   touch .nojekyll
   ```

5. Commit and push:
   ```bash
   git add .
   git commit -m "Deploy to GitHub Pages"
   git push -u origin gh-pages
   ```

6. Return to main branch:
   ```bash
   git checkout main
   ```

## Accessing Your Deployed Application

Once deployed, your application will be available at:
`https://[your-github-username].github.io/your-repo-name/`

Replace `your-repo-name` with the actual name of your repository.

## Troubleshooting

If you encounter any issues with the deployment:

1. Check the GitHub Actions logs for any error messages
2. Ensure GitHub Pages is properly configured in your repository settings
3. Verify that the base path in the Vite configuration matches your repository name
4. Check that the repository has proper permissions set for GitHub Pages deployment
5. If using manual deployment, make sure you have a .nojekyll file in the gh-pages branch
6. Verify that all paths in the application are relative, not absolute

## Note About App Functionality

When deployed to GitHub Pages, be aware that:

1. The application is entirely client-side - all data processing happens in the browser
2. No data is sent to any server when using the CSV upload feature
3. If your CSV files are large, performance will depend on the user's device capabilities
4. The localStorage-based KV store implementation means data will be persisted only in the user's browser