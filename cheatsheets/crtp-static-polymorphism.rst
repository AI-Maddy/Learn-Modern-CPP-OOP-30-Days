CRTP Static Polymorphism
========================

Overview
--------

Compile-time polymorphism using the Curiously Recurring Template Pattern.

Key Rules
---------

* Use CRTP when runtime dispatch is unnecessary.
* Keep CRTP base API minimal and documented.
* Prefer explicit derived contracts (impl naming).
* Benchmark before replacing virtual dispatch.

Quick Snippet
-------------

.. code-block:: cpp

    template <typename D>
    struct Base {
        void run() { static_cast<D*>(this)->run_impl(); }
    };

Common Mistakes
---------------

* Applying CRTP to dynamic plugin-style problems.
* Hard-to-read template inheritance chains.
* Assuming CRTP always outperforms virtual calls.

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
