---
title: "05 — Flashcards · Day 21"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-cards: 05 — Flashcards: PIMPL Idiom Type Erasure

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
<div class="flashcard" data-card-id="day21-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation — Hiding Implementation Details</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Two recurring problems in C++ library design:</div>
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
<div class="flashcard" data-card-id="day21-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">The pImpl Idiom</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">cpp
// widget.hpp  (public header — stable, ABI-safe)
pragma once
include <memory>
include <string></div>
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
<div class="flashcard" data-card-id="day21-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Type Erasure — Duck Typing at Runtime</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Type erasure allows code to work with values of any type that satisfies a conceptual interface, without that type inheriting from a base class. std::function, std::any, and std::sharedptr<void> are all type-erasing vocab</div>
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
<div class="flashcard" data-card-id="day21-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Custom Type Erasure — The `AnyDrawable` Pattern</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The most powerful pattern: type-erase a whole interface without inheritance.</div>
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
<div class="flashcard" data-card-id="day21-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`std::variant` as Closed-Set Type Erasure</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">When the set of types is known and fixed at compile time:</div>
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
<div class="flashcard" data-card-id="day21-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Type Erasure Technique Comparison</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">| Technique           | Heap alloc  | Type set       | Use case                          |
|---------------------|-------------|----------------|-----------------------------------|
| Virtual base class  | Yes (new)   |</div>
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
<div class="flashcard" data-card-id="day21-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Q1. Why must \\Widget::~Widget()\\ be defined in the \\.cpp\\ file when using pImpl with \\uniqueptr\<Impl\>\\?</div>
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

_No cards at this level._


---

## 📖 Deep Dive Q&A (Active Recall — Feature 6)

!!! tip "How to use"
    Close the page, wait 5 seconds, then come back and open each card without looking at the theory page.
    The retrieval effort is what makes the memory stick.


??? question "Motivation — Hiding Implementation Details"
    Two recurring problems in C++ library design:

??? question "The pImpl Idiom"
    cpp
    // widget.hpp  (public header — stable, ABI-safe)
    pragma once
    include <memory>
    include <string>

??? question "Type Erasure — Duck Typing at Runtime"
    Type erasure allows code to work with values of any type that satisfies a conceptual interface, without that type inheriting from a base class. std::function, std::any, and std::sharedptr<void> are all type-erasing vocab

??? question "Custom Type Erasure — The `AnyDrawable` Pattern"
    The most powerful pattern: type-erase a whole interface without inheritance.

??? question "`std::variant` as Closed-Set Type Erasure"
    When the set of types is known and fixed at compile time:

??? question "Type Erasure Technique Comparison"
    | Technique           | Heap alloc  | Type set       | Use case                          |
    |---------------------|-------------|----------------|-----------------------------------|
    | Virtual base class  | Yes (new)   |

??? question "Self-Check Questions"
    Q1. Why must \\Widget::~Widget()\\ be defined in the \\.cpp\\ file when using pImpl with \\uniqueptr\<Impl\>\\?


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1 — Defaulting the Destructor in the Header"
    Problem: The most common pImpl mistake: `~Widget() = default;` in the header, where `Impl` is incomplete, causes a hard compile error about deleting an incomplete type.

    BAD:

    ``` cpp
    // widget.hpp
    c

??? question "⚠️ Pitfall: Pitfall 2 — pImpl Without Move Operations (Accidentally Deleted)"
    Problem: Declaring a custom destructor suppresses the compiler-generated move constructor and move assignment operator, making the class accidentally non-movable.

    BAD:

    ``` cpp
    // widget.hpp
    class W

??? question "⚠️ Pitfall: Pitfall 3 — `std::any_cast` Without Checking First"
    Problem: Casting `std::any` directly to the wrong type throws `std::badanycast`, which if uncaught terminates the program.

    BAD:

    ``` cpp
    std::any value = std::string("hello");

    // Assuming it holds

??? question "⚠️ Pitfall: Pitfall 4 — Custom Type Erasure Wrapper With Shared Ownership When Unique Is Needed"
    Problem: Using `std::sharedptr<Concept>` inside a type-erasing wrapper when the wrapper is supposed to behave as a value type with independent ownership.

    BAD:

    ``` cpp
    class AnyDrawable {
        std::s

??? question "⚠️ Pitfall: Pitfall 5 — pImpl Disabling the Header-Only Benefit"
    Problem: Using pImpl on a class that is primarily used as a small, frequently-copied value type (e.g., `Point`, `Color`, `Duration`), where the heap allocation and pointer indirection hurt more than

??? question "⚠️ Pitfall: Pitfall 6 — `std::variant` Visitor Missing a Type Arm"
    Problem: A `std::visit` visitor doesn't handle one of the variant alternatives, causing a compile error — but the error message is often cryptic.

    BAD:

    ``` cpp
    using Shape = std::variant<Circle, Squ


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
