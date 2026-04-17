// ─────────────────────────────────────────────────────────────────────────────
// types.ts  —  Shared TypeScript type definitions for the whole website.
// Think of these as "contracts": every piece of data must match one of these
// shapes so the compiler catches typos and missing fields early.
// ─────────────────────────────────────────────────────────────────────────────

// DayMeta holds the lightweight summary of a single day.
// This is what goes into the sidebar list and the homepage grid —
// we deliberately keep it small so loading the full list is fast.
export interface DayMeta {
  day: number;         // Numeric day index, e.g. 0, 1, 2 … 30
  title: string;       // Human-readable title, e.g. "Setup And Basics"
  slug: string;        // URL-safe identifier, e.g. "day-00"
  cluster: string;     // Key of the learning cluster, e.g. "foundations"
  clusterLabel: string;// Display name for the cluster, e.g. "Foundations"
  clusterColor: string;// Tailwind color name for theming, e.g. "blue"
  clusterIcon: string; // Emoji shown next to the cluster name, e.g. "🔵"
}

// DayData extends DayMeta with the actual page content.
// It is only loaded when the user navigates to a specific day page,
// keeping the initial page load small.
export interface DayData extends DayMeta {
  readme: string;    // Markdown string for the Overview tab (from README.rst)
  theory: string;    // Markdown string for the Theory tab  (from theory.rst)
  pitfalls: string;  // Markdown string for the Pitfalls tab (from pitfalls.rst)
  code: string;      // Raw C++ source code shown in the Code tab (from main.cpp)
}

// CheatsheetData represents one reference card.
// There are 28 cheatsheets, each stored as a JSON file in content/cheatsheets/.
export interface CheatsheetData {
  slug: string;    // File-stem used as the URL path, e.g. "raii-smart-pointers"
  title: string;   // Display title shown on the card, e.g. "Raii Smart Pointers"
  content: string; // Full Markdown body converted from the .rst source
}

// Cluster groups several related days under one colour-coded topic.
// Displayed as coloured sections on the homepage and as hub nodes on the mind map.
export interface Cluster {
  days: number[];  // Array of day numbers belonging to this cluster, e.g. [0, 1, 2]
  color: string;   // Colour name used for Tailwind utility classes, e.g. "blue"
  icon: string;    // Emoji representing the cluster in the UI, e.g. "🔵"
  label: string;   // Short human-readable name, e.g. "Foundations"
}

// Manifest is the top-level index file written by convert-content.py.
// Astro loads this once at build time so every page knows all available days
// and clusters without scanning the filesystem at runtime.
export interface Manifest {
  days: DayMeta[];                    // Ordered list of all day summaries
  clusters: Record<string, Cluster>; // Map from cluster key → Cluster object
}
