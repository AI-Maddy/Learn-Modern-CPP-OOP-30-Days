Inheritance and Polymorphism
============================

Overview
--------

When and how to model substitutable behavior through base interfaces.

Key Rules
---------

* Use inheritance only for is-a relationships.
* Always give polymorphic bases virtual destructors.
* Prefer composition if substitution is not required.
* Document behavioral contracts in base classes.

Quick Snippet
-------------

.. code-block:: cpp

    class Shape {
      public:
        virtual ~Shape() = default;
        virtual double area() const = 0;
    };

Common Mistakes
---------------

* Slicing objects by value.
* Downcasting as primary control flow.
* Breaking LSP with narrower derived behavior.

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
