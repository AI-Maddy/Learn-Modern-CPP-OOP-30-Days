Performance Tips OOP
====================

Overview
--------

Low-risk optimizations that preserve design quality.

Key Rules
---------

* Reserve capacity for growing containers.
* Avoid unnecessary dynamic allocation.
* Pass by const reference where appropriate.
* Measure with benchmark/profiler before and after changes.

Quick Snippet
-------------

.. code-block:: cpp

    std::vector<Record> rows;
    rows.reserve(1000);
    rows.emplace_back("alpha", 42);

Common Mistakes
---------------

* Optimizing blind without baseline.
* Complex micro-optimizations harming readability.
* Ignoring allocator and data layout effects.

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
