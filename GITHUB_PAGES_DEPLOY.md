# Deploying to GitHub Pages

This document explains how to deploy the GitHub Copilot Usage Analyzer to GitHub Pages.

## Automated Deployment

This project includes a GitHub Actions workflow that automatically builds and deploys the application to GitHub Pages whenever changes are pushed to the `main` branch.

### How It Works

1. The workflow `.github/workflows/deploy-to-pages.yml` is triggered on pushes to the `main` branch or manually from the Actions tab.
2. It builds the application and configures it for GitHub Pages deployment with the correct base path.
3. The built application is deployed to GitHub Pages automatically.

### Setting Up GitHub Pages

To enable GitHub Pages deployment for this repository:

1. Go to your repository on GitHub
2. Click on "Settings"
3. Navigate to "Pages" in the left sidebar
4. Under "Build and deployment" > "Source", select "GitHub Actions"
5. The workflow will now be able to deploy to GitHub Pages

## Manual Deployment

If you prefer to deploy manually or need to test locally first:

1. Update the base path in `vite.config.ts`:

   ```typescript
   build: {
     outDir: process.env.OUTPUT_DIR || 'dist',
     base: "/spark-template/" // Add this line (replace with your repo name)
   }
   ```

2. Build the application:

   ```bash
   npm run build
   ```

3. Test the build locally:

   ```bash
   npm run preview
   ```

4. Deploy the contents of the `dist` directory to GitHub Pages using your preferred method.

## Accessing Your Deployed Application

Once deployed, your application will be available at:
`https://[your-github-username].github.io/spark-template/`

## Troubleshooting

If you encounter any issues with the deployment:

1. Check the GitHub Actions logs for any error messages
2. Ensure GitHub Pages is properly configured in your repository settings
3. Verify that the base path in the Vite configuration matches your repository name
4. Check that the repository has proper permissions set for GitHub Pages deployment

## Note About App Functionality

When deployed to GitHub Pages, be aware that:

1. The application is entirely client-side - all data processing happens in the browser
2. No data is sent to any server when using the CSV upload feature
3. If your CSV files are large, performance will depend on the user's device capabilities