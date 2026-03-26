Day 16: C++20 Modules Basics
=============================

Learning Outcomes
------------------

By the end of this day you will be able to:

* Write a module interface unit with ``export module`` and distinguish exported
  from non-exported symbols.
* Split a module into implementation units and partitions and explain when each
  is appropriate.
* Describe how the Binary Module Interface (BMI) eliminates repeated parsing
  and macro leakage.
* Configure a CMake 3.28 project to build and consume a named C++20 module.
* Apply the global module fragment pattern to safely include macro-dependent
  legacy C headers inside a module.
* Explain the difference between header units and named modules and choose the
  right migration strategy for a mixed codebase.

Key Concepts
-------------

* **Module interface unit** — the ``.cppm`` file that carries ``export module``
  and defines the public API of a module.
* **Binary Module Interface (BMI)** — the compiler-generated semantic snapshot
  consumed by importers instead of re-parsing source text.
* **Module partition** — a sub-file of a module (``module name:part``) that is
  internal to the module and re-exported through the primary interface.
* **Global module fragment** — the ``module;`` region before ``export module``
  where legacy ``#include`` directives and macros live without escaping.
* **Header unit** — a transitional feature that compiles a legacy header into a
  BMI, preserving macro semantics for gradual migration.
* **``import std;``** — C++23 feature importing the entire standard library as
  a module for maximum build-speed gains.

Hands-On Task
--------------

Build a small ``geometry`` module:

#. Create ``geometry.cppm`` with two exported structs (``Point``, ``Circle``)
   and an exported ``area()`` function.
#. Create a ``geometry_impl.cpp`` implementation unit that defines ``area()``
   using ``std::numbers::pi``.
#. Create ``main.cpp`` that does ``import geometry;`` and calls ``area()``.
#. Configure ``CMakeLists.txt`` with CMake 3.28 ``FILE_SET CXX_MODULES``.
#. Verify the build succeeds and run the program.
#. Add a second partition ``geometry:point_ops`` with a ``distance()`` function
   and re-export it from the primary interface.

What You Will Build
--------------------

A two-partition ``geometry`` module with a CMake 3.28 build, demonstrating
the full lifecycle: interface unit, implementation unit, partition, and
consumer executable.

Suggested Study Order
----------------------

#. Read ``theory.rst`` sections on motivation and the module model — 20 min.
#. Study the interface unit and export block examples, then write your own — 25 min.
#. Read the implementation unit and partition sections — 15 min.
#. Read the CMake section and set up the build — 20 min.
#. Read ``pitfalls.rst`` and test each pitfall in a throw-away file — 20 min.
#. Complete the hands-on task — 30 min.

Build and Run
--------------

.. code-block:: bash

  cd Day-16-Modules-Basics-C++20
  cmake -S . -B build -DCMAKE_CXX_STANDARD=20
  cmake --build build
  ./build/geometry_demo

Compiler requirements: GCC 14+, Clang 17+, or MSVC 2022 17.4+.
Use Ninja as the generator (``-G Ninja``) for the fastest module-aware builds.

.. code-block:: bash

  cmake -S . -B build -G Ninja -DCMAKE_CXX_STANDARD=20
  ninja -C build

Related Days
-------------

* **Day 15** — ``std::expected`` and error handling without exceptions, useful
  inside module-exported APIs.
* **Day 17** — Design Patterns: the clean module boundaries you create here
  align naturally with pattern-based component decomposition.
* **Day 21** — pImpl and type erasure: combine with modules to create
  ABI-stable, implementation-hiding libraries.
* **Day 29** — Advanced topics where module-aware reflection (C++26) builds on
  the module system introduced here.
