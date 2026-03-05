Refactoring Checklist
=====================

Overview
--------

Safe, incremental checklist for improving code without changing behavior.

Key Rules
---------

* Lock behavior first with tests.
* Refactor in small, reversible steps.
* Rename for clarity before structural changes.
* Run build, tests, and analysis after each step.

Quick Snippet
-------------

.. code-block:: cpp

    1) Add/adjust tests
    2) Extract small function
    3) Rename for intent
    4) Re-run tests + lints
    5) Commit

Common Mistakes
---------------

* Large batch refactors without checkpoints.
* Combining behavior changes with cleanup.
* Skipping review after substantial structural edits.

Review Checklist
----------------

* Can you explain the tradeoff of the chosen approach?
* Is ownership/lifetime explicit at API boundaries?
* Is there at least one test or assertion for non-trivial behavior?

Related Paths
-------------

* Day modules: ``src/Day-*``
* Sequence guide: ``docs/day-index.rst``
* Weekly plan: ``docs/30-day-roadmap.rst``
