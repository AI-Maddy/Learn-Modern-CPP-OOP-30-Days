Type Erasure + PIMPL
====================

Overview
--------

Hide implementation details while retaining flexible interfaces.

Key Rules
---------

* Use PIMPL to stabilize headers and reduce rebuilds.
* Use type erasure for runtime-pluggable behaviors.
* Keep erased interface minimal.
* Balance flexibility against allocation/indirection costs.

Quick Snippet
-------------

.. code-block:: cpp

    class Widget {
      public:
        Widget();
        ~Widget();
      private:
        struct Impl;
        std::unique_ptr<Impl> p_;
    };

Common Mistakes
---------------

* Over-erasing simple compile-time use cases.
* Leaking implementation through headers.
* Ignoring ownership semantics in erased wrappers.

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
