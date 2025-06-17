#!/bin/bash
# This script prepares and builds the application for GitHub Pages

# Copy the GitHub Pages specific main file
cp src/main-github-pages.tsx src/main.tsx

# Build using Vite with the GitHub Pages config
npx vite build --config vite.github-pages.config.ts

# Restore the original main file if you need to continue local development
git checkout src/main.tsx

echo "Build complete! The files are in the ./dist directory"