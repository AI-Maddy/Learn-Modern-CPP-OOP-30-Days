Day 11: Generic OOP Design
===========================

Learning Outcomes
-----------------

After completing this day you will be able to:

* Design a policy-based class with two independent policy axes and instantiate
  multiple combinations without any code duplication.
* Constrain policy template parameters with concepts so that incorrect policy
  types produce clear, actionable error messages.
* Implement the template method pattern without virtual functions and measure the
  difference in generated code versus a virtual-function version.
* Build a type-safe generic container (ring buffer or fixed-capacity stack) and
  explain why it is safer than a ``void*`` equivalent.
* Choose between compile-time and runtime polymorphism based on whether types are
  known at compile time and whether heterogeneous storage is needed.

Key Concepts
------------

* **Policy-based design** — parametrise a class on multiple small "policy" types,
  each providing one aspect of behaviour; the compiler inlines each combination.
* **Private policy inheritance** — inherit from a policy using ``private`` so the
  policy's interface is not exposed to callers of the host class.
* **Type-safe container** — a class template whose element type is enforced by the
  compiler; type errors are caught at the call site, not at runtime.
* **Generic algorithm with concepts** — a function template constrained by concepts
  so it works for any conforming type with clear errors for non-conforming ones.
* **Template method pattern** — fix an algorithm's skeleton in a base or host class;
  supply the varying steps through template parameters instead of virtual overrides.
* **Compile-time vs runtime polymorphism** — compile-time (templates) is zero-overhead
  but requires types known at compile time; runtime (virtual) supports heterogeneous
  collections and plugin loading.

Hands-On Task
-------------

Build a **generic event dispatcher**:

#. Define two policy concepts: ``EventHandler`` (must have ``handle(Event)``) and
   ``EventFilter`` (must have ``bool should_pass(Event)``).
#. Implement ``EventDispatcher<Filter, Handler>`` that filters events and dispatches
   them — no virtual functions.
#. Add a second ``Handler`` policy that logs events to ``std::cout``.
#. Compose ``FilteringLogger = EventDispatcher<AlwaysPass, LogHandler>`` and
   ``FilteredDispatcher = EventDispatcher<PriorityFilter, RealHandler>`` as type
   aliases.
#. Add a thin ``IDispatcher`` virtual interface so both can be stored in a
   ``std::vector<std::unique_ptr<IDispatcher>>``.

What You Will Build
-------------------

A compile-time event pipeline that demonstrates policy composition, concept
constraints, the template method pattern, and the bridge to runtime polymorphism
via a thin virtual wrapper — all in under 150 lines.

Suggested Study Order
---------------------

#. Read ``theory.rst`` sections 1–2 (policy-based design, type-safe containers) — *25 min*
#. Read ``theory.rst`` sections 3–4 (generic algorithms, template method) — *20 min*
#. Read ``theory.rst`` section 5 (compile-time vs runtime tradeoff table) — *10 min*
#. Read ``pitfalls.rst`` — *15 min*
#. Implement the hands-on task in ``main.cpp`` — *45 min*
#. Answer self-check questions in ``theory.rst`` — *10 min*

Build and Run
-------------

.. code-block:: bash

    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Release
    cmake --build . --target day11
    ./day11

Related Days
------------

* **Day 08** — Advanced OOP Patterns (composition and strategy — prerequisite)
* **Day 09** — Templates Basics (class and function templates — prerequisite)
* **Day 10** — Concepts and Constraints (constraining template parameters)
* **Day 20** — Static Polymorphism and CRTP (advanced generic OOP patterns)
* **Day 22** — Performance Tips (measuring compile-time vs runtime overhead)
