Debugging Tools 2026
====================

Overview
--------

Modern debugging flow with diagnostics, sanitizers, and debugger tooling.

Key Rules
---------

* Compile with symbols and strict warnings.
* Use ASan/UBSan early in development.
* Use lldb/gdb breakpoints and watch expressions.
* Reproduce with the smallest failing input.

Quick Snippet
-------------

.. code-block:: cpp

    cmake -S . -B build -DENABLE_SANITIZERS=ON
    cmake --build build
    ctest --test-dir build --output-on-failure

Common Mistakes
---------------

* Debugging optimized binaries without symbols.
* Skipping sanitizer runs in CI.
* Fixing symptoms without root-cause isolation.

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
