Day 20: Static Polymorphism and CRTP
====================================


Why This Day Matters
--------------------

This module builds practical skill in **Static Polymorphism and CRTP**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* compile-time polymorphism
* CRTP structure
* zero virtual dispatch
* static interfaces

Hands-on Task
-------------

Implement one CRTP base with two small derived types.

Deliverable
-----------

A static-polymorphism API with zero runtime dispatch.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_20
    ./build/src/day_20
