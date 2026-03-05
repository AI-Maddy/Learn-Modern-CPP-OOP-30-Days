Day 00: Setup and Basics
========================


Why This Day Matters
--------------------

This module builds practical skill in **Setup and Basics**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* toolchain and compiler modes
* basic program structure
* standard input/output
* build and run loop

Hands-on Task
-------------

Set up compiler flags (``-Wall -Wextra -Wpedantic``) and run at least two edit-build-run loops.

Deliverable
-----------

A cleanly compiling hello-style program extended with one STL algorithm.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_00
    ./build/src/day_00
