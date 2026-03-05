Day 14: Rule of 5, Copy and Move
================================


Why This Day Matters
--------------------

This module builds practical skill in **Rule of 5, Copy and Move**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* special member functions
* deep copy vs shallow copy
* move assignment
* exception safety

Hands-on Task
-------------

Implement and test all required special member functions.

Deliverable
-----------

A resource-owning class with correct copy/move semantics.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_14
    ./build/src/day_14
