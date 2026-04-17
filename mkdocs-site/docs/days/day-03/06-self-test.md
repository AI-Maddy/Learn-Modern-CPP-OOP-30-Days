---
title: "06 — Self Test · Day 03"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Classes Encapsulation

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
    A class is more than a bundle of data and functions. A well-designed class establishes an invariant — a guarantee about its internal state that holds at all observable points. Eve

=== "❓ Question"
    What is: **`class` vs `struct`**?

=== "✅ Answer"
    In C++ there is only one real difference between `class` and `struct`: default access.

``` cpp
struct Point {
    int x;   // public by default
    int y;
};

class Circle {

=== "❓ Question"
    What is: **Access Specifiers**?

=== "✅ Answer"
    ``` cpp
class BankAccount {
public:
    // Accessible to everyone
    explicit BankAccount(std::string owner, double initialbalance);
    void deposit(double amount);
    bool wit

=== "❓ Question"
    What is: **Member Functions and `const`-Correctness**?

=== "✅ Answer"
    `const` on a member function means "this function does not modify the observable state of the object". It lets you call the function through a `const` reference or pointer.

``` c


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 03: Classes Encapsulation</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Classes Encapsulation is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Classes Encapsulation** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Classes Encapsulation**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
