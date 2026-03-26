Day 18: SOLID Principles
=========================

Learning Outcomes
------------------

By the end of this day you will be able to:

* State each of the five SOLID principles in one sentence and give a concrete
  C++ example of both a violation and a fix.
* Refactor a God-class into single-responsibility components with clear
  ownership boundaries.
* Apply the Open/Closed Principle using virtual dispatch or ``std::variant`` +
  visitor without editing existing code.
* Identify LSP violations by recognising ``dynamic_cast`` usage and
  postcondition strengthening in overrides.
* Design segregated interfaces so clients only depend on methods they use.
* Inject dependencies via constructor and explain why this is preferred over
  setter injection or internal construction.

Key Concepts
-------------

* **SRP (Single Responsibility)** — one class, one actor, one reason to change;
  detected by counting distinct "stakeholders" who could force a change.
* **OCP (Open/Closed)** — extend via polymorphism or ``std::variant``; never
  by editing a ``switch`` statement on a growing enum.
* **LSP (Liskov Substitution)** — a derived type must be usable wherever the
  base is used without altering the correctness of the program.
* **ISP (Interface Segregation)** — split fat interfaces by role; empty or
  throwing overrides signal a violation.
* **DIP (Dependency Inversion)** — high-level policy depends on an abstraction;
  concrete details are injected at the composition root.
* **Constructor injection** — the preferred DI style in C++; makes dependencies
  visible, mandatory, and amenable to ``const`` references.

Hands-On Task
--------------

Refactor a provided ``ReportEngine`` class (see ``main.cpp``) that currently:

#. Reads configuration from a file directly.
#. Queries a ``PostgreSQLDatabase`` directly.
#. Formats output as HTML using inline string manipulation.
#. Sends the result via ``SmtpClient`` directly.

Your task:

#. Identify which SOLID principle each coupling violates.
#. Define appropriate interfaces (``IDataSource``, ``IFormatter``, ``IDelivery``).
#. Rewrite ``ReportEngine`` to depend only on those interfaces.
#. Write a test that uses in-memory fakes for all three dependencies.
#. Verify the tests pass without any network or file I/O.

What You Will Build
--------------------

A refactored ``ReportEngine`` with three injected interfaces, an in-memory
test double for each interface, and a ``main.cpp`` composition root that wires
the real implementations together — demonstrating full DIP with SRP-aligned
components.

Suggested Study Order
----------------------

#. Read the SRP section and the God-class refactoring — 15 min.
#. Read OCP — study both the polymorphic and ``std::variant`` solutions — 15 min.
#. Read LSP — work through the Rectangle/Square example mentally — 15 min.
#. Read ISP — compare the fat vs segregated animal interfaces — 10 min.
#. Read DIP and the constructor injection section — 20 min.
#. Read ``pitfalls.rst`` — pay special attention to pitfalls 2 and 5 — 20 min.
#. Complete the hands-on refactoring task — 35 min.

Build and Run
--------------

.. code-block:: bash

  cd Day-18-SOLID-Principles
  cmake -S . -B build -DCMAKE_CXX_STANDARD=20
  cmake --build build
  ./build/solid_demo
  ./build/solid_tests   # in-memory fake tests

Related Days
-------------

* **Day 17** — Design Patterns: Factory, Strategy, and Observer all express
  OCP and DIP in action; study alongside this day.
* **Day 19** — Testing with Catch2: DIP makes test doubles trivial; use the
  interfaces designed here to write clean Catch2 tests.
* **Day 21** — pImpl and type erasure: pImpl is a structural DIP application —
  high-level header depends only on an opaque pointer to the implementation.
* **Day 27** — Refactoring legacy code: SOLID principles guide every
  refactoring decision covered there.
