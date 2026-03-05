Day 19: Testing and TDD
=======================


Why This Day Matters
--------------------

This module builds practical skill in **Testing and TDD**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* red-green-refactor cycle
* assertion-driven checks
* small deterministic tests
* edge-case coverage

Hands-on Task
-------------

Write tests first for one function and iterate with small refactors.

Deliverable
-----------

A focused test suite that captures happy and failure paths.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_19
    ./build/src/day_19
