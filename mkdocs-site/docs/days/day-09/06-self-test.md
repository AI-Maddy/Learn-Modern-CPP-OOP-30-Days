---
title: "06 — Self Test · Day 09"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Templates Basics

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
    Imagine writing `max()` once for `int`, then again for `double`, then again for `std::string`. Duplicated logic, duplicated bugs, duplicated maintenance. C++ templates let you wri

=== "❓ Question"
    What is: **Function Templates**?

=== "✅ Answer"
    A function template is a blueprint. The compiler stamps out a concrete function for each combination of template arguments it encounters.

``` cpp
include <string>
include <iostre

=== "❓ Question"
    What is: **Class Templates**?

=== "✅ Answer"
    Class templates parametrise entire classes. Every member function is itself a template function of the class template parameters.

``` cpp
include <cassert>
include <stdexcept>

/

=== "❓ Question"
    What is: **Template Type Deduction**?

=== "✅ Answer"
    The compiler infers template arguments from the function call arguments. The rules closely mirror the rules for `auto` deduction.

``` cpp
template <typename T>
void inspect(T x)


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 09: Templates Basics</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Templates Basics is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Templates Basics** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Templates Basics**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
