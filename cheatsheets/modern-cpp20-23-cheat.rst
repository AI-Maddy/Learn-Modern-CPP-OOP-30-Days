Modern C++20/23 Cheat
=====================

Overview
--------

Quick map of modern language features to write expressive and safer code.

Key Rules
---------

* Use auto where type is obvious from initializer.
* Prefer ranges/views for readable data pipelines.
* Use concepts/requires to constrain templates.
* Adopt explicit value/error modeling where suitable.

Quick Snippet
-------------

.. code-block:: cpp

    auto evens = values
        | std::views::filter([](int x){ return x % 2 == 0; })
        | std::views::transform([](int x){ return x * x; });

Common Mistakes
---------------

* Feature-first coding without readability goals.
* Mixing old and new idioms inconsistently.
* Ignoring compiler support matrix in CI.

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
