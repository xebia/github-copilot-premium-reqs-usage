# GitHub Copilot Usage Analyzer

A web application that visualizes GitHub Copilot premium request usage to help teams monitor and optimize their AI resource consumption.

## Features

- Upload GitHub Copilot usage CSV exports
- View stacked line graph of compliant vs. exceeding requests
- See daily usage patterns by model
- Analyze model-specific usage statistics
- Interactive visualizations with tooltips for detailed information

## Getting Started

### Development

1. Clone this repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open your browser to http://localhost:5000

### Build

To build the application for production:

```bash
npm run build
```

## Deployment

### GitHub Pages Deployment

The project includes a GitHub Actions workflow that will automatically build and deploy the application to GitHub Pages whenever changes are pushed to the main branch.

#### How to Deploy to GitHub Pages

1. Push your changes to the `main` branch
2. The GitHub Actions workflow will automatically:
   - Create a simplified build without Spark dependencies
   - Deploy to GitHub Pages

3. Alternatively, you can manually trigger the deployment:
   - Go to the "Actions" tab in your repository
   - Select "Deploy to GitHub Pages" workflow
   - Click "Run workflow" on the main branch

4. Your application will be available at:
   `https://[your-github-username].github.io/[repo-name]/`

#### Setting Up GitHub Pages for Your Repository

To enable GitHub Pages deployment:

1. Go to your repository on GitHub
2. Click on "Settings"
3. Navigate to "Pages" in the left sidebar
4. Under "Build and deployment" > "Source", select "GitHub Actions"

For more detailed instructions and troubleshooting, see [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md).

## How It Works

The GitHub Pages deployment handles the fact that GitHub Spark dependencies are not available outside the Spark environment. The workflow:

1. Creates a simplified build configuration
2. Implements localStorage-based alternatives to Spark's useKV hooks
3. Builds a fully client-side version of the application
4. Deploys it to GitHub Pages

This approach ensures your application can be shared and accessed outside the Spark development environment.

## License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.