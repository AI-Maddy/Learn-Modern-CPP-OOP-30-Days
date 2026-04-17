#!/usr/bin/env python3
"""
convert-content.py
──────────────────
Reads the RST source files from the Learn-Modern-CPP-OOP-30-Days repository
and converts them into JSON files that the Astro website can consume at
build time.

Run this script whenever you edit a .rst or main.cpp source file:
    python scripts/convert-content.py

Prerequisites:
    pip install pandoc   (or: sudo apt install pandoc)
    The `pandoc` binary must be on your PATH.
"""

import os        # Standard library: operating-system utilities (not used directly but common practice)
import re        # Standard library: regular expressions for parsing directory names
import json      # Standard library: serialise Python dicts → JSON text
import shutil    # Standard library: high-level file operations (imported but unused — safe to keep)
import subprocess# Standard library: run external commands (here: pandoc)
from pathlib import Path  # Standard library: object-oriented file paths (cleaner than os.path)

# ── Path constants ─────────────────────────────────────────────────────────────
# __file__ is the path to this script.  .parent.parent.parent walks up three
# directory levels: scripts/ → website/ → Learn-Modern-CPP-OOP-30-Days/
REPO_ROOT = Path(__file__).parent.parent.parent

# src/ holds the Day-XX-* directories with .rst and .cpp source files.
SRC_DIR = REPO_ROOT / "src"

# cheatsheets/ holds the standalone .rst cheatsheet files.
CHEATSHEETS_DIR = REPO_ROOT / "cheatsheets"

# Output paths inside the website's Astro content directory.
OUT_DAYS        = Path(__file__).parent.parent / "src" / "content" / "days"        # One JSON per day
OUT_CHEATSHEETS = Path(__file__).parent.parent / "src" / "content" / "cheatsheets" # One JSON per cheatsheet

# ── Cluster definitions ────────────────────────────────────────────────────────
# A "cluster" groups related days into a themed section shown on the homepage
# and as hub nodes on the mind-map.  Each entry maps a cluster key to its
# metadata: which day numbers belong, display color, emoji icon, and label.
CLUSTERS = {
    "foundations":  {"days": [0, 1, 2],        "color": "blue",   "icon": "🔵", "label": "Foundations"},
    "oop-core":     {"days": [3, 4, 5, 6, 7, 8], "color": "green",  "icon": "🟢", "label": "OOP Core"},
    "templates":    {"days": [9, 10, 11, 12],   "color": "violet", "icon": "🟣", "label": "Templates & Generics"},
    "memory":       {"days": [13, 14, 15],       "color": "red",    "icon": "🔴", "label": "Memory & Ownership"},
    "modern-cpp":   {"days": list(range(16,24)), "color": "orange", "icon": "🟠", "label": "Modern C++20/23"},
    "projects":     {"days": [24, 25, 26, 27],  "color": "yellow", "icon": "🟡", "label": "Mini Projects"},
    "review":       {"days": [28, 29, 30],       "color": "slate",  "icon": "⚪", "label": "Review & Cert Prep"},
}

def get_cluster(day_num: int) -> dict:
    """Return the cluster dict for a given day number.

    Iterates the CLUSTERS dictionary to find which cluster lists this day.
    Falls back to the "review" cluster if the day number isn't found anywhere
    (this shouldn't happen for valid day numbers 0–30).
    """
    for key, c in CLUSTERS.items():   # key = cluster name, c = its metadata dict
        if day_num in c["days"]:      # Check if this day belongs to this cluster
            return {"key": key, **c}  # Merge the key into the dict using ** unpacking
    # Default: if no cluster matches, assign to "review" (safe fallback)
    return {"key": "review", **CLUSTERS["review"]}

def rst_to_md(rst_text: str) -> str:
    """Convert an RST (reStructuredText) string to GitHub-Flavored Markdown.

    Uses pandoc, an external command-line document converter, to do the heavy
    lifting.  We pipe the RST text in via stdin and read the Markdown from stdout.

    --from=rst          : tells pandoc the input format
    --to=gfm            : GitHub-Flavored Markdown output (renders well in browsers)
    --wrap=none         : disable automatic line wrapping (keeps long lines intact)
    """
    result = subprocess.run(
        ["pandoc", "--from=rst", "--to=gfm", "--wrap=none"],  # Command + args
        input=rst_text,       # Feed RST text via stdin
        capture_output=True,  # Capture stdout and stderr instead of printing them
        text=True             # Decode output as UTF-8 text (not raw bytes)
    )
    return result.stdout  # The converted Markdown string

def read_cpp(path: Path) -> str:
    """Read a C++ source file and return its text, or empty string if missing."""
    if path.exists():                              # Only read if the file is present
        return path.read_text(encoding="utf-8")   # Read as UTF-8 text
    return ""  # Graceful empty string if main.cpp doesn't exist for this day

def parse_day_dir(day_dir: Path) -> dict | None:
    """Parse a single Day-XX-* directory and return a dict of all its data.

    Returns None if the directory name doesn't match the expected pattern
    (e.g. a stray folder that isn't a day directory).
    """
    # Extract day number and slug from directory names like "Day-05-Smart-Pointers-Ownership"
    # re.match returns None if the pattern doesn't match — we return None in that case.
    m = re.match(r"Day-(\d+)-(.+)", day_dir.name)
    if not m:
        return None  # Not a day directory — skip it

    day_num  = int(m.group(1))    # e.g. 5   (captured by the first group \d+)
    slug_raw = m.group(2)         # e.g. "Smart-Pointers-Ownership"
    title    = slug_raw.replace("-", " ")  # e.g. "Smart Pointers Ownership"

    cluster = get_cluster(day_num)  # Look up the cluster metadata for this day

    # Convert each .rst file to Markdown if it exists, otherwise use empty string.
    # The one-liner `X if condition else Y` is a Python ternary expression.
    readme_md   = rst_to_md((day_dir / "README.rst").read_text())   if (day_dir / "README.rst").exists()   else ""
    theory_md   = rst_to_md((day_dir / "theory.rst").read_text())   if (day_dir / "theory.rst").exists()   else ""
    pitfalls_md = rst_to_md((day_dir / "pitfalls.rst").read_text()) if (day_dir / "pitfalls.rst").exists() else ""
    code_cpp    = read_cpp(day_dir / "main.cpp")  # Raw C++ source (not converted)

    # Build and return the complete day data dictionary.
    # This becomes the JSON file that the Astro website reads.
    return {
        "day":          day_num,            # Numeric day index
        "title":        title,              # Human-readable title with spaces
        "slug":         f"day-{day_num:02d}",  # e.g. "day-05" (zero-padded for sorting)
        "cluster":      cluster["key"],     # Cluster key, e.g. "memory"
        "clusterLabel": cluster["label"],   # Display label, e.g. "Memory & Ownership"
        "clusterColor": cluster["color"],   # Tailwind colour name, e.g. "red"
        "clusterIcon":  cluster["icon"],    # Emoji, e.g. "🔴"
        "readme":       readme_md,          # Markdown from README.rst
        "theory":       theory_md,          # Markdown from theory.rst
        "pitfalls":     pitfalls_md,        # Markdown from pitfalls.rst
        "code":         code_cpp,           # Raw C++ source from main.cpp
    }

def write_day(data: dict):
    """Serialise a day data dict to a JSON file in the content/days/ directory."""
    out_dir = OUT_DAYS            # Target directory for day JSON files
    out_dir.mkdir(parents=True, exist_ok=True)  # Create directory tree if needed
    slug = data["slug"]           # e.g. "day-05"

    # Build a frontmatter dict that excludes the large content fields.
    # (We keep the content inside the same JSON file for simplicity.)
    frontmatter = {k: v for k, v in data.items() if k not in ("readme", "theory", "pitfalls", "code")}
    fm_lines = ["---"]  # Start frontmatter block (YAML convention)
    for k, v in frontmatter.items():
        # Numbers and booleans need json.dumps to produce valid YAML values (true/false/42).
        # Strings are wrapped in double-quotes.
        val = json.dumps(v) if isinstance(v, (int, bool)) else f'"{v}"'
        fm_lines.append(f"{k}: {val}")  # Append each key: value line
    fm_lines.append("---")  # Close frontmatter block
    fm = "\n".join(fm_lines)  # Join lines into a single string (not used further but available)

    # Write the entire data dict (including content) as a pretty-printed JSON file.
    # ensure_ascii=False preserves emoji and special characters unchanged.
    (out_dir / f"{slug}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"  ✓ {slug}: {data['title']}")  # Progress indicator in the terminal

def parse_cheatsheet(rst_path: Path) -> dict:
    """Read one cheatsheet .rst file and return a dict with slug, title, and content."""
    name  = rst_path.stem                        # File stem = filename without .rst extension
    title = name.replace("-", " ").title()       # Convert kebab-case to Title Case
    md    = rst_to_md(rst_path.read_text())      # Convert RST → Markdown via pandoc
    return {
        "slug":    name,   # URL-safe identifier, e.g. "raii-smart-pointers"
        "title":   title,  # Display title, e.g. "Raii Smart Pointers"
        "content": md,     # Full Markdown body
    }

def write_cheatsheet(data: dict):
    """Write one cheatsheet dict to a JSON file in content/cheatsheets/."""
    OUT_CHEATSHEETS.mkdir(parents=True, exist_ok=True)  # Create directory if needed
    # Write the JSON file named after the slug, e.g. "raii-smart-pointers.json"
    (OUT_CHEATSHEETS / f"{data['slug']}.json").write_text(
        json.dumps(data, indent=2, ensure_ascii=False)  # Pretty JSON, preserves emoji
    )
    print(f"  ✓ cheatsheet: {data['slug']}")  # Terminal progress indicator

def main():
    """Entry point: convert all days and all cheatsheets."""
    print("Converting day directories...")

    # sorted() + key=lambda ensures we process Day-00, Day-01, … in order.
    day_dirs  = sorted(SRC_DIR.glob("Day-*"), key=lambda p: p.name)
    days_meta = []  # Will accumulate lightweight metadata (no content) for the manifest

    for d in day_dirs:
        data = parse_day_dir(d)   # Try to parse this directory
        if data:                  # Skip directories that didn't match the name pattern
            write_day(data)       # Write the full JSON file for this day
            # Append only the metadata fields (no readme/theory/pitfalls/code) to the list.
            # dict comprehension filters out the four large content keys.
            days_meta.append({k: v for k, v in data.items() if k not in ("readme", "theory", "pitfalls", "code")})

    # Write the manifest JSON — a single file listing all days and clusters.
    # The Astro homepage loads this to render the day grid and cluster sections
    # without having to open every individual day JSON.
    manifest_path = OUT_DAYS.parent / "manifest.json"  # content/manifest.json
    manifest = {
        "days":     days_meta,   # List of all DayMeta objects (lightweight)
        "clusters": CLUSTERS,    # Cluster definitions with colors and day numbers
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"\n  ✓ manifest written ({len(days_meta)} days)")

    print("\nConverting cheatsheets...")
    for rst in sorted(CHEATSHEETS_DIR.glob("*.rst")):  # Process cheatsheets alphabetically
        if rst.name == "index.rst":  # Skip the index file — it's a table of contents, not a card
            continue
        write_cheatsheet(parse_cheatsheet(rst))  # Convert and save this cheatsheet

    print(f"\nDone. {len(days_meta)} days + cheatsheets converted.")

# Python idiom: only call main() when this script is run directly,
# not when it is imported as a module by another script.
if __name__ == "__main__":
    main()
