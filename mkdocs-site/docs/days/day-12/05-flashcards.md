---
title: "05 — Flashcards · Day 12"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-cards: 05 — Flashcards: Ranges Views C++20

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
<div class="flashcard" data-card-id="day12-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The classic STL algorithm model is powerful but verbose. Composing three steps — filter, transform, take — requires three separate passes, three temporary containers, and three pairs of begin/end iterators.</div>
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
<div class="flashcard" data-card-id="day12-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">The `std::ranges::views` Pipeline</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The pipe operator | chains range adaptors. Each adaptor returns a view — a lightweight object that describes how to iterate, without storing any elements.</div>
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
<div class="flashcard" data-card-id="day12-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Lazy Evaluation</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A view does no work when it is created. Work happens only when the view is iterated. This means: Unused elements cost nothing. You can build arbitrarily long pipelines with zero intermediate memory.</div>
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
<div class="flashcard" data-card-id="day12-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Core Range Adaptors</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">filter — yield only elements matching a predicate transform — apply a function to each element take / drop — first/after-first N elements take_while / drop_while — conditional take/drop reverse — iterate backwards keys…</div>
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
<div class="flashcard" data-card-id="day12-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Owning vs Non-Owning Ranges</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A view does not own its elements — it borrows them from a range. This is critical for lifetime management.</div>
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
<div class="flashcard" data-card-id="day12-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Writing a Custom Range Adaptor</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">A range adaptor is an object that, when piped a range, returns a view. The minimal approach for C++20 is to write a view class and a range closure object.</div>
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
<div class="flashcard" data-card-id="day12-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">1. What is the key difference between a range and a view? A range owns or references elements and can be iterated. A view is a lightweight, non-owning, lazily-computed window over a range.</div>
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
    The classic STL algorithm model is powerful but verbose. Composing three steps — filter, transform, take — requires three separate passes, three temporary containers, and three pairs of begin/end iterators.

??? question "The `std::ranges::views` Pipeline"
    The pipe operator | chains range adaptors. Each adaptor returns a view — a lightweight object that describes how to iterate, without storing any elements.

??? question "Lazy Evaluation"
    A view does no work when it is created. Work happens only when the view is iterated. This means: Unused elements cost nothing. You can build arbitrarily long pipelines with zero intermediate memory.

??? question "Core Range Adaptors"
    filter — yield only elements matching a predicate transform — apply a function to each element take / drop — first/after-first N elements take_while / drop_while — conditional take/drop reverse — iterate backwards keys…

??? question "Owning vs Non-Owning Ranges"
    A view does not own its elements — it borrows them from a range. This is critical for lifetime management.

??? question "Writing a Custom Range Adaptor"
    A range adaptor is an object that, when piped a range, returns a view. The minimal approach for C++20 is to write a view class and a range closure object.

??? question "Self-Check Questions"
    1. What is the key difference between a range and a view? A range owns or references elements and can be iterated. A view is a lightweight, non-owning, lazily-computed window over a range.


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: View Over a Temporary — Dangling Iterator"
    Description: Piping a temporary container into a view and then using the view after the temporary has been destroyed causes undefined behaviour.

??? question "⚠️ Pitfall: Pitfall 2: Modifying a Container While Iterating a View"
    Description: Adding or removing elements from a container that an active view refers to invalidates the view's iterators. BAD Why it fails: push_back may trigger a reallocation of v's internal…

??? question "⚠️ Pitfall: Pitfall 3: Infinite Range Without `take` — Hanging Program"
    Description: Materialising or iterating an infinite range without a stopping condition causes the program to loop forever. BAD Why it fails: iota(0) is an infinite range.

??? question "⚠️ Pitfall: Pitfall 4: Assuming a View Is Free to Copy"
    Description: Some views (notably filter_view) cache the iterator to begin internally and are not cheap to copy. Passing them by value can cause subtle issues.

??? question "⚠️ Pitfall: Pitfall 5: `rv::transform` with Mutating Lambdas — Unexpected State"
    Description: A transform lambda that captures a mutable counter can be called multiple times per element if the view is iterated more than once, because views are lazy and re-evaluate on each…


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
