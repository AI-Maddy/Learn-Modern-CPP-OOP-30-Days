Day 28: Code Review and Common C++ Pitfalls
============================================

Why This Day Matters
--------------------

The single highest-leverage activity for improving code quality is
rigorous code review. This day gives you the mental checklist to spot
the most dangerous C++ anti-patterns quickly, the interpersonal skills
to give and receive review effectively, and the tooling knowledge to
automate the mechanical parts so human review focuses on substance.

Learning Outcomes
-----------------

After completing this day you will be able to:

* Apply a five-layer review checklist (correctness, safety, interface,
  performance, style) to any C++ pull request.
* Identify and fix nine named C++ anti-patterns: raw owning pointers,
  unsigned subtraction underflow, narrowing conversions, const-incorrectness,
  dangling references, signed/unsigned comparison, missing override,
  std::endl in loops, and incorrect noexcept.
* Configure ``clang-tidy`` with a ``.clang-tidy`` file and integrate it
  into a CI workflow.
* Set up ``clang-format`` as a pre-commit hook to enforce consistent style
  automatically.
* Give actionable, severity-classified review comments and respond
  professionally to comments on your own code.

Key Concepts
------------

* **Five-layer review** — correctness first; style last; never the reverse.
* **Anti-pattern checklist** — nine recurring C++ mistakes that automated
  tools can help catch but human reviewers must understand.
* **clang-tidy** — static analysis linter with 300+ checks covering the
  C++ Core Guidelines, safety, performance, and modernisation.
* **clang-format** — mechanical formatter that removes style arguments
  from code review permanently.
* **Review severity** — BLOCKER / CRITICAL / MAJOR / MINOR / NIT;
  blockers must be fixed before merge.

What You Will Build
-------------------

A review exercise: the provided ``review_target.cpp`` deliberately contains
one instance of each of the nine anti-patterns described in ``theory.rst``.
You will:

* Run ``clang-tidy`` on it and capture the output.
* Write a review report in ``review_report.txt`` classifying each finding
  by severity and proposing a concrete fix.
* Apply all fixes to create ``review_target_fixed.cpp``.
* Verify that ``clang-tidy`` produces zero warnings on the fixed file.

Hands-On Task
-------------

#. Identify all nine anti-patterns in ``review_target.cpp`` manually
   (before running any tool).
#. Run ``clang-tidy`` and compare your findings to its output.
#. Fix each issue in order from BLOCKER to NIT.
#. Add a ``.clang-format`` file and run ``clang-format -i`` on both files.
#. Confirm the fixed file compiles cleanly with
   ``-Wall -Wextra -Wconversion -Wsign-compare -std=c++20``.

Suggested Study Order
---------------------

#. **Read theory.rst** (35 min) — study each anti-pattern section; for
   each one, think of a place in your own past code where you made that
   mistake.
#. **Manual review pass** (20 min) — read ``review_target.cpp`` and
   annotate with comments; classify each finding.
#. **Run automated tools** (10 min) — compare clang-tidy output with
   your manual findings; note what the tool caught that you missed.
#. **Apply fixes** (25 min) — fix one issue at a time; compile after each.
#. **Read pitfalls.rst** (15 min) — check your fixes are genuine solutions,
   not workarounds that introduce new problems.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
    cmake --build build --target day_28
    ./build/src/day_28
    # Run static analysis:
    clang-tidy src/Day-28-Code-Review-Common-Pitfalls/review_target.cpp \
        -p build/ -- -std=c++20 -Wall -Wextra
    # Run formatter:
    clang-format -i src/Day-28-Code-Review-Common-Pitfalls/*.cpp

Related Days
------------

* **Day 15** — RAII and Rule of Five (raw-pointer pitfall fix).
* **Day 17** — Smart pointers (factory return type pitfall fix).
* **Day 21** — Exception safety (noexcept misuse pitfall).
* **Day 27** — Refactoring Legacy Code (applying review findings).
* **Day 29** — Advanced features (consteval, bit_cast used correctly).
