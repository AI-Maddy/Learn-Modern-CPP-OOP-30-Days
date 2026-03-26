Day 03: Classes and Encapsulation
==================================

Why This Day Matters
--------------------

Classes are the unit of abstraction in object-oriented C++. A class that properly encapsulates
its invariants is reliable, testable, and safe to extend. A class that exposes its internals is
just a struct with extra syntax. This day teaches you the difference and how to design for the
former.

Learning Outcomes
-----------------

By the end of this day you will be able to:

* Distinguish ``class`` from ``struct`` by invariant ownership, not just by default access.
* Write a class that establishes an invariant in the constructor and maintains it in all mutating
  member functions.
* Apply ``const``-correctness to member functions so that the class works through ``const``
  references.
* Use ``explicit`` on single-argument constructors to prevent unintended implicit conversions.
* Explain "tell, don't ask" and refactor an anemic domain model to embed its logic.
* Use ``friend`` appropriately for operator overloading and tightly coupled abstractions.

Key Concepts
------------

* **Class invariant** — the condition that must hold true of internal state at all observable
  points; enforced in the constructor and maintained by every mutating member function.
* **Access specifiers** — ``private``, ``protected``, ``public``: start private and promote only
  as needed.
* **``const`` member functions** — callable on ``const`` objects; do not modify observable state.
* **``this`` pointer** — implicit first parameter; use for method chaining (fluent interface) and
  self-disambiguation.
* **``explicit``** — prevents single-argument constructors from being used as implicit
  conversions; always apply unless a conversion is intentional.
* **``friend``** — grants targeted access to private members; use for operators and
  closely-coupled abstractions, not as an encapsulation bypass.

Hands-On Task
-------------

#. Model a ``BankAccount`` class with the invariant ``balance >= 0``. Enforce it in the
   constructor and in ``withdraw()``.
#. Add ``const``-correct getters and a ``deposit()`` / ``withdraw()`` API; ensure a function
   taking ``const BankAccount&`` can call all read operations.
#. Add ``operator<<`` as a ``friend`` function to print the account in a readable format.
#. Write a unit test (in ``main.cpp``) that tries to construct a ``BankAccount`` with a
   negative balance and verifies the exception is thrown.

What You Will Build
-------------------

A ``BankAccount`` class with an enforced balance invariant, validated construction, a fluent
transaction history builder, and a ``friend`` stream operator — demonstrating all encapsulation
principles from this day.

Suggested Study Order
---------------------

#. Read "``class`` vs ``struct``" and "Access Specifiers" in ``theory.rst`` (~10 min).
#. Read "Encapsulation Principles" and "Tell, Don't Ask" (~15 min).
#. Run ``main.cpp``; trace which functions are called and which modifiers protect them (~10 min).
#. Read ``pitfalls.rst`` and apply Pitfall 4 (``explicit``) to the existing code (~10 min).
#. Complete the hands-on task (~25 min).

Total estimated time: **70 minutes**.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
    cmake --build build
    ./build/day_03

Related Days
------------

* **Day 04** — Constructors and RAII: constructor types, member initialiser lists, destructor.
* **Day 06** — Inheritance: access specifiers for base classes; ``protected`` members.
* **Day 18** — SOLID principles: Single Responsibility and Open/Closed applied to class design.
