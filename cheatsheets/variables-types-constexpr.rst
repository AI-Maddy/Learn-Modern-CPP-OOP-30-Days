Variables, Types, Constexpr
===========================

Overview
--------

Type correctness and compile-time computation fundamentals.

Key Rules
---------

* Prefer brace-initialization to avoid narrowing.
* Use constexpr for compile-time constants/functions.
* Use const for immutable runtime state.
* Keep unit semantics in variable names/types.

Quick Snippet
-------------

.. code-block:: cpp

    constexpr int square(int x) { return x * x; }
    constexpr int area = square(6);
    int runtime = std::stoi(input);

Common Mistakes
---------------

* Uninitialized locals.
* Silent narrowing conversions.
* Overusing constexpr on runtime-dependent values.

Review Checklist
----------------

* Can you explain the tradeoff of the chosen approach?
* Is ownership/lifetime explicit at API boundaries?
* Is there at least one test or assertion for non-trivial behavior?

Related Paths
-------------

* Day modules: ``src/Day-*``
* Sequence guide: ``docs/day-index.rst``
* Weekly plan: ``docs/30-day-roadmap.rst``
