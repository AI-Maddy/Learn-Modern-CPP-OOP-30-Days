---
title: "06 — Self Test · Day 25"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-clipboard-check: 06 — Self Test: Mini Project 2 Shape Editor

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


===! "❓ Question"
    What is: **Motivation**?

=== "✅ Answer"
    The shape editor is the classic OOP teaching example — but this day goes beyond the introductory version. You will see four progressively modern approaches to the same problem: 1.

===! "❓ Question"
    What is: **Domain Overview**?

=== "✅ Answer"
    Operations needed: Compute area and perimeter of any shape. Render / describe any shape as a string. Serialise a collection to JSON.

===! "❓ Question"
    What is: **Approach 1: Classic Virtual Polymorphism**?

=== "✅ Answer"
    The foundational approach — each shape overrides a pure virtual interface. When to use: when you have a stable set of types but expect to add new operations rarely.

===! "❓ Question"
    What is: **Approach 2: The Visitor Pattern**?

=== "✅ Answer"
    Add operations (area, serialise, render) without modifying shape classes. This is the Open/Closed Principle applied to operations rather than types.


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 25: Mini Project 2 Shape Editor</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Mini Project 2 Shape Editor is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Mini Project 2 Shape Editor** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Mini Project 2 Shape Editor**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
