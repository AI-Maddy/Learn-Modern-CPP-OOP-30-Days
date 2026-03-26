Day 27: Refactoring Legacy Code
================================

Why This Day Matters
--------------------

Real C++ work is predominantly maintenance and evolution of existing code.
Knowing how to improve a codebase incrementally — without introducing
regressions and without stopping feature delivery — is one of the most
valuable skills a C++ engineer can have. This day turns that skill into
a repeatable practice.

Learning Outcomes
-----------------

After completing this day you will be able to:

* Identify at least six named code smells in a C++ codebase (long method,
  god class, magic numbers, data clumps, type code, raw pointers) and
  articulate why each is harmful.
* Apply the Strangler Fig pattern to migrate a legacy subsystem to a
  modern design without a big-bang rewrite.
* Write characterisation tests that capture current behaviour before
  making any structural change.
* Perform four incremental refactoring steps (extract method, named
  constants, replace type code, raw-to-smart-pointer) while keeping
  all tests green.
* Configure and run ``clang-tidy`` on a file and interpret its output.

Key Concepts
------------

* **Code smells** — symptoms of structural problems; do not indicate bugs
  directly but predict where bugs are likely to appear.
* **Characterisation tests** — tests written to document existing behaviour
  before refactoring; they make regressions visible immediately.
* **Strangler Fig** — the safest large-scale migration strategy: build new
  alongside old, redirect incrementally, delete the old when idle.
* **Extract Method** — the most common refactoring; pulls a cohesive block
  into a named function, making intent explicit.
* **clang-tidy** — a static analysis tool with 300+ checks covering safety,
  performance, readability, and C++ Core Guidelines compliance.

What You Will Build
-------------------

A before/after pair of files:

* ``legacy_account.cpp`` — the original code with magic numbers, a god-class
  ``AccountManager``, raw owning pointers, and a type-code integer switch.
* ``modern_account.cpp`` — the same logic after incremental refactoring:
  named constants, extracted helpers, polymorphism replacing the switch,
  and ``unique_ptr`` replacing raw pointers.
* A shared test file that asserts identical outputs from both versions,
  proving behaviour is preserved.

Hands-On Task
-------------

Apply the following four refactoring steps to the provided
``legacy_account.cpp``:

#. **Add characterisation tests** — one test per branch of each function;
   commit tests alone (no code changes) so history is clear.
#. **Extract Method** — split ``calculate_fee()`` into per-account-type
   helpers; re-run tests.
#. **Replace Magic Numbers** — introduce named ``constexpr`` constants;
   re-run tests.
#. **Replace Type Code with Polymorphism** — introduce a virtual
   ``calculate_fee()``; re-run tests.

Measure cyclomatic complexity with ``lizard`` before and after::

    lizard legacy_account.cpp
    lizard modern_account.cpp

Suggested Study Order
---------------------

#. **Read theory.rst** (35 min) — study each refactoring step with its
   before/after code; spend extra time on the Strangler Fig diagram.
#. **Read the legacy file** (10 min) — identify all six smells; annotate
   them with comments before touching the code.
#. **Write characterisation tests** (20 min) — commit them; do not change
   the legacy code yet.
#. **Apply each refactoring step** (40 min) — one commit per step;
   verify tests pass after each.
#. **Read pitfalls.rst** (15 min) — ensure your PR has no new dependencies,
   no removed ``const``, and no boundary-condition changes.
#. **Run clang-tidy** (10 min) — fix at least three warnings in the legacy file.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_27
    ./build/src/day_27
    # Run clang-tidy:
    clang-tidy src/Day-27-Refactoring-Legacy-Code/legacy_account.cpp \
        -p build/ -- -std=c++20

Related Days
------------

* **Day 11** — Inheritance and virtual dispatch (used in type-code replacement).
* **Day 15** — RAII and smart pointers (used in pointer modernisation).
* **Day 21** — Exception handling (add safety to modernised factories).
* **Day 28** — Code review (reviewing a refactoring PR requires specific skills).
* **Day 29** — Advanced features (consteval, constexpr for compile-time constants).
