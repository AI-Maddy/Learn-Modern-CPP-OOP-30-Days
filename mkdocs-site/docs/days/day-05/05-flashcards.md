---
title: "05 — Flashcards · Day 05"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-cards: 05 — Flashcards: Smart Pointers Ownership

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
<div class="flashcard" data-card-id="day05-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Why This Day Matters</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Raw pointers do not convey ownership. When you see a raw pointer in a function signature, you cannot tell: does this function own the pointed-to object? Is it borrowing it? Does it need to delete it? Smart pointers make</div>
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
<div class="flashcard" data-card-id="day05-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Ownership Vocabulary</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Before examining each smart pointer, establish the vocabulary:</div>
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
<div class="flashcard" data-card-id="day05-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">`std::unique_ptr` — Exclusive Ownership</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">uniqueptr<T> is a non-copyable, movable RAII wrapper. It destroys the owned object when it goes out of scope. Zero runtime overhead compared to a raw pointer.</div>
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
<div class="flashcard" data-card-id="day05-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">`std::shared_ptr` — Shared Ownership</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">sharedptr<T> maintains a reference count. The object is destroyed when the last sharedptr pointing to it is destroyed. Use when multiple independent owners need the object to remain alive as long as any of them need it.</div>
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
<div class="flashcard" data-card-id="day05-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`std::weak_ptr` — Non-Owning Observer</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">weakptr<T> holds a non-owning reference to a sharedptr-managed object. It does not prevent the object from being destroyed. Before accessing the object, you must lock the weakptr into a sharedptr; if the object has alrea</div>
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
<div class="flashcard" data-card-id="day05-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Custom Deleters</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Both uniqueptr and sharedptr accept a custom deleter — a callable invoked instead of delete when the object is released.</div>
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
<div class="flashcard" data-card-id="day05-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Observer Pattern Without Cycles</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A classic use of weakptr: an event system where observers register interest but should not keep the publisher alive.</div>
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
<div class="flashcard" data-card-id="day05-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Raw Pointers — The Non-Owning Convention</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">In modern C++, a raw pointer (T) in a function signature means "non-owning borrow". The caller retains ownership. The function must not delete the pointer.</div>
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
<div class="flashcard" data-card-id="day05-l3-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Q1: When should you use \\uniqueptr\\ vs \\sharedptr\\?</div>
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
    Raw pointers do not convey ownership. When you see a raw pointer in a function signature, you cannot tell: does this function own the pointed-to object? Is it borrowing it? Does it need to delete it? Smart pointers make

??? question "Ownership Vocabulary"
    Before examining each smart pointer, establish the vocabulary:

??? question "`std::unique_ptr` — Exclusive Ownership"
    uniqueptr<T> is a non-copyable, movable RAII wrapper. It destroys the owned object when it goes out of scope. Zero runtime overhead compared to a raw pointer.

??? question "`std::shared_ptr` — Shared Ownership"
    sharedptr<T> maintains a reference count. The object is destroyed when the last sharedptr pointing to it is destroyed. Use when multiple independent owners need the object to remain alive as long as any of them need it.

??? question "`std::weak_ptr` — Non-Owning Observer"
    weakptr<T> holds a non-owning reference to a sharedptr-managed object. It does not prevent the object from being destroyed. Before accessing the object, you must lock the weakptr into a sharedptr; if the object has alrea

??? question "Custom Deleters"
    Both uniqueptr and sharedptr accept a custom deleter — a callable invoked instead of delete when the object is released.

??? question "Observer Pattern Without Cycles"
    A classic use of weakptr: an event system where observers register interest but should not keep the publisher alive.

??? question "Raw Pointers — The Non-Owning Convention"
    In modern C++, a raw pointer (T) in a function signature means "non-owning borrow". The caller retains ownership. The function must not delete the pointer.

??? question "Self-Check Questions"
    Q1: When should you use \\uniqueptr\\ vs \\sharedptr\\?


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: Shared Pointer Cycles Causing Memory Leaks"
    Description: Two or more objects holding `sharedptr` references to each other in a cycle. The reference count of each never reaches zero, so neither object is ever destroyed.

    BAD code:

    ``` cpp
    incl

??? question "⚠️ Pitfall: Pitfall 2: Using `shared_ptr` by Default (Overuse)"
    Description: Reaching for `sharedptr` for every heap-allocated object regardless of whether shared ownership is actually needed. `sharedptr` has measurable overhead: atomic reference count increments

??? question "⚠️ Pitfall: Pitfall 3: Storing `this` in a `shared_ptr` Without `enable_shared_from_this`"
    Description: Creating a second `sharedptr` from a raw `this` pointer inside a member function when the object is already managed by a `sharedptr`. This creates two independent control blocks for the

??? question "⚠️ Pitfall: Pitfall 4: Calling `get()` and Storing the Raw Pointer Longer Than the Smart Pointer"
    Description: Extracting a raw pointer from a smart pointer via `get()` and storing it in a variable or data structure that outlives the smart pointer. The raw pointer becomes dangling.

    BAD code:

    ``


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
