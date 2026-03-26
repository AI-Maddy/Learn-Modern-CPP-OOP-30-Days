Day 23: Modern Features Preview — C++26
=========================================

Learning Outcomes
------------------

By the end of this day you will be able to:

* Describe the purpose of static reflection (P2996): querying type members,
  enumerators, and names at compile time using ``^^T`` and ``[:r:]``.
* Explain how pattern matching with ``inspect`` (P2688) replaces
  ``std::visit`` + ``overloaded`` with readable, exhaustive type dispatch.
* Write C++26 contract annotations (``pre``/``post``) and explain how they
  differ from ``assert()`` in scope, expressiveness, and build-mode control.
* Sketch a ``std::execution`` sender pipeline using ``schedule``, ``then``, and
  ``when_all``, and explain why it is preferable to ``std::future``.
* Use ``std::inplace_vector<T, N>`` for fixed-capacity stack-allocated
  sequences and handle the full-container case with ``try_push_back``.
* Assess each feature's compiler support status and choose the correct
  workaround for production code that must build on stable compilers today.

Key Concepts
-------------

* **Static reflection (P2996)** — compile-time type introspection as first-
  class values; eliminates code generators for serialisation and enum-to-string.
* **Pattern matching (P2688)** — structured multi-way dispatch with
  structural, type, and value patterns in an exhaustiveness-checked ``inspect``
  block.
* **Contracts (P2900)** — ``pre()``/``post()`` annotations on function
  declarations; express caller/callee API contracts at the language level.
* **``std::execution`` (P2300)** — lazy, composable async via senders and
  receivers; structured concurrency with cancellation and three result channels.
* **``std::inplace_vector<T, N>``** — ``std::vector`` interface with fixed
  N-element inline storage; zero heap allocation; ``try_push_back`` for safe
  overflow handling.
* **Merged vs implemented** — "merged into C++26 draft" does not mean compiler
  support exists; always check ``en.cppreference.com`` compiler support tables.

Hands-On Task
--------------

Explore the two features with the best current toolchain support:

#. **Contracts:** Write a ``Matrix`` class whose ``at(row, col)`` method has
   ``pre(row < rows() && col < cols())`` and verify the contract fires on
   out-of-bounds access with GCC 14+ ``-fcontracts``.
#. **``inplace_vector``:** Implement a small event queue using
   ``std::inplace_vector<Event, 64>`` and write ``try_push_back``-based
   overflow handling. Compare ``sizeof`` vs ``std::vector<Event>``.
#. **Bonus exploration:** Compile the ``to_json`` reflection example using
   Clang trunk with ``-freflection`` (use the Compiler Explorer /
   ``godbolt.org`` with the "clang (trunk)" toolchain — no local install
   needed).

What You Will Build
--------------------

A ``Matrix`` with contract-annotated bounds checking, a contract-violation test
harness that logs violations without aborting, and an ``inplace_vector``-backed
event queue with measured zero-allocation overhead versus ``std::vector``.

Suggested Study Order
----------------------

#. Read the Motivation and the stable-vs-experimental table — 10 min.
#. Read the Static Reflection section; trace the ``to_json`` example — 20 min.
#. Read Pattern Matching; compare ``inspect`` to the C++23 ``std::visit`` — 15 min.
#. Read Contracts; write a pre/post annotated function on godbolt — 15 min.
#. Read ``std::execution``; sketch a pipeline diagram — 15 min.
#. Read ``std::inplace_vector``; compare the container table — 10 min.
#. Read ``pitfalls.rst`` — pitfalls 1 and 6 are the most important — 20 min.
#. Complete the hands-on task — 35 min.

Build and Run
--------------

.. code-block:: bash

  # Contracts (GCC 14+):
  cd Day-23-Modern-Features-Preview-C++26
  g++ -std=c++26 -fcontracts main_contracts.cpp -o contracts_demo
  ./contracts_demo

  # inplace_vector (GCC 15+ or Clang 18+):
  g++ -std=c++26 main_ivec.cpp -o ivec_demo
  ./ivec_demo

  # Reflection exploration — use Compiler Explorer (no local install needed):
  # https://godbolt.org → compiler: "clang (trunk)" → flags: -std=c++26 -freflection

Online reflection playground:

.. code-block:: bash

  # stdexec (P2300 reference implementation) — works on C++20:
  git clone https://github.com/NVIDIA/stdexec
  cd stdexec && cmake -S . -B build -DCMAKE_CXX_STANDARD=20
  cmake --build build && ctest --test-dir build

Related Days
-------------

* **Day 16** — Modules: reflection and modules are complementary C++26
  features; reflect over module-exported types for automated tooling.
* **Day 10** — Concepts/Constraints: contracts are the runtime complement to
  concepts' compile-time constraints; design APIs using both together.
* **Day 19** — Testing with Catch2: contracts replace many ``REQUIRE`` guards
  on preconditions; use ``REQUIRE_THROWS`` in tests to verify contract firing.
* **Day 30** — Review and Next Steps: C++26 features are the natural final
  topic linking the course to the frontier of the language.
