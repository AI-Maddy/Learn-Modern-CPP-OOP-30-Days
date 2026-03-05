Day 16: Modules Basics (C++20)
==============================


Why This Day Matters
--------------------

This module builds practical skill in **Modules Basics (C++20)**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* translation unit boundaries
* export surface design
* faster incremental builds
* clear API ownership

Hands-on Task
-------------

Separate API and implementation boundaries with module mindset.

Deliverable
-----------

A cleanly separated interface boundary and client usage.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_16
    ./build/src/day_16
