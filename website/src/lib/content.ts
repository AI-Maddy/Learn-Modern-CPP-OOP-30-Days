import manifestJson from "../content/manifest.json";
import type { DayData, CheatsheetData, Cluster, Manifest } from "./types";

export const manifest = manifestJson as Manifest;
export const allDays = manifest.days;
export const clusters = manifest.clusters;

export function getDay(slug: string) {
  const meta = allDays.find((d) => d.slug === slug);
  if (!meta) return null;
  // Dynamic import of full day JSON (includes readme/theory/pitfalls/code)
  return meta;
}

export function getDayFull(slug: string): DayData | null {
  try {
    // We use this in getStaticPaths — load from JSON at build time
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require(`../content/days/${slug}.json`);
    return data as DayData;
  } catch {
    return null;
  }
}

export function getAllCheatsheets(): CheatsheetData[] {
  // Glob all cheatsheet JSONs at build time
  const files = import.meta.glob("../content/cheatsheets/*.json", {
    eager: true,
  }) as Record<string, { default: CheatsheetData }>;
  return Object.values(files).map((m) => m.default ?? m as unknown as CheatsheetData);
}

export function getClusterStyle(color: string) {
  const map: Record<string, { border: string; bg: string; text: string; badge: string }> = {
    blue:   { border: "border-blue-500",   bg: "bg-blue-500/10",   text: "text-blue-400",   badge: "bg-blue-500/20 text-blue-300" },
    green:  { border: "border-green-500",  bg: "bg-green-500/10",  text: "text-green-400",  badge: "bg-green-500/20 text-green-300" },
    violet: { border: "border-violet-500", bg: "bg-violet-500/10", text: "text-violet-400", badge: "bg-violet-500/20 text-violet-300" },
    red:    { border: "border-red-500",    bg: "bg-red-500/10",    text: "text-red-400",    badge: "bg-red-500/20 text-red-300" },
    orange: { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-400", badge: "bg-orange-500/20 text-orange-300" },
    yellow: { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", badge: "bg-yellow-500/20 text-yellow-300" },
    slate:  { border: "border-slate-500",  bg: "bg-slate-500/10",  text: "text-slate-400",  badge: "bg-slate-500/20 text-slate-300" },
  };
  return map[color] ?? map.slate;
}
