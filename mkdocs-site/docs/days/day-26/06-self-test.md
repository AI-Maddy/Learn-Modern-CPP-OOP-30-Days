---
title: "06 — Self Test · Day 26"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-clipboard-check: 06 — Self Test: Mini Project 3 Game Entities

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)

!!! tip "Testing = Learning (Feature 9)"
    Research shows that **testing yourself** is more effective than re-reading.
    For each question, genuinely try to answer before revealing the answer.
    Close your eyes if needed!

---

## 📋 Tabbed Q&A


=== "❓ Question"
    What is: **Motivation**?

=== "✅ Answer"
    Game development stress-tests every OOP skill: performance matters, objects are created and destroyed rapidly, behaviour combinations are unpredictable, and systems must communica

=== "❓ Question"
    What is: **The Problem with Deep Inheritance in Games**?

=== "✅ Answer"
    A naive OOP approach leads to an explosion of types:

``` text
Entity
├── Actor
│   ├── Player
│   │   ├── ArmedPlayer
│   │   └── FlyingPlayer
│   └── Enemy
│       ├── FlyingEne

=== "❓ Question"
    What is: **The Entity-Component System (ECS)**?

=== "✅ Answer"
    An Entity is just an ID. All data lives in Components. Systems iterate over entities that have a specific set of components.

``` cpp
include <any>
include <cstdint>
include <func

=== "❓ Question"
    What is: **The Game Loop Pattern**?

=== "✅ Answer"
    A fixed timestep loop ensures physics and game logic advance by the same `dt` regardless of frame rate. Variable-rate rendering interpolates between logic ticks for smooth visuals


---

## 🧩 Multiple Choice


<div class="quiz-block" data-answer="c">
  <div class="quiz-question">🧩 Quick Check — Day 26: Mini Project 3 Game Entities</div>
  <div class="quiz-options">
    <button class="quiz-option" data-value="a">A: It is a compile-time feature only</button>
    <button class="quiz-option" data-value="b">B: It replaces all use of raw pointers</button>
    <button class="quiz-option" data-value="c">C: It is the primary design principle for this topic</button>
    <button class="quiz-option" data-value="d">D: It was introduced in C++98 only</button>
  </div>
  <div class="quiz-explanation">
    ✅ Correct! Option C is right because Mini Project 3 Game Entities is primarily about the core design principle
    introduced in modern C++. The other options are common misconceptions.
  </div>
</div>


---

## 📝 Open-Ended Reflection


??? question "❓ Synthesis Question"
    In your own words, explain **Mini Project 3 Game Entities** to someone who has never seen it before.

    Write 3-5 sentences. Focus on:
    1. What problem it solves
    2. How C++ implements it
    3. One real-world example of using it



??? abstract "🟣 Memory Check"
    Without looking at the theory page, list 3 key facts about **Mini Project 3 Game Entities**:

    1. ___
    2. ___
    3. ___


---

[← Flashcards](05-flashcards.md) · [Summary →](07-summary.md)
