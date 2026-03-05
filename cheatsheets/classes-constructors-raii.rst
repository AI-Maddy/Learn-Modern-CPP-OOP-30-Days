Classes, Constructors, RAII
===========================

Overview
--------

Class invariants, safe lifetime management, and deterministic cleanup.

Key Rules
---------

* Establish class invariants in constructors.
* Use RAII wrappers for all resources.
* Prefer initialization lists.
* Delete copying for non-copyable resource owners.

Quick Snippet
-------------

.. code-block:: cpp

    class Timer {
      public:
        Timer();
        ~Timer();
      private:
        std::chrono::steady_clock::time_point start_;
    };

Common Mistakes
---------------

* Two-phase initialization.
* Resource allocation without cleanup guarantees.
* Mutable invariants from public fields.

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
