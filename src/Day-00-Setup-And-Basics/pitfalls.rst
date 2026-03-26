Pitfalls — Day 00: Setup and Basics
====================================

Pitfall 1: Ignoring Compiler Warnings
--------------------------------------

**Description:** Treating compiler warnings as optional noise and shipping code with ``-Wall``
output suppressed. Warnings are the compiler telling you that your code has a high probability of
being wrong.

**BAD code:**

.. code-block:: cpp

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

**Why it fails:** ``result`` is uninitialised when ``x <= 0``. With optimisations enabled the
compiler is permitted to assume this path is never taken, which can produce completely unexpected
machine code. Without ``-Wall`` you receive no warning.

**GOOD code:**

.. code-block:: cpp

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

**Detection tip:** Add ``-Wall -Wextra -Werror`` to every target in your CMakeLists.txt.
The build will fail rather than silently produce a potentially dangerous binary.


Pitfall 2: In-Source Builds
----------------------------

**Description:** Running ``cmake .`` from the project root generates build artefacts (Makefiles,
object files, the executable) directly inside the source tree, contaminating version control.

**BAD:**

.. code-block:: bash

    cd my_project
    cmake .          # pollutes source tree with CMakeFiles/, CMakeCache.txt, Makefile
    make

After this, ``git status`` shows dozens of generated files. You now need to ``gitignore`` them
manually and your source tree is harder to navigate.

**Why it fails:** CMake generates many files during configuration. Mixing them with source files
makes it hard to distinguish generated from hand-written code, makes ``git clean`` dangerous, and
breaks many editor integrations that expect a clean source tree.

**GOOD:**

.. code-block:: bash

    cmake -S . -B build          # configure into a separate build/ directory
    cmake --build build          # compile there
    # Source tree stays clean; build/ can be gitignored with a single line

**Detection tip:** Add ``build/`` to ``.gitignore``. If you see ``CMakeCache.txt`` in the same
directory as ``CMakeLists.txt``, you have an in-source build. Delete it with
``git clean -fdx`` and reconfigure out-of-source.


Pitfall 3: Missing ``CMAKE_CXX_STANDARD_REQUIRED``
----------------------------------------------------

**Description:** Setting ``CMAKE_CXX_STANDARD`` without ``CMAKE_CXX_STANDARD_REQUIRED ON``
allows CMake to silently fall back to an older standard when the compiler does not support the
requested one.

**BAD:**

.. code-block:: cmake

    set(CMAKE_CXX_STANDARD 20)
    # No CMAKE_CXX_STANDARD_REQUIRED — silent fallback to C++17, C++14, ...

**Why it fails:** On an older compiler, CMake silently compiles with C++14. Your C++20 features
(concepts, ranges, ``std::span``) cause cryptic compiler errors rather than a clear "C++20 not
supported" message.

**GOOD:**

.. code-block:: cmake

    set(CMAKE_CXX_STANDARD 20)
    set(CMAKE_CXX_STANDARD_REQUIRED ON)
    set(CMAKE_CXX_EXTENSIONS OFF)   # also disable GNU extensions for portability

**Detection tip:** After configuring, run ``cmake --build build 2>&1 | head -5``. If you see
a C++ standard error, the required flag is doing its job. Without it you would get a silent
degradation.


Pitfall 4: Using ``std::endl`` in Performance-Sensitive Code
-------------------------------------------------------------

**Description:** Reflexively writing ``std::endl`` instead of ``'\n'``. Every call to
``std::endl`` flushes the underlying output buffer, which is a system call.

**BAD:**

.. code-block:: cpp

    #include <iostream>
    #include <vector>

    void print_log(const std::vector<std::string>& messages) {
        for (const auto& msg : messages) {
            std::cout << msg << std::endl;  // flushes on every iteration
        }
    }

**Why it fails:** With 100,000 messages, this issues 100,000 ``write()`` system calls. The same
loop with ``'\n'`` issues a handful, because the I/O library buffers output and writes in large
chunks. Benchmarks commonly show a 50–200x slowdown.

**GOOD:**

.. code-block:: cpp

    #include <iostream>
    #include <vector>

    void print_log(const std::vector<std::string>& messages) {
        for (const auto& msg : messages) {
            std::cout << msg << '\n';   // buffered — fast
        }
        // Buffer flushed automatically at program exit or when it fills
    }

**Detection tip:** Search for ``endl`` in your codebase with ``grep -rn 'endl' src/``. Replace
all occurrences with ``'\n'`` unless you explicitly need to flush (e.g., before reading user input
or before a crash-prone operation where you want to ensure output is visible).


Pitfall 5: Not Enabling Sanitisers in Debug Builds
---------------------------------------------------

**Description:** Developing without ``-fsanitize=address,undefined``, then wondering why the
Release build behaves differently or crashes in production.

**BAD:**

.. code-block:: cmake

    # CMakeLists.txt — no sanitiser flags
    add_executable(app main.cpp)
    target_compile_options(app PRIVATE -g -O0)

.. code-block:: cpp

    // main.cpp — contains a subtle out-of-bounds write
    #include <vector>
    int main() {
        std::vector<int> v(5);
        v[5] = 42;   // one past the end — silent corruption without ASan
    }

**Why it fails:** Without ASan, the out-of-bounds write silently corrupts adjacent memory. The
bug may only manifest as a crash much later, in unrelated code, making it extremely hard to
diagnose.

**GOOD:**

.. code-block:: cmake

    if(CMAKE_BUILD_TYPE STREQUAL "Debug")
        target_compile_options(app PRIVATE -g -O0 -fsanitize=address,undefined)
        target_link_options(app PRIVATE -fsanitize=address,undefined)
    endif()

Running the same binary now produces:
``AddressSanitizer: heap-buffer-overflow ... at vector index 5``

**Detection tip:** Add a CI step that builds in Debug with sanitisers and runs the test suite.
Any sanitiser error fails the build.


Pitfall 6: ``using namespace std;`` in Headers
-----------------------------------------------

**Description:** Placing ``using namespace std;`` at file scope in a header file. This injects
the entire ``std`` namespace into every translation unit that includes that header.

**BAD:**

.. code-block:: cpp

    // utils.hpp
    #pragma once
    #include <string>
    using namespace std;   // poisons every includer

    string greet(const string& name);  // looks clean but silently pollutes callers

**Why it fails:** A caller's code may have its own ``swap``, ``min``, or ``sort`` that now
conflicts with ``std::swap``, ``std::min``, or ``std::sort``. The conflict may produce subtle
overload resolution surprises rather than a clear error.

**GOOD:**

.. code-block:: cpp

    // utils.hpp
    #pragma once
    #include <string>

    // Always qualify: std::string, not string
    std::string greet(const std::string& name);

    // In .cpp files only (not headers), a using declaration for specific names is acceptable:
    // using std::string;   // limits scope to this translation unit

**Detection tip:** ``clang-tidy`` check ``google-build-using-namespace`` flags ``using namespace``
at file scope. Enable it in ``.clang-tidy`` to catch this automatically.
