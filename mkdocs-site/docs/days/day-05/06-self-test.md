---
title: "06 — Self Test · Day 05"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Smart Pointers Ownership

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
    Raw pointers do not convey ownership. When you see a raw pointer in a function signature, you cannot tell: does this function own the pointed-to object? Is it borrowing it? Does i

=== "❓ Question"
    What is: **Ownership Vocabulary**?

=== "✅ Answer"
    Before examining each smart pointer, establish the vocabulary:

- Owner: the entity responsible for destroying the resource.
- Non-owning reference: borrows access without taking

=== "❓ Question"
    What is: **`std::unique_ptr` — Exclusive Ownership**?

=== "✅ Answer"
    `uniqueptr<T>` is a non-copyable, movable RAII wrapper. It destroys the owned object when it goes out of scope. Zero runtime overhead compared to a raw pointer.

``` cpp
include <

=== "❓ Question"
    What is: **`std::shared_ptr` — Shared Ownership**?

=== "✅ Answer"
    `sharedptr<T>` maintains a reference count. The object is destroyed when the last `sharedptr` pointing to it is destroyed. Use when multiple independent owners need the object to


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 05: Smart Pointers Ownership</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Smart Pointers Ownership is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Smart Pointers Ownership** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Smart Pointers Ownership**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
