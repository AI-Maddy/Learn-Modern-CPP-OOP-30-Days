---
title: "06 — Self Test · Day 14"
---

<div class="brain-cluster-banner" data-cluster="memory">
  🔴 &nbsp; **Memory & Error Handling** &nbsp;·&nbsp; Limbic System
</div>



# :material-clipboard-check: 06 — Self Test: Rule of 5 Copy Move

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
    Every class that manages a resource — raw memory, a file handle, a network socket, a mutex — must answer six questions about object lifetime:

1.  How is the resource created? (co

=== "❓ Question"
    What is: **Rule of Zero**?

=== "✅ Answer"
    The best rule: if a class does not directly manage a resource, define none of the five special members. Let the compiler generate them all.

``` cpp
include <string>
include <vect

=== "❓ Question"
    What is: **Rule of Five**?

=== "✅ Answer"
    If you define (or \`\`=delete\`\`) any one of the five special members, you must explicitly handle all five — because the compiler's implicit generation rules become unreliable on

=== "❓ Question"
    What is: **`=default` and `=delete`**?

=== "✅ Answer"
    `= default` asks the compiler to generate an operation explicitly. `= delete` prevents the operation entirely.

``` cpp
class MoveOnly {
    std::uniqueptr<int> resource;
public:


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 14: Rule of 5 Copy Move</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Rule of 5 Copy Move is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Rule of 5 Copy Move** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Rule of 5 Copy Move**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
