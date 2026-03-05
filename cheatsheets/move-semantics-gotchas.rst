Move Semantics Gotchas
======================

Overview
--------

Common traps and safe patterns around moves and value categories.

Key Rules
---------

* Moved-from objects must remain valid but unspecified.
* Mark move operations noexcept when possible.
* Use std::move only when ownership transfer is intended.
* Prefer return-by-value with NRVO over manual optimizations.

Quick Snippet
-------------

.. code-block:: cpp

    std::string s = "abc";
    std::string t = std::move(s);
    // s is valid but unspecified

Common Mistakes
---------------

* Using moved-from objects as if unchanged.
* Moving from const objects (copy occurs).
* Double-moving the same value unexpectedly.

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
