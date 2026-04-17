---
title: "05 — Flashcards · Day 22"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-cards: 05 — Flashcards: Performance Tips OOP

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
<div class="flashcard" data-card-id="day22-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation — Measure Before You Optimise</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Most OOP performance advice is anecdotal without benchmarks. The principles below are real and measurable, but their magnitude depends entirely on your specific workload, data sizes, and CPU. The only reliable process is</div>
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
<div class="flashcard" data-card-id="day22-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Cache Lines and Data Locality</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Modern CPUs read memory in cache lines (64 bytes on x86). If your data fits in cache, arithmetic is fast. If it doesn't, the CPU stalls waiting for RAM — this is the cache miss penalty (50–200 cycles on a modern CPU vs 1</div>
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
<div class="flashcard" data-card-id="day22-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Virtual Call Cost and Devirtualisation</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A virtual call through a pointer-to-base requires:</div>
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
<div class="flashcard" data-card-id="day22-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Hot/Cold Data Splitting</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">If an object has members that are accessed in the hot path and members that are rarely accessed, keeping them together wastes cache lines.</div>
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
<div class="flashcard" data-card-id="day22-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Small Buffer Optimisation (SBO)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">SBO is an implementation technique where small objects are stored inline (on the stack or in the owning object) instead of being heap-allocated. The standard library uses it in std::string (SSO — typically strings ≤ 15 c</div>
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
<div class="flashcard" data-card-id="day22-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`[[likely]]` and `[[unlikely]]` Attributes</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++20 adds likely and unlikely to hint to the compiler which branch is taken most often, enabling better code layout (hot path stays in the instruction cache):</div>
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
<div class="flashcard" data-card-id="day22-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Benchmark-Driven Approach with `google/benchmark`</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Never guess — measure. google/benchmark provides a micro-benchmark harness:</div>
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
<div class="flashcard" data-card-id="day22-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Performance Tip Summary</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a"><table style="width:97%;">
<colgroup>
<col style="width: 40%" />
<col style="width: 25%" />
<col style="width: 30%" />
<col style="width: 1%" />
</colgroup>
<thead>
<tr class="header">
<th>Technique</th>
<th>When to appl</div>
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
<div class="flashcard" data-card-id="day22-l3-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Q1. Why is SoA often faster than AoS for simulation loops?</div>
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


??? question "Motivation — Measure Before You Optimise"
    Most OOP performance advice is anecdotal without benchmarks. The principles below are real and measurable, but their magnitude depends entirely on your specific workload, data sizes, and CPU. The only reliable process is

??? question "Cache Lines and Data Locality"
    Modern CPUs read memory in cache lines (64 bytes on x86). If your data fits in cache, arithmetic is fast. If it doesn't, the CPU stalls waiting for RAM — this is the cache miss penalty (50–200 cycles on a modern CPU vs 1

??? question "Virtual Call Cost and Devirtualisation"
    A virtual call through a pointer-to-base requires:

??? question "Hot/Cold Data Splitting"
    If an object has members that are accessed in the hot path and members that are rarely accessed, keeping them together wastes cache lines.

??? question "Small Buffer Optimisation (SBO)"
    SBO is an implementation technique where small objects are stored inline (on the stack or in the owning object) instead of being heap-allocated. The standard library uses it in std::string (SSO — typically strings ≤ 15 c

??? question "`[[likely]]` and `[[unlikely]]` Attributes"
    C++20 adds likely and unlikely to hint to the compiler which branch is taken most often, enabling better code layout (hot path stays in the instruction cache):

??? question "Benchmark-Driven Approach with `google/benchmark`"
    Never guess — measure. google/benchmark provides a micro-benchmark harness:

??? question "Performance Tip Summary"
    <table style="width:97%;">
    <colgroup>
    <col style="width: 40%" />
    <col style="width: 25%" />
    <col style="width: 30%" />
    <col style="width: 1%" />
    </colgroup>
    <thead>
    <tr class="header">
    <th>Technique</th>
    <th>When to appl

??? question "Self-Check Questions"
    Q1. Why is SoA often faster than AoS for simulation loops?


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1 — Optimising Without Profiling"
    Problem: Spending time optimising code that is not the bottleneck, while the real hot path remains slow.

    BAD:

    ``` cpp
    // Developer sees many virtual calls and "optimises" them all
    // without measur

??? question "⚠️ Pitfall: Pitfall 2 — Storing Polymorphic Objects by Value in a `std::vector`"
    Problem: Inserting derived objects into a `std::vector<Base>` causes object slicing — the derived part is silently discarded.

    BAD:

    ``` cpp
    struct Shape { virtual double area() const { return 0; } }

??? question "⚠️ Pitfall: Pitfall 3 — Cache Miss from Indirection in Tight Loops"
    Problem: A vector of pointers to heap-allocated objects causes a cache miss for each element because the objects are scattered in memory.

    BAD:

    ``` cpp
    std::vector<std::uniqueptr<Particle>> particle

??? question "⚠️ Pitfall: Pitfall 4 — Calling Virtual Functions Inside a SIMD-Able Loop"
    Problem: A virtual call inside a tight numeric loop prevents auto-vectorisation, even if the derived method is trivially inlineable.

    BAD:

    ``` cpp
    struct ITransform { virtual float apply(float x) co

??? question "⚠️ Pitfall: Pitfall 5 — Using `std::function` in a Performance-Critical Hot Path"
    Problem: `std::function` incurs heap allocation (for large callables) and an indirect call through a function pointer — both are expensive in tight loops.

    BAD:

    ``` cpp
    void processevents(const std:

??? question "⚠️ Pitfall: Pitfall 6 — Misapplying `[[likely]]`/`[[unlikely]]`"
    Problem: Annotating the wrong branch as likely, or applying the hint based on intuition rather than profiling, can hurt performance.

    BAD:

    ``` cpp
    int parsetoken(char c) {
        if (c == '\0') [[unlik


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
