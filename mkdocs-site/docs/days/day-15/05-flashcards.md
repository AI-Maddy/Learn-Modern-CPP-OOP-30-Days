---
title: "05 — Flashcards · Day 15"
---

<div class="brain-cluster-banner" data-cluster="memory">
  🔴 &nbsp; **Memory & Error Handling** &nbsp;·&nbsp; Limbic System
</div>



# :material-cards: 05 — Flashcards: Error Handling Expected C++23

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
<div class="flashcard" data-card-id="day15-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Error handling is one of the most contentious design areas in C++. Three main approaches exist, each with distinct tradeoffs: Exceptions — the standard mechanism; zero-overhead on the happy path; complex stack…</div>
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
<div class="flashcard" data-card-id="day15-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Exceptions — Strengths and Weaknesses</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">When to use exceptions: Truly exceptional conditions (out-of-memory, logic programming errors). When error handling belongs far from the error site.</div>
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
<div class="flashcard" data-card-id="day15-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">`std::optional` — Absent Values</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">std::optional&lt;T&gt; represents a value that may or may not be present. Use it when absence is normal (not an error). Design rule: std::optional&lt;T&gt; for &quot;no value is a normal outcome.&quot; Do NOT use it to represent errors with…</div>
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
<div class="flashcard" data-card-id="day15-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">`std::expected&lt;T, E&gt;` (C++23)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">std::expected&lt;T, E&gt; holds either a value of type T (success) or an error of type E (failure). It makes the error path visible in the return type.</div>
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
<div class="flashcard" data-card-id="day15-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`std::variant` as a Result Type</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Before C++23, std::variant&lt;T, E&gt; was the idiomatic result type. It is more verbose but works in C++17.</div>
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
<div class="flashcard" data-card-id="day15-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Monadic Operations — `.and_then` and `.or_else`</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">C++23 adds monadic operations to std::expected and std::optional, enabling pipeline-style error handling without nested if checks. ASCII diagram — monadic chain: read_config(&quot;app.conf&quot;) │ ▼ (success: &quot;port=8080&quot;)…</div>
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
<div class="flashcard" data-card-id="day15-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`noexcept` Correctness</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">noexcept is a contract: the function will not propagate exceptions. It enables optimisations and is required for move operations to be used by standard containers.</div>
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
<div class="flashcard" data-card-id="day15-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">1. When should you use std::optional vs std::expected? Use std::optional&lt;T&gt; when &quot;no value&quot; is a normal outcome with no need to communicate why.</div>
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


??? question "Motivation"
    Error handling is one of the most contentious design areas in C++. Three main approaches exist, each with distinct tradeoffs: Exceptions — the standard mechanism; zero-overhead on the happy path; complex stack…

??? question "Exceptions — Strengths and Weaknesses"
    When to use exceptions: Truly exceptional conditions (out-of-memory, logic programming errors). When error handling belongs far from the error site.

??? question "`std::optional` — Absent Values"
    std::optional<T> represents a value that may or may not be present. Use it when absence is normal (not an error). Design rule: std::optional<T> for "no value is a normal outcome." Do NOT use it to represent errors with…

??? question "`std::expected<T, E>` (C++23)"
    std::expected<T, E> holds either a value of type T (success) or an error of type E (failure). It makes the error path visible in the return type.

??? question "`std::variant` as a Result Type"
    Before C++23, std::variant<T, E> was the idiomatic result type. It is more verbose but works in C++17.

??? question "Monadic Operations — `.and_then` and `.or_else`"
    C++23 adds monadic operations to std::expected and std::optional, enabling pipeline-style error handling without nested if checks. ASCII diagram — monadic chain: read_config("app.conf") │ ▼ (success: "port=8080")…

??? question "`noexcept` Correctness"
    noexcept is a contract: the function will not propagate exceptions. It enables optimisations and is required for move operations to be used by standard containers.

??? question "Self-Check Questions"
    1. When should you use std::optional vs std::expected? Use std::optional<T> when "no value" is a normal outcome with no need to communicate why.


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: Ignoring the Return Value of `std::expected`"
    Description: Calling a function that returns std::expected<T, E> and discarding the return value silently swallows the error — the same problem as ignoring an error code.

??? question "⚠️ Pitfall: Pitfall 2: Accessing `std::optional` Value Without a Check"
    Description: Calling opt or opt.value() on an empty std::optional is either undefined behaviour (operator) or an exception (value() throws std::bad_optional_access).

??? question "⚠️ Pitfall: Pitfall 3: Using `std::expected` for Logic Errors — Misuse of the Abstraction"
    Description: Using std::expected to report programming errors (null pointer dereference, out-of-bounds, precondition violations) forces callers to handle errors that should never occur in correct…

??? question "⚠️ Pitfall: Pitfall 4: Throwing from a Destructor"
    Description: Throwing an exception from a destructor while another exception is already propagating calls std::terminate. BAD Why it fails: During stack unwinding, destructors are called.

??? question "⚠️ Pitfall: Pitfall 5: Monadic Chains — Forgetting Error Type Consistency"
    Description: .and_then requires that the transformation function returns an std::expected with the same error type. Mixing error types breaks the chain.


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
