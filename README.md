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

This project is configured for automatic deployment to GitHub Pages.

### GitHub Pages Deployment

The project includes a GitHub Actions workflow that will automatically build and deploy the application whenever changes are pushed to the main branch.

For detailed instructions on setting up and using GitHub Pages deployment, please see [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md).

## License

The Spark Template files and resources from GitHub are licensed under the terms of the MIT license, Copyright GitHub, Inc.