Day 06: Inheritance and Polymorphism
====================================


Why This Day Matters
--------------------

This module builds practical skill in **Inheritance and Polymorphism**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* is-a relationships
* base class contracts
* runtime dispatch
* substitutability

Hands-on Task
-------------

Define one abstract base and two concrete implementations.

Deliverable
-----------

Polymorphic behavior verified through base pointers/references.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_06
    ./build/src/day_06
