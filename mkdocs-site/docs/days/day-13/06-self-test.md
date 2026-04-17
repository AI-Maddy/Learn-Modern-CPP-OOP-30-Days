---
title: "06 — Self Test · Day 13"
---

<div class="brain-cluster-banner" data-cluster="memory">
  🔴 &nbsp; **Memory & Error Handling** &nbsp;·&nbsp; Limbic System
</div>



# :material-clipboard-check: 06 — Self Test: Move Semantics Rvalue Refs

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
    Before C++11, returning a `std::vector<int>` from a function meant a deep copy: allocate new memory, copy every element, deallocate the old. For a vector with a million elements,

=== "❓ Question"
    What is: **Value Categories — lvalue, rvalue, xvalue**?

=== "✅ Answer"
    Every expression in C++ has a type and a value category.

- lvalue (locator value) — an expression that refers to a persistent object in memory. You can take its address. Examples

=== "❓ Question"
    What is: **Rvalue References**?

=== "✅ Answer"
    An rvalue reference `T&&` binds to rvalues (including xvalues) but not to lvalues. It signals "this object can be pillaged — it won't be needed again."

``` cpp
void sink(std::str

=== "❓ Question"
    What is: **Move Constructor and Move Assignment**?

=== "✅ Answer"
    The move constructor transfers resources from a source object, leaving the source valid but empty. The move assignment operator does the same for assignment.

``` cpp
include <cst


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 13: Move Semantics Rvalue Refs</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Move Semantics Rvalue Refs is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Move Semantics Rvalue Refs** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Move Semantics Rvalue Refs**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
