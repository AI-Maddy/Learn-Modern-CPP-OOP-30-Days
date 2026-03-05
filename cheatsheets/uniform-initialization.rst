Uniform Initialization
======================

Overview
--------

Brace initialization patterns for clarity and narrowing safety.

Key Rules
---------

* Prefer {} for direct initialization.
* Use parentheses only where overload semantics require it.
* Watch initializer_list overload selection.
* Use auto carefully with braces.

Quick Snippet
-------------

.. code-block:: cpp

    int x{42};
    std::vector<int> v{1, 2, 3};
    Widget w{arg1, arg2};

Common Mistakes
---------------

* Unexpected initializer_list constructor calls.
* Mixing initialization styles inconsistently.
* Assuming {} and () are always equivalent.

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
