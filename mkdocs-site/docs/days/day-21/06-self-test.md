---
title: "06 — Self Test · Day 21"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-clipboard-check: 06 — Self Test: PIMPL Idiom Type Erasure

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Motivation — Hiding Implementation Details**?

=== "✅ Answer"
    Two recurring problems in C++ library design:

Problem 1 — Compilation Firewall: A header file for a class exposes all private members to every consumer because C++ class layout m

=== "❓ Question"
    What is: **The pImpl Idiom**?

=== "✅ Answer"
    ``` cpp
// widget.hpp  (public header — stable, ABI-safe)
pragma once
include <memory>
include <string>

class Widget {
public:
    explicit Widget(std::string title);
    ~Widget

=== "❓ Question"
    What is: **Type Erasure — Duck Typing at Runtime**?

=== "✅ Answer"
    Type erasure allows code to work with values of any type that satisfies a conceptual interface, without that type inheriting from a base class. `std::function`, `std::any`, and `s

=== "❓ Question"
    What is: **Custom Type Erasure — The `AnyDrawable` Pattern**?

=== "✅ Answer"
    The most powerful pattern: type-erase a whole interface without inheritance.

``` cpp
class AnyDrawable {
public:
    template<typename T>
    AnyDrawable(T obj)
        : self{st


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 21: PIMPL Idiom Type Erasure</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because PIMPL Idiom Type Erasure is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **PIMPL Idiom Type Erasure** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **PIMPL Idiom Type Erasure**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
