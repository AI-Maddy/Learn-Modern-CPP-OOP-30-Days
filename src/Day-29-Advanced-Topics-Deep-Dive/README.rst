Day 29: Advanced Topics Deep Dive
=================================


Why This Day Matters
--------------------

This module builds practical skill in **Advanced Topics Deep Dive**, with emphasis on writing modern, maintainable C++ code.

Learning Outcomes
-----------------

* Explain the core ideas in your own words.
* Implement the day example and extend it safely.
* Identify tradeoffs and justify design choices.

Key Topics
----------

* sum types with variant
* visitor patterns
* abstraction tradeoffs
* robust generic handling

Hands-on Task
-------------

Use ``std::variant`` + ``std::visit`` in a real mini workflow.

Deliverable
-----------

An advanced example justified by simplicity and correctness.

Suggested Workflow
------------------

#. Read ``theory.rst`` and summarize each concept in one sentence.
#. Run and inspect ``main.cpp`` behavior.
#. Review ``pitfalls.rst`` and apply one improvement.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_29
    ./build/src/day_29
