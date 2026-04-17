# Day 00: Setup and Basics

## Why This Day Matters

Every productive C++ session starts with a reproducible build, clean warnings, and automatic style
enforcement. This day installs that foundation so that all subsequent days compile, analyse, and
run correctly from the first keystroke.

## Learning Outcomes

By the end of this day you will be able to:

* Configure a CMake project with `-std=c++20`, `-Wall`, `-Wextra`, and `-Werror`.
* Explain all five stages of the C++ compilation pipeline and identify which stage produced a
  given error message.
* Run `clang-format` and `clang-tidy` on a file and interpret their output.
* Enable AddressSanitizer and UBSan for a Debug build and recognise sanitiser output.
* Explain why `'\n'` is preferred over `std::endl` and when flushing is actually needed.

## Key Concepts

* **Compilation pipeline** — preprocessor, compiler, assembler, linker, each producing distinct
  error classes.
* **CMake out-of-source build** — keeps the source tree clean; a single `-B build` flag suffices.
* **Warning flags** — `-Wall -Wextra -Wpedantic -Werror` form a minimum safety net for all code.
* **clang-format** — eliminates style discussions by enforcing a machine-defined layout on save.
* **clang-tidy** — semantic static analysis that catches bug-prone patterns the compiler ignores.
* **Sanitisers** — runtime instrumentation (ASan, UBSan) that turns silent UB into actionable
  error reports.

## Theory

### Why This Day Matters

Before writing a single meaningful line of C++, you need a reliable foundation: a working
toolchain, a build system you understand, and automated quality gates that catch problems before
they reach review. Skipping this setup leads to "works on my machine" bugs, silent undefined
behaviour from missing warning flags, and style drift that makes code reviews painful.

This day gives you a professional-grade C++ workspace that will serve every subsequent day of the
course. Invest the time here — it pays compound interest for thirty days.

### The C++ Compilation Pipeline

Understanding what actually happens when you type `g++ main.cpp` demystifies linker errors,
header include-order problems, and optimisation flags.

```
Source (.cpp)
     |
     v
[ Preprocessor ]   -- expands #include, #define, #ifdef
     |
     v
Translation Unit (.ii)
     |
     v
[ Compiler ]       -- parses C++, performs semantic analysis, generates IR
     |
     v
Object File (.o)
     |
     v
[ Linker ]         -- resolves symbols across translation units, produces executable
     |
     v
Executable (a.out / your_binary)
```

Each stage produces distinct error messages. A "undefined reference to" error is a **linker**
error, not a compiler error. Recognising the stage helps you fix issues faster.

#### Preprocessor Pass

The preprocessor runs before any parsing. It performs textual substitution and file inclusion.

```cpp
// main.cpp — before preprocessing
#include <iostream>
#define GREETING "Hello"

int main() {
    std::cout << GREETING << '\n';
}

// After preprocessing, the compiler sees the entire <iostream> content
// pasted in, and every occurrence of GREETING replaced with "Hello".
// Inspect the output yourself:
//   g++ -E main.cpp -o main.ii
```

### Compiler Flags That Matter

Flags are not optional polish — they are safety nets. The following set is the default for every
project in this course.

```cmake
# CMakeLists.txt — project-wide compile options
add_compile_options(
    -Wall             # Enable most common warnings
    -Wextra           # Enable extra warnings that -Wall misses
    -Wpedantic        # Enforce strict ISO compliance
    -Werror           # Treat warnings as errors — catch issues early
    -Wshadow          # Warn when a local variable shadows an outer one
    -Wnon-virtual-dtor   # Warn on class with virtual functions but non-virtual dtor
    -Wold-style-cast     # Warn on C-style casts; use static_cast/reinterpret_cast
    -Wconversion         # Warn on implicit narrowing conversions
    -Wsign-conversion    # Warn on signed/unsigned mismatch
)
```

Why each flag matters:

* `-Wall` catches uninitialised variables, unused results, mismatched printf formats.
* `-Wextra` adds missing field initialisers, extra semicolons, and more.
* `-Wshadow` prevents subtle bugs where `int x` in a nested scope hides a class member `x`.
* `-Wconversion` is critical: `int x = 3.7;` compiles silently without it, truncating the value.
* `-Werror` makes the build fail on warnings — forcing you to fix issues immediately rather than
  accumulate technical debt.

#### Debug vs Release Builds

```cmake
# Debug: full symbol info, no optimisation, sanitisers enabled
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    add_compile_options(-g -O0)
    add_compile_options(-fsanitize=address,undefined)
    add_link_options(-fsanitize=address,undefined)
endif()

# Release: aggressive optimisation, strip assert() calls
if(CMAKE_BUILD_TYPE STREQUAL "Release")
    add_compile_options(-O2 -DNDEBUG)
endif()
```

Always develop in **Debug** with sanitisers. Ship in **Release**. Never benchmark in Debug.

### CMake: A Minimal but Correct Project

CMake is the de-facto standard build system for C++. It generates native build files (Makefiles,
Ninja, Visual Studio solutions) from a single portable description.

```cmake
cmake_minimum_required(VERSION 3.20)
project(Day00 VERSION 1.0 LANGUAGES CXX)

# Force C++20 globally
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)   # Disable GNU extensions; enforce pure ISO C++

# Export compile commands for clang-tidy and editor integration
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

add_executable(hello main.cpp)

target_compile_options(hello PRIVATE
    -Wall -Wextra -Wpedantic -Wshadow -Wconversion
)
```

`CMAKE_CXX_EXTENSIONS OFF` is important: it prevents GCC from enabling its own extensions
(like `__int128` or variable-length arrays) that make code non-portable.

#### Building the Project

```bash
# Out-of-source build (never build inside the source tree)
cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build

# Run the executable
./build/hello

# Clean build artefacts
cmake --build build --target clean

# Regenerate without wiping the directory
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

### Hello World — Anatomy

A "hello world" is actually a dense lesson in C++ fundamentals.

```cpp
// main.cpp
#include <iostream>   // (1) Includes the I/O stream declarations

int main() {          // (2) Program entry point; returns int to the OS
    std::cout         // (3) Standard output stream object (in namespace std)
        << "Hello, Modern C++!\n";  // (4) Stream insertion operator
                      //     '\n' preferred over std::endl — no flush overhead
    return 0;         // (5) 0 = success; omitting return in main is valid C++11+
}
```

Annotations:

1. `#include` is a preprocessor directive — the entire `<iostream>` file is textually inserted.
2. `main` is the only function the OS knows to call. Its return value is the process exit code.
3. `std::cout` lives in namespace `std`. Never write `using namespace std;` in headers — it
   pollutes every translation unit that includes the header.
4. `<<` is the stream insertion operator, overloaded on `ostream`. Chains left-to-right.
5. `'\n'` is a character literal. `"\n"` is a string literal (carries an extra null byte).
   Prefer `'\n'` for single-character newlines.

### clang-format: Automated Style Enforcement

Manual formatting wastes review time. `clang-format` enforces style automatically and
consistently.

```yaml
# .clang-format — place at repository root
BasedOnStyle: Google
IndentWidth: 4
ColumnLimit: 100
AllowShortFunctionsOnASingleLine: None
SortIncludes: true
IncludeBlocks: Regroup
```

```bash
# Format a single file in-place
clang-format -i main.cpp

# Check without modifying (useful in CI pipelines)
clang-format --dry-run --Werror main.cpp

# Format all .cpp and .hpp files recursively
find . \( -name '*.cpp' -o -name '*.hpp' \) | xargs clang-format -i
```

Integrate with your editor so formatting happens automatically on save. This removes all style
debates from code reviews.

### clang-tidy: Static Analysis

`clang-tidy` performs semantic checks that compilers miss: performance issues, modernisation
opportunities, bug-prone patterns, and readability problems. It reads `compile_commands.json`,
so it understands your exact include paths and compile flags.

```yaml
# .clang-tidy — place at repository root
Checks: >
  clang-analyzer-*,
  cppcoreguidelines-*,
  modernize-*,
  performance-*,
  readability-*,
  bugprone-*,
  -modernize-use-trailing-return-type

WarningsAsErrors: '*'
HeaderFilterRegex: '.*'
```

```bash
# Run on a single file (requires compile_commands.json in build/)
clang-tidy main.cpp -p build/

# Run on all files via the helper script
run-clang-tidy -p build/
```

Key checks to understand:

* `modernize-use-override`: ensures virtual overrides are marked `override`.
* `cppcoreguidelines-avoid-goto`: bans `goto` outside generated code.
* `bugprone-use-after-move`: catches using an object after it has been moved from.
* `performance-unnecessary-copy-initialization`: catches accidental copies of heavy objects.
* `readability-identifier-naming`: enforces a consistent naming convention across the project.

### AddressSanitizer and UBSan

Sanitisers are dynamic analysis tools that detect memory errors and undefined behaviour at runtime
with minimal false positives. They are invaluable during development.

```cpp
// bug.cpp — will be caught by AddressSanitizer at runtime
int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    return arr[10];   // out-of-bounds access: UB, silent without sanitisers
}
```

```bash
g++ -fsanitize=address,undefined -g bug.cpp -o bug
./bug
# Output: runtime error: index 10 out of bounds for type 'int [5]'
#         AddressSanitizer: stack-buffer-overflow on address ...
```

Enable sanitisers for all Debug builds. They add roughly 2x runtime overhead — acceptable during
development, always disabled in Release binaries.

UBSan catches:

* Signed integer overflow (`INT_MAX + 1`)
* Null pointer dereferences
* Misaligned memory access
* Use of uninitialised values

### Modern C++ Philosophy

C++ has evolved dramatically. C++20 is a different language from C++98. The guiding principles
that will appear throughout this course:

* **Zero-overhead abstractions**: high-level code should compile to the same machine instructions
  as the equivalent hand-written low-level code.
* **Resource Acquisition Is Initialization (RAII)**: tie resource lifetimes to object lifetimes.
  No manual `free()`, no manual `unlock()`.
* **Value semantics by default**: prefer stack allocation and value copying over heap allocation
  and pointer indirection.
* **Express intent, not mechanism**: use `std::ranges::transform` rather than a raw index loop
  when the operation is a pure transformation.
* **Type safety**: use `enum class`, `std::variant`, and strong typedefs to prevent confusion
  between values that share the same underlying type but have different meanings.

### Design Tradeoffs

| Choice | Benefit | Cost |
|---|---|---|
| `-Werror` on | Forces clean code | New compiler may add warnings |
| Sanitisers on | Catches UB early | ~2x slower in debug |
| Out-of-source build | Clean source tree | Slightly longer cmake command |
| clang-format | Consistent style | Initial setup and team buy-in |

## Pitfalls

### Pitfall 1: Ignoring Compiler Warnings

**Description:** Treating compiler warnings as optional noise and shipping code with `-Wall`
output suppressed. Warnings are the compiler telling you that your code has a high probability of
being wrong.

**BAD code:**

```cpp
// Compiled with: g++ main.cpp  (no warning flags)
#include <cstdio>

int compute(int x) {
    int result;           // uninitialised — warning suppressed
    if (x > 0)
        result = x * 2;
    return result;        // may return garbage when x <= 0
}

int main() {
    printf("%d\n", compute(-1));  // undefined behaviour: reads uninitialised memory
}
```

**Why it fails:** `result` is uninitialised when `x <= 0`. With optimisations enabled the
compiler is permitted to assume this path is never taken, which can produce completely unexpected
machine code. Without `-Wall` you receive no warning.

**GOOD code:**

```cpp
// Compiled with: g++ -Wall -Wextra -Werror main.cpp
#include <cstdio>

int compute(int x) {
    int result = 0;       // always initialised — or better, use brace init
    if (x > 0)
        result = x * 2;
    return result;
}

int main() {
    printf("%d\n", compute(-1));  // prints 0, defined behaviour
}
```

**Detection tip:** Add `-Wall -Wextra -Werror` to every target in your CMakeLists.txt.
The build will fail rather than silently produce a potentially dangerous binary.

### Pitfall 2: In-Source Builds

**Description:** Running `cmake .` from the project root generates build artefacts (Makefiles,
object files, the executable) directly inside the source tree, contaminating version control.

**BAD:**

```bash
cd my_project
cmake .          # pollutes source tree with CMakeFiles/, CMakeCache.txt, Makefile
make
```

After this, `git status` shows dozens of generated files. You now need to `gitignore` them
manually and your source tree is harder to navigate.

**Why it fails:** CMake generates many files during configuration. Mixing them with source files
makes it hard to distinguish generated from hand-written code, makes `git clean` dangerous, and
breaks many editor integrations that expect a clean source tree.

**GOOD:**

```bash
cmake -S . -B build          # configure into a separate build/ directory
cmake --build build          # compile there
# Source tree stays clean; build/ can be gitignored with a single line
```

**Detection tip:** Add `build/` to `.gitignore`. If you see `CMakeCache.txt` in the same
directory as `CMakeLists.txt`, you have an in-source build. Delete it with
`git clean -fdx` and reconfigure out-of-source.

### Pitfall 3: Missing `CMAKE_CXX_STANDARD_REQUIRED`

**Description:** Setting `CMAKE_CXX_STANDARD` without `CMAKE_CXX_STANDARD_REQUIRED ON`
allows CMake to silently fall back to an older standard when the compiler does not support the
requested one.

**BAD:**

```cmake
set(CMAKE_CXX_STANDARD 20)
# No CMAKE_CXX_STANDARD_REQUIRED — silent fallback to C++17, C++14, ...
```

**Why it fails:** On an older compiler, CMake silently compiles with C++14. Your C++20 features
(concepts, ranges, `std::span`) cause cryptic compiler errors rather than a clear "C++20 not
supported" message.

**GOOD:**

```cmake
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)   # also disable GNU extensions for portability
```

**Detection tip:** After configuring, run `cmake --build build 2>&1 | head -5`. If you see
a C++ standard error, the required flag is doing its job. Without it you would get a silent
degradation.

### Pitfall 4: Using `std::endl` in Performance-Sensitive Code

**Description:** Reflexively writing `std::endl` instead of `'\n'`. Every call to
`std::endl` flushes the underlying output buffer, which is a system call.

**BAD:**

```cpp
#include <iostream>
#include <vector>

void print_log(const std::vector<std::string>& messages) {
    for (const auto& msg : messages) {
        std::cout << msg << std::endl;  // flushes on every iteration
    }
}
```

**Why it fails:** With 100,000 messages, this issues 100,000 `write()` system calls. The same
loop with `'\n'` issues a handful, because the I/O library buffers output and writes in large
chunks. Benchmarks commonly show a 50–200x slowdown.

**GOOD:**

```cpp
#include <iostream>
#include <vector>

void print_log(const std::vector<std::string>& messages) {
    for (const auto& msg : messages) {
        std::cout << msg << '\n';   // buffered — fast
    }
    // Buffer flushed automatically at program exit or when it fills
}
```

**Detection tip:** Search for `endl` in your codebase with `grep -rn 'endl' src/`. Replace
all occurrences with `'\n'` unless you explicitly need to flush (e.g., before reading user input
or before a crash-prone operation where you want to ensure output is visible).

### Pitfall 5: Not Enabling Sanitisers in Debug Builds

**Description:** Developing without `-fsanitize=address,undefined`, then wondering why the
Release build behaves differently or crashes in production.

**BAD:**

```cmake
# CMakeLists.txt — no sanitiser flags
add_executable(app main.cpp)
target_compile_options(app PRIVATE -g -O0)
```

```cpp
// main.cpp — contains a subtle out-of-bounds write
#include <vector>
int main() {
    std::vector<int> v(5);
    v[5] = 42;   // one past the end — silent corruption without ASan
}
```

**Why it fails:** Without ASan, the out-of-bounds write silently corrupts adjacent memory. The
bug may only manifest as a crash much later, in unrelated code, making it extremely hard to
diagnose.

**GOOD:**

```cmake
if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    target_compile_options(app PRIVATE -g -O0 -fsanitize=address,undefined)
    target_link_options(app PRIVATE -fsanitize=address,undefined)
endif()
```

Running the same binary now produces:
`AddressSanitizer: heap-buffer-overflow ... at vector index 5`

**Detection tip:** Add a CI step that builds in Debug with sanitisers and runs the test suite.
Any sanitiser error fails the build.

### Pitfall 6: `using namespace std;` in Headers

**Description:** Placing `using namespace std;` at file scope in a header file. This injects
the entire `std` namespace into every translation unit that includes that header.

**BAD:**

```cpp
// utils.hpp
#pragma once
#include <string>
using namespace std;   // poisons every includer

string greet(const string& name);  // looks clean but silently pollutes callers
```

**Why it fails:** A caller's code may have its own `swap`, `min`, or `sort` that now
conflicts with `std::swap`, `std::min`, or `std::sort`. The conflict may produce subtle
overload resolution surprises rather than a clear error.

**GOOD:**

```cpp
// utils.hpp
#pragma once
#include <string>

// Always qualify: std::string, not string
std::string greet(const std::string& name);

// In .cpp files only (not headers), a using declaration for specific names is acceptable:
// using std::string;   // limits scope to this translation unit
```

**Detection tip:** `clang-tidy` check `google-build-using-namespace` flags `using namespace`
at file scope. Enable it in `.clang-tidy` to catch this automatically.

## Code Example

```cpp
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<int> values{1, 2, 3, 4, 5};
    int sum = std::accumulate(values.begin(), values.end(), 0);
    std::cout << "Day 00 - Setup and Basics\n";
    std::cout << "Values count: " << values.size() << "\n";
    std::cout << "Sum: " << sum << "\n";
    return 0;
}
```
