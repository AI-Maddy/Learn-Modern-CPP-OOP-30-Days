Ranges and Views
================

Overview
--------

Readable, composable, lazy data processing with C++20 ranges.

Key Rules
---------

* Compose filter/transform/take pipelines.
* Views are lazy and often non-owning.
* Materialize only when needed.
* Prefer pipelines over manual loop boilerplate.

Quick Snippet
-------------

.. code-block:: cpp

    auto out = nums
        | std::views::filter([](int x){ return x > 0; })
        | std::views::transform([](int x){ return x * 2; });

Common Mistakes
---------------

* Dangling views from temporary ranges.
* Complex one-liners hurting readability.
* Assuming eager evaluation.

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
