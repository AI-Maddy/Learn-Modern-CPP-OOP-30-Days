Advanced OOP Patterns
=====================

Overview
--------

OOP-focused structural patterns for extensibility and maintainability.

Key Rules
---------

* Strategy: replace conditionals with interchangeable behavior.
* Template Method: fixed workflow with customizable steps.
* State: model behavior transitions explicitly.
* Dependency Injection: decouple policy from mechanism.

Quick Snippet
-------------

.. code-block:: cpp

    class PricingStrategy {
      public:
        virtual ~PricingStrategy() = default;
        virtual double apply(double base) const = 0;
    };

Common Mistakes
---------------

* Pattern overuse for small codebases.
* Too many indirection layers.
* Naming patterns without solving real design pain.

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
