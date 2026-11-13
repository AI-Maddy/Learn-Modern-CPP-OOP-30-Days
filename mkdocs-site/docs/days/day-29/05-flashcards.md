---
title: "05 — Flashcards · Day 29"
---

<div class="brain-cluster-banner" data-cluster="review">
  ⚪ &nbsp; **Review & Mastery** &nbsp;·&nbsp; Brain Stem
</div>



# :material-cards: 05 — Flashcards: Advanced Topics Deep Dive

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
<div class="flashcard" data-card-id="day29-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++20 introduced several features that change the way high-performance and systems-level code is written. This day covers five topics that reward the effort to understand them deeply: 1.</div>
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
<div class="flashcard" data-card-id="day29-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Coroutines: Concepts</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A coroutine is a function that can suspend and resume execution. Unlike threads, suspension is cooperative and happens at explicit co_await / co_yield points — no context switch, no mutex.</div>
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
<div class="flashcard" data-card-id="day29-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Custom Allocators</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The default allocator calls ::operator new for every allocation. In performance-critical code, custom allocators can: Use a pre-allocated pool (no system calls during use). Use stack memory for small allocations.</div>
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
<div class="flashcard" data-card-id="day29-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">`consteval`: Compile-Time-Only Functions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">consteval (C++20) declares a function that must be evaluated at compile time. If called in a runtime context, the compiler rejects it. This is stronger than constexpr, which may run at either time.</div>
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
<div class="flashcard" data-card-id="day29-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`std::bit_cast`: Safe Type Punning</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Before C++20, the only standard-conforming way to reinterpret bytes of one type as another was memcpy. std::bit_cast does the same thing but is: Evaluated at compile time (constexpr).</div>
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
<div class="flashcard" data-card-id="day29-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Compile-Time Algorithms with `constexpr`</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++17/20 mark most standard algorithms constexpr. You can sort, search, and compute on arrays entirely at compile time.</div>
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
<div class="flashcard" data-card-id="day29-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Embedded C++ Considerations</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">On embedded systems the same techniques apply with additional constraints: No dynamic memory: heap allocation is often prohibited in safety-critical systems. Use constexpr arrays, std::array, or pool allocators.</div>
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
<div class="flashcard" data-card-id="day29-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Design Tradeoffs</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Coroutines vs threads: coroutines are lighter (no kernel context switch, no stack per coroutine), but they require cooperative yielding. Threads are pre-emptive — a blocked thread does not block the scheduler.</div>
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
<div class="flashcard" data-card-id="day29-l3-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">1. What is the difference between co_yield and co_return? co_yield suspends the coroutine and produces an intermediate value — the coroutine can be resumed later.</div>
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
    C++20 introduced several features that change the way high-performance and systems-level code is written. This day covers five topics that reward the effort to understand them deeply: 1.

??? question "Coroutines: Concepts"
    A coroutine is a function that can suspend and resume execution. Unlike threads, suspension is cooperative and happens at explicit co_await / co_yield points — no context switch, no mutex.

??? question "Custom Allocators"
    The default allocator calls ::operator new for every allocation. In performance-critical code, custom allocators can: Use a pre-allocated pool (no system calls during use). Use stack memory for small allocations.

??? question "`consteval`: Compile-Time-Only Functions"
    consteval (C++20) declares a function that must be evaluated at compile time. If called in a runtime context, the compiler rejects it. This is stronger than constexpr, which may run at either time.

??? question "`std::bit_cast`: Safe Type Punning"
    Before C++20, the only standard-conforming way to reinterpret bytes of one type as another was memcpy. std::bit_cast does the same thing but is: Evaluated at compile time (constexpr).

??? question "Compile-Time Algorithms with `constexpr`"
    C++17/20 mark most standard algorithms constexpr. You can sort, search, and compute on arrays entirely at compile time.

??? question "Embedded C++ Considerations"
    On embedded systems the same techniques apply with additional constraints: No dynamic memory: heap allocation is often prohibited in safety-critical systems. Use constexpr arrays, std::array, or pool allocators.

??? question "Design Tradeoffs"
    Coroutines vs threads: coroutines are lighter (no kernel context switch, no stack per coroutine), but they require cooperative yielding. Threads are pre-emptive — a blocked thread does not block the scheduler.

??? question "Self-Check Questions"
    1. What is the difference between co_yield and co_return? co_yield suspends the coroutine and produces an intermediate value — the coroutine can be resumed later.


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: Destroying a Coroutine Handle Twice"
    Description Calling handle_.destroy() on an already-destroyed coroutine handle, or allowing two owner objects to both call destroy(), is undefined behaviour (double-free on the coroutine frame).

??? question "⚠️ Pitfall: Pitfall 2: Resuming a Finished Coroutine"
    Description Calling handle_.resume() after the coroutine has reached its final suspension point (done() == true) is undefined behaviour.

??? question "⚠️ Pitfall: Pitfall 3: Using consteval With Runtime-Only Arguments"
    Description Calling a consteval function with a variable whose value is not known at compile time produces a compile error.

??? question "⚠️ Pitfall: Pitfall 4: bit_cast on Non-Trivially-Copyable Types"
    Description std::bit_cast<T>(src) requires both types to be the same size and trivially copyable. Using it with non-trivial types (e.g., std::string) is a compile error.

??? question "⚠️ Pitfall: Pitfall 5: Allocating in a Coroutine When the Allocator Is a Pool"
    Description Coroutine frames are allocated on the heap by default using ::operator new. On embedded systems or in pool-only environments, this bypasses the pool and falls back to the global…

??? question "⚠️ Pitfall: Pitfall 6: Ignoring pmr Allocator Lifetime"
    Description A std::pmr::vector holds a non-owning pointer to its memory resource. If the resource is destroyed before the vector, any subsequent access to the vector's memory is undefined behaviour.


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
