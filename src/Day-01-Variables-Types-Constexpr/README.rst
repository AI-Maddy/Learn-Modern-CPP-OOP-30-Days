Day 01: Variables, Types, and Constexpr
========================================

Why This Day Matters
--------------------

Choosing the right type and initialising it safely eliminates an entire category of runtime bugs
before the program runs. The C++ type system is your most powerful tool for expressing invariants,
and ``constexpr`` moves computation from runtime to compile time — free performance with no
trade-off.

Learning Outcomes
-----------------

By the end of this day you will be able to:

* Explain the difference between ``const`` and ``constexpr`` and choose correctly between them.
* Use brace initialisation ``{}`` for all variable declarations to prevent narrowing conversions.
* Write ``constexpr`` functions and verify they are evaluated at compile time.
* Unpack pairs, tuples, and aggregates with C++17 structured bindings.
* Identify lvalue, prvalue, and xvalue expressions in a code sample.
* Describe what happens when a signed integer overflows and how to detect it with UBSan.

Key Concepts
------------

* **Brace initialisation** — the uniform ``{}`` syntax that makes narrowing conversions a
  compile-time error rather than a silent runtime truncation.
* **``constexpr``** — computes values at compile time; stronger guarantee than ``const``;
  replaces ``#define`` for constants and macros for simple functions.
* **``auto``** — type deduction that eliminates verbosity for iterators and obvious initialisers;
  requires ``&`` to avoid copying in range-for loops.
* **Structured bindings** — unpacks ``std::pair``, ``std::tuple``, and aggregates into named
  variables, replacing ``.first`` / ``.second`` / ``get<N>`` noise.
* **Value categories** — lvalue (named, addressable), prvalue (temporary), xvalue (movable):
  foundation for understanding move semantics on Day 13.
* **Fixed-width integers** — ``std::int32_t``, ``std::uint64_t`` from ``<cstdint>`` guarantee
  exact bit widths across platforms.

Hands-On Task
-------------

#. Replace every ``#define`` constant in ``main.cpp`` with a ``constexpr`` equivalent.
#. Change all ``=`` initialisations to brace initialisations; observe any new compile errors.
#. Write a ``constexpr`` function ``clamp(int val, int lo, int hi)`` that returns ``val`` bounded
   to ``[lo, hi]``; use it in a ``static_assert`` to verify compile-time evaluation.
#. Iterate over a ``std::map<std::string, int>`` using a structured binding and print each pair.

What You Will Build
-------------------

A program that demonstrates type-safe compile-time constants, narrowing-safe initialisation,
``constexpr`` computation verified with ``static_assert``, and structured bindings on a small
score table.

Suggested Study Order
---------------------

#. Read the "Brace Initialisation" and "const vs constexpr" sections in ``theory.rst`` (~15 min).
#. Run ``main.cpp`` and introduce a narrowing error; observe the compiler message (~5 min).
#. Read the "Value Categories" section; draw the lvalue/rvalue tree on paper (~15 min).
#. Read ``pitfalls.rst`` and identify which pitfalls apply to your own prior C++ code (~10 min).
#. Complete the hands-on task (~20 min).

Total estimated time: **65 minutes**.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ./build/day_01

    # Verify constexpr evaluation — no runtime output needed
    # static_assert failures appear at compile time

Related Days
------------

* **Day 00** — Toolchain setup: the build system used here.
* **Day 04** — RAII: ``const`` member variables and ``constexpr`` constructors.
* **Day 13** — Move semantics: value categories (lvalue/xvalue/prvalue) explained in depth.
