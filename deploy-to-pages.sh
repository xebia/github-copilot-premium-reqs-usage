#!/bin/bash

# Script to deploy the GitHub Copilot Usage Analyzer to GitHub Pages manually

# Exit on error
set -e

# Variables - update these
GITHUB_USERNAME=$(git config user.name)
REPO_NAME="spark-template"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed."
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree &> /dev/null; then
    echo "Error: Not in a git repository."
    exit 1
fi

# Build the application with correct base path
echo "Building application for GitHub Pages..."
export VITE_BASE_PATH="/${REPO_NAME}/"

# Create a temporary build config with the base path
cat > temp-vite.config.ts <<EOF
$(cat vite.config.ts | sed "s/build: {/build: {\n    base: '\/${REPO_NAME}\/',/")
EOF

# Build with temporary config
mv temp-vite.config.ts vite.config.ts
npm run build
git checkout -- vite.config.ts

echo "Build completed successfully."

# Create or navigate to gh-pages branch
if git show-ref --quiet refs/heads/gh-pages; then
    echo "Checking out existing gh-pages branch..."
    git checkout gh-pages
    # Remove all files except .git
    find . -mindepth 1 -maxdepth 1 -not -name .git -exec rm -rf {} \;
else
    echo "Creating new gh-pages branch..."
    git checkout --orphan gh-pages
    git rm -rf .
fi

# Copy the build files
echo "Copying build files..."
cp -r dist/* .
touch .nojekyll

# Commit and push
echo "Committing changes..."
git add .
git commit -m "Deploy to GitHub Pages: $(date)"

echo "Pushing to GitHub..."
git push -u origin gh-pages

# Return to the main branch
git checkout main

echo "Deployment complete!"
echo "Your application should be available at: https://${GITHUB_USERNAME}.github.io/${REPO_NAME}/"