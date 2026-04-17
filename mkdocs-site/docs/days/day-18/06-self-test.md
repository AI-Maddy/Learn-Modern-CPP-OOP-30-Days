---
title: "06 — Self Test · Day 18"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-clipboard-check: 06 — Self Test: SOLID Principles

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Motivation — Why SOLID?**?

=== "✅ Answer"
    SOLID is an acronym for five object-oriented design principles articulated by Robert C. Martin. They answer the question: "How do I structure my classes so the system stays easy t

=== "❓ Question"
    What is: **Single Responsibility Principle (SRP)**?

=== "✅ Answer"
    A class should have only one reason to change.

"Reason to change" maps to "actor" — the stakeholder who owns that responsibility. If two unrelated stakeholders can both force a c

=== "❓ Question"
    What is: **Open/Closed Principle (OCP)**?

=== "✅ Answer"
    Software entities should be open for extension but closed for modification.

New behaviour should be addable without touching existing, tested code.

BAD — adding a new shape requ

=== "❓ Question"
    What is: **Liskov Substitution Principle (LSP)**?

=== "✅ Answer"
    Subtypes must be behaviourally substitutable for their base types.

A derived class must honour every postcondition the base class establishes. It may weaken preconditions but mus


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 18: SOLID Principles</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because SOLID Principles is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **SOLID Principles** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **SOLID Principles**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
