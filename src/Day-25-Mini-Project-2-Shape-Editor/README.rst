Day 25: Mini Project 2: Shape Editor
====================================


Why This Day Matters
--------------------

This module builds practical skill in **Mini Project 2: Shape Editor**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* shape hierarchies
* polymorphic rendering contract
* container of polymorphic objects
* extensible operations

Hands-on Task
-------------

Support at least two shape types and one common operation.

Deliverable
-----------

An extensible shape model ready for additional tools.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_25
    ./build/src/day_25
