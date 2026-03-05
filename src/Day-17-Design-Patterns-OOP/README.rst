Day 17: Design Patterns OOP
===========================


Why This Day Matters
--------------------

This module builds practical skill in **Design Patterns OOP**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* factory construction
* separation of creation and use
* polymorphic interfaces
* open/closed extensibility

Hands-on Task
-------------

Implement one creational and one behavioral pattern minimally.

Deliverable
-----------

Pattern usage that solves a real local design problem.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_17
    ./build/src/day_17
