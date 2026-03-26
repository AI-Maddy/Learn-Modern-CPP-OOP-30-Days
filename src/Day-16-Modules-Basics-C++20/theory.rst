C++20 Modules — Replacing the Preprocessor Include Model
=========================================================

Motivation — Why Modules Exist
--------------------------------

For 50 years C++ relied on a textual inclusion model inherited from C.
Every ``#include`` directive pastes the entire contents of a header file into
the translation unit, causing:

* **Repeated parsing** — ``<vector>`` may be parsed thousands of times across a
  large project, once per translation unit that includes it.
* **Macro pollution** — any ``#define`` in any included file leaks into all
  subsequent code in that translation unit.
* **Order-sensitive fragility** — ``#pragma once`` and include guards help but
  don't eliminate ODR violations when the same symbol is defined differently
  in different translation units.
* **Slow incremental builds** — a one-line change to a widely-included header
  triggers a cascade recompilation across the whole project.

C++20 modules address all four issues with a new compilation model: a module is
compiled **once** into a Binary Module Interface (BMI), and importers consume
the BMI rather than re-parsing source text.

The Textual Model vs The Module Model
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

::

  Textual #include model
  ──────────────────────
  header.h ──► paste into TU1 ──► compile ──► obj1
           └──► paste into TU2 ──► compile ──► obj2
  (header parsed N times, macros escape everywhere)

  Module model
  ────────────
  module.cppm ──► compile once ──► module.pcm  (BMI)
                                     ├──► TU1 imports BMI ──► obj1
                                     └──► TU2 imports BMI ──► obj2
  (module source parsed once, macros do not escape)

The BMI captures the *semantic* interface, not the textual form. Macros
defined inside a module do **not** escape the module boundary — they are a
preprocessor concept that is not stored in the semantic representation.

Module Interface Units
-----------------------

A **module interface unit** declares the module name with ``export module`` and
marks exported declarations with ``export``. The file extension varies by
toolchain: ``.cppm`` (Clang/CMake), ``.ixx`` (MSVC), or plain ``.cpp`` with
build-system flags.

.. code-block:: cpp

  // math.cppm
  export module math;          // declares this file as the interface unit

  export int add(int a, int b) { return a + b; }

  export double square(double x) { return x * x; }

  // Internal helper — NOT exported, invisible to importers
  static int clamp_impl(int v, int lo, int hi) {
      return v < lo ? lo : v > hi ? hi : v;
  }

  export int clamp(int v, int lo, int hi) {
      return clamp_impl(v, lo, hi);
  }

Consuming the module from another translation unit:

.. code-block:: cpp

  // main.cpp
  import math;               // import the compiled BMI — not source text
  #include <iostream>        // legacy header still works alongside modules

  int main() {
      std::cout << add(3, 4)    << '\n';   // 7
      std::cout << square(2.5)  << '\n';   // 6.25
      std::cout << clamp(15, 0, 10) << '\n'; // 10
      // clamp_impl(…)  ← compile error: not exported
  }

Key rules:

* ``export module <name>;`` must appear **before** any other declarations.
* Only one interface unit per named module (unless you use partitions).
* ``export`` can precede a single declaration, a definition, or a braced
  ``export { }`` block to export multiple names at once.

Export Blocks — Grouping Multiple Symbols
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

  export module geometry;

  export {
      struct Point   { double x, y; };
      struct Circle  { Point centre; double radius; };
      double area(Circle c);
  }

  // Implementation can live in the same file or in a separate impl unit
  double area(Circle c) {
      return 3.14159265358979 * c.radius * c.radius;
  }

Module Implementation Units
-----------------------------

Large modules can split interface from implementation to keep the interface
unit concise. An **implementation unit** uses ``module <name>;`` (no
``export`` keyword).

.. code-block:: cpp

  // geometry_impl.cpp
  module geometry;          // implementation unit — contributes to same module

  #include <cmath>          // this include does NOT escape to importers
  #include <numbers>        // C++20 math constants

  double area(Circle c) {
      return std::numbers::pi * c.radius * c.radius;
  }

The implementation unit sees all declarations from the interface unit without
an explicit import. Consumers of the module only ever need the BMI from the
interface unit — the implementation unit is completely hidden.

Module Partitions
------------------

Partitions let you break a large module into sub-files that remain logically
part of the same named module. Partitions are **not** independently importable
from outside the module; they must be re-exported through the primary
interface unit.

.. code-block:: cpp

  // shapes:circle.cppm   — interface partition (colon syntax)
  export module shapes:circle;

  export struct Circle {
      double cx, cy, radius;
      double area() const;
  };

.. code-block:: cpp

  // shapes:rectangle.cppm — another interface partition
  export module shapes:rectangle;

  export struct Rectangle {
      double x, y, width, height;
      double area() const;
  };

.. code-block:: cpp

  // shapes.cppm — primary interface unit re-exports both partitions
  export module shapes;

  export import :circle;      // re-export circle partition to consumers
  export import :rectangle;   // re-export rectangle partition to consumers

::

  Partition layout (viewed from outside)
  ───────────────────────────────────────
                         shapes.cppm
                        /            \
      shapes:circle.cppm          shapes:rectangle.cppm

  External consumer:
    import shapes;    // sees Circle AND Rectangle
    import shapes:circle;  // ERROR — partitions are internal

Header Units — Incremental Migration Path
------------------------------------------

Header units compile a legacy header into a BMI so you can ``import`` it with
angle-bracket or quoted syntax. They are transitional, not a full replacement:

.. code-block:: cpp

  // With header units enabled in the build system:
  import <vector>;
  import <string>;
  import "my_legacy_api.h";   // quoted header unit

  int main() {
      std::vector<std::string> names{"Alice", "Bob"};
  }

Important differences from named modules:

* Macros **do** escape from header units (unlike named modules).
* Not all standard library headers behave well as header units on every
  compiler yet (as of early 2025).
* Header units are useful during migration but should not be the end goal.

Import std — The Standard Library Module
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

C++23 standardises ``import std;`` and ``import std.compat;`` which compile
the entire standard library as a module, giving the biggest build-speed wins:

.. code-block:: cpp

  import std;          // entire standard library as a module

  int main() {
      std::println("Hello from modules!");   // C++23 std::println
      std::vector<int> v{3, 1, 4, 1, 5, 9};
      std::ranges::sort(v);
      for (int x : v) std::print("{} ", x);
  }

``import std.compat;`` additionally exports the C compatibility names
(``::printf``, ``::strlen``, etc.) in the global namespace.

Modules vs Headers — Design Tradeoff Summary
---------------------------------------------

+---------------------------+------------------+----------------------+
| Property                  | ``#include``     | ``import``           |
+===========================+==================+======================+
| Macro leakage             | Yes              | No                   |
+---------------------------+------------------+----------------------+
| Repeated parsing          | Yes (once/TU)    | No (BMI cached)      |
+---------------------------+------------------+----------------------+
| ODR violation risk        | High             | Low                  |
+---------------------------+------------------+----------------------+
| Build speed               | Slow (large TUs) | Fast (BMI reuse)     |
+---------------------------+------------------+----------------------+
| Order dependence          | Yes              | No                   |
+---------------------------+------------------+----------------------+
| Tooling maturity (2025)   | Excellent        | Good, improving fast |
+---------------------------+------------------+----------------------+
| Legacy interop            | Native           | Via header units     |
+---------------------------+------------------+----------------------+

CMake Module Support
---------------------

CMake 3.28+ has first-class module support. It auto-scans sources for
``export module`` declarations and orders compilation accordingly.

.. code-block:: cmake

  cmake_minimum_required(VERSION 3.28)
  project(ModuleDemo CXX)
  set(CMAKE_CXX_STANDARD 20)
  set(CMAKE_CXX_SCAN_FOR_MODULES ON)     # enabled by default in 3.28

  add_library(math_lib)
  target_sources(math_lib
    PUBLIC
      FILE_SET CXX_MODULES FILES
        src/math.cppm          # interface unit
        src/math_impl.cpp      # implementation unit
  )

  add_executable(app main.cpp)
  target_link_libraries(app PRIVATE math_lib)

CMake automatically:

* detects which files are module interface units vs implementation units,
* derives the BMI build order so that interfaces are compiled before importers,
* passes the correct ``-fmodule-file=`` (Clang) or ``/reference`` (MSVC) flags.

Interoperability Patterns
--------------------------

**Pattern 1 — Wrapping a legacy C library:**

.. code-block:: cpp

  // c_wrapper.cppm
  export module c_wrapper;

  // Include the C header INSIDE the module — it does not escape to importers
  extern "C" {
  #include <zlib.h>
  }

  export class ZStream {
      z_stream strm_{};
  public:
      ZStream()  { deflateInit(&strm_, Z_DEFAULT_COMPRESSION); }
      ~ZStream() { deflateEnd(&strm_); }
      // ... compress() wrapping deflate()
  };

**Pattern 2 — Global module fragment for macro-dependent headers:**

When a header relies on macros that must appear before the module declaration:

.. code-block:: cpp

  module;                       // opens the global module fragment
  #define WIN32_LEAN_AND_MEAN   // macro stays inside fragment
  #include <windows.h>          // header parsed here, not visible to importers

  export module win_utils;      // module interface starts here — clean slate

  export void show_window(const char* title);

The ``module;`` line (no name) opens a region where ``#include`` and
``#define`` live. Everything in the fragment is invisible outside the module.

Ownership and Visibility Model
--------------------------------

::

  Module boundary (conceptual)
  ┌──────────────────────────────────────────┐
  │  export int foo();         ← visible     │
  │  int bar();                ← invisible   │
  │  static int impl_detail(); ← invisible   │
  │  #define INTERNAL_MACRO 42 ← invisible   │
  └──────────────────────────────────────────┘
            ↕ BMI (only exported symbols cross the boundary)
  ┌──────────────────────┐
  │  import mymodule;    │
  │  foo();   // OK      │
  │  bar();   // error   │
  └──────────────────────┘

When to Use Modules vs When to Avoid Them
------------------------------------------

**Use modules when:**

* Starting a new library or application from scratch.
* Build times are a bottleneck (especially large template-heavy codebases).
* You want guaranteed ABI-neutral interfaces with no macro leakage.
* Your whole team is on CMake 3.28+ and a C++20-capable toolchain.

**Avoid or delay when:**

* The project must support older compilers (GCC < 11, MSVC < 2019 v16.8).
* Third-party dependencies do not yet provide module interface units.
* CI/CD infrastructure does not support module-aware build tools.

Modern C++ Approach Summary
-----------------------------

#. Prefer ``export module`` over ``#pragma once`` for **new** code.
#. Use **partitions** to split large modules without exposing internal structure
   to external consumers.
#. Use the **global module fragment** to tame legacy C headers that rely on
   macros being set before inclusion.
#. Use ``import std;`` when your toolchain supports it for maximum build speed.
#. In mixed codebases, migrate module-by-module — legacy ``#include`` TUs can
   still ``import`` modules, and modules can include legacy headers via the
   global module fragment or header units.

Self-Check Questions
---------------------

**Q1. What is a Binary Module Interface (BMI) and why does it speed up builds?**

A BMI is a pre-compiled, compiler-specific representation of a module's
exported semantic interface. Consumers import the BMI directly instead of
re-parsing source text, so the compiler skips lexing, preprocessing, and
name-lookup phases that ``#include`` forces on every translation unit. The
result is build times that scale with the number of modules, not with the
cumulative size of all transitively included headers.

**Q2. Why don't macros leak out of a named module?**

Named modules are compiled into a semantic (non-textual) representation. Macros
are a preprocessor concept with no semantic meaning; they are not stored in
the BMI. When another translation unit imports the module it receives only the
type information, declarations, and inline definitions — never the macros.

**Q3. When should you use a module partition vs a separate named module?**

Use partitions when the pieces belong to the same logical library and you want
to hide sub-structure from external users (they import the primary interface and
get everything). Use separate named modules when the pieces are independently
reusable, so consumers can ``import`` only what they need and avoid pulling in
unrelated symbols.

**Q4. What is the global module fragment used for?**

It provides a region before ``export module`` where ``#include`` and
``#define`` can live. Everything in the fragment is visible to the module's
own implementation but does not escape to importers. It is the correct way to
use macro-dependent C headers (like ``<windows.h>``) inside a module.

**Q5. How does CMake 3.28 differ from earlier versions in module handling?**

Earlier CMake had no native module awareness; users needed hand-crafted
``depend.make`` files or custom commands. CMake 3.28 scans sources for
``export module`` declarations automatically, derives the topological
compilation order, and passes the right ``-fmodule-file=`` or ``/reference``
flags, making modules as easy to use as ordinary source files.
