---
title: "05 — Flashcards · Day 01"
---

<div class="brain-cluster-banner" data-cluster="foundations">
  🔵 &nbsp; **Foundations** &nbsp;·&nbsp; Frontal Lobe
</div>



# :material-cards: 05 — Flashcards: Variables Types Constexpr

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)

!!! abstract "🟣 Purple = Memory Anchor — Spaced Repetition System"
    **Level 1** = core concepts (must know).
    **Level 2** = deeper understanding.
    **Level 3** = advanced mastery.
    Rate your confidence on each card. Come back tomorrow and re-review L1 and L2.

<button id="study-mode-btn" class="md-button md-button--primary" style="margin-bottom:1rem;">
  🎯 Study Mode — Full Screen Review
</button>

---

## 🟢 Level 1 — Core Concepts (Must Know)

<div class="flashcard-grid">
<div class="flashcard" data-card-id="day01-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Why This Day Matters</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Types are the backbone of C++. The type system lets the compiler prove correctness, enable optimisations, and catch entire classes of bugs before the program ever runs.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day01-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Fundamental Types</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++ provides a set of built-in types with platform-defined but bounded sizes. Why avoid \\int\\ for everything? int is at least 16 bits but commonly 32.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day01-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Brace Initialisation — The Modern Default</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++11 introduced uniform brace initialisation, which should be your default. It prevents narrowing conversions at compile time. Design rule: Prefer {} for all variable initialisation.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day01-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">`auto` — Type Deduction</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">auto asks the compiler to deduce the type from the initialiser. It eliminates redundancy and makes code more resilient to type changes during refactoring.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
</div>


---

## 🟡 Level 2 — Deeper Understanding

<div class="flashcard-grid">
<div class="flashcard" data-card-id="day01-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`const` vs `constexpr`</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">These two keywords are related but serve distinct purposes. Why prefer \\constexpr\\ over \\#define\\? #define MAX 64 is a textual substitution with no type, no scope, and no debugger visibility.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day01-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Structured Bindings (C++17)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Structured bindings let you unpack tuples, pairs, arrays, and aggregates into named variables, eliminating .first, .second, and get&lt;N&gt; noise.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day01-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Value Categories: lvalue and rvalue</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Every expression in C++ belongs to a value category. Understanding this is essential for writing efficient code and understanding move semantics (covered in depth on Day 13).</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day01-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Integer Overflow and Narrowing</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">These are two of the most common sources of silent bugs in C++. Integer overflow (signed): Narrowing conversion: Rule: Always use brace initialisation. Use static_cast when a narrowing conversion is genuinely needed.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
</div>


---

## 🟣 Level 3 — Advanced Mastery

<div class="flashcard-grid">
<div class="flashcard" data-card-id="day01-l3-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Modern C++ Best Practices Summary</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Use {}) for all initialisations — prevents narrowing silently. Use constexpr for compile-time constants instead of #define. Use auto for iterator types and obvious initialisers; spell out the type for domain clarity.</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
<div class="flashcard" data-card-id="day01-l3-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Q1: What is the difference between \\const\\ and \\constexpr\\? Can a \\constexpr\\ variable be used at runtime? const declares a variable whose value cannot change after initialisation; the value may be determined at…</div>
      <div class="flashcard-confidence">
        <div class="confidence-dot" data-level="1" title="Still learning 🔴"></div>
        <div class="confidence-dot" data-level="2" title="Getting there 🟠"></div>
        <div class="confidence-dot" data-level="3" title="Okay 🟡"></div>
        <div class="confidence-dot" data-level="4" title="Good 🟢"></div>
        <div class="confidence-dot" data-level="5" title="Mastered 🟣"></div>
      </div>
    </div>
  </div>
</div>
</div>


---

## 📖 Deep Dive Q&A (Active Recall — Feature 6)

!!! tip "How to use"
    Close the page, wait 5 seconds, then come back and open each card without looking at the theory page.
    The retrieval effort is what makes the memory stick.


??? question "Why This Day Matters"
    Types are the backbone of C++. The type system lets the compiler prove correctness, enable optimisations, and catch entire classes of bugs before the program ever runs.

??? question "Fundamental Types"
    C++ provides a set of built-in types with platform-defined but bounded sizes. Why avoid \\int\\ for everything? int is at least 16 bits but commonly 32.

??? question "Brace Initialisation — The Modern Default"
    C++11 introduced uniform brace initialisation, which should be your default. It prevents narrowing conversions at compile time. Design rule: Prefer {} for all variable initialisation.

??? question "`auto` — Type Deduction"
    auto asks the compiler to deduce the type from the initialiser. It eliminates redundancy and makes code more resilient to type changes during refactoring.

??? question "`const` vs `constexpr`"
    These two keywords are related but serve distinct purposes. Why prefer \\constexpr\\ over \\#define\\? #define MAX 64 is a textual substitution with no type, no scope, and no debugger visibility.

??? question "Structured Bindings (C++17)"
    Structured bindings let you unpack tuples, pairs, arrays, and aggregates into named variables, eliminating .first, .second, and get<N> noise.

??? question "Value Categories: lvalue and rvalue"
    Every expression in C++ belongs to a value category. Understanding this is essential for writing efficient code and understanding move semantics (covered in depth on Day 13).

??? question "Integer Overflow and Narrowing"
    These are two of the most common sources of silent bugs in C++. Integer overflow (signed): Narrowing conversion: Rule: Always use brace initialisation. Use static_cast when a narrowing conversion is genuinely needed.

??? question "Modern C++ Best Practices Summary"
    Use {}) for all initialisations — prevents narrowing silently. Use constexpr for compile-time constants instead of #define. Use auto for iterator types and obvious initialisers; spell out the type for domain clarity.

??? question "Self-Check Questions"
    Q1: What is the difference between \\const\\ and \\constexpr\\? Can a \\constexpr\\ variable be used at runtime? const declares a variable whose value cannot change after initialisation; the value may be determined at…


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: Uninitialised Variables"
    Description: Declaring a variable without an initialiser and then reading from it before a guaranteed assignment. The value is indeterminate — reading it is undefined behaviour.

??? question "⚠️ Pitfall: Pitfall 2: Silent Narrowing Conversion"
    Description: Assigning a wider type to a narrower type using = or (), which silently truncates or changes the value with no diagnostic.

??? question "⚠️ Pitfall: Pitfall 3: Using `#define` for Constants"
    Description: Defining compile-time constants with the C preprocessor macro #define instead of constexpr. Macros have no type, no scope, and no debugger visibility.

??? question "⚠️ Pitfall: Pitfall 4: Signed/Unsigned Comparison"
    Description: Comparing a signed integer to an unsigned integer (e.g., comparing an int loop counter to std::vector::size() which returns std::size_t).

??? question "⚠️ Pitfall: Pitfall 5: Misunderstanding `auto` Reference Semantics"
    Description: Using auto without & when iterating over a container, causing an unexpected copy of each element. BAD code: Why it fails: auto name deduces std::string (a value), not std::string& (a…


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
