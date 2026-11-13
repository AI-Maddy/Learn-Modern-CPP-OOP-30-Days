---
title: "05 — Flashcards · Day 20"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-cards: 05 — Flashcards: Static Polymorphism CRTP

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
<div class="flashcard" data-card-id="day20-l1-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Motivation — The Cost of Virtual Dispatch</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Virtual dispatch is essential for runtime polymorphism but carries costs: Indirect call — every virtual method call goes through a vtable pointer; the CPU must load the vtable, load the function pointer, then call it.</div>
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
<div class="flashcard" data-card-id="day20-l1-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">CRTP Mechanics</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">CRTP is the idiom where a base class template takes the derived class as its template argument: Class hierarchy (CRTP) ────────────────────── Base&lt;ConcreteA&gt; Base&lt;ConcreteB&gt; ▲ ▲ ConcreteA ConcreteB No common base class…</div>
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
<div class="flashcard" data-card-id="day20-l1-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">Static Interface Enforcement</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">CRTP enforces that a derived class implements required methods. If ConcreteA forgets implementation(), the program fails to compile when base.interface() is instantiated — not at runtime.</div>
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
<div class="flashcard" data-card-id="day20-l1-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L1 · Question</div>
      <div class="flashcard-q">CRTP for Default Implementations (Mixin Pattern)</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">The base class provides default behaviour by calling the derived class&#x27;s customisation hook. The derived class only overrides what it needs.</div>
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
<div class="flashcard" data-card-id="day20-l2-0">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Mixin Accumulation — Stacking Multiple CRTP Bases</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">CRTP bases compose cleanly because each is a distinct template instantiation: Config object layout (CRTP mixins add NO data, only methods) ─────────────────────────────────────────────────────────────…</div>
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
<div class="flashcard" data-card-id="day20-l2-1">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">CRTP vs Virtual — Performance Comparison</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">CRTP is the right choice when: All concrete types are known at compile time. Performance is critical (tight loops, game entities, DSP processing). You want compile-time enforcement of an interface.</div>
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
<div class="flashcard" data-card-id="day20-l2-2">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">`std::span` as a CRTP-Free Alternative for Read-Only Ranges</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">std::span&lt;T&gt; (C++20) provides a non-owning view over any contiguous range without inheritance. It is a form of concept-based static polymorphism for sequences: No template required at the call site; std::span erases the…</div>
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
<div class="flashcard" data-card-id="day20-l2-3">
  <div class="flashcard-inner">
    <div class="flashcard-front">
      <div class="flashcard-label">L2 · Question</div>
      <div class="flashcard-q">Self-Check Questions</div>
      <div class="flashcard-hint">Hover or click to flip →</div>
    </div>
    <div class="flashcard-back">
      <div class="flashcard-label">Answer</div>
      <div class="flashcard-a">Q1. What makes CRTP &quot;Curiously Recurring&quot;? The derived class passes itself as the template argument to its own base class: struct Derived : Base&lt;Derived&gt;.</div>
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


??? question "Motivation — The Cost of Virtual Dispatch"
    Virtual dispatch is essential for runtime polymorphism but carries costs: Indirect call — every virtual method call goes through a vtable pointer; the CPU must load the vtable, load the function pointer, then call it.

??? question "CRTP Mechanics"
    CRTP is the idiom where a base class template takes the derived class as its template argument: Class hierarchy (CRTP) ────────────────────── Base<ConcreteA> Base<ConcreteB> ▲ ▲ ConcreteA ConcreteB No common base class…

??? question "Static Interface Enforcement"
    CRTP enforces that a derived class implements required methods. If ConcreteA forgets implementation(), the program fails to compile when base.interface() is instantiated — not at runtime.

??? question "CRTP for Default Implementations (Mixin Pattern)"
    The base class provides default behaviour by calling the derived class's customisation hook. The derived class only overrides what it needs.

??? question "Mixin Accumulation — Stacking Multiple CRTP Bases"
    CRTP bases compose cleanly because each is a distinct template instantiation: Config object layout (CRTP mixins add NO data, only methods) ─────────────────────────────────────────────────────────────…

??? question "CRTP vs Virtual — Performance Comparison"
    CRTP is the right choice when: All concrete types are known at compile time. Performance is critical (tight loops, game entities, DSP processing). You want compile-time enforcement of an interface.

??? question "`std::span` as a CRTP-Free Alternative for Read-Only Ranges"
    std::span<T> (C++20) provides a non-owning view over any contiguous range without inheritance. It is a form of concept-based static polymorphism for sequences: No template required at the call site; std::span erases the…

??? question "Self-Check Questions"
    Q1. What makes CRTP "Curiously Recurring"? The derived class passes itself as the template argument to its own base class: struct Derived : Base<Derived>.


---

## ⚠️ Pitfall Flashcards


??? question "⚠️ Pitfall: Pitfall 1 — Incorrect `static_cast` Direction in CRTP"
    Problem: Casting this to the derived type in the wrong direction, or casting to an unrelated type, producing undefined behaviour.

??? question "⚠️ Pitfall: Pitfall 2 — Forgetting `const` Overloads in the CRTP Base"
    Problem: The CRTP base provides only a non-const interface() method, so const instances of the derived class cannot call it. BAD: Why it fails: const Point can only call const member functions.

??? question "⚠️ Pitfall: Pitfall 3 — CRTP Base Has Virtual Destructor (Unintended vtable)"
    Problem: Adding a virtual destructor to a CRTP base defeats the purpose by introducing a vtable and a vptr in every derived object.

??? question "⚠️ Pitfall: Pitfall 4 — Using CRTP Where `std::variant` Is Simpler"
    Problem: Applying CRTP to a small closed set of types when std::variant + visitor would be cleaner and more maintainable. BAD (over-engineered CRTP for two shapes): Why it fails: CRTP produces…

??? question "⚠️ Pitfall: Pitfall 5 — Accidentally Instantiating Two `Base<Derived>` Chains"
    Problem: A derived class inherits from two CRTP bases that each inherit from a common third CRTP base, creating ambiguous member access (the diamond problem).

??? question "⚠️ Pitfall: Pitfall 6 — Excessively Deep CRTP Chains Hiding Code Paths"
    Problem: Stacking five or more CRTP mixins makes it very hard to trace which base class provides a given method. BAD: Why it fails: IDE navigation degrades; a go to definition on config.diff() may…


---

[← Pitfalls](04-pitfalls.md) · [Self Test →](06-self-test.md)
