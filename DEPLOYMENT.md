# Deploying GitHub Copilot Premium Requests Usage Analyzer to GitHub Pages

This document explains how to deploy the GitHub Copilot Premium Requests Usage Analyzer application to GitHub Pages.

## Automatic Deployment with GitHub Actions

This repository includes a GitHub Actions workflow that will automatically build and deploy the application to GitHub Pages whenever changes are pushed to the `main` branch.

### Setup

1. Make sure your repository has GitHub Pages enabled:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - For the Source, select "GitHub Actions"

2. Push your code to the `main` branch:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

3. The GitHub Actions workflow will automatically:
   - Build the application using the GitHub Pages configuration
   - Deploy the built files to the `gh-pages` branch
   - Publish the site to GitHub Pages

4. Once deployed, your site will be available at `https://[your-username].github.io/[repo-name]/`

## Manual Deployment

You can also deploy manually using the npm scripts:

1. Install dependencies if you haven't already:
   ```bash
   npm install
   ```

2. Build and deploy:
   ```bash
   npm run deploy
   ```

This will:
- Build the application using the GitHub Pages specific configuration
- Deploy the built files to the `gh-pages` branch

## Configuration

- The application uses a special Vite configuration for GitHub Pages deployment (`vite.github-pages.config.ts`)
- The `main-github-pages.tsx` file excludes Spark-specific imports that cause build issues
- Build configuration excludes `@github/spark/spark` from bundling
- Base URL is set to `'./'` to allow relative paths on GitHub Pages

## Troubleshooting

If you encounter deployment issues:

1. Check the GitHub Actions workflow run for error messages
2. Verify that GitHub Pages is properly configured in your repository settings
3. Make sure all dependencies are properly installed
4. Confirm that the GitHub Pages branch (gh-pages) is correctly set as the publishing source
5. Examine the build logs for errors related to missing dependencies