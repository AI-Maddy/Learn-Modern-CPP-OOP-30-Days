Theory — Day 02: Functions and Lambdas
======================================


Concept Deep Dive
-----------------

1) Function signatures
~~~~~~~~~~~~~~~~~~~~~~

Understand the intent, typical use cases, and boundaries of this idea before coding.

2) Value vs reference parameters
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Focus on correctness-first design and keep implementation details hidden behind clear interfaces.

3) Lambda captures
~~~~~~~~~~~~~~~~~~

Validate assumptions through small runnable examples and explicit edge-case checks.

4) Higher-order utilities
~~~~~~~~~~~~~~~~~~~~~~~~~

Prefer simple, readable constructs; optimize only after behavior is verified.

Design Notes
------------

* Write APIs that communicate ownership, lifetime, and mutability clearly.
* Keep units small so they can be tested independently.
* Use naming to document intent, not implementation detail.

Quick Self-Check
----------------

* Can you explain when **not** to use this day’s primary technique?
* Can you identify one refactor that improves clarity without changing behavior?
* Can you propose one focused unit test for the example code?
