RAII + Smart Pointers
=====================

Overview
--------

Ownership and lifetime safety using modern C++ resource primitives.

Key Rules
---------

* Use unique_ptr as default owning pointer.
* Use shared_ptr only for true shared ownership.
* Use weak_ptr to break cycles.
* Model non-owning references with raw/reference/span.

Quick Snippet
-------------

.. code-block:: cpp

    auto owner = std::make_unique<Node>();
    auto shared = std::make_shared<Node>();
    std::weak_ptr<Node> observer = shared;

Common Mistakes
---------------

* shared_ptr everywhere.
* Circular ownership graphs.
* Returning raw pointers that outlive owners.

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
