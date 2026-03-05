Catch2 Testing
==============

Overview
--------

Pragmatic unit-testing workflow for C++ behavior verification.

Key Rules
---------

* One behavior per test case.
* Name tests by behavior and expectation.
* Cover failure paths and edge cases.
* Keep tests deterministic and fast.

Quick Snippet
-------------

.. code-block:: cpp

    TEST_CASE("withdraw rejects overdraft") {
        BankAccount a{"x", 100};
        REQUIRE_FALSE(a.withdraw(200));
    }

Common Mistakes
---------------

* Integration-heavy tests in unit layer.
* Shared mutable fixture state.
* Flaky timing/randomness dependencies.

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
