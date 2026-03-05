Day 12: Ranges and Views (C++20)
================================


Why This Day Matters
--------------------

This module builds practical skill in **Ranges and Views (C++20)**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* lazy pipelines
* views composition
* range adaptors
* readable transformations

Hands-on Task
-------------

Build a 3-stage views pipeline and reason about laziness.

Deliverable
-----------

A clear range pipeline replacing manual loops.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_12
    ./build/src/day_12
