---
title: "06 — Self Test · Day 27"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-clipboard-check: 06 — Self Test: Refactoring Legacy Code

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
    Most professional C++ work involves changing existing code, not writing from scratch. Legacy codebases are full of patterns that were written before modern C++ existed, under time

=== "❓ Question"
    What is: **Recognising Code Smells**?

=== "✅ Answer"
    A code smell is a symptom that suggests a deeper problem. Common C++ smells:

Long Method  
A function longer than ~30 lines that mixes multiple levels of abstraction. It is hard

=== "❓ Question"
    What is: **The Strangler Fig Pattern**?

=== "✅ Answer"
    The safest approach for large refactors is the Strangler Fig: grow the new system alongside the old one, redirect traffic incrementally, then remove the old code when it is no lon

=== "❓ Question"
    What is: **Step 1: Add Tests Before Touching Anything**?

=== "✅ Answer"
    Before changing a single line, write tests that characterise the current behaviour — even if that behaviour is wrong. These are called characterisation tests. They pin the current


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 27: Refactoring Legacy Code</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Refactoring Legacy Code is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Refactoring Legacy Code** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Refactoring Legacy Code**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
