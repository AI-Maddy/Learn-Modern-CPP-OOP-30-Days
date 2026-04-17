---
title: "05 — Flashcards · Day 28"
---

<div class="brain-cluster-banner" data-cluster="review">
  ⚪ &nbsp; **Review & Mastery** &nbsp;·&nbsp; Brain Stem
</div>



# :material-cards: 05 — Flashcards: Code Review Common Pitfalls

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
<div class="flashcard" data-card-id="day28-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Code review is where knowledge transfers between engineers and where accumulated bugs are caught before they reach users. A reviewer who does not know the common C++ anti-patterns will miss the most dangerous issues. A r</div>
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
<div class="flashcard" data-card-id="day28-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">How to Give a Code Review</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Effective code reviews are structured. Work through these layers in order:</div>
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
<div class="flashcard" data-card-id="day28-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">How to Receive a Code Review</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">- Treat every comment as a question, not an attack.
- Respond to every comment — either fix it, explain why you disagree, or ask for clarification. "Done" and "Good point, will fix in a follow-up" are both acceptable. Si</div>
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
<div class="flashcard" data-card-id="day28-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">The C++ Anti-Pattern Checklist</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Use this checklist mentally on every PR:</div>
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
<div class="flashcard" data-card-id="day28-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Integrating Static Analysis into CI</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">yaml
 .github/workflows/staticanalysis.yml (example)
name: Static Analysis
on: push, pullrequest
jobs:
  clang-tidy:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - name: Install tools</div>
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
<div class="flashcard" data-card-id="day28-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Automated Formatters</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">clang-format enforces style mechanically so code review can focus on substance. A .clang-format file checked into the repository ensures every contributor gets the same style:</div>
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
<div class="flashcard" data-card-id="day28-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">ASCII: Review Severity Levels</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">text
┌──────────────┬──────────────────────────────────────────┐
│ Severity     │ Example                                  │
├──────────────┼──────────────────────────────────────────┤
│ BLOCKER      │ UB, data race, me</div>
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
<div class="flashcard" data-card-id="day28-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Design Tradeoffs</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">- Automated vs manual review: automated tools catch consistent, mechanical issues (formatting, obvious UB patterns). Manual review catches design problems, missing business-logic edge cases, and architectural concerns th</div>
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
<div class="flashcard" data-card-id="day28-l3-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L3 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">1.  Why should you check correctness before style in a code review?</div>
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
    Code review is where knowledge transfers between engineers and where accumulated bugs are caught before they reach users. A reviewer who does not know the common C++ anti-patterns will miss the most dangerous issues. A r

??? question "How to Give a Code Review"
    Effective code reviews are structured. Work through these layers in order:

??? question "How to Receive a Code Review"
    - Treat every comment as a question, not an attack.
    - Respond to every comment — either fix it, explain why you disagree, or ask for clarification. "Done" and "Good point, will fix in a follow-up" are both acceptable. Si

??? question "The C++ Anti-Pattern Checklist"
    Use this checklist mentally on every PR:

??? question "Integrating Static Analysis into CI"
    yaml
     .github/workflows/staticanalysis.yml (example)
    name: Static Analysis
    on: push, pullrequest
    jobs:
      clang-tidy:
        runs-on: ubuntu-22.04
        steps:
          - uses: actions/checkout@v4
          - name: Install tools

??? question "Automated Formatters"
    clang-format enforces style mechanically so code review can focus on substance. A .clang-format file checked into the repository ensures every contributor gets the same style:

??? question "ASCII: Review Severity Levels"
    text
    ┌──────────────┬──────────────────────────────────────────┐
    │ Severity     │ Example                                  │
    ├──────────────┼──────────────────────────────────────────┤
    │ BLOCKER      │ UB, data race, me

??? question "Design Tradeoffs"
    - Automated vs manual review: automated tools catch consistent, mechanical issues (formatting, obvious UB patterns). Manual review catches design problems, missing business-logic edge cases, and architectural concerns th

??? question "Self-Check Questions"
    1.  Why should you check correctness before style in a code review?


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: Approving a PR Without Reading the Logic"
    Description  
    A reviewer leaves an "LGTM" based on a quick scan of formatting and naming without verifying that the algorithm is correct. The wrong logic ships.

    BAD review comment

    ``` text
    "Looks g

??? question "⚠️ Pitfall: Pitfall 2: Missing `const` Cascades"
    Description  
    A single function missing `const` forces every caller to be non-const, which propagates through the codebase and blocks safe const references.

    BAD code

    ``` cpp
    class Account {
    public:

??? question "⚠️ Pitfall: Pitfall 3: Raw Owning Pointer Returned From a Factory"
    Description  
    A factory function returns a raw pointer to a heap-allocated object. If the caller forgets to delete it, or an exception is thrown before `delete`, the memory is leaked.

    BAD code

    ```

??? question "⚠️ Pitfall: Pitfall 4: Signed/Unsigned Comparison in Loop Bounds"
    Description  
    Comparing a signed loop counter to an unsigned `size()` promotes the signed value to unsigned. A negative value wraps to a huge positive, causing an out-of-bounds access or an infinite

??? question "⚠️ Pitfall: Pitfall 5: Implicit Conversion Hiding a Type Mismatch"
    Description  
    Passing a `double` where an `int` is expected, or vice versa, compiles silently with C-style initialisation. The value is silently truncated or widened with possible precision loss.

    BA

??? question "⚠️ Pitfall: Pitfall 6: `std::endl` in Performance-Critical Output"
    Description  
    `std::endl` outputs `'\n'` and calls `flush()`. In loops that output thousands of lines, this can be 10–50x slower than using `'\n'`.

    BAD code

    ``` cpp
    void dumplog(const std::vector<L


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
