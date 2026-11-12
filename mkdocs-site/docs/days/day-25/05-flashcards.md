---
title: "05 — Flashcards · Day 25"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-cards: 05 — Flashcards: Mini Project 2 Shape Editor

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
<div class="flashcard" data-card-id="day25-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The shape editor is the classic OOP teaching example — but this day goes beyond the introductory version. You will see four progressively modern approaches to the same problem: 1.</div>
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
<div class="flashcard" data-card-id="day25-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Domain Overview</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Operations needed: Compute area and perimeter of any shape. Render / describe any shape as a string. Serialise a collection to JSON. Filter a collection (e.g., keep only shapes with area \&gt; threshold).</div>
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
<div class="flashcard" data-card-id="day25-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Approach 1: Classic Virtual Polymorphism</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The foundational approach — each shape overrides a pure virtual interface. When to use: when you have a stable set of types but expect to add new operations rarely.</div>
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
<div class="flashcard" data-card-id="day25-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Approach 2: The Visitor Pattern</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Add operations (area, serialise, render) without modifying shape classes. This is the Open/Closed Principle applied to operations rather than types.</div>
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
<div class="flashcard" data-card-id="day25-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Approach 3: std::variant — The Modern Alternative</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++17 std::variant models a type-safe discriminated union. No vtable, no heap allocation for the shape itself, and std::visit dispatches at compile time via a generated jump table.</div>
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
<div class="flashcard" data-card-id="day25-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Approach 4: Factory + std::ranges Filtering</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A factory creates shapes from runtime string tags. std::ranges provides pipeline-style filtering and transformation.</div>
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
<div class="flashcard" data-card-id="day25-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">ASCII Diagram: Four Approaches Compared</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">This is the Expression Problem: no solution is perfect for both axes without additional machinery (type erasure / concept-based polymorphism).</div>
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
<div class="flashcard" data-card-id="day25-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Design Tradeoffs</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Virtual dispatch vs variant: vtable costs one indirect call per virtual function. std::variant dispatches via a generated jump table with no heap allocation — measurably faster in tight loops over many shapes.</div>
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
<div class="flashcard" data-card-id="day25-l3-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">1. When would you choose std::variant over a virtual-function hierarchy? When the set of types is small and known at compile time, you want stack allocation (no heap), or you need the compiler to enforce exhaustive…</div>
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


??? question "Motivation"
    The shape editor is the classic OOP teaching example — but this day goes beyond the introductory version. You will see four progressively modern approaches to the same problem: 1.

??? question "Domain Overview"
    Operations needed: Compute area and perimeter of any shape. Render / describe any shape as a string. Serialise a collection to JSON. Filter a collection (e.g., keep only shapes with area \> threshold).

??? question "Approach 1: Classic Virtual Polymorphism"
    The foundational approach — each shape overrides a pure virtual interface. When to use: when you have a stable set of types but expect to add new operations rarely.

??? question "Approach 2: The Visitor Pattern"
    Add operations (area, serialise, render) without modifying shape classes. This is the Open/Closed Principle applied to operations rather than types.

??? question "Approach 3: std::variant — The Modern Alternative"
    C++17 std::variant models a type-safe discriminated union. No vtable, no heap allocation for the shape itself, and std::visit dispatches at compile time via a generated jump table.

??? question "Approach 4: Factory + std::ranges Filtering"
    A factory creates shapes from runtime string tags. std::ranges provides pipeline-style filtering and transformation.

??? question "ASCII Diagram: Four Approaches Compared"
    This is the Expression Problem: no solution is perfect for both axes without additional machinery (type erasure / concept-based polymorphism).

??? question "Design Tradeoffs"
    Virtual dispatch vs variant: vtable costs one indirect call per virtual function. std::variant dispatches via a generated jump table with no heap allocation — measurably faster in tight loops over many shapes.

??? question "Self-Check Questions"
    1. When would you choose std::variant over a virtual-function hierarchy? When the set of types is small and known at compile time, you want stack allocation (no heap), or you need the compiler to enforce exhaustive…


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: Switch-on-Type Instead of Polymorphism"
    Description Querying a pointer's dynamic type with dynamic_cast or a type-tag enum inside a switch is a red flag. It duplicates the virtual dispatch the compiler already provides and breaks every…

??? question "⚠️ Pitfall: Pitfall 2: Ignoring `[[nodiscard]]` on Geometry Functions"
    Description Calling shape.area() without using the return value is almost always a programming error (e.g., calling the function for a side-effect it does not have, or forgetting to store the…

??? question "⚠️ Pitfall: Pitfall 3: Storing Polymorphic Objects by Value (Object Slicing)"
    Description Putting a derived object into a container of base-class values silently discards the derived portion. Virtual dispatch then uses the wrong vtable.

??? question "⚠️ Pitfall: Pitfall 4: Unchecked `std::get` on `std::variant`"
    Description std::get<T>(v) throws std::bad_variant_access if the variant does not currently hold type T. Calling it without checking the active type first causes runtime exceptions.

??? question "⚠️ Pitfall: Pitfall 5: Forgetting the Visitor `accept()` in Derived Classes"
    Description If a concrete shape forgets to override accept(), it inherits the base class version (or has no accept at all). The visitor dispatches to the wrong overload silently.

??? question "⚠️ Pitfall: Pitfall 6: Missing Validation in Shape Constructors"
    Description Creating a Circle with radius zero or a Rectangle with a negative dimension produces a mathematically invalid shape that silently poisons every subsequent calculation.


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
