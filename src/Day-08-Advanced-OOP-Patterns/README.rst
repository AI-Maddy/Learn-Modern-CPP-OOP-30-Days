Day 08: Advanced OOP Patterns
==============================

Learning Outcomes
-----------------

After completing this day you will be able to:

* Refactor an inheritance hierarchy into a composition-based design and explain
  why the result is more maintainable.
* Implement a CRTP mixin that injects at least two operators into a class with
  zero runtime overhead.
* Store a runtime-selectable algorithm in a class using ``std::function`` and
  swap strategies without recompiling the class.
* Distinguish value semantics from reference semantics and choose correctly for
  a given domain type.
* Apply the Interface Segregation Principle to split a fat abstract class into
  focused role interfaces.

Key Concepts
------------

* **Composition over inheritance** — assemble objects from small, independent
  capability components instead of creating deep hierarchies.
* **CRTP mixin** — a base class template that uses ``static_cast<Derived&>(*this)``
  to call derived-class methods at compile time, injecting shared behaviour for free.
* **Strategy pattern** — encapsulate an interchangeable algorithm behind
  ``std::function<Signature>`` so it can be replaced at runtime.
* **Value semantics** — objects own their data; copies are fully independent; the
  preferred model for regular C++ types.
* **Reference semantics** — objects are shared via pointers; mutation is globally
  visible; needed for polymorphism and shared ownership.
* **pImpl idiom** — forward-declare a private ``Impl`` struct and hold it via
  ``unique_ptr`` to decouple interface from implementation.
* **Interface Segregation Principle** — split large abstract classes into narrow
  role interfaces so clients depend only on what they use.

Hands-On Task
-------------

Build a **plugin-style Shape renderer**:

#. Define three narrow interfaces: ``IGeometry`` (area, perimeter),
   ``IDrawable`` (draw), ``IStyleable`` (set_color).
#. Implement ``Circle`` (IGeometry + IDrawable) and ``GlowCircle``
   (all three interfaces) using composition, not inheritance, for the
   rendering engine.
#. Add a ``RenderPipeline`` that holds a ``std::function<void(IDrawable&)>``
   strategy and can be switched between "wireframe" and "filled" modes at runtime.
#. Create a ``Comparable<T>`` CRTP mixin and apply it to a ``Circle`` so that
   circles can be sorted by area.

What You Will Build
-------------------

A small rendering pipeline demonstrating all six patterns working together:
composition-based shapes, a CRTP comparison mixin, a runtime-switchable render
strategy, and segregated interfaces that let the pipeline hold only ``IDrawable``
references regardless of what other interfaces a shape implements.

Suggested Study Order
---------------------

#. Read ``theory.rst`` sections 1–2 (composition, CRTP) — *25 min*
#. Read ``theory.rst`` sections 3–4 (strategy, value/reference semantics) — *20 min*
#. Read ``theory.rst`` sections 5–6 (pImpl preview, ISP) — *15 min*
#. Read ``pitfalls.rst`` — *15 min*
#. Implement the hands-on task in ``main.cpp`` — *45 min*
#. Review self-check questions in ``theory.rst`` — *10 min*

Build and Run
-------------

.. code-block:: bash

    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Debug
    cmake --build . --target day08
    ./day08

Related Days
------------

* **Day 07** — Virtual, override, final, abstract (prerequisite)
* **Day 11** — Generic OOP Design (policy-based design extends composition ideas)
* **Day 20** — Static Polymorphism and CRTP (deep dive into CRTP)
* **Day 21** — pImpl Idiom and Type Erasure (full pImpl coverage)
* **Day 18** — SOLID Principles (ISP in the context of all five principles)
