Day 13: Move Semantics and Rvalue References
=============================================

Learning Outcomes
-----------------

After completing this day you will be able to:

* Classify any C++ expression as lvalue, prvalue, or xvalue and explain the
  practical consequence of each category.
* Write a move constructor and move assignment operator for a resource-owning class
  and verify correctness with ``static_assert(std::is_nothrow_move_constructible_v<T>)``.
* Explain what ``std::move`` does (and does not do) at runtime.
* Identify when NRVO applies and avoid the common mistake of ``return std::move(x)``.
* Describe perfect forwarding and explain why forwarding references preserve the
  original value category.

Key Concepts
------------

* **lvalue** — an expression that refers to a persistent object; has a stable
  address; binds to ``T&`` and ``const T&``.
* **rvalue / prvalue** — a temporary or computed value with no stable address;
  binds to ``T&&`` and ``const T&``.
* **xvalue** — an expiring value produced by ``std::move`` or a function returning
  ``T&&``; has an address but its resources may be transferred.
* **Rvalue reference** ``T&&`` — binds only to rvalues/xvalues; signals "I can steal
  this object's resources."
* **Move constructor** — transfers resources from a source object in O(1) time;
  leaves the source valid but empty.
* **Move assignment** — same transfer semantics for the assignment operator.
* **``std::move``** — a compile-time cast; converts an lvalue to an xvalue to enable
  move operations; does nothing at runtime by itself.
* **NRVO** — Named Return Value Optimisation; the compiler may construct a local
  return variable directly in the caller's frame, avoiding any copy or move.
* **``noexcept`` on moves** — required for standard containers to use move during
  reallocation instead of falling back to copy.

Hands-On Task
-------------

Build a **``UniqueBuffer``** class:

#. ``UniqueBuffer(std::size_t n)`` — allocates ``n`` bytes on the heap.
#. Implement the move constructor and move assignment operator (``noexcept``).
#. Delete the copy constructor and copy assignment operator.
#. Add a ``transfer_to(UniqueBuffer& dest)`` method that moves ``*this``'s
   resources into ``dest`` using ``std::move``.
#. Write a factory function ``make_buffer(std::size_t n)`` and confirm via a
   print statement that NRVO elides the move entirely (no "move" message printed).

What You Will Build
-------------------

A move-only resource wrapper that demonstrates: deleted copies, move-only semantics,
``noexcept`` correctness, and NRVO verification — all the patterns that make
resource-owning C++ classes efficient and safe.

Suggested Study Order
---------------------

#. Read ``theory.rst`` sections 1–2 (value categories, rvalue references) — *20 min*
#. Read ``theory.rst`` sections 3–4 (move constructor/assignment, std::move) — *25 min*
#. Read ``theory.rst`` section 5 (perfect forwarding preview) — *10 min*
#. Read ``theory.rst`` section 6 (NRVO/RVO) — *10 min*
#. Read ``pitfalls.rst`` — *15 min*
#. Implement the hands-on task in ``main.cpp`` — *40 min*
#. Answer self-check questions in ``theory.rst`` — *10 min*

Build and Run
-------------

.. code-block:: bash

    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Release
    cmake --build . --target day13
    ./day13

Related Days
------------

* **Day 04** — Constructors, Destructors, RAII (resource ownership — prerequisite)
* **Day 14** — Rule of Five, Copy-Move (builds directly on this day's content)
* **Day 05** — Smart Pointers (``unique_ptr`` uses move semantics internally)
* **Day 22** — Performance Tips (measuring move vs copy overhead)
