---
title: "05 — Flashcards · Day 11"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-cards: 05 — Flashcards: Generic OOP Design

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
<div class="flashcard" data-card-id="day11-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Runtime polymorphism — virtual functions and base-class pointers — is powerful but carries costs: vtable indirection on every call, forced heap allocation, inability to inline, and loss of type information that prevents</div>
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
<div class="flashcard" data-card-id="day11-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Policy-Based Design</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Popularised by Andrei Alexandrescu's Modern C++ Design, policy-based design uses template parameters as "policies" — small classes that implement one aspect of behaviour. The host class assembles them.</div>
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
<div class="flashcard" data-card-id="day11-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Type-Safe Containers</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Raw void containers (the C approach) are fast but unsafe — you can store an int where a double is expected. Template containers enforce element types at compile time with no runtime cost.</div>
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
<div class="flashcard" data-card-id="day11-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Generic Algorithms with Concepts</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Combine templates with C++20 concepts to write algorithms that are both generic and well-constrained.</div>
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
<div class="flashcard" data-card-id="day11-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Template Method Pattern via Templates</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The GoF Template Method pattern defines an algorithm's skeleton in a base class and lets subclasses override specific steps. With virtual dispatch the "steps" are virtual methods. With templates, the "steps" are template</div>
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
<div class="flashcard" data-card-id="day11-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Compile-Time vs Runtime Polymorphism</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Understanding when to use each approach is the key design decision.</div>
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
<div class="flashcard" data-card-id="day11-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">1.  What is a policy in policy-based design, and how does it differ from a virtual function-based strategy?</div>
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
    Runtime polymorphism — virtual functions and base-class pointers — is powerful but carries costs: vtable indirection on every call, forced heap allocation, inability to inline, and loss of type information that prevents

??? question "Policy-Based Design"
    Popularised by Andrei Alexandrescu's Modern C++ Design, policy-based design uses template parameters as "policies" — small classes that implement one aspect of behaviour. The host class assembles them.

??? question "Type-Safe Containers"
    Raw void containers (the C approach) are fast but unsafe — you can store an int where a double is expected. Template containers enforce element types at compile time with no runtime cost.

??? question "Generic Algorithms with Concepts"
    Combine templates with C++20 concepts to write algorithms that are both generic and well-constrained.

??? question "Template Method Pattern via Templates"
    The GoF Template Method pattern defines an algorithm's skeleton in a base class and lets subclasses override specific steps. With virtual dispatch the "steps" are virtual methods. With templates, the "steps" are template

??? question "Compile-Time vs Runtime Polymorphism"
    Understanding when to use each approach is the key design decision.

??? question "Self-Check Questions"
    1.  What is a policy in policy-based design, and how does it differ from a virtual function-based strategy?


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1: Policy Type Exposing Too Much — Breaking Encapsulation"
    Description: A policy class that provides methods with the same names as the host class's public interface can be accessed directly, bypassing the host's invariants.

    BAD

    ``` cpp
    struct LoggingPolic

??? question "⚠️ Pitfall: Pitfall 2: Unconstrained Policy Parameters — Opaque Errors"
    Description: A policy-based class with no concept constraints on its template parameters produces incomprehensible errors when the wrong policy is supplied.

    BAD

    ``` cpp
    template <typename Storage,

??? question "⚠️ Pitfall: Pitfall 3: Template Method Pattern — Calling Non-Existent Hook"
    Description: In the template method pattern via CRTP or templates, calling a hook that the policy/derived class has not implemented compiles in some cases and silently does nothing, or calls a wrong

??? question "⚠️ Pitfall: Pitfall 4: Mixing Compile-Time and Runtime Polymorphism Incorrectly"
    Description: Storing a policy-based type by pointer to a base class that has no virtual functions causes object slicing or broken polymorphism.

    BAD

    ``` cpp
    template <typename Policy>
    class Widget :

??? question "⚠️ Pitfall: Pitfall 5: Ring Buffer — Off-By-One in Modular Indexing"
    Description: Type-safe generic containers like ring buffers are prone to off-by-one errors in the modular index arithmetic, causing either data loss or buffer overflow.

    BAD

    ``` cpp
    template <typena


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
