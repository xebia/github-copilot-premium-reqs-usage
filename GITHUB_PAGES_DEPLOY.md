# GitHub Pages Deployment Guide

This document provides detailed instructions for deploying the GitHub Copilot Usage Analyzer to GitHub Pages.

## Understanding the Deployment Process

When deploying to GitHub Pages, we need to address the fact that GitHub Spark dependencies are not available in the standard GitHub Pages environment. The deployment process includes:

1. Using a simplified version of the application's main entry point
2. Building with a custom Vite configuration that excludes Spark dependencies
3. Deploying the built assets to GitHub Pages

## Prerequisites

- A GitHub repository containing your Copilot Usage Analyzer code
- GitHub Pages enabled for your repository

## Step-by-Step Deployment

### 1. Enabling GitHub Pages for Your Repository

1. Go to your repository on GitHub
2. Click on "Settings"
3. Navigate to "Pages" in the left sidebar
4. Under "Build and deployment" > "Source", select "GitHub Actions"

### 2. Automatic Deployment with GitHub Actions

The included GitHub Actions workflow will automatically deploy your application when changes are pushed to the main branch:

1. Push your changes to the `main` branch
2. Go to the "Actions" tab to monitor the deployment progress
3. Once complete, your application will be available at: `https://[your-github-username].github.io/[repo-name]/`

### 3. Manual Deployment

If you prefer to trigger the deployment manually:

1. Go to the "Actions" tab in your repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" dropdown and select the main branch
4. Click the green "Run workflow" button

### 4. Local Build for GitHub Pages

You can also build the GitHub Pages version locally to test before deploying:

```bash
# Copy the GitHub Pages specific main file
cp src/main-github-pages.tsx src/main.tsx

# Build using the custom config
npm run build

# Restore the original main file if needed
git checkout src/main.tsx
```

## Troubleshooting

### Common Issues

#### 1. Build Failure Due to Missing Dependencies

If your build fails with errors about missing `@github/spark` dependencies:

- Make sure you're using the GitHub Pages specific main file (`main-github-pages.tsx`)
- Check that your application doesn't reference Spark-specific functionality in components

#### 2. Blank Page After Deployment

If your deployed page is blank:

- Check the browser console for errors
- Ensure your `index.html` file correctly references the built JavaScript and CSS files
- Verify that your repository name is correctly set in the `base` path in your Vite config

#### 3. Styling Issues

If your application loses styling after deployment:

- Make sure all CSS imports are properly included
- Verify that Tailwind is properly configured in your build

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)