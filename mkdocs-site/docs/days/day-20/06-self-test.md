---
title: "06 — Self Test · Day 20"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Static Polymorphism CRTP

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Motivation — The Cost of Virtual Dispatch**?

=== "✅ Answer"
    Virtual dispatch is essential for runtime polymorphism but carries costs:

- Indirect call — every virtual method call goes through a vtable pointer; the CPU must load the vtable,

=== "❓ Question"
    What is: **CRTP Mechanics**?

=== "✅ Answer"
    CRTP is the idiom where a base class template takes the derived class as its template argument:

``` cpp
template<typename Derived>
struct Base {
    void interface() {
        //

=== "❓ Question"
    What is: **Static Interface Enforcement**?

=== "✅ Answer"
    CRTP enforces that a derived class implements required methods. If `ConcreteA` forgets `implementation()`, the program fails to compile when `base.interface()` is instantiated — n

=== "❓ Question"
    What is: **CRTP for Default Implementations (Mixin Pattern)**?

=== "✅ Answer"
    The base class provides default behaviour by calling the derived class's customisation hook. The derived class only overrides what it needs.

``` cpp
// Provides !=, >, <=, >= fro


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 20: Static Polymorphism CRTP</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Static Polymorphism CRTP is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Static Polymorphism CRTP** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Static Polymorphism CRTP**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
