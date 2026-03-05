Optional, Variant, Any
======================

Overview
--------

Model optionality, alternatives, and dynamic type containers.

Key Rules
---------

* Use optional<T> for maybe-present values.
* Use variant for finite known alternatives.
* Use any sparingly for open type sets.
* Prefer std::visit for variant handling.

Quick Snippet
-------------

.. code-block:: cpp

    std::variant<int, std::string> v = 42;
    std::visit([](const auto& x){ std::cout << x; }, v);

Common Mistakes
---------------

* Using any where variant is better.
* Unchecked std::get on variant.
* Treating optional absence as error without context.

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
