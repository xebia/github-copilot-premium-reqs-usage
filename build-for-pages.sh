#!/bin/bash

# Script to build the GitHub Copilot Premium Requests Usage Analyzer for GitHub Pages deployment
# This script creates a version without Spark dependencies

# Exit on error
set -e

# Variables - update these
REPO_NAME="spark-template"  # Change this to your actual repository name
OUTPUT_DIR="dist-pages"

# Create temporary directory for build
mkdir -p temp_build
cd temp_build

# Copy source files
echo "Copying source files..."
cp -r ../src .
cp ../index.html .
cp ../tailwind.config.js .

# Create simplified vite config
echo "Creating simplified vite config..."
cat > vite.config.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    base: "/spark-template/", // Change this to your repository name
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
EOF

# Create simplified package.json
echo "Creating simplified package.json..."
cat > package.json << 'EOF'
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
EOF

# Create shim for Spark dependencies
echo "Creating shims for Spark dependencies..."
mkdir -p src/spark-shims
cat > src/spark-shims/hooks.js << 'EOF'
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
EOF

# Update imports in files to use our shims
echo "Updating imports..."
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import {.*} from "@github\/spark\/hooks"/import { useKV } from "..\/spark-shims\/hooks"/g'

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the app
echo "Building application..."
npm run build

# Move the built files to the output directory
echo "Moving build files to output directory..."
cd ..
rm -rf $OUTPUT_DIR
mv temp_build/dist $OUTPUT_DIR
rm -rf temp_build

echo "Build completed successfully! The output is in the $OUTPUT_DIR directory."
echo 
echo "To deploy to GitHub Pages manually:"
echo "1. Create a gh-pages branch: git checkout --orphan gh-pages"
echo "2. Remove existing files: git rm -rf ."
echo "3. Copy build files: cp -r $OUTPUT_DIR/* ."
echo "4. Add .nojekyll: touch .nojekyll"
echo "5. Commit: git add . && git commit -m \"Deploy to GitHub Pages\""
echo "6. Push: git push -u origin gh-pages"
echo "7. Return to main: git checkout main"