Day 03: Classes and Encapsulation
=================================


Why This Day Matters
--------------------

This module builds practical skill in **Classes and Encapsulation**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* class invariants
* public interface design
* private data ownership
* const-correct member functions

Hands-on Task
-------------

Model one domain object with invariants and strictly controlled mutations.

Deliverable
-----------

A class with clear API boundaries and invariant-preserving methods.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_03
    ./build/src/day_03
