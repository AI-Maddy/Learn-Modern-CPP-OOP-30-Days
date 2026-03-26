Day 19: Testing with Catch2 and TDD
=====================================

Learning Outcomes
------------------

By the end of this day you will be able to:

* Write Catch2 ``TEST_CASE`` / ``SECTION`` / ``REQUIRE`` tests that document
  and verify class behaviour through the public interface.
* Apply the TDD red-green-refactor cycle to build a new class incrementally,
  letting failing tests drive the implementation.
* Create test doubles (stub, fake, mock) that substitute injected dependencies
  without a mocking framework.
* Use ``REQUIRE_THROWS_AS`` and ``REQUIRE_NOTHROW`` to verify exception safety
  and the strong guarantee.
* Generate an LCOV code-coverage report and interpret which paths are untested.
* Apply the naming convention ``Class/method condition`` for self-documenting
  test names.

Key Concepts
-------------

* **TEST_CASE** — top-level test container; its string name appears in the
  test runner and serves as documentation.
* **SECTION** — independent branch within a test case; each runs from the
  start of the test case, providing implicit fixture reuse.
* **REQUIRE vs CHECK** — ``REQUIRE`` stops on first failure; ``CHECK`` records
  failures and continues, useful for validating multiple postconditions.
* **TDD red-green-refactor** — write a failing test, write minimum code to
  pass, then clean up; tests always drive the design.
* **Test double taxonomy** — stub (hardcoded return), fake (simplified working
  implementation), mock (records calls for verification).
* **``TEMPLATE_TEST_CASE``** — parameterises a test over multiple types,
  verifying LSP compliance across an entire class hierarchy.

Hands-On Task
--------------

Apply TDD to build a ``ShoppingCart`` class from scratch:

#. Write a failing test: ``ShoppingCart/add_item increases item count``.
#. Implement the minimum ``ShoppingCart`` to pass it.
#. Write a failing test: ``ShoppingCart/total returns sum of item prices``.
#. Implement ``total()``.
#. Write tests for: removing an item, removing a non-existent item (no throw
   or a specific exception — your design decision), and applying a discount.
#. Use a fake ``IPriceService`` dependency to avoid calling a real pricing API.
#. Run with ``--coverage`` and check that all branches are covered.

What You Will Build
--------------------

A fully TDD-built ``ShoppingCart`` with 10+ test cases, a ``FakePriceService``
test double, exception safety tests, and a coverage report showing near-100%
branch coverage.

Suggested Study Order
----------------------

#. Read the Catch2 Fundamentals and assertion macro sections — 15 min.
#. Study the ``SECTION`` mechanics example; reproduce it for a ``Stack`` — 15 min.
#. Read the TDD cycle section; trace through the ``Money`` class example — 20 min.
#. Study the test doubles section; implement a ``MockLogger`` — 15 min.
#. Read ``pitfalls.rst`` — pitfalls 1, 2, and 4 are the most common — 20 min.
#. Complete the hands-on ``ShoppingCart`` TDD task — 45 min.

Build and Run
--------------

.. code-block:: bash

  cd Day-19-Testing-Catch2-TDD
  cmake -S . -B build -DCMAKE_CXX_STANDARD=20
  cmake --build build
  ./build/tests                          # run all tests
  ./build/tests "[bank]"                 # run only tagged tests
  ./build/tests --reporter=console -v    # verbose output

Coverage report (GCC/Clang):

.. code-block:: bash

  cmake -S . -B cov_build \
    -DCMAKE_CXX_FLAGS="--coverage" \
    -DCMAKE_BUILD_TYPE=Debug
  cmake --build cov_build
  ./cov_build/tests
  lcov --capture --directory cov_build --output-file cov.info
  genhtml cov.info --output-directory html_coverage

Related Days
-------------

* **Day 18** — SOLID/DIP: dependency injection is the precondition for clean
  test doubles; review those interfaces before writing mocks.
* **Day 17** — Design Patterns: Observer and Command designs tested here
  exercise the patterns covered in Day 17.
* **Day 24** — Mini Project 1 (Bank System): use TDD from the start of the
  project; every feature added after a failing test.
* **Day 28** — Code Review: untested code paths identified in code review
  drive new test cases written using Catch2.
