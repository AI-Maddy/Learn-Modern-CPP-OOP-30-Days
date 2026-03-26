Day 00: Setup and Basics
========================

Why This Day Matters
--------------------

Every productive C++ session starts with a reproducible build, clean warnings, and automatic style
enforcement. This day installs that foundation so that all subsequent days compile, analyse, and
run correctly from the first keystroke.

Learning Outcomes
-----------------

By the end of this day you will be able to:

* Configure a CMake project with ``-std=c++20``, ``-Wall``, ``-Wextra``, and ``-Werror``.
* Explain all five stages of the C++ compilation pipeline and identify which stage produced a
  given error message.
* Run ``clang-format`` and ``clang-tidy`` on a file and interpret their output.
* Enable AddressSanitizer and UBSan for a Debug build and recognise sanitiser output.
* Explain why ``'\n'`` is preferred over ``std::endl`` and when flushing is actually needed.

Key Concepts
------------

* **Compilation pipeline** — preprocessor, compiler, assembler, linker, each producing distinct
  error classes.
* **CMake out-of-source build** — keeps the source tree clean; a single ``-B build`` flag suffices.
* **Warning flags** — ``-Wall -Wextra -Wpedantic -Werror`` form a minimum safety net for all code.
* **clang-format** — eliminates style discussions by enforcing a machine-defined layout on save.
* **clang-tidy** — semantic static analysis that catches bug-prone patterns the compiler ignores.
* **Sanitisers** — runtime instrumentation (ASan, UBSan) that turns silent UB into actionable
  error reports.

Key Files
---------

* ``main.cpp`` — annotated hello-world demonstrating entry point, namespace, and stream I/O.
* ``CMakeLists.txt`` — minimal but correct project with C++20, strict warnings, and sanitisers.
* ``.clang-format`` — Google-based style, 4-space indent, 100-column limit.
* ``.clang-tidy`` — cppcoreguidelines + modernize + bugprone checks.

Hands-On Task
-------------

#. Build the project in Debug mode with sanitisers enabled.
#. Intentionally introduce an out-of-bounds array access and observe the ASan output.
#. Fix the bug, then run ``clang-tidy`` and resolve any warnings it reports.
#. Add a second ``std::cout`` print, run ``clang-format``, and observe what it changes.

What You Will Build
-------------------

A cleanly structured CMake project containing an annotated ``main.cpp`` that compiles with zero
warnings, passes ``clang-tidy``, and produces sanitiser-clean output.

Suggested Study Order
---------------------

#. Read ``theory.rst`` — compilation pipeline section first (~20 min).
#. Open ``CMakeLists.txt`` and trace every line to the theory (~10 min).
#. Build and run ``main.cpp``; inspect the binary with ``file ./build/hello`` (~5 min).
#. Read ``pitfalls.rst`` and reproduce Pitfall 1 deliberately, then fix it (~15 min).
#. Set up ``.clang-format`` and ``.clang-tidy``; run both on ``main.cpp`` (~10 min).

Total estimated time: **60 minutes**.

Build and Run
-------------

.. code-block:: bash

    # Configure (Debug with sanitisers)
    cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug

    # Compile
    cmake --build build

    # Run
    ./build/hello

    # Static analysis
    clang-tidy main.cpp -p build/

    # Auto-format in place
    clang-format -i main.cpp

Related Days
------------

* **Day 01** — Variables and types: builds on the CMake setup introduced here.
* **Day 19** — Testing with Catch2: extends the build system with a test target.
* **Day 22** — Performance tips: explores Release vs Debug build differences in depth.
