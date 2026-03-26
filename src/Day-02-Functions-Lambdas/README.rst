Day 02: Functions and Lambdas
==============================

Why This Day Matters
--------------------

Functions define your program's interface to itself. Getting parameter passing right eliminates
unnecessary copies; understanding lambdas unlocks the full power of the standard algorithms.
After this day you will write functions that are safe, efficient, and composable.

Learning Outcomes
-----------------

By the end of this day you will be able to:

* Choose the correct parameter passing convention (value, ``const&``, ``&&``, pointer) for any
  given argument type and usage pattern.
* Write lambdas with explicit capture lists and explain the lifetime implications of each mode.
* Explain when ``std::function`` is appropriate and when a template callable is preferable.
* Use ``[[nodiscard]]`` to enforce that callers handle return values.
* Compose higher-order functions (filter, transform, accumulate) using lambdas and standard
  algorithms.
* Write a ``mutable`` lambda and explain what it changes about the generated closure type.

Key Concepts
------------

* **Parameter passing conventions** — value, ``const&``, ``&``, ``&&``, and pointer: each
  communicates ownership and mutability intent to the reader.
* **Lambda capture modes** — ``[=]`` copies, ``[&]`` references, mixed, and ``[*this]`` for
  safe capture of ``*this`` in asynchronous contexts.
* **``mutable`` lambda** — removes the implicit ``const`` from the call operator, allowing
  modification of value-captured copies.
* **Generic lambda** — ``auto`` or template parameters that make the lambda work across types,
  equivalent to a templated ``operator()``.
* **``std::function``** — type-erased callable storage; pay the virtual dispatch cost only at
  runtime-polymorphic API boundaries.
* **``[[nodiscard]]``** — attribute that forces callers to use return values, preventing silent
  error discard.

Hands-On Task
-------------

#. Write a function ``clamp_range`` that takes a ``std::vector<int>`` by reference and a min/max
   range by value, and clamps every element in place using a lambda and ``std::transform``.
#. Write a ``make_multiplier(int factor)`` factory that returns a ``mutable`` lambda holding
   a running product. Each call multiplies the accumulated value by ``factor``.
#. Replace a ``std::function<void(int)>`` callback in a hot loop with a template parameter and
   compare the generated assembly using ``-O2 -S``.

What You Will Build
-------------------

A small pipeline: generate a vector of integers, filter it with a lambda predicate, transform
each element with a lambda multiplier, and print the results using a callback. The pipeline
should work without a single raw loop.

Suggested Study Order
---------------------

#. Read "Function Signatures and Parameter Passing" in ``theory.rst`` (~15 min).
#. Run ``main.cpp`` and modify the lambda captures; observe the resulting output (~10 min).
#. Read "Lambdas — Closures in C++" and capture-mode section (~15 min).
#. Read ``pitfalls.rst``, focusing on Pitfall 1 (dangling reference) (~10 min).
#. Complete the hands-on task (~20 min).

Total estimated time: **70 minutes**.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ./build/day_02

    # Inspect generated code for template vs std::function
    g++ -std=c++20 -O2 -S main.cpp -o main.s

Related Days
------------

* **Day 01** — Value categories: lvalue/rvalue references used in function parameter types.
* **Day 03** — Classes: member functions and ``const``-correct method signatures.
* **Day 12** — Ranges and views: lambdas as projections and predicates in C++20 ranges.
* **Day 17** — Design patterns: strategy pattern implemented with ``std::function``.
