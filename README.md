# GitHub Copilot Usage Analyzer

A single-page application that visualizes GitHub Copilot premium request usage data from CSV exports. This tool helps you understand your team's Copilot usage patterns.

## Features

- Upload and parse GitHub Copilot usage CSV data
- Visualize usage over time with interactive charts
- See request distribution by model
- Track compliant vs. exceeding quota requests
- Analyze usage patterns with daily breakdown charts

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/[your-username]/github-copilot-usage.git
   cd github-copilot-usage
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5000 in your browser

## CSV Format

The application expects a CSV export from GitHub Copilot premium requests with the following format:

```
"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-11T05:13:27.8766440Z","UserName","gpt-4.1-2025-04-14","1","False","Unlimited"
```

## Deployment

### GitHub Pages

This project is configured for easy deployment to GitHub Pages. See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

Quick deploy:
```bash
npm run deploy
```

## Built With

- React
- TypeScript
- Vite
- Recharts
- shadcn/ui components
- Tailwind CSS

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- GitHub Copilot for helping with development
- The shadcn/ui team for the beautiful components
- Recharts for the charting library