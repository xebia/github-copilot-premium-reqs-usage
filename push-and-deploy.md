# Push and Deploy to GitHub Pages

To deploy your GitHub Copilot Usage Analyzer to GitHub Pages, follow these steps:

## Step 1: Create a GitHub Repository

If you haven't already done so, create a repository on GitHub:

1. Go to [GitHub](https://github.com)
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Name your repository (e.g., "github-copilot-usage")
5. Choose public or private visibility
6. Click "Create repository"

## Step 2: Push Your Code to GitHub

Use the following commands to push your code to GitHub:

```bash
# Initialize a git repository if not already done
git init

# Add your GitHub repository as a remote
# Replace YOUR_USERNAME with your GitHub username
# Replace REPO_NAME with your repository name
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Add all files
git add .

# Commit your changes
git commit -m "Initial commit of GitHub Copilot Usage Analyzer"

# Push to GitHub main branch
git push -u origin main
```

## Step 3: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Navigate to "Pages" in the left sidebar
4. Under "Build and deployment" > "Source", select "GitHub Actions"

## Step 4: Trigger Deployment

The deployment should start automatically after pushing to the main branch. If you need to manually trigger it:

1. Go to the "Actions" tab in your repository
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" on the main branch

## Step 5: Access Your Deployed Application

Once deployed (usually takes 1-2 minutes), your application will be available at:

`https://YOUR_USERNAME.github.io/REPO_NAME/`

Replace `YOUR_USERNAME` with your GitHub username and `REPO_NAME` with your repository name.

## Troubleshooting

If the deployment fails:

1. Check the GitHub Actions logs for error messages
2. Make sure your repository is set up correctly for GitHub Pages
3. Verify that the GitHub Actions workflow has appropriate permissions

For more detailed instructions, see [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md).