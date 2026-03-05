Day 27: Refactoring Legacy Code
===============================


Why This Day Matters
--------------------

This module builds practical skill in **Refactoring Legacy Code**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* small safe refactors
* naming and extraction
* removing duplication
* modernizing APIs incrementally

Hands-on Task
-------------

Pick one legacy-style function and refactor in tiny verified steps.

Deliverable
-----------

Before/after code with behavior preserved and readability improved.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_27
    ./build/src/day_27
