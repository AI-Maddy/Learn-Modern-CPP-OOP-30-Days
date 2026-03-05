Functions and Lambdas
=====================

Overview
--------

Practical function design and functional-style composition with lambdas.

Key Rules
---------

* Pass large objects by const reference unless ownership transfer is intended.
* Capture minimally in lambdas ([x], [&] with caution).
* Prefer pure helper functions when possible.
* Keep side effects explicit and localized.

Quick Snippet
-------------

.. code-block:: cpp

    std::transform(v.begin(), v.end(), v.begin(),
        [factor](int x){ return x * factor; });

Common Mistakes
---------------

* Dangling reference captures.
* Mutable lambdas hiding state changes.
* Too many positional parameters without grouping.

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
