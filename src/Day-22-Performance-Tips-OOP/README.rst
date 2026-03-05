Day 22: Performance Tips OOP
============================


Why This Day Matters
--------------------

This module builds practical skill in **Performance Tips OOP**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* reserve and emplace usage
* avoiding unnecessary copies
* const references
* measurement-driven tuning

Hands-on Task
-------------

Measure baseline, apply one optimization, then measure again.

Deliverable
-----------

A small but measurable performance improvement with explanation.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_22
    ./build/src/day_22
