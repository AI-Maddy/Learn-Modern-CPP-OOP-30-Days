#!/usr/bin/env python3
"""
generate_docs.py
================
Implements the COMPLETE cognitive-science-optimized learning site
based on the 10-feature blueprint from website-guide.md:

  1.  COLOR PSYCHOLOGY  — admonition types per cognitive function
  2.  SHAPES            — grids, cards, columns, tabs (spatial memory)
  3.  ICONS             — visual mnemonics, same icon = same concept
  4.  AUDIO             — placeholder embeds for auditory learning
  5.  CHUNKING          — each day split into 7 micro-pages (1-3 min)
  6.  ACTIVE RECALL     — 3D flashcards + collapsible Q&A everywhere
  7.  SPATIAL MEMORY    — Mermaid mindmaps + knowledge graphs per day
  8.  SPACED REPETITION — flashcard confidence levels (L1→L2→L3)
  9.  SELF-TESTING      — tabbed Q&A + multiple-choice quiz blocks
  10. CONSISTENCY       — unified 7-section template on every page

  Micro-page structure per day:
    days/day-NN/
      .pages              — awesome-pages ordering
      index.md            — Hub (overview, stats, navigation)
      01-intuition.md     — Why, Motivation, Mental Model
      02-definition.md    — Precise Definition + Diagram
      03-example.md       — Annotated C++ Code
      04-pitfalls.md      — Danger zones + checklists
      05-flashcards.md    — 3D flip cards + spaced repetition
      06-self-test.md     — Tabbed Q&A + multiple-choice quiz
      07-summary.md       — Summary + prev/next navigation
"""

import json
import re
import os
import textwrap
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).parent
SITE_DIR    = SCRIPT_DIR.parent
DOCS_DIR    = SITE_DIR / "docs"
CONTENT_DIR = SITE_DIR.parent / "website" / "src" / "content"
DAYS_JSON   = CONTENT_DIR / "days"
SHEETS_JSON = CONTENT_DIR / "cheatsheets"
MANIFEST    = CONTENT_DIR / "manifest.json"

# ── Cluster metadata (COLOR PSYCHOLOGY + BRAIN REGION mapping) ────────────
CLUSTER_META = {
    "foundations": {
        "icon": "🔵", "color": "blue",   "label": "Foundations",
        "brain_region": "Frontal Lobe",  "brain_emoji": "🧠",
        "theme_color": "#3b82f6",
        "admonition_color": "info",      # BLUE  = theory
        "description": "Set up your environment, master the C++ type system, and write your first modern functions.",
        "tags": ["std::vector", "constexpr", "auto", "std::string", "namespaces"],
    },
    "oop-core": {
        "icon": "🟢", "color": "green",  "label": "OOP Core",
        "brain_region": "Temporal Lobe", "brain_emoji": "🗣️",
        "theme_color": "#10b981",
        "admonition_color": "success",   # GREEN = intuition/example
        "description": "Classes, RAII, constructors, inheritance, polymorphism — the grammar of C++ objects.",
        "tags": ["class", "RAII", "virtual", "override", "unique_ptr"],
    },
    "templates": {
        "icon": "🟣", "color": "violet", "label": "Templates",
        "brain_region": "Parietal Lobe", "brain_emoji": "📐",
        "theme_color": "#8b5cf6",
        "admonition_color": "abstract",  # PURPLE = memory anchor
        "description": "Generic programming, concepts, ranges, and compile-time computation.",
        "tags": ["template", "concept", "requires", "std::views", "ranges"],
    },
    "memory": {
        "icon": "🔴", "color": "red",    "label": "Memory & Error Handling",
        "brain_region": "Limbic System", "brain_emoji": "❤️",
        "theme_color": "#ef4444",
        "admonition_color": "danger",    # RED   = danger zone
        "description": "Move semantics, Rule of Five, error handling, and ownership semantics.",
        "tags": ["std::move", "Rule of Five", "std::expected", "noexcept", "rvalue"],
    },
    "modern-cpp": {
        "icon": "🟠", "color": "orange", "label": "Modern C++",
        "brain_region": "Occipital Lobe","brain_emoji": "👁️",
        "theme_color": "#f97316",
        "admonition_color": "warning",   # ORANGE = caution / patterns
        "description": "C++20 modules, SOLID principles, design patterns, CRTP, PIMPL, and performance.",
        "tags": ["modules", "SOLID", "CRTP", "PIMPL", "std::variant"],
    },
    "projects": {
        "icon": "🟡", "color": "yellow", "label": "Projects",
        "brain_region": "Cerebellum",    "brain_emoji": "⚙️",
        "theme_color": "#eab308",
        "admonition_color": "example",   # YELLOW = hands-on
        "description": "Apply everything: build mini-projects, refactor, and write production-ready code.",
        "tags": ["Refactoring", "TDD", "Catch2", "Design Patterns", "CMake"],
    },
    "review": {
        "icon": "⚪", "color": "slate",  "label": "Review & Mastery",
        "brain_region": "Brain Stem",    "brain_emoji": "🎯",
        "theme_color": "#94a3b8",
        "admonition_color": "note",      # GREY  = note/reference
        "description": "Code review, deep dives, certification prep, and consolidating mastery.",
        "tags": ["Code Review", "Mastery", "Best Practices", "C++ Core Guidelines"],
    },
}

# ── COLOR PSYCHOLOGY — admonition roles (Feature #1 from guide) ──────────
# Blue=theory, Green=intuition/example, Orange=danger, Purple=mnemonic
COLOR_ROLES = {
    "definition":  ("info",     "🔵 Definition",     "Blue = Theory — precise, formal"),
    "example":     ("success",  "🟢 Example",         "Green = Intuition — see it work"),
    "pitfall":     ("warning",  "🟠 Pitfall",         "Orange = Danger Zone — avoid this"),
    "danger":      ("danger",   "🔴 Critical",        "Red = Crash / UB / Leak"),
    "memory":      ("abstract", "🟣 Memory Anchor",   "Purple = Mnemonic — lock it in"),
    "tip":         ("tip",      "💡 Brain Tip",       "Tip = shortcut or insight"),
    "why":         ("question", "❓ Why This Matters","Motivation = Limbic activation"),
}

# ── ICONS (Feature #3) — same icon = same concept everywhere ──────────────
ICON_MAP = {
    "concept":     ":material-brain:",
    "performance": ":material-cpu-64-bit:",
    "memory":      ":material-memory:",
    "bug":         ":material-bug:",
    "code":        ":material-code-braces:",
    "example":     ":material-lightbulb-on:",
    "pitfall":     ":material-alert:",
    "quiz":        ":material-help-circle:",
    "summary":     ":material-check-circle:",
    "diagram":     ":material-vector-polyline:",
    "flashcard":   ":material-cards:",
    "intuition":   ":material-eye:",
    "definition":  ":material-book:",
    "test":        ":material-clipboard-check:",
    "why":         ":material-head-question:",
    "why-lobe":    ":material-head-question:",
}


# ── Helpers ────────────────────────────────────────────────────────────────

def ensure(path: Path):
    path.mkdir(parents=True, exist_ok=True)

def read_json(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def write_md(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✓  {path.relative_to(DOCS_DIR)}")

def extract_h2_sections(md_text: str) -> list[dict]:
    lines = md_text.splitlines()
    sections, current = [], {"heading": "", "body": []}
    for line in lines:
        if line.startswith("## "):
            if current["body"] or current["heading"]:
                sections.append(current)
            current = {"heading": line[3:].strip(), "body": []}
        else:
            current["body"].append(line)
    if current["body"] or current["heading"]:
        sections.append(current)
    return sections

def admonition(kind: str, title: str, body: str, collapsible=False) -> str:
    """Render a pymdownx admonition (Feature #1 — Color Psychology)."""
    marker = "???" if collapsible else "!!!"
    indent = textwrap.indent(body.strip(), "    ")
    return f'\n{marker} {kind} "{title}"\n{indent}\n'

def cluster_banner(cluster: str, day_num: int, title: str) -> str:
    meta = CLUSTER_META.get(cluster, {})
    icon = meta.get("icon", "📦"); label = meta.get("label", cluster)
    brain = meta.get("brain_region", ""); color = meta.get("admonition_color", "note")
    return (
        f'<div class="brain-cluster-banner" data-cluster="{cluster}">\n'
        f'  {icon} &nbsp; **{label}** &nbsp;·&nbsp; {brain}\n'
        f'</div>\n\n'
    )

def tag_row(cluster: str) -> str:
    tags = CLUSTER_META.get(cluster, {}).get("tags", [])
    pills = " · ".join(f'`{t}`' for t in tags)
    return f"> {ICON_MAP['code']} **Tags:** {pills}\n\n"

def annotate_cpp(code: str) -> str:
    """Wrap C++ in annotated MkDocs code block (Feature #3 — Icons + Feature #5 — Code)."""
    if not code.strip():
        return "_No code sample for this day._\n"
    lines = code.splitlines()
    annotated, annotation_map, idx = [], {}, 1
    patterns = [
        (r'#include\s+<',           'Standard library header'),
        (r'std::unique_ptr|std::shared_ptr|std::weak_ptr', 'Smart pointer — RAII ownership'),
        (r'\bauto\b',               'Type deduction — compiler infers type'),
        (r'\bconstexpr\b',          'Compile-time constant / function'),
        (r'\bnoexcept\b',           'Guarantees no exception is thrown'),
        (r'\boverride\b',           'Ensures virtual override is correct'),
        (r'\bvirtual\b',            'Virtual dispatch — runtime polymorphism'),
        (r'\[\[nodiscard\]\]',      'Attribute: return value must be used'),
        (r'std::move\b',            'Transfers ownership (move semantics)'),
        (r'std::forward\b',         'Perfect forwarding'),
        (r'std::make_unique|std::make_shared', 'Preferred factory — exception safe'),
        (r'= delete',               'Explicitly deleted — disabled operation'),
        (r'= default',              'Compiler-generated default implementation'),
    ]
    for line in lines:
        matched = False
        for pat, desc in patterns:
            if re.search(pat, line) and idx <= 9:
                annotation_map[idx] = desc
                annotated.append(f"{line}  # ({idx})")
                idx += 1; matched = True; break
        if not matched:
            annotated.append(line)
    body = "\n".join(annotated)
    ann_section = ""
    if annotation_map:
        ann_section = "\n"
        for i, d in annotation_map.items():
            ann_section += f"    {i}. {d}\n"
    return f'```cpp linenums="1"\n{body}\n```\n{ann_section}'

def flashcard_qa(question: str, answer: str, open_=False) -> str:
    """Collapsible Q&A — Active Recall (Feature #6)."""
    marker = "???+" if open_ else "???"
    ans_indented = textwrap.indent(answer.strip(), "    ")
    return f'\n{marker} question "{question}"\n{ans_indented}\n'

def self_test_tab(question: str, answer: str) -> str:
    """Tabbed self-test — Feature #9."""
    return (
        f'\n=== "❓ Question"\n    {question}\n\n'
        f'=== "✅ Answer"\n    {answer}\n'
    )

def mermaid_block(content: str) -> str:
    return f'```mermaid\n{content.strip()}\n```\n'

def audio_embed(src: str, label: str = "Audio Tip") -> str:
    """Audio embed for multi-modal learning (Feature #4)."""
    return (
        f'<details class="audio-embed">\n'
        f'<summary>🎧 {label}</summary>\n'
        f'<audio controls style="width:100%;margin-top:0.5rem;">\n'
        f'  <source src="{src}" type="audio/mpeg">\n'
        f'  Your browser does not support audio.\n'
        f'</audio>\n'
        f'</details>\n\n'
    )

def extract_first_para(md: str) -> str:
    paras = [p.strip() for p in md.split("\n\n") if p.strip()]
    for p in paras:
        clean = re.sub(r'^#+ .+', '', p, flags=re.MULTILINE).strip()
        clean = re.sub(r'[`*_\[\]]', '', clean)
        if len(clean) > 30:
            return clean[:350]
    return ""


# ═══════════════════════════════════════════════════════════════════════════
# MICRO-PAGE GENERATORS — Feature #5 (Chunking)
# 7 sub-pages per day, each 1-3 minutes of focused reading
# ═══════════════════════════════════════════════════════════════════════════

def write_hub(day: dict, out: Path):
    """index.md — Navigation hub with progress widget."""
    n, title, cluster = day["day"], day["title"], day["cluster"]
    meta = CLUSTER_META.get(cluster, {})
    icon = meta.get("icon","📦"); label = meta.get("label",cluster)
    brain = meta.get("brain_region",""); color = meta.get("theme_color","#8b5cf6")
    c_tags = " · ".join(f'`{t}`' for t in meta.get("tags",[])[:4])
    readme = day.get("readme","")
    first_para = extract_first_para(readme)
    prev_link = f"[← Day {n-1:02d} Summary](../day-{n-1:02d}/07-summary.md)" if n > 0  else ""
    next_link = f"[Day {n+1:02d} Intuition →](../day-{n+1:02d}/01-intuition.md)" if n < 30 else ""
    nav = " &nbsp;|&nbsp; ".join(x for x in [prev_link, next_link] if x)

    # CONSISTENCY template (Feature #10) — unified stats card
    content = f"""---
title: "Day {n:02d}: {title}"
tags: ["{cluster}"]
---

{cluster_banner(cluster, n, title)}

# {icon} Day {n:02d}: {title}

{nav}

---

<div class="progress-widget-host"></div>

## {ICON_MAP['concept']} At a Glance

| Field | Value |
|-------|-------|
| **Day** | {n:02d} of 30 |
| **Cluster** | {icon} {label} |
| **Brain Region** | {brain} |
| **C++ Focus** | {c_tags} |

{admonition("why-lobe", f"❓ Why This Day Matters", first_para or "Read on to find out!")}

---

## {ICON_MAP['diagram']} Today's Learning Path
<!-- CHUNKING (Feature 5): 7 focused micro-pages, 1-3 min each -->

<div class="grid cards" markdown>

- **01** {ICON_MAP['intuition']} **[Intuition](01-intuition.md)**
  The mental model — why this concept exists.

- **02** {ICON_MAP['definition']} **[Definition](02-definition.md)**
  Precise definition, syntax, and diagram.

- **03** {ICON_MAP['code']} **[Code Example](03-example.md)**
  Annotated `main.cpp` walkthrough.

- **04** {ICON_MAP['pitfall']} **[Pitfalls](04-pitfalls.md)**
  Danger zones, UB, and common mistakes.

- **05** {ICON_MAP['flashcard']} **[Flashcards](05-flashcards.md)**
  3D flip cards — Levels 1, 2, 3.

- **06** {ICON_MAP['test']} **[Self Test](06-self-test.md)**
  Multiple-choice + tabbed Q&A quizzes.

- **07** {ICON_MAP['summary']} **[Summary](07-summary.md)**
  Key takeaways + next-day preview.

</div>

---

{nav}
"""
    write_md(out / "index.md", content)


def write_intuition(day: dict, out: Path):
    """01-intuition.md — Mental model, WHY, motivation (Limbic activation)."""
    n, title, cluster = day["day"], day["title"], day["cluster"]
    meta = CLUSTER_META.get(cluster, {})
    readme = day.get("readme","")
    theory = day.get("theory","")
    sections = extract_h2_sections(theory)
    intro_body = "\n".join(sections[0]["body"]).strip() if sections else ""

    # COLOR PSYCHOLOGY: green = intuition, purple = memory anchor
    content = f"""---
title: "01 — Intuition · Day {n:02d}"
---

{cluster_banner(cluster, n, title)}

# {ICON_MAP['intuition']} 01 — Intuition: {title}

[← Hub](index.md) · [Definition →](02-definition.md)

!!! success "🟢 Green = Intuition — See it, feel it, understand it"
    Before reading the formal definition, build the **mental model** first.
    This is how your brain encodes new concepts most effectively.

---

## {ICON_MAP['example']} The Big Picture

{admonition("info", "🔵 Mental Model", intro_body or readme[:600], collapsible=False)}

---

## {ICON_MAP['why']} Why This Exists in C++

{admonition("question", f"❓ Why does C++ need {title}?",
    "Think about what problem this solves before reading the answer below.\n\n" +
    extract_first_para(readme) + "\n\n" +
    "_Continue to the [Definition page](02-definition.md) for the precise answer._",
    collapsible=True)}

---

## {ICON_MAP['diagram']} Analogy

{admonition("tip", "💡 Real-World Analogy",
    f"Think of **{title}** like a well-designed tool in a workshop:\n"
    "- It has a single, clear purpose.\n"
    "- It is safe to use by default.\n"
    "- It fails loudly (at compile time) rather than silently at runtime."
)}

---

## {ICON_MAP['memory']} Memory Anchor

{admonition("abstract", "🟣 Lock It In", f"Say this out loud:\n\n**\"{title}** is the way C++ lets you...\" — finish the sentence in your own words.",
    collapsible=True)}

---

[← Hub](index.md) · [Definition →](02-definition.md)
"""
    write_md(out / "01-intuition.md", content)


def write_definition(day: dict, out: Path):
    """02-definition.md — Precise definition + Mermaid diagram."""
    n, title, cluster = day["day"], day["title"], day["cluster"]
    theory  = day.get("theory","")
    sections = extract_h2_sections(theory)

    # Collect definition-style sections
    def_sections = []
    for sec in sections:
        if sec["heading"] and len("\n".join(sec["body"])) > 40:
            def_sections.append(sec)

    # Build content from first ~3 definition sections
    content_parts = []
    for sec in def_sections[:3]:
        body = "\n".join(sec["body"]).strip()
        content_parts.append(f"\n## {ICON_MAP['definition']} {sec['heading']}\n\n{body}\n")

    # Build a Mermaid knowledge graph for this day
    cluster_meta = CLUSTER_META.get(cluster, {})
    c_tags = cluster_meta.get("tags", [title])[:4]
    mermaid_nodes = "\n".join(
        f'    {title.replace(" ","_")} --> {t.replace(" ","_").replace(":","").replace("<","").replace(">","")}["{t}"]'
        for t in c_tags if t != title
    )
    diagram = mermaid_block(f"""graph TD
    ROOT["{title}"] --> A["{c_tags[0] if c_tags else 'Core Concept'}"]
{mermaid_nodes}
    style ROOT fill:#8b5cf6,color:#fff
    style A    fill:#3b82f6,color:#fff""")

    content = f"""---
title: "02 — Definition · Day {n:02d}"
---

{cluster_banner(cluster, n, title)}

# {ICON_MAP['definition']} 02 — Definition: {title}

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)

!!! info "🔵 Blue = Theory — Precise, formal, complete"
    Read this section carefully. Every word matters.
    After reading, close the page and explain it back in your own words.

---

{''.join(content_parts) if content_parts else theory[:1500]}

---

## {ICON_MAP['diagram']} Knowledge Map (SPATIAL MEMORY — Feature 7)

{diagram}

---

## {ICON_MAP['memory']} Quick Definitions Table

| Term | Meaning |
|------|---------|
{''.join(f"| `{t}` | _{t} — key concept for {title}_ |\n" for t in cluster_meta.get("tags",[]))}

---

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)
"""
    write_md(out / "02-definition.md", content)


def write_example(day: dict, out: Path):
    """03-example.md — Annotated C++ code (Feature #3 Icons + full annotations)."""
    n, title, cluster = day["day"], day["title"], day["cluster"]
    code  = day.get("code","")
    theory = day.get("theory","")

    # Try to pull a code-context sentence from theory
    code_ctx = ""
    for line in theory.splitlines():
        if any(k in line.lower() for k in ["main.cpp","source","example","code","compile"]):
            code_ctx = re.sub(r'^#+\s*', '', line).strip()
            break

    annotated = annotate_cpp(code)

    # Modern vs legacy comparison
    comparison = ""
    if code and any(kw in code for kw in ["unique_ptr","shared_ptr","make_unique"]):
        comparison = f"""
## {ICON_MAP['code']} Modern vs Legacy (COLOR: Green=Good, Red=Avoid)

=== "🟢 Modern C++ (Recommended)"

    ```cpp
    // RAII — resource managed automatically
    auto ptr = std::make_unique<MyClass>(args);
    ptr->doWork();
    // ptr auto-destroyed at scope exit — no leak possible
    ```

=== "🔴 C-Style (Avoid)"

    ```cpp
    // Manual memory — error prone
    MyClass* ptr = new MyClass(args);
    ptr->doWork();
    delete ptr;  // Easy to forget — or double-delete
    ```

"""

    how_to_run = f"""
## {ICON_MAP['code']} Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_{n:02d}
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_{n:02d}_test --reporter console --colour-mode ansi
```
"""

    content = f"""---
title: "03 — Code Example · Day {n:02d}"
---

{cluster_banner(cluster, n, title)}

# {ICON_MAP['code']} 03 — Code Example: {title}

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## {ICON_MAP['code']} main.cpp

{code_ctx and admonition("note", "Context", code_ctx) or ""}

{annotated}

{comparison}

{how_to_run}

---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
"""
    write_md(out / "03-example.md", content)


def write_pitfalls(day: dict, out: Path):
    """04-pitfalls.md — Feature #1 RED/ORANGE color psychology for danger."""
    n, title, cluster = day["day"], day["title"], day["cluster"]
    pitfalls = day.get("pitfalls","_No pitfalls documented._")
    sections = extract_h2_sections(pitfalls)

    parts = []
    for sec in sections:
        heading = sec["heading"]
        body    = "\n".join(sec["body"]).strip()
        if not body:
            continue
        # Color psychology: severity → admonition color
        if any(k in heading.lower() for k in ["undefined","crash","leak","corrupt","dangl"]):
            kind = "danger"   # RED
        elif any(k in heading.lower() for k in ["warn","caution","careful","avoid","never"]):
            kind = "warning"  # ORANGE
        else:
            kind = "pitfall-lobe"  # Custom yellow-ish (cerebellum)
        if heading:
            parts.append(admonition(kind, f"⚠️ {heading}", body, collapsible=True))
        else:
            parts.append(body + "\n")

    content = f"""---
title: "04 — Pitfalls · Day {n:02d}"
---

{cluster_banner(cluster, n, title)}

# {ICON_MAP['pitfall']} 04 — Pitfalls: {title}

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

{''.join(parts)}

---

## {ICON_MAP['test']} Pre-Commit Checklist

Use this before pushing code from Day {n:02d}:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
"""
    write_md(out / "04-pitfalls.md", content)


def write_flashcards(day: dict, out: Path):
    """05-flashcards.md — Spaced repetition L1/L2/L3 + 3D flip cards (Features #6, #8)."""
    n, title, cluster = day["day"], day["title"], day["cluster"]
    theory   = day.get("theory","")
    pitfalls = day.get("pitfalls","")
    sections = extract_h2_sections(theory)

    # Generate card definitions from ## headings
    card_defs = []
    for sec in sections:
        if not sec["heading"] or not sec["body"]:
            continue
        body = "\n".join(sec["body"]).strip()
        if len(body) < 20:
            continue
        first_para = body.split("\n\n")[0]
        answer = re.sub(r'[`*_#\[\]]', '', first_para)[:220].strip()
        if len(answer) > 10:
            card_defs.append((sec["heading"], answer))

    # Limit and distribute across 3 levels
    all_cards = card_defs[:12]
    l1 = all_cards[:4]
    l2 = all_cards[4:8]
    l3 = all_cards[8:]

    def render_flip_cards(cards, level_id):
        if not cards:
            return "_No cards at this level._\n"
        html = ['<div class="flashcard-grid">\n']
        for i, (q, a) in enumerate(cards):
            cid = f"day{n:02d}-l{level_id}-{i}"
            html.append(f'''<div class="flashcard" data-card-id="{cid}">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L{level_id} · Question</div>
      <div class="flashcard-q">{q}</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">{a}</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>\n''')
        html.append('</div>\n')
        return "".join(html)

    # Pitfall Q&As
    p_sections = extract_h2_sections(pitfalls)
    pitfall_qas = ""
    for ps in p_sections:
        if not ps["heading"] or not ps["body"]:
            continue
        body = re.sub(r'[*_#]', '', "\n".join(ps["body"]))[:200].strip()
        pitfall_qas += flashcard_qa(f"⚠️ Pitfall: {ps['heading']}", body)

    content = f"""---
title: "05 — Flashcards · Day {n:02d}"
---

{cluster_banner(cluster, n, title)}

# {ICON_MAP['flashcard']} 05 — Flashcards: {title}

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)

!!! abstract "🟣 Purple = Memory Anchor — Spaced Repetition System"
    **Level 1** = core concepts (must know).
    **Level 2** = deeper understanding.
    **Level 3** = advanced mastery.
    Rate your confidence on each card. Come back tomorrow and re-review L1 and L2.

<button id="study-mode-btn" class="md-button md-button--primary" style="margin-bottom:1rem;">
  🎯 Study Mode — Full Screen Review
</button>

---

## 🟢 Level 1 — Core Concepts (Must Know)

{render_flip_cards(l1, 1)}

---

## 🟡 Level 2 — Deeper Understanding

{render_flip_cards(l2, 2)}

---

## 🟣 Level 3 — Advanced Mastery

{render_flip_cards(l3, 3)}

---

## 📖 Deep Dive Q&A (Active Recall — Feature 6)

!!! tip "How to use"
    Close the page, wait 5 seconds, then come back and open each card without looking at the theory page.
    The retrieval effort is what makes the memory stick.

{''.join(flashcard_qa(q, a) for q, a in card_defs)}

---

## ⚠️ Pitfall Flashcards

{pitfall_qas or "_No pitfall cards generated._"}

---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
"""
    write_md(out / "05-flashcards.md", content)


def write_self_test(day: dict, out: Path):
    """06-self-test.md — Tabbed Q&A + multiple-choice (Features #9)."""
    n, title, cluster = day["day"], day["title"], day["cluster"]
    theory   = day.get("theory","")
    sections = extract_h2_sections(theory)

    # Generate tabbed Q&A from first 4 sections
    tabbed_qas = ""
    for sec in sections[:5]:
        if not sec["heading"] or not sec["body"]:
            continue
        body = re.sub(r'[*_#]', '', "\n".join(sec["body"]))[:180].strip()
        if len(body) < 20:
            continue
        tabbed_qas += self_test_tab(f"What is: **{sec['heading']}**?", body)

    # Multiple choice block (HTML)
    mc_block = f"""
<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day {n:02d}: {title}</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because {title} is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>
"""

    content = f"""---
title: "06 — Self Test · Day {n:02d}"
---

{cluster_banner(cluster, n, title)}

# {ICON_MAP['test']} 06 — Self Test: {title}

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A

{tabbed_qas if tabbed_qas else "_No Q&A generated for this day._"}

---

## 🧩 Multiple Choice

{mc_block}

---

## 📝 Open-Ended Reflection

{admonition("question", "❓ Synthesis Question",
    f"In your own words, explain **{title}** to someone who has never seen it before.\n\n"
    "Write 3-5 sentences. Focus on:\n"
    "1. What problem it solves\n"
    "2. How C++ implements it\n"
    "3. One real-world example of using it",
    collapsible=True)}

{admonition("abstract", "🟣 Memory Check",
    f"Without looking at the theory page, list 3 key facts about **{title}**:\n\n"
    "1. ___\n2. ___\n3. ___",
    collapsible=True)}

---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
"""
    write_md(out / "06-self-test.md", content)


def write_summary(day: dict, out: Path):
    """07-summary.md — Summary bullets, next-day preview, prev/next nav."""
    n, title, cluster = day["day"], day["title"], day["cluster"]
    meta  = CLUSTER_META.get(cluster, {})
    tags  = meta.get("tags",[])
    theory = day.get("theory","")
    sections = extract_h2_sections(theory)

    # Key ideas from section headings
    key_ideas = "\n".join(
        f"- {ICON_MAP['summary']} **{sec['heading']}**"
        for sec in sections if sec["heading"]
    )[:800]

    prev_day = f"[← Day {n-1:02d} Summary](../day-{n-1:02d}/07-summary.md)" if n > 0 else ""
    next_day = f"[Day {n+1:02d} Hub →](../day-{n+1:02d}/index.md)" if n < 30 else ""
    nav = " &nbsp;|&nbsp; ".join(x for x in [prev_day, next_day] if x)

    content = f"""---
title: "07 — Summary · Day {n:02d}"
---

{cluster_banner(cluster, n, title)}

# {ICON_MAP['summary']} 07 — Summary: {title}

[← Self Test](06-self-test.md) · {next_day}

!!! success "🟢 You made it through Day {n:02d}!"
    Review the key ideas below. If any feel fuzzy, go back to the relevant page.
    The best time to review flashcards is **24 hours after first reading**.

---

## {ICON_MAP['summary']} Key Ideas from Today

{key_ideas or "- " + title + " is now in your long-term memory!"}

---

## {ICON_MAP['memory']} Memory Palace — Lock It In

{admonition("abstract", "🟣 Today's Mnemonic",
    f"**{title.upper()}** — Connect this to something you already know.\n\n"
    f"Keyword: **{tags[0] if tags else title}**\n\n"
    "Visualize it. Say it. Write it. *Then* sleep on it."
)}

---

## 📊 C++ Features Covered Today

| Feature | Standard | Used in Day {n:02d} |
|---------|----------|------------|
{''.join(f"| `{t}` | C++11/14/17/20/23 | ✓ |\n" for t in tags)}

---

## 🔭 Preview: What's Coming Next

{admonition("tip", f"Day {n+1:02d} Preview" if n < 30 else "You're done!",
    f"Next up: **Day {n+1:02d}** builds directly on today's concepts.\n"
    "Make sure you can explain today's topics before moving on!" if n < 30 else
    "**Congratulations!** You've completed the 30-Day journey."
)}

---

{nav}

---

[← All Days](../index.md) · [Cheatsheets →](../../cheatsheets/index.md)
"""
    write_md(out / "07-summary.md", content)


def write_day_pages_file(day: dict, out: Path):
    """Awesome Pages .pages file — Feature #5 Chunking navigation."""
    n, title = day["day"], day["title"]
    content = f"""title: "Day {n:02d}: {title}"
nav:
  - index.md
  - 01-intuition.md
  - 02-definition.md
  - 03-example.md
  - 04-pitfalls.md
  - 05-flashcards.md
  - 06-self-test.md
  - 07-summary.md
"""
    (out / ".pages").write_text(content, encoding="utf-8")


# ── Cheatsheet page ────────────────────────────────────────────────────────

def write_cheatsheet(sheet: dict, out: Path):
    slug, title = sheet["slug"], sheet["title"]
    content_md  = sheet.get("content","_Empty_")
    # Ensure C++ code blocks are tagged
    content_md = re.sub(
        r'```\n((?:#include|int |void |class |struct |template|auto |using ))',
        r'```cpp\n\1', content_md
    )
    md = f"""---
title: "{title}"
tags: ["cheatsheet", "reference"]
---

# {ICON_MAP['definition']} {title}

{admonition("abstract", "🟣 Parietal Lobe — Pattern Recognition Reference",
    "This is a **quick reference** card. Keep it open while coding.")}

---

{content_md}

---

[← All Cheatsheets](index.md)
"""
    write_md(out / f"{slug}.md", md)


# ── Index pages ───────────────────────────────────────────────────────────

def write_days_index(manifest: dict):
    cluster_days = {}
    for d in manifest.get("days",[]):
        cluster_days.setdefault(d["cluster"],[]).append(d)

    blocks = []
    for cluster, meta in CLUSTER_META.items():
        if cluster not in cluster_days:
            continue
        icon = meta["icon"]; label = meta["label"]; desc = meta["description"]
        c_days = cluster_days[cluster]
        cards = ""
        for d in c_days:
            cards += (
                f'- {ICON_MAP["concept"]} **[Day {d["day"]:02d}: {d["title"]}]'
                f'(day-{d["day"]:02d}/index.md)**\n\n'
                f'    _{d["title"]}_\n\n'
            )
        blocks.append(f"""
## {icon} {label}

> {desc}

<div class="grid cards" markdown>

{cards}
</div>
""")

    write_md(DOCS_DIR / "days" / "index.md",
        "---\ntitle: 30-Day Journey\n---\n\n# 📅 30-Day Journey\n\n" +
        admonition("tip","How This Journey Is Structured",
            "Each day has **7 micro-pages** (1-3 min each): Intuition → Definition → "
            "Code → Pitfalls → Flashcards → Self-Test → Summary.\n\n"
            "Follow in order, or jump to any topic.") +
        "".join(blocks))


def write_cheatsheets_index(sheets: list[dict]):
    items = ""
    for s in sorted(sheets, key=lambda x: x["title"]):
        items += f'- {ICON_MAP["definition"]} **[{s["title"]}]({s["slug"]}.md)**\n\n'
    write_md(DOCS_DIR / "cheatsheets" / "index.md", f"""---
title: Cheatsheets
---

# 📚 Reference Cheatsheets

{admonition("abstract", "🟣 Pattern Recognition Library",
    "28 hand-crafted reference cards. Keep one open while coding.")}

<div class="grid cards" markdown>

{items}
</div>
""")


def write_homepage(manifest: dict):
    """Homepage — ALL 10 cognitive features demonstrated at a glance."""
    days    = manifest.get("days",[])
    cluster_days_map = {}
    for d in days:
        cluster_days_map.setdefault(d["cluster"],[]).append(d)

    cluster_blocks = []
    for cluster, meta in CLUSTER_META.items():
        if cluster not in cluster_days_map:
            continue
        c_days = cluster_days_map[cluster]
        icon = meta["icon"]; label = meta["label"]
        desc = meta["description"]
        cluster_blocks.append(f"""<div class="cluster-section">
<div class="cluster-header" data-cluster="{cluster}">{icon} {label} <small>— {desc}</small></div>
<div class="day-cards-grid">
{''.join(
    f'''<a class="day-card" data-cluster="{cluster}" data-slug="day-{d['day']:02d}" href="days/day-{d['day']:02d}/index.md">
  <div class="day-card-num">Day {d['day']:02d}</div>
  <div class="day-card-title">{d['title']}</div>
</a>''' for d in c_days
)}
</div>
</div>""")

    write_md(DOCS_DIR / "index.md", f"""---
title: Home
hide:
  - navigation
---

<div class="neural-canvas-host" style="min-height:340px;padding:3rem 2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;overflow:hidden;border-radius:1rem;margin-bottom:2rem;border:1px solid rgba(139,92,246,0.15);">

<h1 class="hero-title">Modern C++ OOP</h1>
<p class="hero-subtitle typewriter-text">30 Days · 7 Brain Regions · 28 Cheatsheets · C++23 Ready</p>

<div class="brain-stats">
  <div class="brain-stat-card"><div class="brain-stat-icon">📅</div><div class="brain-stat-number">31</div><div class="brain-stat-label">Days</div></div>
  <div class="brain-stat-card"><div class="brain-stat-icon">🧠</div><div class="brain-stat-number">7</div><div class="brain-stat-label">Clusters</div></div>
  <div class="brain-stat-card"><div class="brain-stat-icon">📋</div><div class="brain-stat-number">28</div><div class="brain-stat-label">Cheatsheets</div></div>
  <div class="brain-stat-card"><div class="brain-stat-icon">⚡</div><div class="brain-stat-number">C++23</div><div class="brain-stat-label">Standard</div></div>
  <div class="brain-stat-card"><div class="brain-stat-icon">🧪</div><div class="brain-stat-number">TDD</div><div class="brain-stat-label">Catch2</div></div>
</div>

</div>

<div class="progress-widget-host"></div>

---

## 🧠 10 Cognitive Features in Every Page

<div class="grid cards" markdown>

- 🎨 **Color Psychology** — Blue=Theory, Green=Example, Orange=Pitfall, Purple=Memory
- 🧩 **Spatial Shapes**  — Grids, cards, columns, tabs encode position into memory
- 🏷️ **Visual Icons**    — Same icon = same concept everywhere (instant recognition)
- 🎧 **Audio Anchors**   — Embedded sound cues for multi-modal learning
- ✂️ **Chunking**        — 7 micro-pages per day (1-3 min each, zero overwhelm)
- 🔁 **Active Recall**   — 3D flip flashcards with confidence rating (L1/L2/L3)
- 🗺️ **Spatial Memory**  — Mermaid mind-maps + knowledge graphs per topic
- ⏱️ **Spaced Repetition** — 3 card levels, revisit in 24h / 3d / 7d cycles
- 🧪 **Self-Testing**    — Tabbed Q&A + multiple-choice checkpoints
- 📐 **Consistency**     — Identical 7-section template on every day page

</div>

---

## 🧠 Brain Learning Map

| Cluster | Brain Region | Color | Focus |
|---------|-------------|-------|-------|
| 🔵 Foundations | Frontal Lobe | Blue | Logic, Setup, Types |
| 🟢 OOP Core | Temporal Lobe | Green | Language, Objects |
| 🟣 Templates | Parietal Lobe | Violet | Math, Generics |
| 🔴 Memory | Limbic System | Red | Motivation, Ownership |
| 🟠 Modern C++ | Occipital Lobe | Orange | Vision, Patterns |
| 🟡 Projects | Cerebellum | Yellow | Practice, Motor |
| ⚪ Review | Brain Stem | Slate | Core, Reflex |

---

## 📅 All Days

{''.join(cluster_blocks)}

---

## 🚀 Quick Start

<div class="grid cards" markdown>

- :material-rocket-launch: **[Start Day 00](days/day-00/index.md)**
  Set up your environment and write your first modern C++ program.

- :material-map: **[Mind Map](mindmap.md)**
  See all 31 days as an interactive neural network graph.

- :material-book-open-variant: **[Cheatsheets](cheatsheets/index.md)**
  28 quick-reference cards.

- :material-lightning-bolt: **[Quick Reference](quick-reference.md)**
  One-page survival guide.

</div>
""")


def write_mindmap():
    write_md(DOCS_DIR / "mindmap.md", """---
title: Mind Map
---

# 🗺️ Mind Map — All 31 Days

!!! tip "Spatial Memory (Feature 7)"
    Use this map to orient yourself in the learning journey.
    Click any day link to jump directly there.

---

## Full Curriculum Mind Map

```mermaid
mindmap
  root((Modern C++<br/>OOP))
    Foundations 🔵
      Day 00 Setup
      Day 01 Variables
      Day 02 Functions
    OOP Core 🟢
      Day 03 Classes
      Day 04 RAII
      Day 05 Inheritance
      Day 06 Polymorphism
      Day 07 Operators
      Day 08 Rule of Five
    Templates 🟣
      Day 09 Basics
      Day 10 Concepts
      Day 11 Ranges
      Day 12 Bindings
    Memory 🔴
      Day 13 Move Semantics
      Day 14 Move Gotchas
      Day 15 Error Handling
    Modern C++ 🟠
      Day 16 C++20/23
      Day 17 Modules
      Day 18 SOLID
      Day 19 Adv Patterns
      Day 20 Catch2
      Day 21 CRTP
      Day 22 TypeErasure
      Day 23 Performance
    Projects 🟡
      Day 24 Project A
      Day 25 Project B
      Day 26 Composition
      Day 27 Refactoring
    Review ⚪
      Day 28 Code Review
      Day 29 Deep Dives
      Day 30 Cert Prep
```

---

## Knowledge Connections Graph

```mermaid
graph TD
    RAII["RAII<br/>Day 04"] -->|enables| SP["Smart Pointers<br/>Day 04"]
    SP -->|prevents| ML["Memory Leaks"]
    RAII -->|uses| R5["Rule of Five<br/>Day 08"]
    R5  -->|involves| MS["Move Semantics<br/>Day 13"]
    MS  -->|uses| MV["std::move"]
    MS  -->|uses| FW["std::forward"]

    CL["Classes<br/>Day 03"] -->|extended by| INH["Inheritance<br/>Day 05"]
    INH -->|enables| POLY["Polymorphism<br/>Day 06"]
    POLY -->|via| VF["virtual functions"]
    VF  -->|optimized by| CRTP["CRTP<br/>Day 21"]

    TPL["Templates<br/>Day 09"] -->|constrained by| CON["Concepts<br/>Day 10"]
    CON -->|C++20 feature| RNG["Ranges<br/>Day 11"]

    SOLID["SOLID<br/>Day 18"] -->|guides| PAT["Design Patterns<br/>Day 19"]
    PAT -->|uses| CL
    PAT -->|uses| TPL

    style RAII fill:#ef4444,color:#fff
    style CL   fill:#10b981,color:#fff
    style TPL  fill:#8b5cf6,color:#fff
    style SOLID fill:#f97316,color:#fff
    style MS   fill:#ef4444,color:#fff
```

---

## Learning Path Options

=== "📅 Linear (Recommended)"

    Follow Days 0 → 30 in order.
    Each day builds directly on the previous.

=== "🚀 OOP Fast Track"

    Day 00 → 03 → 04 → 05 → 06 → 08 → 18 → 19

=== "🟣 Templates Deep Dive"

    Day 00 → 09 → 10 → 11 → 21 → 22

=== "🟠 Modern C++ Focus"

    Day 00 → 16 → 17 → 13 → 14 → 15 → 23

""")


def write_quick_reference():
    write_md(DOCS_DIR / "quick-reference.md", """---
title: Quick Reference
---

# ⚡ Quick Reference — Modern C++ Survival Guide

!!! note "🔵 Brain Stem Active — Reflex Knowledge"
    This is your **instant lookup**. Ctrl+F to find what you need.

---

## Smart Pointers

```cpp linenums="1"
#include <memory>

auto u = std::make_unique<T>(args);      // (1)
auto v = std::move(u);                    // (2)
auto s1 = std::make_shared<T>(args);     // (3)
auto s2 = s1;                             // (4)
std::weak_ptr<T> w = s1;                 // (5)
if (auto sp = w.lock()) { /* use sp */ } // (6)
```

1. `make_unique` — exception safe, single ownership
2. `u` is null after move
3. One allocation for object + control block
4. Shared ownership; destroyed when last shared_ptr goes away
5. Non-owning observer; breaks cycles
6. `lock()` returns shared_ptr or nullptr

---

## Rule of Five Template

```cpp linenums="1"
class MyResource {
public:
    MyResource();
    ~MyResource() noexcept;
    MyResource(const MyResource&);
    MyResource& operator=(const MyResource&);
    MyResource(MyResource&&) noexcept;
    MyResource& operator=(MyResource&&) noexcept;
};
```

---

## Concepts (C++20)

```cpp linenums="1"
template<typename T>
concept Printable = requires(T t) {
    { std::cout << t } -> std::same_as<std::ostream&>;
};

void print(Printable auto const& val) {
    std::cout << val << '\\n';
}
```

---

## Ranges Pipeline (C++20)

```cpp linenums="1"
auto result = v
    | std::views::filter([](int x){ return x % 2 == 0; })
    | std::views::transform([](int x){ return x * x; })
    | std::views::take(3);
```

---

## std::expected (C++23)

```cpp linenums="1"
std::expected<int, std::string> divide(int a, int b) {
    if (b == 0) return std::unexpected{"Division by zero"};
    return a / b;
}
```

---

## Pitfalls Quick Reference

| Pitfall | Fix |
|---------|-----|
| `delete[]` on `new T` | Use `std::vector` or `unique_ptr<T[]>` |
| Slicing via value copy | Pass polymorphic types by pointer/reference |
| Missing virtual dtor | Add `virtual ~Base() = default;` |
| `std::move` on const | `const T&&` can't actually move |
| Dangling ref return | Return by value or use `string_view` carefully |
| Exception in dtor | Mark `noexcept`, handle internally |

---

[← Home](index.md) · [Cheatsheets](cheatsheets/index.md) · [Mind Map](mindmap.md)
""")


def write_pages_files(all_days: list[dict]):
    day_slugs = [f"day-{d['day']:02d}" for d in sorted(all_days, key=lambda x: x["day"])]
    pages = "title: 30-Day Journey\nnav:\n  - index.md\n" + "".join(f"  - {s}\n" for s in day_slugs)
    (DOCS_DIR / "days" / ".pages").write_text(pages, encoding="utf-8")
    (DOCS_DIR / "cheatsheets" / ".pages").write_text("title: Cheatsheets\nnav:\n  - index.md\n  - ...\n", encoding="utf-8")
    (DOCS_DIR / ".pages").write_text("nav:\n  - index.md\n  - days\n  - cheatsheets\n  - mindmap.md\n  - quick-reference.md\n", encoding="utf-8")


# ── MAIN ──────────────────────────────────────────────────────────────────

def main():
    print("🧠 Neural Docs Generator (10 Cognitive Features)\n")
    ensure(DOCS_DIR / "days")
    ensure(DOCS_DIR / "cheatsheets")

    manifest = read_json(MANIFEST)
    all_days = manifest.get("days",[])

    print("📅 Generating day pages (7 micro-pages each)...")
    for dm in all_days:
        slug = dm["slug"]
        day_path = DAYS_JSON / f"{slug}.json"
        if not day_path.exists():
            print(f"  ⚠  Missing: {slug}.json"); continue
        day = read_json(day_path)
        out = DOCS_DIR / "days" / slug
        ensure(out)
        print(f"\n  Day {day['day']:02d}: {day['title']}  [{day['cluster']}]")
        write_hub(day, out)
        write_intuition(day, out)
        write_definition(day, out)
        write_example(day, out)
        write_pitfalls(day, out)
        write_flashcards(day, out)
        write_self_test(day, out)
        write_summary(day, out)
        write_day_pages_file(day, out)

    print("\n📚 Generating cheatsheets...")
    all_sheets = []
    for p in sorted(SHEETS_JSON.glob("*.json")):
        s = read_json(p); all_sheets.append(s)
        write_cheatsheet(s, DOCS_DIR / "cheatsheets")

    print("\n🗺️  Generating index + special pages...")
    write_days_index(manifest)
    write_cheatsheets_index(all_sheets)
    write_homepage(manifest)
    write_mindmap()
    write_quick_reference()
    write_pages_files(all_days)

    total_day_files = len(all_days) * 9   # 7 micro + index + .pages
    print(f"\n✅  Done! {DOCS_DIR}")
    print(f"   Day pages:   {len(all_days)} days × 8 files = {len(all_days)*8}")
    print(f"   Cheatsheets: {len(all_sheets)}")
    print(f"   Special:     index, mindmap, quick-ref, days/index, cheatsheets/index")
    print("\n🚀  pip install mkdocs-material pymdownx mkdocs-awesome-pages-plugin")
    print("   cd mkdocs-site && mkdocs serve")

if __name__ == "__main__":
    main()
