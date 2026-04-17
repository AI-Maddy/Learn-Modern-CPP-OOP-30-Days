# C++20 Modules

## Overview

Modules replace the preprocessor-based `#include` model with a language-level
mechanism that provides true encapsulation, faster builds, and eliminates macro
leakage across translation units.  They are the biggest change to the C++
compilation model since the language was standardised.

Key distinctions from headers:

* A module is **compiled once** — the Binary Module Interface (BMI) is reused.
* Macros do **not** leak across module boundaries.
* Order of `import` declarations does not matter.
* The same symbol can be exported by only one module (no ODR duplicates).

## Compilation Pipeline

```text
Source (.cppm / .cpp)
      │
      ▼
Compiler reads module interface
      │
      ▼
Produces BMI (.pcm / .ifc)   ◄── imported by other TUs
      │
      ▼
Produces object file (.o)
      │
      ▼
Linker
```

Without modules the compiler must re-parse every `#include` for every TU.
With modules each interface is parsed **once** and the BMI is memory-mapped.

## Module Interface Unit

The file that `export`s declarations.  Conventionally named `<module>.cppm`
or `<module>-<partition>.cppm`.

```cpp
// math.cppm  ← module interface unit
export module math;          // declares module name

export int add(int a, int b) { return a + b; }

export class Vec2 {
public:
    float x{}, y{};
    Vec2 operator+(Vec2 o) const { return {x+o.x, y+o.y}; }
};

// NOT exported — internal linkage within the module
static float helper(float v) { return v * 2.f; }
```

## Module Implementation Unit

Splits the implementation out of the interface to keep the interface file small
and reduce recompilation when only the body changes.

```cpp
// math-impl.cpp  ← module implementation unit
module math;        // no 'export' keyword here

// Can use everything from math.cppm
int add(int a, int b) { return a + b; }  // definition
```

## Module Partitions

Split a large module into sub-files without exposing the split to consumers.

```cpp
// math:algebra.cppm  ← partition interface
export module math:algebra;
export int multiply(int a, int b);

// math.cppm  ← primary interface re-exports partition
export module math;
export import :algebra;   // re-export partition

// math-algebra.cpp  ← partition implementation
module math:algebra;
int multiply(int a, int b) { return a * b; }
```

## Consuming a Module

```cpp
// main.cpp
import math;          // import, not #include
import <iostream>;    // header unit (see below)

int main() {
    auto v = Vec2{1.f, 2.f} + Vec2{3.f, 4.f};
    std::cout << add(1, 2) << '\n';
}
```

No angle brackets or quotes for named modules.  The compiler locates the BMI
via the build system (CMake, build2, etc.).

## Header Units

A transitional feature — wrap an existing header in a module-like interface
without porting it.

```cpp
import <vector>;       // header unit — std header
import "mylegacy.h";   // header unit — project header
```

Header units are **not** the same as `import std;` (C++23).  They still
process macros, but the result is cached per-TU.

## `import std;` (C++23)

Imports the entire standard library as a single named module — the cleanest
option when the toolchain supports it.

```cpp
import std;   // everything in namespace std available

int main() {
    std::println("Hello, modules!");   // C++23
}
```

## Global Module Fragment

Code that must remain in the preprocessor world (e.g., macros from C headers)
goes in the **global module fragment** before the `module` declaration.

```cpp
module;               // begins global module fragment
#include <cstdio>     // legacy C header — macros stay here
#include <cassert>

export module mylib;  // ends global module fragment, begins named module
export void greet() { std::printf("hello\n"); }
```

## Modules vs Headers — Comparison

| Property | Headers | Modules |
| --- | --- | --- |
| Parsed per TU | Every TU | Once (BMI) |
| Macro leakage | Yes | No |
| ODR violations possible | Yes | Much harder |
| Include-order sensitivity | Yes | No |
| Incremental build speed | Slow | Fast |
| Legacy interop | Trivial | Needs global frag |
| Toolchain maturity (2026) | Universal | MSVC/Clang/GCC |

## CMake Integration (3.28+)

```cmake
cmake_minimum_required(VERSION 3.28)
project(myproject LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_SCAN_FOR_MODULES ON)   # enables module dependency scanning

add_library(math)
target_sources(math
    PUBLIC  FILE_SET CXX_MODULES FILES math.cppm
    PRIVATE math-impl.cpp
)

add_executable(app main.cpp)
target_link_libraries(app PRIVATE math)
```

The `FILE_SET CXX_MODULES` annotation tells CMake which files are module
interfaces so it can order compilation correctly.

## Export Patterns

```cpp
// Export individual declarations
export int    foo();
export class  Bar {};

// Export a block — avoids repeating 'export' on each line
export {
    int baz();
    struct Qux { int x; };
}

// Re-export an imported module
export import :partition_name;
export import someother_module;

// Export a namespace (exports all names in the namespace)
export namespace geom {
    class Point { public: float x, y; };
    float distance(Point a, Point b);
}
```

## Common Pitfalls

**Pitfall 1 — `#include` after `export module`**

```cpp
// BAD — preprocessor runs in named module scope, macros may leak
export module mylib;
#include <cstring>

// GOOD — put legacy includes in global module fragment
module;
#include <cstring>
export module mylib;
```

**Pitfall 2 — exporting `using namespace`**

```cpp
// BAD — pulls everything from std into the consumer's namespace
export module mylib;
export using namespace std;

// GOOD — export only specific names you own or intentionally expose
export module mylib;
export using std::string;
```

**Pitfall 3 — missing export on a type used in an exported function**

```cpp
// BAD — Cfg is reachable but not exported; some compilers warn/error
struct Cfg { int level; };
export void configure(Cfg c);

// GOOD
export struct Cfg { int level; };
export void configure(Cfg c);
```

**Pitfall 4 — CMake version mismatch**

CMake 3.28+ is required for first-class module support.  Check:

```bash
cmake --version   # must be >= 3.28
```

**Pitfall 5 — modules don't eliminate all ODR issues**

Inline functions and templates exported from a module still have definitions
that must be consistent across the program.  Modules prevent *accidental*
duplication via headers; deliberate violations are still UB.

**Pitfall 6 — assuming all compilers handle modules identically**

BMI formats are compiler-specific (.pcm for Clang, .ifc for MSVC).
Cross-compiler module sharing is not possible; each toolchain builds its own BMI.

## Feature-Test Macros

```cpp
#if __has_include(<version>)
#  include <version>
#endif

// GCC, Clang: __cpp_modules >= 201907L
#ifdef __cpp_modules
    // module support confirmed
#endif
```

## Review Checklist

* Does the module interface export only what consumers actually need?
* Are all macro-dependent headers inside the global module fragment?
* Is `export using namespace` avoided?
* Does CMake use `FILE_SET CXX_MODULES` with version >= 3.28?
* Are large modules split into partitions to keep the primary interface readable?
* Are internal helpers non-exported (`static` or left in implementation unit)?
* Is `import std;` preferred over `import <iostream>` where C++23 is available?
* Has the build been tested on all target compilers (MSVC/Clang/GCC may differ)?

## Related Paths

* Related cheatsheets: `modern-cpp20-23-cheat.rst`, `cpp-core-guidelines.rst`
