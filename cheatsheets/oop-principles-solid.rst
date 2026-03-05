OOP Principles + SOLID
======================

Overview
--------

Core object-oriented design principles for extensible systems.

Key Rules
---------

* Model behavior around domain concepts, not data bags.
* Apply SRP: one reason to change per class.
* Depend on abstractions and inject dependencies.
* Use interface segregation for focused contracts.

Quick Snippet
-------------

.. code-block:: cpp

    class Notifier {
      public:
        virtual ~Notifier() = default;
        virtual void send(std::string_view msg) = 0;
    };

Common Mistakes
---------------

* God classes with mixed responsibilities.
* Hard-coded concrete dependencies.
* Inheritance used only for code reuse.

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
