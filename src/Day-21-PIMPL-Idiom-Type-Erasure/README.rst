Day 21: PIMPL Idiom and Type Erasure
====================================


Why This Day Matters
--------------------

This module builds practical skill in **PIMPL Idiom and Type Erasure**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* implementation hiding
* stable headers
* type-erased callables
* compile-time decoupling

Hands-on Task
-------------

Hide implementation details for one class and expose minimal API.

Deliverable
-----------

A compile-time friendly interface with private implementation.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_21
    ./build/src/day_21
