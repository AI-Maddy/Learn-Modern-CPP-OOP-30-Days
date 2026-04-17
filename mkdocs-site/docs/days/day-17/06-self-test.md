---
title: "06 — Self Test · Day 17"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Design Patterns OOP

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Motivation — Why Patterns Matter (and When They Don't)**?

=== "✅ Answer"
    The Gang of Four (GoF) book catalogued 23 recurring solutions to common OOP design problems in 1994. Many of those solutions were written around the limitations of C++98: no lambd

=== "❓ Question"
    What is: **GoF Pattern Overview**?

=== "✅ Answer"
    Creational       Structural        Behavioural
    ─────────────    ──────────────    ────────────────────
    Factory Method   Adapter           Observer
    Abstract Factory

=== "❓ Question"
    What is: **Factory Method**?

=== "✅ Answer"
    Intent: Define an interface for creating an object, but let subclasses (or a factory function) decide which class to instantiate. Decouples creation from usage.

Classic OOP probl

=== "❓ Question"
    What is: **Observer**?

=== "✅ Answer"
    Intent: Define a one-to-many dependency so that when one object changes state, all dependents are notified automatically.

Modern C++ implementation without virtual inheritance —


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 17: Design Patterns OOP</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Design Patterns OOP is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Design Patterns OOP** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Design Patterns OOP**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
