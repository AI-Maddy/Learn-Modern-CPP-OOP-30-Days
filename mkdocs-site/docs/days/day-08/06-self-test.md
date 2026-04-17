---
title: "06 — Self Test · Day 08"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Advanced OOP Patterns

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
    Classic object-oriented design teaches inheritance as the primary tool for code reuse. In practice, deep inheritance hierarchies become brittle: every change to a base class rippl

=== "❓ Question"
    What is: **Composition over Inheritance**?

=== "✅ Answer"
    The canonical rule from the Gang of Four: favour object composition over class inheritance. Inheritance models an IS-A relationship; composition models HAS-A.

Why inheritance hur

=== "❓ Question"
    What is: **CRTP Mixins — Zero-Cost Behaviour Injection**?

=== "✅ Answer"
    The Curiously Recurring Template Pattern lets a base class call methods on its derived class without virtual dispatch. Use it to inject reusable behaviour (comparable, printable,

=== "❓ Question"
    What is: **Strategy Pattern with `std::function`**?

=== "✅ Answer"
    The Strategy pattern replaces hard-coded algorithms with interchangeable policies. `std::function<Signature>` is the modern C++ way to store any callable — lambda, function pointe


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 08: Advanced OOP Patterns</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Advanced OOP Patterns is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Advanced OOP Patterns** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Advanced OOP Patterns**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
