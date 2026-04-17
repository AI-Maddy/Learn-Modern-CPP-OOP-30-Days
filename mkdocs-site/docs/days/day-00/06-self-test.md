---
title: "06 — Self Test · Day 00"
---

<div class="brain-cluster-banner" data-cluster="foundations">
  🔵 &nbsp; **Foundations** &nbsp;·&nbsp; Frontal Lobe
</div>



# :material-clipboard-check: 06 — Self Test: Setup And Basics

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
    Before writing a single meaningful line of C++, you need a reliable foundation: a working toolchain, a build system you understand, and automated quality gates that catch problems

=== "❓ Question"
    What is: **The C++ Compilation Pipeline**?

=== "✅ Answer"
    Understanding what actually happens when you type `g++ main.cpp` demystifies linker errors, header include-order problems, and optimisation flags.

    Source (.cpp)
         |

=== "❓ Question"
    What is: **Compiler Flags That Matter**?

=== "✅ Answer"
    Flags are not optional polish — they are safety nets. The following set is the default for every project in this course.

``` cmake
 CMakeLists.txt — project-wide compile options

=== "❓ Question"
    What is: **CMake: A Minimal but Correct Project**?

=== "✅ Answer"
    CMake is the de-facto standard build system for C++. It generates native build files (Makefiles, Ninja, Visual Studio solutions) from a single portable description.

``` cmake
cma


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 00: Setup And Basics</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Setup And Basics is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Setup And Basics** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Setup And Basics**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
