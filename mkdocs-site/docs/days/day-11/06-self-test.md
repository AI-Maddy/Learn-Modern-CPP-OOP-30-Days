---
title: "06 — Self Test · Day 11"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Generic OOP Design

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
    Runtime polymorphism — virtual functions and base-class pointers — is powerful but carries costs: vtable indirection on every call, forced heap allocation, inability to inline, an

=== "❓ Question"
    What is: **Policy-Based Design**?

=== "✅ Answer"
    Popularised by Andrei Alexandrescu's Modern C++ Design, policy-based design uses template parameters as "policies" — small classes that implement one aspect of behaviour. The host

=== "❓ Question"
    What is: **Type-Safe Containers**?

=== "✅ Answer"
    Raw `void` containers (the C approach) are fast but unsafe — you can store an `int` where a `double` is expected. Template containers enforce element types at compile time with no

=== "❓ Question"
    What is: **Generic Algorithms with Concepts**?

=== "✅ Answer"
    Combine templates with C++20 concepts to write algorithms that are both generic and well-constrained.

``` cpp
include <concepts>
include <ranges>
include <algorithm>
include <num


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 11: Generic OOP Design</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Generic OOP Design is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Generic OOP Design** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Generic OOP Design**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
