---
title: "05 — Flashcards · Day 23"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-cards: 05 — Flashcards: Modern Features Preview C++26

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
<div class="flashcard" data-card-id="day23-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation — The Evolving Language</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++ has a three-year release cycle. C++20 delivered modules, concepts, ranges, coroutines, and std::format. C++23 delivered std::expected, import std;, std::mdspan, and std::print. C++26, finalised in 2026, brings transf</div>
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
<div class="flashcard" data-card-id="day23-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Static Reflection — P2996 (Merged into C++26)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Static reflection allows querying properties of types at compile time as first-class language values, without macros or code generation.</div>
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
<div class="flashcard" data-card-id="day23-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Pattern Matching — P2688 (Targeted for C++26)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Pattern matching provides a structured multi-way dispatch over values and types, extending switch to work with arbitrary types including std::variant, std::optional, structs, and ranges.</div>
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
<div class="flashcard" data-card-id="day23-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Contracts — P2900 (Merged into C++26)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Contracts provide a language-level mechanism to specify preconditions, postconditions, and invariants. They are distinct from assert() in that they are part of the function declaration and can be verified, disabled, or a</div>
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
<div class="flashcard" data-card-id="day23-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`std::execution` — P2300 Senders/Receivers (Merged into C++26)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">std::execution provides a composable, asynchronous programming model based on senders (descriptions of async work) and receivers (continuations).</div>
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
<div class="flashcard" data-card-id="day23-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`std::inplace_vector` — P0843 (Merged into C++26)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A fixed-capacity vector stored entirely on the stack (or inside the parent object) — no heap allocation, no indirection, same interface as std::vector.</div>
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
<div class="flashcard" data-card-id="day23-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">What Is Stable vs Experimental (Early 2025)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a"><table style="width:97%;">
<colgroup>
<col style="width: 38%" />
<col style="width: 20%" />
<col style="width: 35%" />
<col style="width: 2%" />
</colgroup>
<tbody>
<tr class="odd">
<td rowspan="2"><blockquote>
<p>Featur</div>
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
<div class="flashcard" data-card-id="day23-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Modern C++ Trajectory</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++11/14  C++17      C++20        C++23         C++26
    ────────  ───────    ──────────   ──────────    ──────────────────
    move sem  structured modules      expected      reflection
    lambdas   bindings   concept</div>
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
<div class="flashcard" data-card-id="day23-l3-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Q1. What does the reflection operator \\^^T\\ produce and how is it used?</div>
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


??? question "Motivation — The Evolving Language"
    C++ has a three-year release cycle. C++20 delivered modules, concepts, ranges, coroutines, and std::format. C++23 delivered std::expected, import std;, std::mdspan, and std::print. C++26, finalised in 2026, brings transf

??? question "Static Reflection — P2996 (Merged into C++26)"
    Static reflection allows querying properties of types at compile time as first-class language values, without macros or code generation.

??? question "Pattern Matching — P2688 (Targeted for C++26)"
    Pattern matching provides a structured multi-way dispatch over values and types, extending switch to work with arbitrary types including std::variant, std::optional, structs, and ranges.

??? question "Contracts — P2900 (Merged into C++26)"
    Contracts provide a language-level mechanism to specify preconditions, postconditions, and invariants. They are distinct from assert() in that they are part of the function declaration and can be verified, disabled, or a

??? question "`std::execution` — P2300 Senders/Receivers (Merged into C++26)"
    std::execution provides a composable, asynchronous programming model based on senders (descriptions of async work) and receivers (continuations).

??? question "`std::inplace_vector` — P0843 (Merged into C++26)"
    A fixed-capacity vector stored entirely on the stack (or inside the parent object) — no heap allocation, no indirection, same interface as std::vector.

??? question "What Is Stable vs Experimental (Early 2025)"
    <table style="width:97%;">
    <colgroup>
    <col style="width: 38%" />
    <col style="width: 20%" />
    <col style="width: 35%" />
    <col style="width: 2%" />
    </colgroup>
    <tbody>
    <tr class="odd">
    <td rowspan="2"><blockquote>
    <p>Featur

??? question "Modern C++ Trajectory"
    C++11/14  C++17      C++20        C++23         C++26
        ────────  ───────    ──────────   ──────────    ──────────────────
        move sem  structured modules      expected      reflection
        lambdas   bindings   concept

??? question "Self-Check Questions"
    Q1. What does the reflection operator \\^^T\\ produce and how is it used?


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1 — Using C++26 Reflection in Production Without Stable Compiler Support"
    Problem: Adopting `^^T` reflection syntax in production code before the feature is available in released, stable compilers used by the whole team.

    BAD:

    ``` cpp
    // Requires Clang trunk with -freflec

??? question "⚠️ Pitfall: Pitfall 2 — Contracts Used as Defensive Programming Instead of Design"
    Problem: Adding contracts to every function as a defensive coding habit instead of using them to express caller/callee responsibilities at API boundaries.

    BAD:

    ``` cpp
    // Contracts on a private imp

??? question "⚠️ Pitfall: Pitfall 3 — Misunderstanding `inspect` Exhaustiveness"
    Problem: Assuming that an `inspect` block without a catch-all handles all cases, leading to a compile error or silent fallthrough at runtime.

    BAD (assuming the P2688 experimental syntax):

    ``` cpp
    s

??? question "⚠️ Pitfall: Pitfall 4 — Blocking on a Sender with `sync_wait` Inside Async Contexts"
    Problem: Calling `std::execution::syncwait` inside a coroutine or a thread-pool task, blocking a thread that should remain free for other work.

    BAD:

    ``` cpp
    namespace ex = std::execution;

    // A tas

??? question "⚠️ Pitfall: Pitfall 5 — `std::inplace_vector` Overflow Without Checking"
    Problem: Using `pushback` on a full `inplacevector` throws `std::badalloc`, but this is often unexpected because "allocation failure" feels irrelevant for a stack-based container.

    BAD:

    ``` cpp
    std:

??? question "⚠️ Pitfall: Pitfall 6 — Confusing Merged-into-Draft with Implemented-in-Compiler"
    Problem: Reading that a paper is "merged into C++26" and assuming it is available in released compilers immediately.

    BAD assumption:

    ``` cpp
    // P2996 (Reflection) merged into C++26 draft — so let's


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
