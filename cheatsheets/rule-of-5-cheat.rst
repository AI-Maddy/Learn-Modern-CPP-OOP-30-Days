Rule of 5 Cheat
===============

Overview
--------

Special member function guidance for resource-owning types.

Key Rules
---------

* If you define one of dtor/copy/move ops, consider all five.
* Prefer Rule of Zero when possible via standard types.
* Use copy-and-swap for strong exception safety in copy assignment.
* Handle self-assignment gracefully.

Quick Snippet
-------------

.. code-block:: cpp

    class Buffer {
      public:
        Buffer(const Buffer&);
        Buffer& operator=(const Buffer&);
        Buffer(Buffer&&) noexcept;
        Buffer& operator=(Buffer&&) noexcept;
        ~Buffer();
    };

Common Mistakes
---------------

* Shallow copy of owning raw pointer.
* Forgetting move assignment after move ctor.
* Missing noexcept on move operations.

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
