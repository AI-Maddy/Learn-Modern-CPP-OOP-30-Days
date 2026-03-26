Day 25: Mini Project 2 – Shape Editor
======================================

Why This Day Matters
--------------------

The shape editor teaches you how to choose between four modern C++ patterns
for the same problem: virtual dispatch, the Visitor pattern, ``std::variant``,
and factory + ``std::ranges``. Knowing *when* to reach for each tool
separates intermediate C++ programmers from seniors.

Learning Outcomes
-----------------

After completing this day you will be able to:

* Build a polymorphic shape hierarchy with pure virtual ``area()``,
  ``perimeter()``, and ``describe()`` methods.
* Implement the Visitor pattern to add serialisation and area reporting
  as new operations without modifying shape classes.
* Rewrite the same hierarchy using ``std::variant`` and ``std::visit``
  with the overloaded-lambda idiom, and explain the tradeoffs.
* Use a factory (with a runtime registry map) to construct shapes from
  string type tags.
* Filter and transform a shape collection with ``std::ranges::views::filter``
  and ``std::views::transform`` in a lazy pipeline.

Key Concepts
------------

* **Virtual dispatch** — stable operation set, easy to add new types;
  each shape subclass provides its own implementation.
* **Visitor pattern** — stable type set, easy to add new operations;
  new behaviour is added by writing a new visitor class.
* **std::variant** — compile-time exhaustive dispatch; zero heap overhead
  for the shape itself; best when the type set is small and fixed.
* **Shape factory** — decouples construction from usage; a registry map
  lets new shapes register themselves at startup.
* **std::ranges views** — lazy filtering and transformation pipelines that
  compose without intermediate allocations.

What You Will Build
-------------------

A shape editor library with:

* ``Circle``, ``Rectangle``, and ``Triangle`` inheriting ``Shape``.
* An ``AreaPrinter`` and a ``JsonSerializer`` implemented as visitors.
* A ``ShapeV`` variant alias with ``area()`` and ``describe()`` free functions.
* A ``ShapeFactory`` with a runtime registry.
* A ``main.cpp`` that creates a mixed collection, filters by area threshold
  using ``std::ranges``, and serialises to JSON.

Hands-On Task
-------------

Implement an ``Ellipse`` shape and integrate it into all four approaches:

#. Subclass ``Shape`` and implement ``area()`` and ``perimeter()``
   (use the Ramanujan approximation for ellipse perimeter).
#. Add ``visit(const Ellipse&)`` to every existing concrete visitor.
#. Add ``Ellipse`` to the ``ShapeV`` variant — observe which translation
   units produce compile errors, guiding you to every visitor that needs
   updating.
#. Register ``"ellipse"`` in ``ShapeFactory``.

Suggested Study Order
---------------------

#. **Read theory.rst** (35 min) — study each approach section; pause at the
   comparison table and reason about which to choose for your own projects.
#. **Compile and run main.cpp** (15 min) — verify JSON output and filtered
   results; add a ``std::cout`` line for each shape's perimeter.
#. **Implement the Ellipse task** (40 min) — work through each of the four
   steps; note how the variant step gives compile-time guidance.
#. **Read pitfalls.rst** (15 min) — check your Ellipse integration against
   each pitfall; especially verify constructors throw on invalid dimensions.
#. **Write two unit tests** (15 min) — one for area correctness, one
   confirming the factory throws on an unregistered tag.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_25
    ./build/src/day_25

Related Days
------------

* **Day 12** — Abstract classes and pure virtual functions.
* **Day 14** — Templates and generic programming (visitor overload trick).
* **Day 17** — Smart pointers (unique_ptr in factory returns).
* **Day 20** — std::variant and std::visit fundamentals.
* **Day 24** — Previous mini-project (Bank System) for comparison.
* **Day 26** — Next mini-project: Game Entities (ECS, Observer pattern).
