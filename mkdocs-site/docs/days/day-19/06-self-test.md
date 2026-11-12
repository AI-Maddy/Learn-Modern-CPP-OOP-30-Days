---
title: "06 — Self Test · Day 19"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Testing Catch2 TDD

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


===! "❓ Question"
    What is: **Motivation — Why Tests Matter in OOP**?

=== "✅ Answer"
    A C++ class that compiles and links may still be broken. Tests prove that the code does what its design intends — not just that it satisfies the type system.

===! "❓ Question"
    What is: **Catch2 Fundamentals**?

=== "✅ Answer"
    Catch2 is a header-only (single-file) or CMake-installable test framework. It requires no separate main() and supports rich assertion macros.

===! "❓ Question"
    What is: **Core Assertion Macros**?

=== "✅ Answer"
    Approximate floating-point comparison: String matchers:

===! "❓ Question"
    What is: **SECTION Mechanics — Fixture Reuse Without a Test Fixture Class**?

=== "✅ Answer"
    Every SECTION executes from the beginning of the TEST_CASE, so setup code at the top of the test case acts as an implicit fixture: Each SECTION starts with s containing {1, 2}…


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 19: Testing Catch2 TDD</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Testing Catch2 TDD is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Testing Catch2 TDD** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Testing Catch2 TDD**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
