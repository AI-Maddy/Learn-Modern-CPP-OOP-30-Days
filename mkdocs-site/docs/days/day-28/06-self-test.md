---
title: "06 — Self Test · Day 28"
---

<div class="brain-cluster-banner" data-cluster="review">
  ⚪ &nbsp; **Review & Mastery** &nbsp;·&nbsp; Brain Stem
</div>



# :material-clipboard-check: 06 — Self Test: Code Review Common Pitfalls

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
    Code review is where knowledge transfers between engineers and where accumulated bugs are caught before they reach users. A reviewer who does not know the common C++ anti-patterns

=== "❓ Question"
    What is: **How to Give a Code Review**?

=== "✅ Answer"
    Effective code reviews are structured. Work through these layers in order:

Layer 1 — Correctness  
Does the code do what the ticket/spec says? Are edge cases handled? Can it pani

=== "❓ Question"
    What is: **How to Receive a Code Review**?

=== "✅ Answer"
    - Treat every comment as a question, not an attack.
- Respond to every comment — either fix it, explain why you disagree, or ask for clarification. "Done" and "Good point, will fi

=== "❓ Question"
    What is: **The C++ Anti-Pattern Checklist**?

=== "✅ Answer"
    Use this checklist mentally on every PR:

1. Raw \`\`new\`\` / \`\`delete\`\`

``` cpp
// BAD: manual memory management
Foo p = new Foo(args);
// ... something throws here ...
del


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 28: Code Review Common Pitfalls</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Code Review Common Pitfalls is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Code Review Common Pitfalls** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Code Review Common Pitfalls**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
