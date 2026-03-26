#!/usr/bin/env python3
"""
Convert RST content from the Learn-Modern-CPP-OOP-30-Days repo
into Markdown files for Astro content collections.
"""

import os
import re
import json
import shutil
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent
SRC_DIR = REPO_ROOT / "src"
CHEATSHEETS_DIR = REPO_ROOT / "cheatsheets"
OUT_DAYS = Path(__file__).parent.parent / "src" / "content" / "days"
OUT_CHEATSHEETS = Path(__file__).parent.parent / "src" / "content" / "cheatsheets"

# Topic cluster definitions
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
    for key, c in CLUSTERS.items():
        if day_num in c["days"]:
            return {"key": key, **c}
    return {"key": "review", **CLUSTERS["review"]}

def rst_to_md(rst_text: str) -> str:
    """Convert RST to Markdown using pandoc."""
    result = subprocess.run(
        ["pandoc", "--from=rst", "--to=gfm", "--wrap=none"],
        input=rst_text, capture_output=True, text=True
    )
    return result.stdout

def read_cpp(path: Path) -> str:
    if path.exists():
        return path.read_text(encoding="utf-8")
    return ""

def parse_day_dir(day_dir: Path) -> dict | None:
    # Extract day number from dir name like Day-05-Smart-Pointers-Ownership
    m = re.match(r"Day-(\d+)-(.+)", day_dir.name)
    if not m:
        return None
    day_num = int(m.group(1))
    slug_raw = m.group(2)
    title = slug_raw.replace("-", " ")

    cluster = get_cluster(day_num)

    readme_md  = rst_to_md((day_dir / "README.rst").read_text())  if (day_dir / "README.rst").exists()  else ""
    theory_md  = rst_to_md((day_dir / "theory.rst").read_text())  if (day_dir / "theory.rst").exists()  else ""
    pitfalls_md= rst_to_md((day_dir / "pitfalls.rst").read_text())if (day_dir / "pitfalls.rst").exists() else ""
    code_cpp   = read_cpp(day_dir / "main.cpp")

    return {
        "day": day_num,
        "title": title,
        "slug": f"day-{day_num:02d}",
        "cluster": cluster["key"],
        "clusterLabel": cluster["label"],
        "clusterColor": cluster["color"],
        "clusterIcon": cluster["icon"],
        "readme": readme_md,
        "theory": theory_md,
        "pitfalls": pitfalls_md,
        "code": code_cpp,
    }

def write_day(data: dict):
    out_dir = OUT_DAYS
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = data["slug"]

    # Write frontmatter + content as MDX
    frontmatter = {k: v for k, v in data.items() if k not in ("readme", "theory", "pitfalls", "code")}
    fm_lines = ["---"]
    for k, v in frontmatter.items():
        val = json.dumps(v) if isinstance(v, (int, bool)) else f'"{v}"'
        fm_lines.append(f"{k}: {val}")
    fm_lines.append("---")
    fm = "\n".join(fm_lines)

    # Write separate section files for clean MDX
    (out_dir / f"{slug}.json").write_text(json.dumps(data, indent=2, ensure_ascii=False))
    print(f"  ✓ {slug}: {data['title']}")

def parse_cheatsheet(rst_path: Path) -> dict:
    name = rst_path.stem
    title = name.replace("-", " ").title()
    md = rst_to_md(rst_path.read_text())
    return {
        "slug": name,
        "title": title,
        "content": md,
    }

def write_cheatsheet(data: dict):
    OUT_CHEATSHEETS.mkdir(parents=True, exist_ok=True)
    (OUT_CHEATSHEETS / f"{data['slug']}.json").write_text(
        json.dumps(data, indent=2, ensure_ascii=False)
    )
    print(f"  ✓ cheatsheet: {data['slug']}")

def main():
    print("Converting day directories...")
    day_dirs = sorted(SRC_DIR.glob("Day-*"), key=lambda p: p.name)
    days_meta = []
    for d in day_dirs:
        data = parse_day_dir(d)
        if data:
            write_day(data)
            days_meta.append({k: v for k, v in data.items() if k not in ("readme", "theory", "pitfalls", "code")})

    # Write manifest for the dashboard
    manifest_path = OUT_DAYS.parent / "manifest.json"
    manifest = {
        "days": days_meta,
        "clusters": CLUSTERS,
    }
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False))
    print(f"\n  ✓ manifest written ({len(days_meta)} days)")

    print("\nConverting cheatsheets...")
    for rst in sorted(CHEATSHEETS_DIR.glob("*.rst")):
        if rst.name == "index.rst":
            continue
        write_cheatsheet(parse_cheatsheet(rst))

    print(f"\nDone. {len(days_meta)} days + cheatsheets converted.")

if __name__ == "__main__":
    main()
