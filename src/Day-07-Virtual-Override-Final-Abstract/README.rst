Day 07: Virtual, Override, Final, and Abstract Classes
=======================================================

Why This Day Matters
--------------------

Pure virtual functions, abstract classes, and the Non-Virtual Interface idiom are the tools you
use to design stable, extensible APIs. After this day you will be able to define interfaces that
force correct implementation by derived classes, enforce invariants that no override can bypass,
and make deliberate decisions about when to seal a class and when to leave it open.

Learning Outcomes
-----------------

By the end of this day you will be able to:

* Write an abstract base class with pure virtual functions and explain why it cannot be
  instantiated.
* Apply ``override`` to every overriding function and describe the compiler check it enables.
* Choose when ``final`` is appropriate on a class or method and explain the devirtualisation
  benefit.
* Implement the NVI idiom and explain how it enforces invariants that derived classes cannot
  bypass.
* Write covariant return types in clone/factory patterns to eliminate ``dynamic_cast`` at call
  sites.
* Explain the virtual destructor requirement and apply it to every abstract base class.
* Identify a situation where ``std::variant`` + ``std::visit`` is a better alternative to
  virtual dispatch.

Key Concepts
------------

* **Pure virtual function (``= 0``)** — mandates that derived classes provide an implementation;
  makes the class abstract (not instantiable directly).
* **Abstract base class** — a class with at least one pure virtual function; models a protocol
  or interface.
* **``override``** — compiler-checked annotation that the function signature matches a base
  virtual; prevents silent function hiding.
* **``final`` (class)** — seals the class against further derivation; enables compiler
  devirtualisation.
* **``final`` (method)** — prevents further override in derived classes; useful to lock down a
  specific override in the middle of a hierarchy.
* **NVI idiom** — public non-virtual wrapper calls protected/private virtual hooks; guarantees
  pre/post processing runs for every invocation.
* **Covariant return types** — override can return a more-derived pointer/reference; eliminates
  casts in clone and factory patterns.

Hands-On Task
-------------

#. Design an ``ISerializer`` interface with ``serialize`` and ``deserialize`` pure virtuals.
   Implement ``JsonSerializer`` and ``BinarySerializer``. Store both behind ``ISerializer*`` and
   call ``serialize`` polymorphically.
#. Add a ``DataPipeline`` class using NVI: public ``run()`` calls protected hooks
   ``on_pre_run()``, ``do_run()``, and ``on_post_run()``. Implement a concrete subclass that
   overrides only ``do_run()``.
#. Mark ``JsonSerializer`` as ``final`` and verify that trying to subclass it produces a compile
   error.

What You Will Build
-------------------

A small plugin-style serialiser framework: an ``ISerializer`` interface, two concrete
implementations (JSON and binary), a ``DataPipeline`` with NVI-enforced hooks, and a driver
that swaps serialisers at runtime via the interface pointer.

Suggested Study Order
---------------------

#. Read "Pure Virtual Functions and Abstract Classes" with the full ``Renderer`` example (~15 min).
#. Implement ``ISerializer`` from scratch and verify abstract class cannot be instantiated (~10 min).
#. Read "NVI Idiom" and trace the call sequence through the ``DataProcessor`` example (~15 min).
#. Read ``pitfalls.rst`` Pitfall 1 (missing override) and reproduce it; observe the silent
   behaviour (~10 min).
#. Complete the hands-on tasks (~25 min).

Total estimated time: **75 minutes**.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ./build/day_07

Related Days
------------

* **Day 06** — Inheritance: virtual functions, vtable, slicing — prerequisites for this day.
* **Day 17** — Design patterns: Strategy and Observer use abstract base classes extensively.
* **Day 18** — SOLID: Interface Segregation and Dependency Inversion applied to abstract types.
* **Day 20** — CRTP: static polymorphism as a zero-overhead alternative to virtual dispatch.
