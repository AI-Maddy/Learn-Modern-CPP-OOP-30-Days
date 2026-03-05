Error Handling Expected
=======================

Overview
--------

Explicit value-or-error style for predictable control flow.

Key Rules
---------

* Return success/error values for expected failures.
* Attach actionable error context.
* Keep exceptions for exceptional conditions.
* Handle all branches at call sites.

Quick Snippet
-------------

.. code-block:: cpp

    using Result = std::variant<Value, ParseError>;
    Result parse(std::string_view input);

Common Mistakes
---------------

* Ignoring error alternatives.
* Losing domain context in generic errors.
* Combining multiple strategies inconsistently.

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
