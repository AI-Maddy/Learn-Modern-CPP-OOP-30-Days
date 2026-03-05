Structured Bindings
===================

Overview
--------

Concise unpacking for tuples, pairs, and aggregate-style results.

Key Rules
---------

* Use for map iteration and tuple returns.
* Prefer meaningful binding names.
* Bind by reference when mutating source.
* Keep destructuring shallow for readability.

Quick Snippet
-------------

.. code-block:: cpp

    for (const auto& [key, value] : lookup) {
        std::cout << key << ":" << value << "\n";
    }

Common Mistakes
---------------

* Copying large values unintentionally.
* Using unclear names everywhere.
* Mutating copies assuming original changes.

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
