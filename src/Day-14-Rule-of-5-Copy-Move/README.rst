Day 14: Rule of Five, Copy and Move
=====================================

Learning Outcomes
-----------------

After completing this day you will be able to:

* Apply the Rule of Zero — identify classes that need no special members and let
  the compiler generate all five correctly.
* Implement all five special members for a resource-owning class using the
  copy-and-swap idiom for exception-safe assignment.
* Use ``= default`` and ``= delete`` correctly to express intent and prevent
  accidental copies or moves.
* Identify the three levels of exception safety (nothrow, strong, basic) and
  implement copy-and-swap to achieve the strong guarantee for assignment.
* Explain why a user-defined destructor suppresses the implicit move operations
  and how to re-enable them safely.

Key Concepts
------------

* **Rule of Zero** — classes that use RAII member types (smart pointers, containers)
  need no hand-written special members; the compiler composes them correctly.
* **Rule of Five** — if you define any one of {destructor, copy ctor, copy assign,
  move ctor, move assign}, explicitly handle all five.
* **Copy constructor** — creates a new object as a deep copy of an existing one;
  should leave the source unchanged.
* **Copy assignment** — replaces a live object's state with a deep copy; must handle
  self-assignment and provide exception safety.
* **Move constructor** — transfers resources from a source object in O(1); source
  left valid but empty; must be ``noexcept``.
* **Move assignment** — same transfer semantics; must guard against self-assignment.
* **``= default``** — explicitly requests the compiler-generated version; enables
  trivial-copy and ``noexcept`` propagation.
* **``= delete``** — prevents an operation at compile time; preferred over ``private``.
* **Copy-and-swap idiom** — implement copy assignment by constructing a copy as a
  parameter, then swapping; achieves the strong exception guarantee automatically.
* **Exception safety levels** — nothrow (never throws), strong (rollback on throw),
  basic (valid state after throw), no-guarantee (avoid).

Hands-On Task
-------------

Build a complete ``Matrix<T>`` class:

#. Stores a 2D grid of values in a single heap-allocated ``T[]`` array.
#. Implement all five special members following the Rule of Five.
#. Use copy-and-swap for copy assignment (single function handles both copy and
   move assignment via value parameter).
#. Add ``static_assert(std::is_nothrow_move_constructible_v<Matrix<int>>)``.
#. Write a test that verifies: copy leaves source unchanged, move leaves source
   empty, self-assignment is safe, exception during copy does not modify original.

What You Will Build
-------------------

A 2D matrix type that manages its own memory correctly under all copy, move,
and exception conditions — demonstrating every aspect of the Rule of Five and
the copy-and-swap idiom in a single realistic class.

Suggested Study Order
---------------------

#. Read ``theory.rst`` sections 1–2 (Rule of Zero, Rule of Five) — *20 min*
#. Read ``theory.rst`` sections 3–4 (``=default``, ``=delete``, copy-and-swap) — *20 min*
#. Read ``theory.rst`` section 5 (exception safety levels) — *15 min*
#. Read ``pitfalls.rst`` — *15 min*
#. Implement the hands-on task in ``main.cpp`` — *50 min*
#. Answer self-check questions in ``theory.rst`` — *10 min*

Build and Run
-------------

.. code-block:: bash

    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_STANDARD=20
    cmake --build . --target day14
    ./day14

Related Days
------------

* **Day 13** — Move Semantics and Rvalue References (prerequisite)
* **Day 04** — Constructors, Destructors, RAII (resource management basics)
* **Day 05** — Smart Pointers (moving to Rule-of-Zero via unique_ptr/shared_ptr)
* **Day 15** — Error Handling (exception safety in context of error management)
