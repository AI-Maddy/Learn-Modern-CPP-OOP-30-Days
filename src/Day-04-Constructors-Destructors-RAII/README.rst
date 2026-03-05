Day 04: Constructors, Destructors, RAII
=======================================


Why This Day Matters
--------------------

This module builds practical skill in **Constructors, Destructors, RAII**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* resource acquisition at construction
* deterministic destruction
* scope-bound safety
* exception-safe cleanup

Hands-on Task
-------------

Wrap one resource in an RAII type and verify cleanup across all exits.

Deliverable
-----------

A scope-managed resource class with predictable teardown.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_04
    ./build/src/day_04
