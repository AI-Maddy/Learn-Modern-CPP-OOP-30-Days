Day 09: Templates Basics
========================


Why This Day Matters
--------------------

This module builds practical skill in **Templates Basics**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* function templates
* class templates
* type parameter deduction
* template instantiation

Hands-on Task
-------------

Generalize one function and one class using templates.

Deliverable
-----------

Type-generic utilities with clean call sites.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_09
    ./build/src/day_09
