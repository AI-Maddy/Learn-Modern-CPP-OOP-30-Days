---
title: "06 — Self Test · Day 29"
---

<div class="brain-cluster-banner" data-cluster="review">
  ⚪ &nbsp; **Review & Mastery** &nbsp;·&nbsp; Brain Stem
</div>



# :material-clipboard-check: 06 — Self Test: Advanced Topics Deep Dive

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Motivation**?

=== "✅ Answer"
    C++20 introduced several features that change the way high-performance and systems-level code is written. This day covers five topics that reward the effort to understand them dee

=== "❓ Question"
    What is: **Coroutines: Concepts**?

=== "✅ Answer"
    A coroutine is a function that can suspend and resume execution. Unlike threads, suspension is cooperative and happens at explicit `coawait` / `coyield` points — no context switch

=== "❓ Question"
    What is: **Custom Allocators**?

=== "✅ Answer"
    The default allocator calls `::operator new` for every allocation. In performance-critical code, custom allocators can:

- Use a pre-allocated pool (no system calls during use).
-

=== "❓ Question"
    What is: **`consteval`: Compile-Time-Only Functions**?

=== "✅ Answer"
    `consteval` (C++20) declares a function that must be evaluated at compile time. If called in a runtime context, the compiler rejects it. This is stronger than `constexpr`, which m


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 29: Advanced Topics Deep Dive</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Advanced Topics Deep Dive is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Advanced Topics Deep Dive** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Advanced Topics Deep Dive**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
