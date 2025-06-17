# GitHub Copilot Usage Analyzer

## Core Purpose & Success
- **Mission Statement**: A tool that visualizes GitHub Copilot premium request usage to help teams monitor and optimize their AI resource consumption.
- **Success Indicators**: Users can upload CSV data and quickly understand usage patterns, model distribution, and quota status through clear visualizations.
- **Experience Qualities**: Efficient, Insightful, Professional

## Project Classification & Approach
- **Complexity Level**: Light Application (multiple features with basic state)
- **Primary User Activity**: Consuming (analyzing visualized data)

## Thought Process for Feature Selection
- **Core Problem Analysis**: Teams need to track and understand GitHub Copilot usage patterns across users and models, particularly tracking quota usage.
- **User Context**: Team leads or administrators who need to monitor resource usage, likely accessed periodically for reporting purposes.
- **Critical Path**: Upload CSV → Parse data → View visualization → Draw insights
- **Key Moments**: 
  1. File upload and successful parsing
  2. Rendering the visualization with clear data representation
  3. Toggling between different view options (if implemented)

## Essential Features
1. **CSV Upload**
   - What: Allow users to upload GitHub Copilot usage CSV exports
   - Why: Provides the raw data needed for analysis
   - Success: Properly parses CSV format with correct data types and handles validation

2. **Stacked Line Graph**
   - What: Visualize request data by model per day with color-coded status indicators
   - Why: Makes usage patterns and quota status immediately apparent
   - Success: Clearly shows trends over time and distinguishes between quota-compliant and exceeding requests

3. **Data Processing**
   - What: Transform raw CSV data into aggregated daily metrics by model
   - Why: Converts raw timestamp data into meaningful daily summaries
   - Success: Correctly groups and counts requests by day, model, and quota status

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Confidence, clarity, and professionalism
- **Design Personality**: Clean, analytical, and technical with a modern GitHub-inspired aesthetic
- **Visual Metaphors**: Data flow, resource monitoring
- **Simplicity Spectrum**: Minimal interface with focus on the visualization

### Color Strategy
- **Color Scheme Type**: Custom palette with GitHub-inspired colors
- **Primary Color**: GitHub-blue (oklch(0.55 0.18 250)) - represents the professional identity
- **Secondary Colors**: Neutral grays for UI elements
- **Accent Color**: Green for compliant requests, Red for quota-exceeding requests
- **Color Psychology**: Blue conveys trustworthiness, green represents safety/compliance, red indicates warning/excess
- **Color Accessibility**: High contrast between text and backgrounds, distinct colors for data visualization
- **Foreground/Background Pairings**:
  - Background (oklch(0.98 0.01 240)) / Foreground (oklch(0.25 0.01 240))
  - Card (oklch(1 0 0)) / Card-foreground (oklch(0.25 0.01 240))
  - Primary (oklch(0.55 0.18 250)) / Primary-foreground (oklch(1 0 0))
  - Secondary (oklch(0.9 0.03 240)) / Secondary-foreground (oklch(0.3 0.01 240))
  - Accent (oklch(0.65 0.15 145)) / Accent-foreground (oklch(0.2 0.01 240))
  - Destructive (oklch(0.65 0.15 30)) / Destructive-foreground (oklch(1 0 0))

### Typography System
- **Font Pairing Strategy**: Single sans-serif font family for consistency with weight variations for hierarchy
- **Typographic Hierarchy**: Clear heading/body distinction with size and weight
- **Font Personality**: Professional, clean, highly readable
- **Readability Focus**: Generous line height, optimal line length for instructions
- **Typography Consistency**: Consistent font sizing using relative units
- **Which fonts**: Inter - a clean, modern sans-serif optimized for screen readability
- **Legibility Check**: High legibility at all sizes, works well for both data labels and body text

### Visual Hierarchy & Layout
- **Attention Direction**: Upload area prominent initially, visualization takes focus after data is loaded
- **White Space Philosophy**: Generous spacing to create focus on the visualization
- **Grid System**: Simple single-column layout on mobile, extending to a more spacious layout on larger screens
- **Responsive Approach**: Chart container adapts to available width, UI controls stack on smaller screens
- **Content Density**: Focused presentation with minimal UI elements competing with the data visualization

### Animations
- **Purposeful Meaning**: Subtle transitions when loading data and rendering chart
- **Hierarchy of Movement**: Chart animation shows data appearing sequentially to help comprehension
- **Contextual Appropriateness**: Minimal animations focused on data state changes

### UI Elements & Component Selection
- **Component Usage**: Card for the upload area, Button for triggering upload, Toast for notifications
- **Component Customization**: Rounded corners and subtle shadows for cards
- **Component States**: Clear hover/focus states for interactive elements
- **Icon Selection**: Upload icon, chart icon, and information icon where appropriate
- **Component Hierarchy**: Upload component as primary action initially, chart as main focus after data load
- **Spacing System**: Consistent spacing using Tailwind's spacing scale
- **Mobile Adaptation**: Stacked layout on mobile with full-width components

### Visual Consistency Framework
- **Design System Approach**: Component-based using shadcn components
- **Style Guide Elements**: Typography scale, color tokens, spacing rhythm
- **Visual Rhythm**: Consistent padding and spacing throughout the interface
- **Brand Alignment**: GitHub-inspired aesthetic with professional data visualization

### Accessibility & Readability
- **Contrast Goal**: WCAG AA compliance for all text and interactive elements
- **Chart Accessibility**: Multiple visual cues beyond color (patterns or labels) to distinguish data series

## Edge Cases & Problem Scenarios
- **Potential Obstacles**: Malformed CSV files, very large datasets
- **Edge Case Handling**: Validation messaging for incorrect file formats, graceful handling of parsing errors
- **Technical Constraints**: Browser-based CSV parsing limitations

## Implementation Considerations
- **Scalability Needs**: Potential for additional chart types or filtering options in the future
- **Testing Focus**: Validate with various CSV formats and sizes
- **Critical Questions**: How to optimize performance for large datasets?

## Reflection
- This approach uniquely focuses on simplicity and clarity for a technical audience needing quick insights.
- We assume users have access to correctly formatted GitHub Copilot usage exports.
- The exceptional aspect will be the intuitive visualization that immediately communicates patterns without requiring manual data manipulation.