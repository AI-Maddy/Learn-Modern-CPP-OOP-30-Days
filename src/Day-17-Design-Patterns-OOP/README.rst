Day 17: Design Patterns for OOP
================================

Learning Outcomes
------------------

By the end of this day you will be able to:

* Name and describe the intent of the five core GoF patterns covered: Factory
  Method, Observer, Strategy, Decorator, and Command.
* Implement each pattern in idiomatic C++17/20 using lambdas, ``std::function``,
  ``unique_ptr``, and templates instead of heavyweight virtual hierarchies.
* Identify when a pattern adds value versus when it adds unnecessary complexity.
* Apply the Factory registry pattern to achieve open-for-extension, closed-for-
  modification (OCP) designs.
* Write an Observer system with safe lifetime management using ``weak_ptr``
  or RAII unsubscription tokens.

Key Concepts
-------------

* **Factory Method** — decouples object creation from usage; implemented as a
  registry map from string keys to creator lambdas.
* **Observer** — one-to-many event notification; ``std::function`` handlers
  replace virtual ``IObserver`` base classes.
* **Strategy** — swappable algorithm; use a template parameter for compile-time
  zero-cost selection, ``std::function`` for runtime selection.
* **Decorator** — dynamic behaviour composition; ``unique_ptr`` chain wraps
  components without subclass explosion.
* **Command** — encapsulates a request as a callable pair (do/undo); enables
  history, queuing, and transactional operations.
* **Over-engineering signal** — applying a pattern when there is only one
  implementation and no real changeability requirement.

Hands-On Task
--------------

Build a mini text-processing pipeline:

#. Define a ``TextTransform`` interface and two concrete transforms: ``UpperCase``
   and ``Trim``.
#. Create a ``TransformDecorator`` base and wrap the two transforms into a chain.
#. Add an ``Observer`` that counts how many times the pipeline is invoked.
#. Use a ``CommandHistory`` to record and undo pipeline invocations on a string
   buffer.
#. Write a factory function that builds the pipeline from a ``std::vector<std::string>``
   of transform names (e.g., ``{"trim", "upper"}``).

What You Will Build
--------------------

A composable text-processing pipeline demonstrating Factory (pipeline builder),
Decorator (transform chain), Observer (invocation counter), and Command (undo
history) working together in under 150 lines of modern C++.

Suggested Study Order
----------------------

#. Read the Motivation section and the GoF overview table — 10 min.
#. Study Factory Method with the registry example, reproduce it — 20 min.
#. Study Observer (``std::function`` version), compare to the GoF virtual version — 15 min.
#. Study Strategy (template and runtime versions) — 15 min.
#. Study Decorator (``unique_ptr`` chain and functional version) — 20 min.
#. Study Command (lambda pair with undo) — 15 min.
#. Read ``pitfalls.rst`` in full — 20 min.
#. Complete the hands-on task — 35 min.

Build and Run
--------------

.. code-block:: bash

  cd Day-17-Design-Patterns-OOP
  cmake -S . -B build -DCMAKE_CXX_STANDARD=20
  cmake --build build
  ./build/patterns_demo

Related Days
-------------

* **Day 16** — Modules: package each pattern in its own module interface unit
  to practice the module system and pattern isolation together.
* **Day 18** — SOLID Principles: every pattern here exemplifies one or more
  SOLID principles; study them side-by-side.
* **Day 20** — CRTP: the compile-time alternative to virtual Observer and
  Strategy; eliminates dynamic dispatch entirely.
* **Day 21** — Type Erasure: ``std::function`` used in Observer/Strategy/Command
  is itself a form of type erasure — Day 21 deepens that understanding.
