# Day 16: C++20 Modules Basics

## Why This Day Matters

For 50 years C++ relied on a textual inclusion model inherited from C. Every `#include` directive pastes the entire contents of a header file into the translation unit, causing repeated parsing, macro pollution, order-sensitive fragility, and slow incremental builds. C++20 modules address all four issues with a new compilation model: a module is compiled **once** into a Binary Module Interface (BMI), and importers consume the BMI rather than re-parsing source text.

## Learning Outcomes

By the end of this day you will be able to:

* Write a module interface unit with `export module` and distinguish exported from non-exported symbols.
* Split a module into implementation units and partitions and explain when each is appropriate.
* Describe how the Binary Module Interface (BMI) eliminates repeated parsing and macro leakage.
* Configure a CMake 3.28 project to build and consume a named C++20 module.
* Apply the global module fragment pattern to safely include macro-dependent legacy C headers inside a module.
* Explain the difference between header units and named modules and choose the right migration strategy for a mixed codebase.

## Key Concepts

* **Module interface unit** — the `.cppm` file that carries `export module` and defines the public API of a module.
* **Binary Module Interface (BMI)** — the compiler-generated semantic snapshot consumed by importers instead of re-parsing source text.
* **Module partition** — a sub-file of a module (`module name:part`) that is internal to the module and re-exported through the primary interface.
* **Global module fragment** — the `module;` region before `export module` where legacy `#include` directives and macros live without escaping.
* **Header unit** — a transitional feature that compiles a legacy header into a BMI, preserving macro semantics for gradual migration.
* **`import std;`** — C++23 feature importing the entire standard library as a module for maximum build-speed gains.

## Theory

### Motivation — Why Modules Exist

For 50 years C++ relied on a textual inclusion model inherited from C. Every `#include` directive pastes the entire contents of a header file into the translation unit, causing:

* **Repeated parsing** — `<vector>` may be parsed thousands of times across a large project, once per translation unit that includes it.
* **Macro pollution** — any `#define` in any included file leaks into all subsequent code in that translation unit.
* **Order-sensitive fragility** — `#pragma once` and include guards help but don't eliminate ODR violations when the same symbol is defined differently in different translation units.
* **Slow incremental builds** — a one-line change to a widely-included header triggers a cascade recompilation across the whole project.

C++20 modules address all four issues with a new compilation model: a module is compiled **once** into a Binary Module Interface (BMI), and importers consume the BMI rather than re-parsing source text.

### The Textual Model vs The Module Model

```
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
```

The BMI captures the *semantic* interface, not the textual form. Macros defined inside a module do **not** escape the module boundary — they are a preprocessor concept that is not stored in the semantic representation.

### Module Interface Units

A **module interface unit** declares the module name with `export module` and marks exported declarations with `export`. The file extension varies by toolchain: `.cppm` (Clang/CMake), `.ixx` (MSVC), or plain `.cpp` with build-system flags.

```cpp
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
```

Consuming the module from another translation unit:

```cpp
// main.cpp
import math;               // import the compiled BMI — not source text
#include <iostream>        // legacy header still works alongside modules

int main() {
    std::cout << add(3, 4)    << '\n';   // 7
    std::cout << square(2.5)  << '\n';   // 6.25
    std::cout << clamp(15, 0, 10) << '\n'; // 10
    // clamp_impl(…)  ← compile error: not exported
}
```

Key rules:

* `export module <name>;` must appear **before** any other declarations.
* Only one interface unit per named module (unless you use partitions).
* `export` can precede a single declaration, a definition, or a braced `export { }` block to export multiple names at once.

#### Export Blocks — Grouping Multiple Symbols

```cpp
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
```

### Module Implementation Units

Large modules can split interface from implementation to keep the interface unit concise. An **implementation unit** uses `module <name>;` (no `export` keyword).

```cpp
// geometry_impl.cpp
module geometry;          // implementation unit — contributes to same module

#include <cmath>          // this include does NOT escape to importers
#include <numbers>        // C++20 math constants

double area(Circle c) {
    return std::numbers::pi * c.radius * c.radius;
}
```

The implementation unit sees all declarations from the interface unit without an explicit import. Consumers of the module only ever need the BMI from the interface unit — the implementation unit is completely hidden.

### Module Partitions

Partitions let you break a large module into sub-files that remain logically part of the same named module. Partitions are **not** independently importable from outside the module; they must be re-exported through the primary interface unit.

```cpp
// shapes:circle.cppm   — interface partition (colon syntax)
export module shapes:circle;

export struct Circle {
    double cx, cy, radius;
    double area() const;
};
```

```cpp
// shapes:rectangle.cppm — another interface partition
export module shapes:rectangle;

export struct Rectangle {
    double x, y, width, height;
    double area() const;
};
```

```cpp
// shapes.cppm — primary interface unit re-exports both partitions
export module shapes;

export import :circle;      // re-export circle partition to consumers
export import :rectangle;   // re-export rectangle partition to consumers
```

```
Partition layout (viewed from outside)
───────────────────────────────────────
                       shapes.cppm
                      /            \
    shapes:circle.cppm          shapes:rectangle.cppm

External consumer:
  import shapes;    // sees Circle AND Rectangle
  import shapes:circle;  // ERROR — partitions are internal
```

### Header Units — Incremental Migration Path

Header units compile a legacy header into a BMI so you can `import` it with angle-bracket or quoted syntax. They are transitional, not a full replacement:

```cpp
// With header units enabled in the build system:
import <vector>;
import <string>;
import "my_legacy_api.h";   // quoted header unit

int main() {
    std::vector<std::string> names{"Alice", "Bob"};
}
```

Important differences from named modules:

* Macros **do** escape from header units (unlike named modules).
* Not all standard library headers behave well as header units on every compiler yet (as of early 2025).
* Header units are useful during migration but should not be the end goal.

### Import std — The Standard Library Module

C++23 standardises `import std;` and `import std.compat;` which compile the entire standard library as a module, giving the biggest build-speed wins:

```cpp
import std;          // entire standard library as a module

int main() {
    std::println("Hello from modules!");   // C++23 std::println
    std::vector<int> v{3, 1, 4, 1, 5, 9};
    std::ranges::sort(v);
    for (int x : v) std::print("{} ", x);
}
```

`import std.compat;` additionally exports the C compatibility names (`::printf`, `::strlen`, etc.) in the global namespace.

### Modules vs Headers — Design Tradeoff Summary

| Property                  | `#include`     | `import`           |
|---------------------------|----------------|--------------------|
| Macro leakage             | Yes            | No                 |
| Repeated parsing          | Yes (once/TU)  | No (BMI cached)    |
| ODR violation risk        | High           | Low                |
| Build speed               | Slow (large TUs)| Fast (BMI reuse)  |
| Order dependence          | Yes            | No                 |
| Tooling maturity (2025)   | Excellent      | Good, improving fast|
| Legacy interop            | Native         | Via header units   |

### CMake Module Support

CMake 3.28+ has first-class module support. It auto-scans sources for `export module` declarations and orders compilation accordingly.

```cmake
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
```

### Interoperability Patterns

**Pattern 1 — Wrapping a legacy C library:**

```cpp
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
```

**Pattern 2 — Global module fragment for macro-dependent headers:**

When a header relies on macros that must appear before the module declaration:

```cpp
module;                       // opens the global module fragment
#define WIN32_LEAN_AND_MEAN   // macro stays inside fragment
#include <windows.h>          // header parsed here, not visible to importers

export module win_utils;      // module interface starts here — clean slate

export void show_window(const char* title);
```

The `module;` line (no name) opens a region where `#include` and `#define` live. Everything in the fragment is invisible outside the module.

### Ownership and Visibility Model

```
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
```

### Modern C++ Approach Summary

1. Prefer `export module` over `#pragma once` for **new** code.
2. Use **partitions** to split large modules without exposing internal structure to external consumers.
3. Use the **global module fragment** to tame legacy C headers that rely on macros being set before inclusion.
4. Use `import std;` when your toolchain supports it for maximum build speed.
5. In mixed codebases, migrate module-by-module — legacy `#include` TUs can still `import` modules, and modules can include legacy headers via the global module fragment or header units.

## Pitfalls

### Pitfall 1 — Putting `#include` After `export module`

**Problem:** Including a legacy header after the module declaration causes the header's macros and declarations to be treated as part of the module interface, potentially polluting importers and triggering ODR issues.

**BAD:**

```cpp
export module logger;

#include <cstdio>          // WRONG — included inside the module interface
#include "platform_defs.h" // macros from this header now affect importers

export void log(const char* msg) { std::printf("%s\n", msg); }
```

**Why it fails:** Any `#define` in `platform_defs.h` silently leaks into every translation unit that does `import logger;`. The standard says macros do not escape modules, but `#include` after `export module` is still parsed as text and its macros are visible within the same translation unit during compilation — leading to confusing, non-portable behaviour.

**GOOD:**

```cpp
module;                    // global module fragment — macros stay here
#include <cstdio>
#include "platform_defs.h"

export module logger;      // clean module interface starts here

export void log(const char* msg) { std::printf("%s\n", msg); }
```

**Detection tip:** Enable `-Winclude-after-module` (Clang) or equivalent. Review any `#include` that appears after an `export module` declaration.

### Pitfall 2 — Exporting a `using namespace` Declaration

**Problem:** Re-exporting an entire namespace with `export using namespace` forces all names from that namespace onto every importer, recreating the worst problem of `using namespace std;` in headers.

**BAD:**

```cpp
export module utils;

export using namespace std;   // WRONG — dumps entire std into importers

export void process(vector<int>& v);   // OK syntactically but terrible
```

**Why it fails:** Any file that does `import utils;` now has every standard library name injected into its global namespace, causing ambiguity errors and defeating the purpose of qualified names.

**GOOD:**

```cpp
export module utils;

import std;   // or #include <vector> in global module fragment

export void process(std::vector<int>& v);   // use qualified names
```

**Detection tip:** Search your module interface units for `export using namespace` — it is almost always a mistake.

### Pitfall 3 — Missing `export` on a Type Used in an Exported Function

**Problem:** Exporting a function that references a non-exported type. Importers can call the function but cannot name or construct the type.

**BAD:**

```cpp
export module shapes;

struct Point { double x, y; };       // NOT exported — internal

export double distance(Point a, Point b);   // exported, but Point isn't
```

**Why it fails:** A caller does `import shapes; Point p{1,2};` and gets a compile error because `Point` is not part of the exported interface. The function declaration is reachable but unusable without the type.

**GOOD:**

```cpp
export module shapes;

export struct Point { double x, y; };       // exported with the function

export double distance(Point a, Point b) {
    auto dx = a.x - b.x, dy = a.y - b.y;
    return std::sqrt(dx*dx + dy*dy);
}
```

**Detection tip:** Compile a small consumer TU that uses every exported function and verify it can also construct all parameter/return types directly.

### Pitfall 4 — Forgetting That Module Partitions Cannot Be Imported Externally

**Problem:** Treating a module partition like a sub-module that external code can import directly.

**BAD:**

```cpp
// consumer.cpp
import shapes:circle;   // WRONG — partitions are internal to their module

int main() {
    Circle c{{0,0}, 1.0};
}
```

**Why it fails:** Module partitions (`module shapes:circle`) are only importable from within the `shapes` module itself using `import :circle;` (no module name prefix). External consumers must import the primary module.

**GOOD:**

```cpp
// shapes.cppm — primary interface re-exports all partitions
export module shapes;
export import :circle;
export import :rectangle;

// consumer.cpp
import shapes;    // correct — sees everything re-exported by the primary

int main() {
    Circle c{{0,0}, 1.0};
}
```

**Detection tip:** The error message usually says "cannot import partition from outside its module." Check that all consumer code imports the primary module name, not the colon-partition syntax.

### Pitfall 5 — Redefining the Same Module Name in Two Interface Units

**Problem:** Two `.cppm` files both declare `export module foo;`, creating two competing interface units for the same module.

**BAD:**

```cpp
// foo_a.cppm
export module foo;
export int alpha();

// foo_b.cppm
export module foo;      // WRONG — second interface unit for module foo
export int beta();
```

**Why it fails:** A named module can have exactly one interface unit. The linker or module scanner will report a duplicate module name error.

**GOOD:** Either merge into one interface unit, use partitions, or use implementation units:

```cpp
// foo.cppm — single interface unit
export module foo;
export int alpha();
export int beta();

// foo_impl.cpp — implementation unit (no export keyword)
module foo;
int alpha() { return 1; }
int beta()  { return 2; }
```

**Detection tip:** Build system module-dependency scanners (CMake 3.28) will report this immediately. Keep a one-to-one mapping: one module name, one interface `.cppm` file.

### Pitfall 6 — Using Modules With an Incompatible CMake Version

**Problem:** Adding module source files to a CMake project that predates 3.28, then wondering why the build either fails silently or requires manual flags.

**BAD:**

```cmake
cmake_minimum_required(VERSION 3.25)   # too old for native module support
add_executable(app main.cpp math.cppm) # cppm treated as ordinary source
```

**Why it fails:** CMake < 3.28 does not scan for module dependencies. The build may partially work (Ninja with `-fmodule-file=` set manually) but lacks automatic dependency tracking — a change to `math.cppm` won't trigger recompilation of all importers.

**GOOD:**

```cmake
cmake_minimum_required(VERSION 3.28)
project(App CXX)
set(CMAKE_CXX_STANDARD 20)

add_executable(app main.cpp)
target_sources(app
  PRIVATE
    FILE_SET CXX_MODULES FILES math.cppm
)
```

**Detection tip:** Check the CMake version with `cmake --version`. If you must support older CMake, use the `CMakeDependentOption` or a prebuilt BMI strategy, but prefer upgrading the build system.

### Pitfall 7 — Assuming Modules Eliminate All ODR Issues

**Problem:** Believing that switching to modules completely removes the risk of One Definition Rule violations.

**BAD assumption:**

```cpp
// Version A: module compiled in Debug build
export module config;
export struct Options { int level = 1; bool verbose = true; };

// Version B: same module in Release build (different struct layout assumed)
export module config;
export struct Options { int level = 1; };   // verbose removed
```

**Why it fails:** Modules prevent the classic textual ODR violation caused by differing headers, but they do not prevent ODR violations that arise from compiling the *same* module with different preprocessor definitions (e.g., `-DNDEBUG` removing a data member). The linker may silently pick one definition and produce wrong behaviour.

**GOOD:** Ensure all translation units that import a module are compiled with the same flags that affect the module's exported type layout. Use `static_assert` guards or versioned module names to catch mismatches.

```cpp
export module config;

export struct Options {
    int level = 1;
    bool verbose = true;
    static_assert(sizeof(Options) == 8, "Recompile all TUs if layout changes");
};
```

**Detection tip:** UBSan with `-fsanitize=undefined` and link-time ODR detection (`-Wodr` on GCC, `/Zc:inline` on MSVC) catch these at build/test time.

## Code Example

```cpp
#include <iostream>
#include <string>

namespace inventory_api {
class Item {
  public:
    Item(std::string name, int qty) : name_(std::move(name)), qty_(qty) {}
    std::string summary() const { return name_ + ":" + std::to_string(qty_); }

  private:
    std::string name_;
    int qty_{};
};
}

int main() {
    inventory_api::Item item{"sensor", 8};
    std::cout << "Day 16 - Modules Basics (API boundary mindset)\n";
    std::cout << item.summary() << "\n";
    return 0;
}
```
