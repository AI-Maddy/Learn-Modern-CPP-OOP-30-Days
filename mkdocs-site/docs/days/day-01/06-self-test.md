---
title: "06 — Self Test · Day 01"
---

<div class="brain-cluster-banner" data-cluster="foundations">
  🔵 &nbsp; **Foundations** &nbsp;·&nbsp; Frontal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Variables Types Constexpr

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Why This Day Matters**?

=== "✅ Answer"
    Types are the backbone of C++. The type system lets the compiler prove correctness, enable optimisations, and catch entire classes of bugs before the program ever runs. Choosing t

=== "❓ Question"
    What is: **Fundamental Types**?

=== "✅ Answer"
    C++ provides a set of built-in types with platform-defined but bounded sizes.

``` cpp
include <cstdint>   // fixed-width types
include <climits>   // INTMAX, UINTMAX, ...

// Pre

=== "❓ Question"
    What is: **Brace Initialisation — The Modern Default**?

=== "✅ Answer"
    C++11 introduced uniform brace initialisation, which should be your default. It prevents narrowing conversions at compile time.

``` cpp
// Brace init: safe, consistent, prevents

=== "❓ Question"
    What is: **`auto` — Type Deduction**?

=== "✅ Answer"
    `auto` asks the compiler to deduce the type from the initialiser. It eliminates redundancy and makes code more resilient to type changes during refactoring.

``` cpp
include <vect


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 01: Variables Types Constexpr</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Variables Types Constexpr is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Variables Types Constexpr** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Variables Types Constexpr**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
