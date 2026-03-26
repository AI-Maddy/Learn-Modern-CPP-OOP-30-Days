Day 20: Static Polymorphism and CRTP
======================================

Learning Outcomes
------------------

By the end of this day you will be able to:

* Explain the CRTP mechanics — the base class takes ``Derived`` as a template
  argument and uses ``static_cast<Derived*>(this)`` to call derived methods.
* Implement a CRTP mixin that provides default behaviour by calling a
  customisation point on the derived class.
* Stack multiple CRTP bases (mixin accumulation) and explain the layout
  implications (zero-overhead — no added data members).
* Compare virtual dispatch and CRTP on the dimensions of overhead, inlining,
  heterogeneous containers, and compile-time vs runtime type selection.
* Use ``std::span`` as a CRTP-free way to write polymorphic code over contiguous
  ranges without virtual dispatch or inheritance.
* Combine CRTP with C++20 Concepts for self-documenting interface constraints.

Key Concepts
-------------

* **CRTP base** — a class template whose parameter is the derived type;
  provides methods that call ``static_cast<Derived*>(this)->hook()``.
* **Static interface enforcement** — if the derived class omits the required
  hook, the compiler reports the error at the call site (not at runtime).
* **Mixin accumulation** — inherit multiple CRTP bases; each adds methods to
  the derived type with zero data overhead.
* **``static_cast<Derived*>(this)``** — the canonical downcast; safe within
  CRTP because ``Base<Derived>`` is only ever a base of ``Derived``.
* **``std::span<T>``** — C++20 non-owning range view; erases container type
  while keeping element type, providing sequence polymorphism without CRTP.
* **Devirtualisation** — compiler optimisation that converts a virtual call to
  a direct call; CRTP makes this unnecessary by eliminating the vtable.

Hands-On Task
--------------

Build a ``Sensor`` mixin framework:

#. Create a ``SensorBase<Derived>`` CRTP base with a ``read()`` method that
   calls ``Derived::sample()`` three times and returns the average.
#. Create a ``Loggable<Derived>`` CRTP mixin whose ``log_read()`` calls
   ``read()`` and prints the result with a timestamp.
#. Create ``TemperatureSensor`` and ``PressureSensor`` that inherit both mixins
   and implement ``sample()`` returning a simulated value.
#. Show that ``sizeof(TemperatureSensor)`` contains no ``vptr``.
#. Benchmark ``read()`` vs a virtual equivalent to observe the inlining benefit.

What You Will Build
--------------------

A ``Sensor`` hierarchy using CRTP mixins with zero virtual overhead,
demonstrating compile-time interface enforcement, mixin stacking, and
benchmark-verified performance versus a virtual baseline.

Suggested Study Order
----------------------

#. Read the Motivation section — understand the vtable costs — 10 min.
#. Study CRTP Mechanics; trace through ``Base<ConcreteA>::interface()`` — 20 min.
#. Read Static Interface Enforcement; trigger the compile error intentionally — 15 min.
#. Study Mixin Accumulation; draw the ``Config`` layout diagram — 15 min.
#. Read the CRTP vs Virtual comparison table — 10 min.
#. Study the ``std::span`` section; write a span-based algorithm — 15 min.
#. Read ``pitfalls.rst`` — pitfalls 1 and 3 are the most common mistakes — 20 min.
#. Complete the hands-on Sensor task — 35 min.

Build and Run
--------------

.. code-block:: bash

  cd Day-20-Static-Polymorphism-CRTP
  cmake -S . -B build -DCMAKE_CXX_STANDARD=20 -DCMAKE_BUILD_TYPE=Release
  cmake --build build
  ./build/crtp_demo

To inspect assembly and confirm inlining:

.. code-block:: bash

  # GCC: generate assembly for the crtp_demo target
  g++ -O2 -std=c++20 -S main.cpp -o main.s
  # Look for: no indirect call (call *%rax) in the CRTP version

Related Days
-------------

* **Day 7** — Virtual/Override/Final/Abstract: the baseline to compare against;
  understand virtual dispatch fully before replacing it with CRTP.
* **Day 10** — Concepts/Constraints: C++20 Concepts replace CRTP as a
  constraint mechanism for free functions; use them together.
* **Day 17** — Design Patterns: Strategy and Observer implemented at compile
  time via CRTP rather than virtual dispatch.
* **Day 22** — Performance Tips: CRTP is one of several devirtualisation and
  hot-path optimisation techniques covered there.
