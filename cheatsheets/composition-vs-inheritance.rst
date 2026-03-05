Composition vs Inheritance
==========================

Overview
--------

Tradeoff guide for reuse through composition or subtype polymorphism.

Key Rules
---------

* Start with composition; inherit only for substitutability.
* Composition reduces tight coupling and ripple changes.
* Inheritance can simplify polymorphic extension points.
* Prefer strategy objects for runtime behavior variation.

Quick Snippet
-------------

.. code-block:: cpp

    class Checkout {
      public:
        explicit Checkout(std::unique_ptr<PricingStrategy> s)
          : strategy_(std::move(s)) {}
      private:
        std::unique_ptr<PricingStrategy> strategy_;
    };

Common Mistakes
---------------

* Deep inheritance hierarchies.
* Behavior duplication across sibling classes.
* Leaky protected state in base classes.

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
