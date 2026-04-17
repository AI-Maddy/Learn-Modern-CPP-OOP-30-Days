---
title: "06 — Self Test · Day 10"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Concepts Constraints C++20

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
    Before C++20, template error messages were infamous. Pass the wrong type to `std::sort` and the compiler might emit forty lines of nested template errors pointing deep into librar

=== "❓ Question"
    What is: **The `requires` Clause**?

=== "✅ Answer"
    A `requires` clause attaches a constraint to a template or function. The constraint is a compile-time Boolean expression.

``` cpp
include <concepts>
include <string>
include <ios

=== "❓ Question"
    What is: **Defining Your Own Concepts**?

=== "✅ Answer"
    A concept is defined with the `concept` keyword. The body is a `requires` expression that tests whether the type satisfies certain syntactic and semantic requirements.

``` cpp
in

=== "❓ Question"
    What is: **Abbreviated Function Templates**?

=== "✅ Answer"
    C++20 adds abbreviated syntax: using `auto` as a parameter type creates a function template, and a concept name before `auto` constrains it.

``` cpp
include <concepts>

// Abbrev


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 10: Concepts Constraints C++20</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Concepts Constraints C++20 is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Concepts Constraints C++20** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Concepts Constraints C++20**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
