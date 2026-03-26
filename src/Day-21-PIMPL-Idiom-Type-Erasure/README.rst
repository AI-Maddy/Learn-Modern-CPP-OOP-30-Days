Day 21: pImpl Idiom and Type Erasure
======================================

Learning Outcomes
------------------

By the end of this day you will be able to:

* Implement the pImpl idiom with ``std::unique_ptr<Impl>`` and explain why the
  destructor, move constructor, and move assignment must be defined in the
  ``.cpp`` file.
* Explain how pImpl creates a compilation firewall and achieves ABI stability
  in shared libraries.
* Use ``std::function`` and ``std::any`` as standard type-erasing vocabulary
  types and handle type mismatches correctly.
* Implement a custom ``AnyX`` type-erasing wrapper using the
  ``Concept``/``Model<T>`` internal pattern with value semantics via a
  virtual ``clone()`` method.
* Choose between ``std::variant`` (closed-set, stack, zero virtual overhead)
  and custom type erasure (open-set, heap, value semantics) for a given design.
* Write an ``overloaded`` helper and use it with ``std::visit`` to dispatch
  over all variant alternatives.

Key Concepts
-------------

* **pImpl (Pointer to Implementation)** — hides private state behind a
  forward-declared ``struct Impl`` and a ``unique_ptr``; decouples the public
  header from implementation details.
* **Compilation firewall** — changing ``Impl`` does not recompile consumers of
  the public header, since only a pointer (fixed size) is in the header.
* **ABI stability** — binary layout of the public class never changes when
  ``Impl`` changes; shipped libraries remain link-compatible.
* **``std::function<Sig>``** — type-erases any callable matching ``Sig``;
  uses SBO to avoid heap allocation for small lambdas.
* **``std::any``** — type-erases any copyable value; ``any_cast<T>``
  retrieves it with a type check.
* **Custom type erasure** — ``Concept`` virtual interface + ``Model<T>``
  template wraps any type satisfying a conceptual duck-typed interface.
* **``std::variant`` + ``std::visit``** — closed-set sum type; stack-allocated
  and dispatched through a jump table, faster than virtual dispatch.

Hands-On Task
--------------

Build an ABI-stable ``Connection`` library:

#. Create ``connection.hpp`` with only the public interface and a
   ``unique_ptr<Impl>`` member.
#. Add ``TcpImpl`` and ``UnixSocketImpl`` structs in ``connection.cpp``.
#. Add a factory function that creates the right ``Connection`` based on a URI
   string.
#. Implement ``AnyReadable`` — a custom type-erasing wrapper for any type with
   a ``read(std::span<std::byte>)`` method.
#. Write Catch2 tests that substitute a fake ``Impl`` without modifying the
   header.

What You Will Build
--------------------

An ABI-stable ``Connection`` abstraction with a pImpl compilation firewall,
a custom ``AnyReadable`` type-erasing wrapper, and a ``std::variant``-based
message parser demonstrating all three type-hiding techniques in one project.

Suggested Study Order
----------------------

#. Read the Motivation section — understand the ABI problem concretely — 10 min.
#. Study the full pImpl example; compile and break it by inlining the destructor — 20 min.
#. Study ``std::function`` and ``std::any`` usage — 15 min.
#. Read the custom ``AnyDrawable`` type erasure pattern — 20 min.
#. Read the ``std::variant`` + ``overloaded`` section — 15 min.
#. Read ``pitfalls.rst`` — pitfalls 1, 2, and 4 are the most critical — 20 min.
#. Complete the hands-on Connection task — 40 min.

Build and Run
--------------

.. code-block:: bash

  cd Day-21-PIMPL-Idiom-Type-Erasure
  cmake -S . -B build -DCMAKE_CXX_STANDARD=20
  cmake --build build
  ./build/pimpl_demo
  ./build/pimpl_tests

Related Days
-------------

* **Day 16** — Modules: pImpl and modules address the same compilation firewall
  problem from different angles; use both together for maximum encapsulation.
* **Day 13** — Move Semantics: pImpl's move operations rely on ``unique_ptr``
  move semantics; review if move behaviour is unclear.
* **Day 17** — Design Patterns: custom type erasure is the implementation
  technique behind the Strategy pattern's ``std::function`` variant.
* **Day 22** — Performance: understand the SBO threshold for ``std::function``
  and the ``std::variant`` jump-table advantage over vtable dispatch.
