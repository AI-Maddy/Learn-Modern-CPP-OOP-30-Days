---
title: "05 — Flashcards · Day 02"
---

<div class="brain-cluster-banner" data-cluster="foundations">
  🔵 &nbsp; **Foundations** &nbsp;·&nbsp; Frontal Lobe
</div>



# :material-cards: 05 — Flashcards: Functions Lambdas

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
<div class="flashcard" data-card-id="day02-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Why This Day Matters</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Functions are the primary unit of abstraction in C++. Getting their signatures right — parameter passing conventions, return types, overloading rules — determines whether your code is safe, efficient, and easy to reason…</div>
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
<div class="flashcard" data-card-id="day02-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Function Signatures and Parameter Passing</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The single most impactful decision in a function signature is how to pass each parameter. The golden rule: pass by const T&amp; unless you need a copy or a mutation.</div>
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
<div class="flashcard" data-card-id="day02-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Default Arguments</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Default arguments let callers omit trailing parameters, providing a natural API extension path. Tradeoff: Default arguments make callers concise but can hide the actual arguments being passed, making code harder to read…</div>
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
<div class="flashcard" data-card-id="day02-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Function Overloading</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Overloading lets you define multiple functions with the same name but different parameter types. The compiler selects the best match through overload resolution.</div>
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
<div class="flashcard" data-card-id="day02-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`inline` Functions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The compiler is free to ignore the inline hint for large functions. Modern compilers perform inlining at their own discretion regardless of the keyword.</div>
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
<div class="flashcard" data-card-id="day02-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Lambdas — Closures in C++</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A lambda is an anonymous function object defined inline. It can capture variables from its enclosing scope, making it a true closure. Dangling reference warning: If a lambda captures by reference and the lambda outlives…</div>
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
<div class="flashcard" data-card-id="day02-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`std::function` — Type-Erased Callable</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">std::function&lt;R(Args...)&gt; is a general-purpose polymorphic callable wrapper. It stores any callable that matches the given signature: function pointers, lambdas, functors.</div>
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
<div class="flashcard" data-card-id="day02-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Q1: When should you pass a \\std::string\\ by value instead of by \\const std::string&amp;\\? Pass by value when the function always needs its own copy — for example, a constructor that stores the string in a member.</div>
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


??? question "Why This Day Matters"
    Functions are the primary unit of abstraction in C++. Getting their signatures right — parameter passing conventions, return types, overloading rules — determines whether your code is safe, efficient, and easy to reason…

??? question "Function Signatures and Parameter Passing"
    The single most impactful decision in a function signature is how to pass each parameter. The golden rule: pass by const T& unless you need a copy or a mutation.

??? question "Default Arguments"
    Default arguments let callers omit trailing parameters, providing a natural API extension path. Tradeoff: Default arguments make callers concise but can hide the actual arguments being passed, making code harder to read…

??? question "Function Overloading"
    Overloading lets you define multiple functions with the same name but different parameter types. The compiler selects the best match through overload resolution.

??? question "`inline` Functions"
    The compiler is free to ignore the inline hint for large functions. Modern compilers perform inlining at their own discretion regardless of the keyword.

??? question "Lambdas — Closures in C++"
    A lambda is an anonymous function object defined inline. It can capture variables from its enclosing scope, making it a true closure. Dangling reference warning: If a lambda captures by reference and the lambda outlives…

??? question "`std::function` — Type-Erased Callable"
    std::function<R(Args...)> is a general-purpose polymorphic callable wrapper. It stores any callable that matches the given signature: function pointers, lambdas, functors.

??? question "Self-Check Questions"
    Q1: When should you pass a \\std::string\\ by value instead of by \\const std::string&\\? Pass by value when the function always needs its own copy — for example, a constructor that stores the string in a member.


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: Capturing a Dangling Reference in a Lambda"
    Description: Capturing a local variable by reference in a lambda that outlives the scope where that variable was defined. When the lambda is later invoked, the reference is dangling.

??? question "⚠️ Pitfall: Pitfall 2: Passing a Large Object by Value When `const&` Suffices"
    Description: Writing a function that only reads a large object but takes it by value, causing an unnecessary deep copy on every call.

??? question "⚠️ Pitfall: Pitfall 3: Accidental Overload Shadowing"
    Description: Adding a new overload with a default argument that shadows a previously selected overload, silently changing the behaviour of existing callers.

??? question "⚠️ Pitfall: Pitfall 4: Storing a `std::function` Over a Template Parameter in Hot Code"
    Description: Using std::function to store callbacks inside a frequently-called class or function, paying type-erasure overhead on every invocation.

??? question "⚠️ Pitfall: Pitfall 5: Ignoring `[[nodiscard]]` on Return Values"
    Description: Calling a function that returns an error code or important value and ignoring the return, silently discarding failure information.


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
