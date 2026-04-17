// ─────────────────────────────────────────────────────────────────────────────
// content.ts  —  Central helper that loads JSON content at Astro build time.
// Astro is a static-site generator: all data is read during `astro build`,
// NOT when a visitor opens the page.  This file bridges our JSON files with
// the Astro pages that render them.
// ─────────────────────────────────────────────────────────────────────────────

// Import the manifest (list of all days + clusters) produced by convert-content.py.
// Using a static JSON import is the fastest option — no filesystem read at runtime.
import manifestJson from "../content/manifest.json";

// Import the TypeScript types so the compiler can verify our data shapes.
import type { DayData, CheatsheetData, Cluster, Manifest } from "./types";

// Cast the raw JSON import to our Manifest type.
// TypeScript imports JSON as `any` by default; the cast tells the compiler
// exactly what shape to expect so we get autocomplete and type errors downstream.
export const manifest = manifestJson as Manifest;

// Convenience re-exports so pages only need to import from one place.
export const allDays = manifest.days;      // Array of all DayMeta objects
export const clusters = manifest.clusters; // Map of cluster key → Cluster object

// getDay — look up the lightweight DayMeta for a given URL slug.
// Returns null when the slug doesn't match any known day (shouldn't happen
// in production because getStaticPaths() enumerates all known slugs).
export function getDay(slug: string) {
  // Array.find searches linearly and stops at the first match.
  const meta = allDays.find((d) => d.slug === slug);
  if (!meta) return null; // Slug not found — caller should handle this
  // Dynamic import of full day JSON (includes readme/theory/pitfalls/code)
  return meta; // Return the metadata object
}

// getDayFull — load the FULL day data (including markdown content) at build time.
// We use require() here because Astro's static build runs this code in Node.js
// where CommonJS require() works synchronously.  The eslint comment suppresses
// the "no dynamic require" rule for this specific line.
export function getDayFull(slug: string): DayData | null {
  try {
    // Build the path to the day's JSON file and require() it synchronously.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require(`../content/days/${slug}.json`);
    return data as DayData; // Cast to DayData so callers get typed access
  } catch {
    // If the file doesn't exist (bad slug), return null instead of crashing.
    return null;
  }
}

// getAllCheatsheets — collect every cheatsheet JSON file in one array.
// import.meta.glob is a Vite/Astro special function that expands a glob pattern
// at *build time* into a map of { filePath → module }.  Setting eager:true means
// all files are loaded immediately rather than lazily.
export function getAllCheatsheets(): CheatsheetData[] {
  // Glob all cheatsheet JSONs at build time — Vite expands the pattern to a
  // plain object whose keys are file paths and values are the imported modules.
  const files = import.meta.glob("../content/cheatsheets/*.json", {
    eager: true, // Load all matching files immediately (not lazy imports)
  }) as Record<string, { default: CheatsheetData }>; // Type the result explicitly

  // Each module value may have the JSON under `.default` (ES module) or directly
  // on the value (CommonJS).  The `?? m` fallback handles the CommonJS case.
  return Object.values(files).map((m) => m.default ?? m as unknown as CheatsheetData);
}

// getClusterStyle — convert a cluster's color name into a set of Tailwind
// class strings for consistent theming across all pages and components.
// Returns four classes: border, background, text, and badge styles.
export function getClusterStyle(color: string) {
  // A lookup table mapping color names to their corresponding Tailwind classes.
  // `/10` means 10% opacity; `/20` means 20% opacity — a Tailwind v3+ feature.
  const map: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    blue:   { border: "border-blue-500",   bg: "bg-blue-500/10",   text: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300" },
    green:  { border: "border-green-500",  bg: "bg-green-500/10",  text: "text-green-400",  badge: "bg-green-500/20 text-green-300" },
    violet: { border: "border-violet-500", bg: "bg-violet-500/10", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-300" },
    red:    { border: "border-red-500",    bg: "bg-red-500/10",    text: "text-red-400",    badge: "bg-red-500/20 text-red-300" },
    orange: { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-300" },
    yellow: { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300" },
    slate:  { border: "border-slate-500",  bg: "bg-slate-500/10",  text: "text-slate-400",  badge: "bg-slate-500/20 text-slate-300" },
  };
  // Return the matching entry, or fall back to slate if the color is unknown.
  return map[color] ?? map.slate;
}
