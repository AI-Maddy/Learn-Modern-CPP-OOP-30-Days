Common Pitfalls
===============

Overview
--------

Recurring design and implementation mistakes in modern C++ OOP codebases.

Key Rules
---------

* Unclear ownership/lifetime contracts.
* Leaky abstractions and weak invariants.
* Overuse of inheritance and global mutable state.
* Insufficient tests around edge/error behavior.

Quick Snippet
-------------

.. code-block:: cpp

    void process(const std::vector<Item>& items);
    std::unique_ptr<Service> make_service();

Common Mistakes
---------------

* Implicit conversions causing ambiguity.
* Exception-unsafe resource handling.
* Copy-heavy APIs for large objects.

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
