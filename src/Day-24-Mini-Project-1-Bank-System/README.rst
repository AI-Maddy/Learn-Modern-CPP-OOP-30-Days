Day 24: Mini Project 1: Bank System
===================================


Why This Day Matters
--------------------

This module builds practical skill in **Mini Project 1: Bank System**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* domain modeling
* account operations
* transaction rules
* state consistency

Hands-on Task
-------------

Implement transfer, validation, and transaction logging rules.

Deliverable
-----------

A minimal bank domain model with consistent state transitions.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_24
    ./build/src/day_24
