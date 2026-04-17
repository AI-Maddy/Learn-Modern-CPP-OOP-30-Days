---
title: "05 — Flashcards · Day 16"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-cards: 05 — Flashcards: Modules Basics C++20

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

<div class="flashcard-grid">
<div class="flashcard" data-card-id="day16-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation — Why Modules Exist</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">For 50 years C++ relied on a textual inclusion model inherited from C. Every include directive pastes the entire contents of a header file into the translation unit, causing:</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Module Interface Units</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A module interface unit declares the module name with export module and marks exported declarations with export. The file extension varies by toolchain: .cppm (Clang/CMake), .ixx (MSVC), or plain .cpp with build-system f</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Module Implementation Units</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Large modules can split interface from implementation to keep the interface unit concise. An implementation unit uses module <name>; (no export keyword).</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Module Partitions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Partitions let you break a large module into sub-files that remain logically part of the same named module. Partitions are not independently importable from outside the module; they must be re-exported through the primar</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
</div>


---

## 🟡 Level 2 — Deeper Understanding

<div class="flashcard-grid">
<div class="flashcard" data-card-id="day16-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Header Units — Incremental Migration Path</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Header units compile a legacy header into a BMI so you can import it with angle-bracket or quoted syntax. They are transitional, not a full replacement:</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Modules vs Headers — Design Tradeoff Summary</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">| Property                | include       | import             |
|-------------------------|------------------|----------------------|
| Macro leakage           | Yes              | No                   |
| Repeated pars</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">CMake Module Support</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">CMake 3.28+ has first-class module support. It auto-scans sources for export module declarations and orders compilation accordingly.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Interoperability Patterns</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Pattern 1 — Wrapping a legacy C library:</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
</div>


---

## 🟣 Level 3 — Advanced Mastery

<div class="flashcard-grid">
<div class="flashcard" data-card-id="day16-l3-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Ownership and Visibility Model</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Module boundary (conceptual)
    ┌──────────────────────────────────────────┐
    │  export int foo();         ← visible     │
    │  int bar();                ← invisible   │
    │  static int impldetail(); ← invisible</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l3-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">When to Use Modules vs When to Avoid Them</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Use modules when:</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l3-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Modern C++ Approach Summary</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">1.  Prefer export module over pragma once for new code.
2.  Use partitions to split large modules without exposing internal structure to external consumers.
3.  Use the global module fragment to tame legacy C headers tha</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day16-l3-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Q1. What is a Binary Module Interface (BMI) and why does it speed up builds?</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
</div>


---

## 📖 Deep Dive Q&A (Active Recall — Feature 6)

!!! tip "How to use"
    Close the page, wait 5 seconds, then come back and open each card without looking at the theory page.
    The retrieval effort is what makes the memory stick.


??? question "Motivation — Why Modules Exist"
    For 50 years C++ relied on a textual inclusion model inherited from C. Every include directive pastes the entire contents of a header file into the translation unit, causing:

??? question "Module Interface Units"
    A module interface unit declares the module name with export module and marks exported declarations with export. The file extension varies by toolchain: .cppm (Clang/CMake), .ixx (MSVC), or plain .cpp with build-system f

??? question "Module Implementation Units"
    Large modules can split interface from implementation to keep the interface unit concise. An implementation unit uses module <name>; (no export keyword).

??? question "Module Partitions"
    Partitions let you break a large module into sub-files that remain logically part of the same named module. Partitions are not independently importable from outside the module; they must be re-exported through the primar

??? question "Header Units — Incremental Migration Path"
    Header units compile a legacy header into a BMI so you can import it with angle-bracket or quoted syntax. They are transitional, not a full replacement:

??? question "Modules vs Headers — Design Tradeoff Summary"
    | Property                | include       | import             |
    |-------------------------|------------------|----------------------|
    | Macro leakage           | Yes              | No                   |
    | Repeated pars

??? question "CMake Module Support"
    CMake 3.28+ has first-class module support. It auto-scans sources for export module declarations and orders compilation accordingly.

??? question "Interoperability Patterns"
    Pattern 1 — Wrapping a legacy C library:

??? question "Ownership and Visibility Model"
    Module boundary (conceptual)
        ┌──────────────────────────────────────────┐
        │  export int foo();         ← visible     │
        │  int bar();                ← invisible   │
        │  static int impldetail(); ← invisible

??? question "When to Use Modules vs When to Avoid Them"
    Use modules when:

??? question "Modern C++ Approach Summary"
    1.  Prefer export module over pragma once for new code.
    2.  Use partitions to split large modules without exposing internal structure to external consumers.
    3.  Use the global module fragment to tame legacy C headers tha

??? question "Self-Check Questions"
    Q1. What is a Binary Module Interface (BMI) and why does it speed up builds?


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1 — Putting `#include` After `export module`"
    Problem: Including a legacy header after the module declaration causes the header's macros and declarations to be treated as part of the module interface, potentially polluting importers and triggeri

??? question "⚠️ Pitfall: Pitfall 2 — Exporting a `using namespace` Declaration"
    Problem: Re-exporting an entire namespace with `export using namespace` forces all names from that namespace onto every importer, recreating the worst problem of `using namespace std;` in headers.

    B

??? question "⚠️ Pitfall: Pitfall 3 — Missing `export` on a Type Used in an Exported Function"
    Problem: Exporting a function that references a non-exported type. Importers can call the function but cannot name or construct the type.

    BAD:

    ``` cpp
    export module shapes;

    struct Point { double x

??? question "⚠️ Pitfall: Pitfall 4 — Forgetting That Module Partitions Cannot Be Imported Externally"
    Problem: Treating a module partition like a sub-module that external code can import directly.

    BAD:

    ``` cpp
    // consumer.cpp
    import shapes:circle;   // WRONG — partitions are internal to their modul

??? question "⚠️ Pitfall: Pitfall 5 — Redefining the Same Module Name in Two Interface Units"
    Problem: Two `.cppm` files both declare `export module foo;`, creating two competing interface units for the same module.

    BAD:

    ``` cpp
    // fooa.cppm
    export module foo;
    export int alpha();

    // foob.c

??? question "⚠️ Pitfall: Pitfall 6 — Using Modules With an Incompatible CMake Version"
    Problem: Adding module source files to a CMake project that predates 3.28, then wondering why the build either fails silently or requires manual flags.

    BAD:

    ``` cmake
    cmakeminimumrequired(VERSION 3

??? question "⚠️ Pitfall: Pitfall 7 — Assuming Modules Eliminate All ODR Issues"
    Problem: Believing that switching to modules completely removes the risk of One Definition Rule violations.

    BAD assumption:

    ``` cpp
    // Version A: module compiled in Debug build
    export module config


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
