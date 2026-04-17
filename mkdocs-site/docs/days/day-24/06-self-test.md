---
title: "06 — Self Test · Day 24"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-clipboard-check: 06 — Self Test: Mini Project 1 Bank System

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
    The best way to consolidate object-oriented knowledge is to build something real. A bank account system is an ideal first mini-project because every OOP pillar — encapsulation, in

=== "❓ Question"
    What is: **Domain Overview**?

=== "✅ Answer"
    Our bank system manages:

    BankAccount (base)
    ├── SavingsAccount   — earns interest, minimum balance rule
    └── CheckingAccount  — overdraft protection, per-transaction f

=== "❓ Question"
    What is: **Design Before Code**?

=== "✅ Answer"
    Before writing a single line of C++, sketch responsibilities:

``` text
┌─────────────────────────────────┐
│         BankAccount             │
│   id      : string            │
│

=== "❓ Question"
    What is: **The Transaction Value Type**?

=== "✅ Answer"
    A `Transaction` is an immutable record of one financial event. Making members `const` documents that transactions are historical facts.

``` cpp
include <chrono>
include <string>


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 24: Mini Project 1 Bank System</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Mini Project 1 Bank System is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Mini Project 1 Bank System** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Mini Project 1 Bank System**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
