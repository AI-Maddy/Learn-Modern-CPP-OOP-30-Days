Modules C++20
=============

Overview
--------

Module mindset: stable public surfaces and hidden implementation details.

Key Rules
---------

* Export only what clients need.
* Keep implementation partitions private.
* Use modules to reduce rebuild costs.
* Design API boundaries before implementation details.

Quick Snippet
-------------

.. code-block:: cpp

    export module math.api;
    export int add(int a, int b);
    
    module math.api;
    int add(int a, int b) { return a + b; }

Common Mistakes
---------------

* Exporting internal helper symbols.
* Mixing headers/modules without strategy.
* Assuming universal compiler support.

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
