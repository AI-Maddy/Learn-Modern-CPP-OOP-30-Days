Memory Layout and Object Model
==============================

Overview
--------

Practical object memory model insights for correctness and performance.

Key Rules
---------

* Know stack vs heap lifetime differences.
* Understand padding/alignment impacts.
* Virtual functions add vptr/vtable overhead.
* Prefer contiguous layouts for cache locality.

Quick Snippet
-------------

.. code-block:: cpp

    struct Data {
        std::uint8_t tag;
        std::uint32_t value;
    };
    static_assert(alignof(Data) >= alignof(std::uint32_t));

Common Mistakes
---------------

* Assuming exact object byte layout portability.
* Ignoring alignment requirements.
* Prematurely micro-optimizing without profiling.

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
