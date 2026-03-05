Pitfalls — Day 03: Classes and Encapsulation
============================================


Common Pitfalls
---------------

* Exposing mutable internal state
* Weak invariants in setters
* Too many public data members

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
