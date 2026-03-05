Pitfalls — Day 17: Design Patterns OOP
======================================


Common Pitfalls
---------------

* Pattern-first design instead of problem-first
* Unnecessary indirection
* Pattern misuse for tiny codebases

Warning Signs
-------------

* Frequent regressions after “small” edits.
* APIs that are hard to explain in one sentence.
* Behavior that depends on hidden assumptions.

Prevention Checklist
--------------------

* Compile with strict warnings and review every warning.
* Add tests for both happy paths and failure paths.
* Keep side effects localized and explicit.
* Refactor incrementally; verify behavior after each step.

Recovery Strategy
-----------------

#. Reproduce the issue with the smallest possible input.
#. Add/adjust a test to lock expected behavior.
#. Apply the minimal fix, then rerun tests and example.
