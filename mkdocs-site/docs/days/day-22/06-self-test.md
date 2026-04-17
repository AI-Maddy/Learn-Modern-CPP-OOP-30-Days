---
title: "06 — Self Test · Day 22"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Performance Tips OOP

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Motivation — Measure Before You Optimise**?

=== "✅ Answer"
    Most OOP performance advice is anecdotal without benchmarks. The principles below are real and measurable, but their magnitude depends entirely on your specific workload, data siz

=== "❓ Question"
    What is: **Cache Lines and Data Locality**?

=== "✅ Answer"
    Modern CPUs read memory in cache lines (64 bytes on x86). If your data fits in cache, arithmetic is fast. If it doesn't, the CPU stalls waiting for RAM — this is the cache miss pe

=== "❓ Question"
    What is: **Virtual Call Cost and Devirtualisation**?

=== "✅ Answer"
    A virtual call through a pointer-to-base requires:

1.  Load the `vptr` from the object.
2.  Load the function pointer from the vtable at the correct offset.
3.  Indirect call to

=== "❓ Question"
    What is: **Hot/Cold Data Splitting**?

=== "✅ Answer"
    If an object has members that are accessed in the hot path and members that are rarely accessed, keeping them together wastes cache lines.

``` cpp
// BAD: hot and cold data mixed


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 22: Performance Tips OOP</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Performance Tips OOP is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Performance Tips OOP** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Performance Tips OOP**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
