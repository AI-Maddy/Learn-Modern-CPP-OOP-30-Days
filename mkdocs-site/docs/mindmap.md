---
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

