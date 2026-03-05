Day 13: Move Semantics and Rvalue References
============================================


Why This Day Matters
--------------------

This module builds practical skill in **Move Semantics and Rvalue References**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* value categories
* move constructors
* std::move semantics
* resource transfer

Hands-on Task
-------------

Instrument copy/move calls and reduce unnecessary copies.

Deliverable
-----------

A class with safe and efficient move behavior.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_13
    ./build/src/day_13
