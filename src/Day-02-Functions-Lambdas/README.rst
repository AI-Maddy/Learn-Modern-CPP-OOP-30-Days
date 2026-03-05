Day 02: Functions and Lambdas
=============================


Why This Day Matters
--------------------

This module builds practical skill in **Functions and Lambdas**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* function signatures
* value vs reference parameters
* lambda captures
* higher-order utilities

Hands-on Task
-------------

Implement transform/filter flows with lambdas and compare capture strategies.

Deliverable
-----------

A reusable function + lambda-based pipeline on a small dataset.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_02
    ./build/src/day_02
