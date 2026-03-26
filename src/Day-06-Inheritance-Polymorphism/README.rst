Day 06: Inheritance and Polymorphism
=====================================

Why This Day Matters
--------------------

Inheritance is C++'s primary tool for expressing "is-a" relationships and enabling open-ended
extension. Used correctly, it lets you write ``draw(shapes)`` once and have it work for every
``Shape`` subtype ever added. Used incorrectly, it produces slicing bugs, virtual destructor
leaks, and fragile hierarchies. This day teaches you to tell the difference.

Learning Outcomes
-----------------

By the end of this day you will be able to:

* Identify when a relationship is truly "is-a" and when composition is more appropriate.
* Explain the vtable mechanism and the cost of a virtual function call.
* Declare virtual destructors in all polymorphic base classes.
* Write ``override`` on every overriding function and explain what the compiler checks.
* Recognise and prevent object slicing by always using references or pointers for polymorphism.
* Apply ``dynamic_cast`` safely for runtime type queries and handle both success and failure.
* Describe the Liskov Substitution Principle and identify a violation.

Key Concepts
------------

* **Virtual functions** — dispatched at runtime via the vtable; enable polymorphism through
  base class pointers and references.
* **``override``** — tells the compiler to verify the signature matches a base virtual; prevents
  silent hiding due to signature mismatches.
* **Virtual destructor** — required in any class used as a polymorphic base; ensures the correct
  destructor chain runs when deleting through a base pointer.
* **Object slicing** — the derived part is discarded when a derived object is copied into a base
  value; prevented by using references and pointers.
* **``dynamic_cast``** — runtime-checked downcast; returns null pointer on failure (pointer form)
  or throws ``std::bad_cast`` (reference form).
* **Liskov Substitution Principle** — derived types must honour the contracts of their base types;
  the Square/Rectangle problem is the canonical violation.

Hands-On Task
-------------

#. Build a ``Shape`` hierarchy (``Circle``, ``Rectangle``, ``Triangle``) with a virtual ``area()``
   and virtual ``perimeter()``. Store them in a ``std::vector<std::unique_ptr<Shape>>`` and print
   the total area.
#. Deliberately delete a derived object through a non-virtual base pointer; observe the sanitiser
   output. Add the virtual destructor and rerun.
#. Write a function that tries to ``dynamic_cast`` a ``Shape*`` to ``Circle*`` and prints the
   radius if it succeeds, or a generic message if not.

What You Will Build
-------------------

A polymorphic shape renderer: a ``std::vector<std::unique_ptr<Shape>>`` populated with mixed
shape types, iterated polymorphically to calculate and print total area and perimeter, with a
``dynamic_cast`` demo for type-specific operations.

Suggested Study Order
---------------------

#. Read "The is-a Relationship" and the vtable ASCII diagram (~15 min).
#. Implement the shape hierarchy from scratch before reading the examples (~20 min).
#. Read "The Slicing Problem" and "Liskov Substitution Principle" (~15 min).
#. Read ``pitfalls.rst`` and reproduce Pitfall 1 (missing virtual destructor) with ASan (~15 min).
#. Complete the hands-on tasks (~20 min).

Total estimated time: **85 minutes**.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ./build/day_06

Related Days
------------

* **Day 05** — Smart pointers: polymorphic hierarchies stored in ``unique_ptr<Base>``.
* **Day 07** — Virtual/override/final/abstract: pure virtual functions and interface design.
* **Day 18** — SOLID principles: LSP in depth; Open/Closed with virtual dispatch.
* **Day 20** — Static polymorphism (CRTP): zero-overhead alternative to virtual dispatch.
