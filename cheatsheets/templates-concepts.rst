Templates + Concepts
====================

Overview
--------

Constrained templates for robust and understandable generic APIs.

Key Rules
---------

* Write concepts around semantics, not syntax alone.
* Use requires to make intent explicit.
* Prefer named concepts over long requires expressions.
* Improve diagnostics by constraining public templates.

Quick Snippet
-------------

.. code-block:: cpp

    template <typename T>
    concept Addable = requires(T a, T b) {
        { a + b } -> std::convertible_to<T>;
    };

Common Mistakes
---------------

* Duplicate constraints in every overload.
* Overly strict concepts blocking valid types.
* Unnamed ad-hoc requires in many call sites.

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
