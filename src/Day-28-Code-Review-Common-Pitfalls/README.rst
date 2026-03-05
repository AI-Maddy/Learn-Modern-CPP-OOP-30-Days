Day 28: Code Review and Common Pitfalls
=======================================


Why This Day Matters
--------------------

This module builds practical skill in **Code Review and Common Pitfalls**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* review checklist discipline
* correctness before style
* readability and maintainability
* defensive boundary checks

Hands-on Task
-------------

Review one file using a checklist and submit actionable comments.

Deliverable
-----------

A review report with issues, severity, and suggested fixes.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_28
    ./build/src/day_28
