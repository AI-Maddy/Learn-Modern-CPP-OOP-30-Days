Day 01: Variables, Types, Constexpr
===================================


Why This Day Matters
--------------------

This module builds practical skill in **Variables, Types, Constexpr**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* strong typing
* initialization styles
* const vs constexpr
* narrowing prevention

Hands-on Task
-------------

Refactor a small snippet to prefer brace-initialization and constexpr constants.

Deliverable
-----------

A program with compile-time evaluated helpers and safe type usage.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_01
    ./build/src/day_01
