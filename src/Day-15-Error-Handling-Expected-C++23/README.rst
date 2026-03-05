Day 15: Error Handling and Expected (C++23)
===========================================


Why This Day Matters
--------------------

This module builds practical skill in **Error Handling and Expected (C++23)**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* value-or-error outcomes
* explicit failure paths
* exception alternatives
* error propagation

Hands-on Task
-------------

Model parsing/validation flow with explicit error values.

Deliverable
-----------

An API returning success-or-error with informative failures.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_15
    ./build/src/day_15
