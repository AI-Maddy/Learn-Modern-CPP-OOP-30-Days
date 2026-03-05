Templates Basics
================

Overview
--------

Core generic-programming syntax and best practices.

Key Rules
---------

* Start with simple function templates.
* Prefer clear template parameter names.
* Document required operations semantically.
* Keep compile errors readable with constraints/comments.

Quick Snippet
-------------

.. code-block:: cpp

    template <typename T>
    T max_of(T a, T b) { return (a < b) ? b : a; }

Common Mistakes
---------------

* Over-generalizing too early.
* Metaprogramming when overloads suffice.
* Huge monolithic template utilities.

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
