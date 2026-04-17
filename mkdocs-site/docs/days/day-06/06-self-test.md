---
title: "06 — Self Test · Day 06"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Inheritance Polymorphism

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
    Inheritance lets you express "is-a" relationships and share behaviour across a type hierarchy. Polymorphism lets you write code that works on the base class and automatically hand

=== "❓ Question"
    What is: **The is-a Relationship**?

=== "✅ Answer"
    Inheritance models the "is-a" relationship: a `Dog` is an `Animal`. This is distinct from "has-a" (composition): a `Car` has-an `Engine`. Use inheritance for is-a; use composition

=== "❓ Question"
    What is: **Virtual Functions and the vtable**?

=== "✅ Answer"
    A virtual function is dispatched at runtime based on the actual type of the object, not the declared type of the pointer or reference.

``` cpp
Shape s = new Circle{5.0};
double a

=== "❓ Question"
    What is: **`override` and `final`**?

=== "✅ Answer"
    `override` tells the compiler "this function is intended to override a base class virtual function". If the signature does not match, the compiler reports an error.

``` cpp
class


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 06: Inheritance Polymorphism</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Inheritance Polymorphism is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Inheritance Polymorphism** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Inheritance Polymorphism**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
