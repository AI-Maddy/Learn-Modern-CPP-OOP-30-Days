Day 24: Mini Project 1 – Bank Account System
============================================

Why This Day Matters
--------------------

This is the first integration day of the course. Every OOP concept taught
in Days 1–23 — encapsulation, inheritance, polymorphism, RAII, smart
pointers, operator overloading, exceptions — converges into one coherent
design. Working through a real domain makes the relationships concrete and
memorable.

Learning Outcomes
-----------------

After completing this day you will be able to:

* Design a class hierarchy using inheritance with a non-trivial virtual
  function (``withdraw``) that behaves differently in each subtype.
* Apply RAII by embedding a file-backed ``TransactionLog`` as a class member
  so resource lifetime is tied to object lifetime.
* Return polymorphic objects from a factory using ``std::unique_ptr`` and
  store them in a ``std::vector`` without object slicing.
* Overload ``operator+=`` and ``operator-=`` on a polymorphic base class so
  the operators dispatch through the vtable correctly.
* Throw and catch a custom exception hierarchy (``InsufficientFunds``) that
  carries structured data beyond a plain message string.

Key Concepts
------------

* **Encapsulation** — balance and log are hidden behind a public interface
  that validates all mutations before they occur.
* **Virtual withdraw** — each account subtype supplies its own withdrawal
  rules (minimum balance, overdraft, fees) without duplicating shared logic.
* **RAII log** — ``TransactionLog`` owns a file handle; the handle is
  released automatically when the enclosing ``BankAccount`` is destroyed.
* **Factory function** — ``make_account()`` centralises construction and
  returns ``unique_ptr<BankAccount>`` so callers never touch raw ``new``.
* **Custom exceptions** — ``InsufficientFunds`` inherits from
  ``std::runtime_error`` and exposes ``needed()`` / ``available()`` for
  structured error handling.

What You Will Build
-------------------

A small banking library with:

* ``BankAccount`` base class with deposit, virtual withdraw, and operators.
* ``SavingsAccount`` with minimum balance enforcement and monthly interest.
* ``CheckingAccount`` with overdraft protection and per-transaction fee.
* ``TransactionLog`` RAII wrapper persisting every event to a text file.
* A ``main.cpp`` demonstrating deposits, withdrawals, exception handling,
  and printing account statements.

Hands-On Task
-------------

Extend the provided ``main.cpp`` by implementing a ``transfer(from, to,
amount)`` free function that atomically moves money between two accounts.
It must:

#. Withdraw from the source (which may throw ``InsufficientFunds``).
#. Deposit into the destination only if the withdrawal succeeded.
#. Log both events with matching amounts.
#. Leave both accounts unchanged if any step throws.

Suggested Study Order
---------------------

#. **Read theory.rst** (30 min) — work through each section top to bottom;
   re-read the design diagram until the ownership model is clear.
#. **Compile and run main.cpp** (15 min) — observe log files generated on
   disk; inspect their contents after running.
#. **Implement the transfer task** (30 min) — write it, then deliberately
   trigger an ``InsufficientFunds`` exception to verify rollback.
#. **Read pitfalls.rst** (15 min) — check your implementation against each
   pitfall; fix anything that matches.
#. **Write one unit test** (15 min) — assert that a failed transfer leaves
   both balances unchanged.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_24
    ./build/src/day_24
    # Check generated log files:
    cat SAV001_log.txt
    cat CHK001_log.txt

Related Days
------------

* **Day 11** — Inheritance fundamentals (virtual functions, vtable).
* **Day 15** — RAII and the Rule of Five.
* **Day 17** — Smart pointers (unique_ptr, shared_ptr).
* **Day 19** — Operator overloading.
* **Day 21** — Exception handling hierarchies.
* **Day 25** — Next mini-project: Shape Editor (visitor pattern, variant).
