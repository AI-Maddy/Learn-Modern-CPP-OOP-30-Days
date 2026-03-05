Day 10: Concepts and Constraints (C++20)
========================================


Why This Day Matters
--------------------

This module builds practical skill in **Concepts and Constraints (C++20)**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* defining concepts
* requires clauses
* improved diagnostics
* semantic constraints

Hands-on Task
-------------

Add concepts to a generic API and compare compiler diagnostics.

Deliverable
-----------

Constrained templates with readable intent.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_10
    ./build/src/day_10
