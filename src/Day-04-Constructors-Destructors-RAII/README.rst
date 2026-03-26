Day 04: Constructors, Destructors, and RAII
============================================

Why This Day Matters
--------------------

C++ has no garbage collector. Resources — memory, file handles, sockets, mutexes — must be
released explicitly. RAII is the idiom that makes this automatic and exception-safe. After this
day you will never write a resource leak, because your objects will clean up after themselves.

Learning Outcomes
-----------------

By the end of this day you will be able to:

* Write all five constructor types (default, parameterised, delegating, copy, move) with correct
  member initialiser lists.
* Explain RAII and implement it for at least two resource types (file, timer).
* Describe the four levels of exception safety and write a function with the strong guarantee.
* Mark destructors ``noexcept`` and explain why throwing from a destructor is dangerous.
* Identify two-phase initialisation anti-patterns and refactor them to single-constructor designs.
* Use ``= delete`` to make a type non-copyable when copying makes no semantic sense.

Key Concepts
------------

* **Member initialiser list** — initialises members before the constructor body; required for
  ``const`` and reference members; follows declaration order, not list order.
* **RAII** — constructor acquires, destructor releases; guarantees cleanup on all exit paths
  including exceptions.
* **Delegating constructors** — forward to a canonical constructor; eliminate init logic
  duplication.
* **``noexcept`` destructors** — destructors must not throw; wrap cleanup that might fail in
  ``try``/``catch`` and swallow or log.
* **Exception safety levels** — no-throw, strong, basic, none; aim for strong when possible.
* **``= delete``** — explicitly prohibits copy/move for types where duplication is meaningless
  (file handles, mutexes, scoped timers).

Hands-On Task
-------------

#. Implement a ``ScopedTimer`` RAII class that measures wall-clock time and prints the duration
   in its destructor. Make it non-copyable with ``= delete``.
#. Implement a ``ScopedFile`` RAII class wrapping ``FILE*`` with ``fopen``/``fclose``.
   Demonstrate it closes on early return and exception.
#. Refactor a two-phase ``DatabaseConnection`` (with an ``init()`` function) into a one-phase
   design where the constructor either succeeds or throws.

What You Will Build
-------------------

Two RAII wrappers (``ScopedTimer`` and ``ScopedFile``) used in a single ``main()`` that
demonstrates cleanup on normal exit, early return, and exception. The build verifies that
``clang-tidy`` reports no resource-management warnings.

Suggested Study Order
---------------------

#. Read "RAII: The Core Pattern" with its ASCII scope diagram (~15 min).
#. Implement ``ScopedTimer`` from scratch before reading the example; then compare (~20 min).
#. Read "Constructor Types" and "Member Initialiser List" (~15 min).
#. Read ``pitfalls.rst`` and reproduce Pitfall 1 (resource leak) manually, then fix it (~15 min).
#. Complete the remaining hands-on tasks (~20 min).

Total estimated time: **85 minutes**.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ./build/day_04

    # Verify no leaks
    ASAN_OPTIONS=detect_leaks=1 ./build/day_04

Related Days
------------

* **Day 05** — Smart pointers: ``unique_ptr`` and ``shared_ptr`` are RAII wrappers for heap memory.
* **Day 14** — Rule of Five: copy constructor, copy assignment, move constructor, move assignment,
  destructor — the complete resource-management story.
* **Day 15** — Error handling: ``std::expected`` as a non-exception alternative to constructor
  failure.
