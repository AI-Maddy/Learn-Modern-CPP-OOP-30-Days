Day 05: Smart Pointers and Ownership
====================================


Why This Day Matters
--------------------

This module builds practical skill in **Smart Pointers and Ownership**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* unique ownership
* shared ownership
* non-owning access
* lifetime modeling

Hands-on Task
-------------

Replace raw ownership with ``unique_ptr``/``shared_ptr`` only where justified.

Deliverable
-----------

A small object graph with explicit ownership semantics.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_05
    ./build/src/day_05
