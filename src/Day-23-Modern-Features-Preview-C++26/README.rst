Day 23: Modern Features Preview (C++26)
=======================================


Why This Day Matters
--------------------

This module builds practical skill in **Modern Features Preview (C++26)**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* forward-looking language evolution
* constexpr/consteval mindset
* safer APIs
* incremental adoption strategy

Hands-on Task
-------------

Experiment with one modern feature and document toolchain support.

Deliverable
-----------

A future-ready note with practical adoption guidance.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_23
    ./build/src/day_23
