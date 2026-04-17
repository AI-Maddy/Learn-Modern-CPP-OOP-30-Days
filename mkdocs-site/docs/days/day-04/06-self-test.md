---
title: "06 — Self Test · Day 04"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Constructors Destructors RAII

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Why This Day Matters**?

=== "✅ Answer"
    Resource management is the hardest problem in systems programming. C++ solves it elegantly with one principle: Resource Acquisition Is Initialization (RAII). Tie a resource's life

=== "❓ Question"
    What is: **Constructor Types**?

=== "✅ Answer"
    C++ provides six special member functions. Today we cover the constructor family.

 Default Constructor

A constructor that can be called with no arguments.

``` cpp
class Timer {

=== "❓ Question"
    What is: **Member Initialiser List**?

=== "✅ Answer"
    Members are initialised in declaration order, not in the order they appear in the initialiser list. Initialise all members in the initialiser list rather than assigning in the con

=== "❓ Question"
    What is: **RAII: The Core Pattern**?

=== "✅ Answer"
    RAII links resource lifetime to object lifetime. The object's constructor acquires the resource; the destructor releases it. Because destructors run deterministically when the obj


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 04: Constructors Destructors RAII</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Constructors Destructors RAII is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Constructors Destructors RAII** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Constructors Destructors RAII**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
