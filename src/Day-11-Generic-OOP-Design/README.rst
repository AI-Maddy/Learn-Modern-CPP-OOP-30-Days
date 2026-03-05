Day 11: Generic OOP Design
==========================


Why This Day Matters
--------------------

This module builds practical skill in **Generic OOP Design**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* generic wrappers
* type-safe reuse
* policy-based design
* interface and template balance

Hands-on Task
-------------

Blend one interface-based and one template-based abstraction.

Deliverable
-----------

A design that balances flexibility and clarity.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_11
    ./build/src/day_11
