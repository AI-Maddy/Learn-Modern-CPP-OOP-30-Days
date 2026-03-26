Day 29: Advanced Topics Deep Dive
==================================

Why This Day Matters
--------------------

C++20 introduced features that professionals in game development, embedded
systems, high-frequency trading, and network programming use daily. This
day gives you working knowledge of coroutines, custom memory management,
compile-time programming, and safe type-punning. These are the features
that separate mid-level from senior C++ engineers.

Learning Outcomes
-----------------

After completing this day you will be able to:

* Implement a minimal ``Generator<T>`` coroutine type using ``co_yield``
  and explain the roles of the promise type and coroutine handle.
* Explain the difference between ``co_yield``, ``co_await``, and
  ``co_return`` and give a use case for each.
* Use ``std::pmr::monotonic_buffer_resource`` to replace heap allocations
  with stack-backed pool allocations in a container.
* Write a ``consteval`` function that generates a lookup table baked into
  the binary at compile time, and explain why this beats ``constexpr``
  for pure compile-time tables.
* Use ``std::bit_cast`` for IEEE 754 float bit manipulation without
  invoking undefined behaviour, and articulate why ``reinterpret_cast``
  is wrong for the same purpose.
* Apply ``constexpr std::sort`` and ``std::binary_search`` to build a
  sorted lookup table verified with ``static_assert``.

Key Concepts
------------

* **co_yield / co_await / co_return** — the three coroutine keywords;
  yield suspends and produces a value; await suspends until a future is
  ready; return terminates and produces the final value.
* **Promise type** — the customisation point that controls coroutine
  lifecycle, suspension behaviour, and return value propagation.
* **std::pmr** — the polymorphic memory resource library; swap allocators
  without recompiling container code.
* **consteval** — stronger than constexpr; guarantees compile-time-only
  evaluation; ideal for lookup tables and static safety checks.
* **std::bit_cast** — standards-conforming type-punning; same-size,
  trivially-copyable types only; fully constexpr.

What You Will Build
-------------------

Four self-contained examples:

#. A ``fibonacci()`` coroutine generator that lazily produces Fibonacci
   numbers using ``co_yield`` and a reusable ``Generator<T>`` template.
#. A pool-allocation demo using ``std::pmr::monotonic_buffer_resource``
   that proves zero heap allocation occurs (by overriding ``::operator new``
   to abort in tests).
#. A compile-time sine lookup table generated with ``consteval`` at 1-degree
   resolution, accessed at runtime with a single array subscript.
#. A safe ``fast_inv_sqrt`` using ``std::bit_cast`` replacing the classic
   undefined-behaviour version.

Hands-On Task
-------------

Implement a ``Task<T>`` coroutine type (simpler than a full async runtime)
that:

#. Uses ``co_return`` to produce a single value.
#. Stores the result in the promise type and exposes it via ``get()``.
#. Propagates exceptions through ``unhandled_exception()`` and re-throws
   them from ``get()``.
#. Is non-copyable and movable.

Then write a ``Task<double>`` coroutine that computes the sum of squares
of numbers 1–100 and verify the result is 338350.

Suggested Study Order
---------------------

#. **Read theory.rst** (45 min) — work through each section with a compiler
   open; compile the Generator example first, then pmr, consteval, bit_cast.
#. **Run main.cpp** (10 min) — verify all four examples produce correct output.
#. **Implement the Task<T> exercise** (40 min) — start from the promise_type
   skeleton; add ``return_value``, then exception propagation.
#. **Read pitfalls.rst** (15 min) — verify your Generator has deleted copy,
   your pmr resource outlives its vector, and your bit_cast targets are
   trivially copyable.
#. **Add static_assert to the consteval table** (10 min) — verify at least
   three known values at compile time.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_29
    ./build/src/day_29
    # Coroutines require C++20:
    # Ensure CMakeLists sets: target_compile_features(day_29 PRIVATE cxx_std_20)

Related Days
------------

* **Day 14** — Templates and generic programming (promise_type is a template).
* **Day 15** — RAII (coroutine handle ownership mirrors unique_ptr ownership).
* **Day 17** — Smart pointers (coroutine handle behaves like a unique_ptr).
* **Day 23** — std::variant and std::expected (alternative to exceptions
  in embedded coroutines).
* **Day 28** — Code review (consteval and bit_cast are frequently reviewed
  incorrectly by reviewers unfamiliar with C++20).
* **Day 30** — Review and next steps (these features are part of the
  senior-level C++ roadmap).
