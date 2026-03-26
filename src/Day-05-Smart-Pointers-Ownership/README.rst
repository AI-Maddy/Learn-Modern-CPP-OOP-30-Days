Day 05: Smart Pointers and Ownership
=====================================

Why This Day Matters
--------------------

Raw pointers are ambiguous: they carry no ownership information and provide no safety guarantees.
Smart pointers make ownership a first-class language construct. After this day, your code will
communicate who owns every heap-allocated object, and the compiler will enforce those rules.

Learning Outcomes
-----------------

By the end of this day you will be able to:

* Choose between ``unique_ptr``, ``shared_ptr``, and ``weak_ptr`` given a description of the
  ownership requirements.
* Use ``make_unique`` and ``make_shared`` instead of ``new``; explain the performance and safety
  advantages.
* Break a ``shared_ptr`` cycle using ``weak_ptr`` and verify with the leak sanitiser.
* Attach a custom deleter to ``unique_ptr`` for non-memory resources (file handles, C library
  objects).
* Implement the ``enable_shared_from_this`` pattern to safely obtain a ``shared_ptr`` to
  ``*this``.
* Explain when a raw pointer is the correct choice (non-owning borrow).

Key Concepts
------------

* **``unique_ptr``** — exclusive ownership, move-only, zero runtime overhead; the default choice
  for heap-allocated objects.
* **``shared_ptr``** — shared ownership via atomic reference counting; use only when multiple
  independent owners genuinely exist.
* **``weak_ptr``** — non-owning observer; must be locked to access the object; used to break
  cycles and implement cache-friendly observer patterns.
* **``make_unique`` / ``make_shared``** — preferred factory functions; exception-safe and (for
  ``make_shared``) allocate object + control block in one call.
* **Custom deleters** — allow smart pointers to manage non-memory resources using any cleanup
  callable.
* **``enable_shared_from_this``** — safe way to obtain a ``shared_ptr`` to ``*this`` from
  inside a member function, avoiding double-free.

Hands-On Task
-------------

#. Create a tree structure where parent nodes own children via ``unique_ptr``, and children
   hold a ``weak_ptr`` back to the parent. Verify no cycle and no leak.
#. Implement a ``FileHandle`` RAII wrapper using ``unique_ptr<FILE, decltype(&fclose)>``.
#. Model a simple cache: a ``std::map<int, std::weak_ptr<Resource>>`` where callers get
   ``shared_ptr<Resource>``; the cache evicts entries automatically when all callers release them.

What You Will Build
-------------------

An object graph (tree with parent back-links) demonstrating unique ownership downward and
weak observation upward, plus a simple cache proving automatic eviction via ``weak_ptr``
expiration.

Suggested Study Order
---------------------

#. Read the "Ownership Vocabulary" section and draw the three pointer types on paper (~10 min).
#. Read ``unique_ptr`` section; implement a factory function from scratch (~15 min).
#. Read ``shared_ptr`` and ``weak_ptr`` sections, focusing on the cycle-breaking example (~15 min).
#. Read ``pitfalls.rst`` Pitfall 1 (cycles); reproduce and then fix it with the leak sanitiser
   running (~15 min).
#. Complete the hands-on tasks (~20 min).

Total estimated time: **75 minutes**.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ASAN_OPTIONS=detect_leaks=1 ./build/day_05

Related Days
------------

* **Day 04** — RAII: the general principle that ``unique_ptr`` implements.
* **Day 06** — Inheritance: polymorphic object hierarchies managed through ``unique_ptr<Base>``.
* **Day 14** — Rule of Five: how copy/move semantics interact with smart pointer ownership.
* **Day 17** — Design patterns: factory and observer patterns using smart pointers.
