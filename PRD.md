# Gas Station Data Viewer

Real-time gas station data viewer that fetches and displays French fuel price data from the official open data feed.

**Experience Qualities**:
1. **Informative** - Clear presentation of comprehensive fuel station data
2. **Responsive** - Fast loading and smooth scrolling through large datasets  
3. **Reliable** - Consistent data fetching and error handling

**Complexity Level**: Light Application (multiple features with basic state)
- Fetches external data, processes XML, displays in tables with statistics

## Essential Features

**Data Fetching**
- Functionality: Downloads and processes zip file containing XML fuel station data
- Purpose: Provides real-time access to official French fuel price information
- Trigger: App initialization and user refresh action
- Progression: Load app → Fetch zip file → Extract XML → Parse data → Display results
- Success criteria: Successfully loads and displays current fuel station data

**Statistics Display**
- Functionality: Shows key metrics about the dataset at the top of the page
- Purpose: Provides quick overview of data scope and freshness
- Trigger: After successful data load
- Progression: Data parsed → Calculate stats → Display in header section
- Success criteria: Accurate station count displayed prominently

**Data Table**
- Functionality: Scrollable table showing all fuel station details
- Purpose: Allows users to browse and search through complete dataset
- Trigger: After data processing completes
- Progression: User scrolls → Table virtualizes content → Smooth performance maintained
- Success criteria: All stations visible with key details, smooth scrolling performance

## Edge Case Handling

- **Network Failures**: Show retry button and error message if data fetch fails
- **Corrupted Data**: Display partial results with warning if XML parsing fails
- **Large Datasets**: Implement virtual scrolling to handle thousands of stations
- **Empty Results**: Show helpful message if no stations found in feed

## Design Direction

Clean, data-focused interface that feels professional and government-official, emphasizing clarity and readability over visual flair.

## Color Selection

Complementary (opposite colors) - Using blue and orange to create clear visual hierarchy between data sections and interactive elements.

- **Primary Color**: Deep Blue (oklch(0.45 0.15 240)) - Professional, trustworthy for official data
- **Secondary Colors**: Light Gray (oklch(0.95 0.02 240)) - Clean backgrounds for data tables
- **Accent Color**: Warm Orange (oklch(0.65 0.15 45)) - Highlights important stats and actions
- **Foreground/Background Pairings**: 
  - Background (White oklch(1 0 0)): Dark Gray text (oklch(0.2 0 0)) - Ratio 16.8:1 ✓
  - Card (Light Gray oklch(0.98 0.01 240)): Dark Gray text (oklch(0.2 0 0)) - Ratio 15.2:1 ✓
  - Primary (Deep Blue oklch(0.45 0.15 240)): White text (oklch(1 0 0)) - Ratio 8.9:1 ✓
  - Accent (Warm Orange oklch(0.65 0.15 45)): White text (oklch(1 0 0)) - Ratio 4.8:1 ✓

## Font Selection

Clean, highly legible sans-serif typeface that maintains readability across data-dense tables and statistical displays.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal spacing  
  - Stats Display: Inter Bold/28px/tabular numbers
  - Table Headers: Inter Medium/14px/uppercase tracking
  - Table Data: Inter Regular/14px/tabular figures for numbers

## Animations

Subtle, performance-focused animations that support data loading and navigation without interfering with information consumption.

- **Purposeful Meaning**: Loading states communicate progress, table interactions provide immediate feedback
- **Hierarchy of Movement**: Prioritize data loading indicators and table scroll responsiveness over decorative effects

## Component Selection

- **Components**: 
  - Card component for statistics display with subtle shadows
  - Table component with sticky headers and zebra striping
  - Button component for refresh actions with loading states
  - Alert component for error states and data freshness indicators
- **Customizations**: Virtual scrolling table wrapper for performance with large datasets
- **States**: Loading spinners, error alerts, empty states, and data freshness indicators
- **Icon Selection**: Refresh icon for data updates, alert icons for error states, gas pump icon for branding
- **Spacing**: Consistent 16px gaps between sections, 8px padding in table cells, 24px margins around page content
- **Mobile**: Horizontal scrolling tables on mobile, collapsible stats cards, touch-friendly refresh buttons