

## Problem Analysis

There are three distinct bugs and two improvement areas:

### Bug 1: Smart Chart Recommendations "Add to Dashboard" does nothing
In `Index.tsx` (line 89-93), the `onChartAdd` callback from `SmartChartRecommendations` just does `console.log`. It never communicates with the `CustomDashboard` component. These are sibling components with no shared state for adding charts.

### Bug 2: Custom Dashboard ChartSelector adds charts but many show "No data available"
In `ChartRenderer.tsx`, the `generateChartData` function only handles `bar`, `pie`, `line`, `area`, `scatter`, and `histogram` in its data generation switch. All other chart types (`column`, `donut`, `boxplot`, `heatmap`, `treemap`, `bubble`, `stacked-bar`, `stacked-area`, `funnel`, `waterfall`, `radar`, `gauge`, `bullet`, `sankey`, `gantt`, `venn`, `sunburst`, `map`) fall to `default: return []` — which triggers the "No data available" message.

Meanwhile, the `renderChart` function handles `column` and `donut` visually, but they never get data because `generateChartData` doesn't produce data for them.

### Bug 3: Many chart types show placeholder "Coming Soon"
In `renderChart`, 14 chart types (`bubble`, `stacked-bar`, `stacked-area`, `funnel`, `waterfall`, `bullet`, `gauge`, `radar`, `sankey`, `gantt`, `venn`, `sunburst`, `treemap`, `map`) render a placeholder emoji instead of actual charts.

---

## Plan

### 1. Connect Smart Chart Recommendations to Custom Dashboard
- Lift the dashboard chart state up to `Index.tsx` or use a ref/callback pattern
- Pass an `addChartToDashboard` function from `CustomDashboard` up to `Index.tsx` via a ref or state, then pass it down to `SmartChartRecommendations`
- When user clicks "Add Chart" in recommendations, it actually adds to the dashboard charts array

### 2. Fix ChartRenderer data generation for all chart types
Add proper data generation cases in `generateChartData` for every chart type:
- **column, donut, funnel, treemap, sunburst, map**: Use categorical counting (same as bar/pie)
- **stacked-bar, stacked-area**: Use categorical + multiple numeric columns
- **bubble**: Use 3 numeric columns (x, y, size)
- **boxplot**: Calculate quartiles from numeric data
- **heatmap**: Build correlation matrix from numeric columns
- **waterfall**: Show cumulative changes in numeric data
- **bullet**: Show actual vs target from numeric columns
- **gauge**: Show single metric as percentage of range
- **radar**: Multi-dimensional numeric comparison
- **gantt**: Use categorical + numeric for timeline bars
- **sankey**: Flow between two categorical columns
- **venn**: Set overlap from categorical columns

### 3. Implement actual chart rendering for all types
Replace the placeholder "Coming Soon" renders with real Recharts implementations:
- **boxplot**: Custom bar chart showing Q1, median, Q3
- **heatmap**: Grid of colored cells using recharts custom shapes
- **treemap**: Recharts `Treemap` component (already available)
- **bubble**: ScatterChart with variable dot size
- **stacked-bar**: BarChart with multiple stacked Bar components
- **stacked-area**: AreaChart with multiple stacked Areas
- **funnel**: Horizontal bar chart sorted descending (funnel shape)
- **waterfall**: Bar chart with invisible base bars
- **bullet**: Horizontal bar with reference line
- **gauge**: Semi-circle using PieChart
- **radar**: Recharts `RadarChart` (import `Radar`, `RadarChart`, `PolarGrid`, `PolarAngleAxis`)
- **sankey**: Custom visualization using bars + labels
- **gantt**: Horizontal bar chart representing timeline
- **venn**: SVG circles with overlap
- **sunburst**: Nested PieChart rings
- **map**: Table/grid representation of geographic data

### 4. UI/UX Improvements
- Add smooth transitions and better loading states
- Improve chart card layout with consistent sizing
- Add column selector dropdown in dashboard charts so users can change which column a chart uses
- Better empty states and error handling
- Improve header with better navigation

### 5. AI Analyzer Efficiency
- Remove fake `setTimeout` delay in `AIInsights.tsx` — run analysis synchronously since it's all client-side math
- Memoize computed values (numeric/categorical column detection is duplicated across 5+ components)
- Create a shared `useDataAnalysis` hook that computes column types, statistics, correlations once and shares across all components
- Deduplicate the `calculateCorrelation`, `getNumericColumns`, `getCategoricalColumns` functions that are copy-pasted in multiple files

### Technical Details

**Files to modify:**
- `src/pages/Index.tsx` — Lift dashboard state, connect recommendations to dashboard
- `src/components/ChartRenderer.tsx` — Full rewrite of data generation + rendering for all 24 chart types
- `src/components/CustomDashboard.tsx` — Expose addChart method, add column selector per chart
- `src/components/SmartChartRecommendations.tsx` — Minor fix to use shared callback
- `src/components/AIInsights.tsx` — Remove fake delay, use shared hook
- New: `src/hooks/useDataAnalysis.ts` — Shared memoized data analysis hook
- `src/components/Header.tsx` — UI polish

**New dependency needed:** Recharts already includes `Treemap`, `RadarChart`, `Radar`, `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis` — just need to import them.

