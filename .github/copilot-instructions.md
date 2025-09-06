# GitHub Copilot Custom Instructions

## Project Overview
This is a **GitHub Copilot Premium Requests Usage Analyzer** - a React-based single-page application that visualizes GitHub Copilot premium request usage data from CSV exports. The primary goal is to help teams understand their Copilot usage patterns, model distribution, and quota status.

## Architecture & Technology Stack

### Core Technologies
- **Frontend**: React 19+ with TypeScript
- **Build Tool**: Vite 7+ with SWC for fast compilation
- **Styling**: Tailwind CSS 4+ with custom design tokens
- **UI Components**: shadcn/ui with Radix UI primitives
- **Charts**: Recharts 3+ for data visualization
- **State Management**: React hooks and local state (no external state management)
- **Testing**: Vitest with React Testing Library

### Key Dependencies
- `@github/spark` - GitHub Spark integration
- `lucide-react` - Icon library
- `date-fns` - Date manipulation
- `clsx` + `tailwind-merge` - Conditional styling
- `sonner` - Toast notifications
- `zod` - Runtime type validation

## Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and data processing
│   └── utils.ts        # Core CSV parsing and data aggregation
├── styles/             # Global styles and themes
├── test/               # Test utilities and setup
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── prd.md              # Product Requirements Document
```

## Data Model & CSV Processing

### Expected CSV Format
```csv
"Timestamp","User","Model","Requests Used","Exceeds Monthly Quota","Total Monthly Quota"
"2025-06-11T05:13:27.8766440Z","UserName","gpt-4.1-2025-04-14","1","False","Unlimited"
```

### Core Data Interfaces
```typescript
interface CopilotUsageData {
  timestamp: Date;
  user: string;
  model: string;
  requestsUsed: number;
  exceedsQuota: boolean;
  totalMonthlyQuota: string;
}

interface AggregatedData {
  date: string;
  compliantRequests: number;
  exceedingRequests: number;
  totalRequests: number;
}
```

### Data Processing Patterns
- **CSV Parsing**: Robust parsing with validation in `lib/utils.ts`
- **Data Aggregation**: Group by day, model, and quota status
- **Decimal Handling**: Support for fractional request values
- **Error Handling**: Graceful handling of malformed CSV data

## UI Patterns & Components

### Design System
- **Color Scheme**: Professional GitHub-inspired palette
- **Typography**: Clean, technical aesthetic
- **Spacing**: Consistent Tailwind spacing scale
- **Components**: Card-based layout with subtle shadows

### Key UI Patterns
1. **File Upload**: Drag-and-drop with visual feedback
2. **Data Tables**: Clean tabular display of usage statistics
3. **Charts**: Line graphs and bar charts for usage visualization
4. **Error States**: Clear validation messaging and error feedback
5. **Loading States**: Appropriate loading indicators
6. **Number Formatting**: Always display thousand separators in all places where numbers are shown to improve readability

### Component Conventions
- Use `cn()` utility for conditional class names
- Prefer composition over inheritance
- Use React.forwardRef for components that need refs
- Follow shadcn/ui component patterns

## Business Logic

### Core Features
1. **CSV Upload & Validation**: Parse and validate GitHub Copilot usage exports
2. **Usage Visualization**: Daily usage trends with compliant vs exceeding requests
3. **Model Analysis**: Breakdown by AI model with usage statistics
4. **Quota Monitoring**: Track quota status and excess costs

### Model Categories
- **Default Models**: Free tier models (grouped as "Default")
- **Premium Models**: Models with usage multipliers and costs
- **Model Multipliers**: Different cost factors for different AI models

## Deployment & Build

### Build Configurations
- **Development**: Standard Vite dev server on port 5000
- **Production**: Optimized build with tree-shaking
- **GitHub Pages**: Special build configuration excluding Spark dependencies

### Deployment Targets
- **GitHub Pages**: Automated deployment via GitHub Actions
- **Local Preview**: `npm run preview` for local testing

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- Use proper type annotations
- Prefer interfaces over types for object shapes
- Use type guards for runtime type checking

### React Patterns
- Functional components with hooks
- Use `useCallback` and `useMemo` for performance optimization
- Proper error boundaries where needed
- Accessible components following WCAG guidelines

### File Naming
- PascalCase for components (`UserStats.tsx`)
- camelCase for utilities (`parseCSV`)
- kebab-case for CSS classes
- UPPER_CASE for constants

## Testing Strategy
- Unit tests for utility functions (especially CSV parsing)
- Component tests for UI interactions
- Integration tests for data flow
- Error boundary testing for edge cases

## Performance Considerations
- Lazy loading for large datasets
- Memoization of expensive calculations
- Efficient chart rendering with Recharts
- Browser-based CSV parsing limitations

## Common Tasks & Patterns

When working on this project, you'll likely need to:

1. **Add new chart types**: Extend the visualization with additional Recharts components
2. **Modify CSV parsing**: Update `lib/utils.ts` for new data formats
3. **Add UI components**: Follow shadcn/ui patterns and use existing design tokens
4. **Update data aggregation**: Modify aggregation functions for new metrics
5. **Handle edge cases**: Add validation and error handling for data processing

## Development Workflow
1. Run `npm run dev` for development server
2. Use `npm run test` for running tests
3. Build with `npm run build` for production
4. Deploy to GitHub Pages with `npm run deploy`

## Important Notes
- This is a client-side only application (no backend)
- All data processing happens in the browser
- CSV files are processed locally (not uploaded to servers)
- The app is designed for periodic usage reporting, not real-time monitoring
- **Minimal Changes**: Only modify files that are absolutely necessary to implement the requested features - avoid unnecessary changes to unrelated files
- When you need to make changes and send in a PR, run the application with the test data, and provide relevant screenshots in the PR that show the changes
