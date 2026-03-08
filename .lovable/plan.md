

# Fix Header Navigation Buttons

## Problem
The three nav buttons in the header — **AI Analytics**, **CSV / XML**, and **Export** — are purely decorative `div` elements with no click handlers or functionality.

## Plan

### 1. Make Header accept callbacks from Index
- Add props to `Header`: `onScrollToAI`, `onScrollToUpload`, `onExport`, and `hasData` (to know if data is loaded)
- **AI Analytics**: Scrolls to the AIInsights section (only when data is loaded)
- **CSV / XML**: Scrolls to the FileUpload section or triggers file upload dialog
- **Export**: Exports the current data as CSV (only when data is loaded)

### 2. Add refs in Index.tsx
- Add `useRef` for key sections: `aiInsightsRef`, `fileUploadRef`
- Pass scroll handlers and an export handler to `Header`
- Export handler: convert `currentData` to CSV using PapaParse's `unparse` and trigger a download

### 3. Visual feedback
- Disable/dim nav buttons when no data is loaded (for AI Analytics and Export)
- Add active state styling on click

### Files to modify
- `src/components/Header.tsx` — Accept and wire up callback props, add disabled state
- `src/pages/Index.tsx` — Create refs, scroll handlers, export function, pass props to Header

No changes to any analytics, chart, or dashboard components.

