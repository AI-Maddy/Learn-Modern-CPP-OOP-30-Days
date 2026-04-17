#!/usr/bin/env bash
# rebuild.sh — Regenerate all docs from JSON source and rebuild MkDocs site
set -e
echo "🧠 Step 1: Regenerating docs from Astro JSON content..."
python3 scripts/generate_docs.py

echo ""
echo "🔨 Step 2: Building MkDocs static site..."
mkdocs build

echo ""
echo "✅ Done! Site is at: site/"
echo "   To serve locally: mkdocs serve"
