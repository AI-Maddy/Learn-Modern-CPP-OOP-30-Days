Day 30: Review, Certification Prep, and Next Steps
====================================================

Why This Day Matters
--------------------

This is the capstone of the course. Today you consolidate 30 days of
learning into a coherent mental model, identify and close any remaining
gaps, and build a concrete plan for continued growth. The skills you
have built are foundational — this day maps them to career paths and
gives you the resources to go significantly deeper in any direction.

Learning Outcomes
-----------------

After completing this day you will be able to:

* Score at least 16/20 on the self-assessment quiz (covering all 30 days)
  and identify which days to revisit for each wrong answer.
* Produce a 30-day knowledge map from memory, grouping concepts into the
  four weekly themes (foundations, inheritance/polymorphism, modern C++,
  integration).
* Name at least two concrete next-learning resources for three different
  specialisation paths (concurrency, embedded, game dev).
* Articulate what separates an intermediate C++ programmer from a senior
  one in one paragraph, using specific technical examples.
* Commit to a 4-week continued practice plan with measurable weekly goals.

Key Concepts Reviewed
---------------------

* **RAII and smart pointers** — the mechanism that makes modern C++ safe;
  every resource is tied to a scope-managed object.
* **Polymorphism** — virtual dispatch, object slicing, vtable, abstract
  interfaces; the foundation of every extensible OOP design.
* **Move semantics** — transferring resource ownership without copying;
  essential for performance in containers and factories.
* **Exception safety** — basic, strong, and no-throw guarantees; knowing
  which your code provides and proving it.
* **constexpr / consteval** — moving computation from runtime to compile
  time; zero-cost lookup tables, static assertions, type safety.
* **Coroutines** — cooperative suspension for asynchronous and lazy code
  without callbacks or thread overhead.

What You Will Build
-------------------

A final self-assessment project: a mini bank + shapes combo that exercises
concepts from at least eight different days:

* A ``ShapeAccount`` that holds a collection of shapes and computes the
  "value" of the account as the sum of all shape areas.
* RAII-backed transaction log (Day 24 technique) for every shape addition.
* ``std::variant``-based shape storage (Day 25 technique).
* A ``consteval`` fee-rate table (Day 29 technique).
* An ``EventBus`` that fires ``ShapeAddedEvent`` when a shape is attached
  (Day 26 technique).
* Exception handling for zero-area shapes (Day 21 technique).
* A ``clang-tidy``-clean codebase reviewed against the Day 28 checklist.

Hands-On Task
-------------

#. Take the 20-question quiz in ``theory.rst`` without looking at any notes.
   Write answers on paper. Score yourself.
#. For each incorrect answer, re-read the corresponding day's ``theory.rst``
   and implement a small example from scratch.
#. Build the ``ShapeAccount`` combo project described above.
#. Write a ``review_report.txt`` using the Day 28 five-layer checklist
   applied to your own ``ShapeAccount`` code.
#. Draft a personal 4-week continued practice plan: one concrete goal per
   week (e.g., "complete one Asio networking tutorial", "read Chapter 4 of
   *C++ Concurrency in Action*").

Suggested Study Order
---------------------

#. **Take the quiz** (30 min) — no notes, timed; honest scoring.
#. **Gap analysis** (15 min) — list wrong answers; map to day numbers.
#. **Targeted re-study** (45 min) — one theory.rst section per gap.
#. **Build the combo project** (60 min) — integrate at least 8 day-concepts.
#. **Read pitfalls.rst** (15 min) — apply active-recall advice immediately.
#. **Write your continuation plan** (15 min) — four weeks, specific goals.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_30
    ./build/src/day_30
    # Run the full quiz from the command line:
    # The main.cpp prompts 20 questions and prints your score.
    # Run sanitizers for the combo project:
    cmake -S . -B build_asan -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined"
    cmake --build build_asan --target day_30
    ./build_asan/src/day_30

Related Days
------------

* **Day 24** — Bank System (RAII, smart pointers, operator overloading).
* **Day 25** — Shape Editor (variant, visitor, factory, ranges).
* **Day 26** — Game Entities (ECS, observer, CRTP).
* **Day 27** — Refactoring (strangler fig, characterisation tests).
* **Day 28** — Code Review (anti-pattern checklist, clang-tidy).
* **Day 29** — Advanced Topics (coroutines, consteval, bit_cast, pmr).
* All of Days 1–23 — the foundations this week builds on.
