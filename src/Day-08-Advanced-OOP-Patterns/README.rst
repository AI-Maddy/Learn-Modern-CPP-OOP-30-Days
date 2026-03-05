Day 08: Advanced OOP Patterns
=============================


Why This Day Matters
--------------------

This module builds practical skill in **Advanced OOP Patterns**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* composition over inheritance
* runtime behavior strategies
* dependency injection basics
* stable abstractions

Hands-on Task
-------------

Implement strategy-style behavior swap without changing client code.

Deliverable
-----------

A composable OOP design with low coupling.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_08
    ./build/src/day_08
