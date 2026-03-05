Day 07: Virtual, Override, Final, Abstract
==========================================


Why This Day Matters
--------------------

This module builds practical skill in **Virtual, Override, Final, Abstract**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* abstract interfaces
* override correctness
* final constraints
* virtual dispatch costs

Hands-on Task
-------------

Audit a hierarchy and add ``override``/``final`` with intent.

Deliverable
-----------

An interface-driven design with robust virtual contracts.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_07
    ./build/src/day_07
