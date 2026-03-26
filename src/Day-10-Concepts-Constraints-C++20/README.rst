Day 10: Concepts and Constraints (C++20)
=========================================

Learning Outcomes
-----------------

After completing this day you will be able to:

* Define a named concept using ``requires`` expressions with return-type constraints.
* Attach constraints to function and class templates using the ``requires`` clause and
  the abbreviated ``ConceptName auto`` syntax.
* Compose concepts with ``&&``, ``||``, and negation to express precise requirements.
* Choose the right standard-library concept (``std::integral``, ``std::regular``,
  ``std::ranges::range``) for common template constraints.
* Explain why concepts produce better error messages than SFINAE and how subsumption
  controls overload resolution.

Key Concepts
------------

* **Concept** — a named compile-time Boolean predicate that constrains a template
  parameter and enables clear error messages.
* **requires clause** — attaches a concept or Boolean expression to a template or
  function to gate its participation in overload resolution.
* **requires expression** — the body of a concept; tests whether operations, type
  members, and return types compile for a given type.
* **Abbreviated function template** — uses ``ConceptName auto`` as a parameter type
  instead of an explicit template parameter list.
* **Concept composition** — ``&&`` and ``||`` combine concepts; subsumption rules
  determine which overload wins when multiple constraints match.
* **Subsumption** — if concept A is defined in terms of concept B, A subsumes B;
  the more constrained overload is preferred without ambiguity.
* **SFINAE** — the pre-C++20 technique using ``enable_if`` to conditionally exclude
  template candidates; replaced by concepts for new code.
* **std::regular** — the baseline concept for types usable in generic algorithms:
  default-constructible, copyable, movable, equality-comparable.

Hands-On Task
-------------

Build a **generic statistics library**:

#. Define a concept ``Numeric`` that requires ``std::is_arithmetic_v<T>`` and that
   ``T{} + T{}`` returns something convertible to ``T``.
#. Implement ``mean()``, ``variance()``, and ``std_dev()`` constrained on ``Numeric``
   and ``std::ranges::range``.
#. Add an overload of ``mean()`` additionally constrained on
   ``std::ranges::sized_range`` that uses ``size()`` directly instead of counting.
#. Demonstrate subsumption: the sized overload should win automatically for
   ``std::vector``, and the basic overload should win for a custom forward-range.

What You Will Build
-------------------

A header-only statistics library that accepts any numeric range, uses concepts
for all constraints, and produces clean error messages when called with wrong types
(e.g., ``mean(std::vector<std::string>{})``).

Suggested Study Order
---------------------

#. Read ``theory.rst`` sections 1–2 (requires clause, defining concepts) — *20 min*
#. Read ``theory.rst`` section 3 (abbreviated templates) — *10 min*
#. Read ``theory.rst`` sections 4–5 (composition, standard concepts) — *15 min*
#. Read ``theory.rst`` section 6 (SFINAE vs concepts) — *15 min*
#. Read ``pitfalls.rst`` — *15 min*
#. Implement the hands-on task in ``main.cpp`` — *40 min*
#. Answer self-check questions in ``theory.rst`` — *10 min*

Build and Run
-------------

.. code-block:: bash

    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_STANDARD=20
    cmake --build . --target day10
    ./day10

Related Days
------------

* **Day 09** — Templates Basics (prerequisite — concepts constrain templates)
* **Day 11** — Generic OOP Design (policy-based design uses concepts for constraints)
* **Day 12** — Ranges and Views C++20 (ranges concepts used extensively)
* **Day 20** — Static Polymorphism and CRTP (concepts replace some CRTP patterns)
