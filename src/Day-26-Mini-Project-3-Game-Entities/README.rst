Day 26: Mini Project 3: Game Entities
=====================================


Why This Day Matters
--------------------

This module builds practical skill in **Mini Project 3: Game Entities**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* entity update loops
* component-like decomposition
* state transitions
* small simulation steps

Hands-on Task
-------------

Implement a deterministic update tick for multiple entities.

Deliverable
-----------

A tiny entity simulation with clean update semantics.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_26
    ./build/src/day_26
