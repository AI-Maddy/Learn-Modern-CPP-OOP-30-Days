Day 18: SOLID Principles
========================


Why This Day Matters
--------------------

This module builds practical skill in **SOLID Principles**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* single responsibility
* open-closed design
* dependency inversion
* interface segregation

Hands-on Task
-------------

Refactor one class to improve SRP and DIP.

Deliverable
-----------

A modular design that is easier to test and extend.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_18
    ./build/src/day_18
