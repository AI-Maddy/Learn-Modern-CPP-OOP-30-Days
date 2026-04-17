---
title: "Debugging Tools 2026"
tags: ["cheatsheet", "reference"]
---

# :material-book: Debugging Tools 2026


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Debugging Tools (2026)

<div class="contents" local="" depth="2">

Sections

</div>

## Compiler Warning Flags

Always compile with at least this flag set during development:

``` cmake
target_compile_options(my_target PRIVATE
    -Wall               # standard warnings
    -Wextra             # extra warnings beyond -Wall
    -Wpedantic          # ISO conformance warnings
    -Wshadow            # local variable shadows outer variable
    -Wnon-virtual-dtor  # class with virtual fn but no virtual dtor
    -Wold-style-cast    # C-style (int*)x instead of static_cast<int*>
    -Woverloaded-virtual# overloading instead of overriding a virtual fn
    -Wnull-dereference  # probable null pointer dereference
    -Wdouble-promotion  # float promoted to double silently
    -Wformat=2          # printf format string vulnerabilities
    -Wimplicit-fallthrough  # switch case without break
    -Werror             # treat all warnings as errors in CI
)

# Clang-specific extras:
# -Weverything -Wno-c++98-compat -Wno-padded
```

## AddressSanitizer (ASan)

Detects: heap-use-after-free, heap-buffer-overflow, stack-buffer-overflow, use-after-return, use-after-scope, global-buffer-overflow, initialization-order bugs.

``` cmake
# CMake: add a sanitize build type
option(SANITIZE "Enable sanitizers" OFF)
if(SANITIZE)
    add_compile_options(-fsanitize=address -fno-omit-frame-pointer -g)
    add_link_options(-fsanitize=address)
endif()
```

``` bash
# Build and run:
cmake -S . -B build-asan -DSANITIZE=ON -DCMAKE_BUILD_TYPE=Debug
cmake --build build-asan
ASAN_OPTIONS="detect_leaks=1:halt_on_error=0:log_path=asan.log" \
    ./build-asan/tests

# Key ASAN_OPTIONS:
# detect_leaks=1          — enable leak detection (Linux only with LSan)
# halt_on_error=0         — report all errors, don't stop at first
# check_initialization_order=1 — catch init-order bugs
# detect_stack_use_after_return=1  — expensive but thorough
```

## UndefinedBehaviorSanitizer (UBSan)

Detects: signed integer overflow, null dereference, misaligned access, use of uninitialized bool, VLA bounds violations, invalid enum values.

``` bash
cmake -S . -B build-ubsan \
    -DCMAKE_CXX_FLAGS="-fsanitize=undefined -fno-omit-frame-pointer -g" \
    -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=undefined"
cmake --build build-ubsan && ./build-ubsan/tests

# Individual UBSan checks (can combine):
# -fsanitize=integer    — integer overflow/truncation
# -fsanitize=bounds     — array bounds
# -fsanitize=null       — null pointer dereference
# -fsanitize=alignment  — misaligned pointers
# -fsanitize=vptr       — virtual function call on wrong dynamic type

# Useful env vars:
# UBSAN_OPTIONS="print_stacktrace=1:halt_on_error=1"
```

## ThreadSanitizer (TSan)

Detects data races: two threads accessing the same memory, at least one write, with no synchronisation. Cannot combine with ASan.

``` bash
cmake -S . -B build-tsan \
    -DCMAKE_CXX_FLAGS="-fsanitize=thread -g" \
    -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=thread"
cmake --build build-tsan && ./build-tsan/tests

# TSAN_OPTIONS="second_deadlock_stack=1:history_size=7"

# TSan false positives: annotate known-safe patterns with
# __attribute__((no_sanitize("thread"))) or TSan annotations
```

## MemorySanitizer (MSan)

Detects: use of uninitialised memory (reads from variables never written). Requires ALL linked libraries to also be instrumented — typically needs a custom build of the standard library.

``` bash
cmake -S . -B build-msan \
    -DCMAKE_CXX_FLAGS="-fsanitize=memory -fno-omit-frame-pointer -g" \
    -DCMAKE_EXE_LINKER_FLAGS="-fsanitize=memory"
```

## Sanitizer Combination Guide

| ASan | UBSan | TSan | MSan | Notes                                                 |
|------|-------|------|------|-------------------------------------------------------|
| Yes  | Yes   | No   | No   | Most common dev combination                           |
| No   | No    | Yes  | No   | Thread-safety testing                                 |
| No   | No    | No   | Yes  | Uninitialised memory (needs full instrumented stdlib) |

## Valgrind

``` bash
# Memory error detection (slower than ASan, no recompile needed)
valgrind --tool=memcheck --leak-check=full --show-leak-kinds=all \
         --track-origins=yes --error-exitcode=1 ./myapp

# Heap profiling:
valgrind --tool=massif ./myapp
ms_print massif.out.* | head -60

# Call graph profiling:
valgrind --tool=callgrind ./myapp
kcachegrind callgrind.out.*
```

## GDB Key Commands

``` bash
gdb ./myapp                   # start
gdb --args ./myapp arg1 arg2  # with arguments
gdb --tui ./myapp             # TUI mode (code + gdb side by side)

# Inside gdb:
run                      # start program
run arg1 arg2            # with args
break main               # breakpoint at function
break file.cpp:42        # breakpoint at line
break ClassName::method  # break at member function
condition 3 x > 5        # conditional breakpoint #3
watch x                  # watchpoint: stop when x changes
rwatch x                 # stop when x is read
next  (n)                # step over
step  (s)                # step into
finish                   # run until function returns
continue (c)             # resume
backtrace (bt)           # full stack trace
bt full                  # stack + local variables
frame 2                  # switch to frame #2
info locals              # local variables in current frame
print x                  # print variable
print *ptr               # dereference and print
x/10i $pc                # disassemble 10 instructions at PC
set variable x = 5       # modify variable at runtime
catch throw              # break on any exception throw
catch catch              # break on exception being caught
```

## LLDB Key Commands

``` bash
lldb ./myapp
lldb -- ./myapp arg1 arg2

# Inside lldb (mostly mirrors gdb):
process launch           # run
breakpoint set -n main
breakpoint set -f file.cpp -l 42
thread step-over         # next
thread step-in           # step
thread step-out          # finish
thread backtrace         # bt
frame variable           # info locals
expression x             # print x
expression -l c++ -- (int)x + 1   # evaluate arbitrary expression
```

## clang-tidy Checks for OOP

``` bash
# Run on entire project (compile_commands.json needed):
clang-tidy -p build/ src/**/*.cpp -- -std=c++20

# .clang-tidy configuration:
# Checks: '-*,cppcoreguidelines-*,modernize-*,readability-*,performance-*'
```

Key clang-tidy checks:

| Check                                                                             | What it catches                    |
|-----------------------------------------------------------------------------------|------------------------------------|
| `cppcoreguidelines-pro-type-cstyle-cast`                                          | C-style cast instead of C++ cast   |
| `cppcoreguidelines-virtual-class-destructor`\| Virtual class missing virtual dtor |                                    |
| `modernize-use-override`                                                          | Missing override keyword           |
| `modernize-use-nullptr`                                                           | NULL instead of nullptr            |
| `modernize-use-unique-ptr`                                                        | new/delete instead of unique_ptr   |
| `performance-unnecessary-copy-init`                                               | Unnecessary copy of large object   |
| `readability-const-return-type`                                                   | const on return-by-value (useless) |
| `misc-unused-parameters`                                                          | Unused function parameters         |
| `clang-analyzer-cplusplus.NewDeleteLeaks`                                         | Leaked new allocations             |

## cppcheck Static Analysis

``` bash
cppcheck --enable=all --inconclusive --std=c++20 \
         --suppress=missingIncludeSystem \
         --error-exitcode=1 \
         -I include/ src/

# Useful flags:
# --check-library   — check library function usage
# --addon=cert      — CERT C++ coding standard checks
# --xml             — output as XML for CI parsing
```

## Static Analysis in CMake

``` cmake
# clang-tidy integration
find_program(CLANG_TIDY clang-tidy)
if(CLANG_TIDY)
    set(CMAKE_CXX_CLANG_TIDY
        "${CLANG_TIDY};-p;${CMAKE_BINARY_DIR};--warnings-as-errors=*")
endif()

# cppcheck integration
find_program(CPPCHECK cppcheck)
if(CPPCHECK)
    set(CMAKE_CXX_CPPCHECK
        "${CPPCHECK};--std=c++20;--enable=warning,performance;--error-exitcode=1")
endif()

# include-what-you-use
find_program(IWYU include-what-you-use)
if(IWYU)
    set(CMAKE_CXX_INCLUDE_WHAT_YOU_USE "${IWYU}")
endif()
```

## Debugging Workflow

1.  **Reproduce with smallest failing input** — write a failing test first
2.  **Run with sanitizers** — ASan+UBSan catches most memory and UB bugs
3.  **Add logging** — use `SPDLOG_DEBUG` or `std::clog` with context
4.  **Set a breakpoint at the crash site** — use `backtrace` to see the call chain
5.  **Inspect variables** — `info locals` and `print` every suspect value
6.  **Bisect the commit history** — `git bisect run ./tests` to find the regression
7.  **Fix the root cause**, not the symptom — add a regression test

## Pitfalls

- Running sanitizers only in nightly CI (not on every PR) — catch bugs earlier
- Debugging optimised (`-O2`) builds: disable with `-O0 -g` for stepping
- Interpreting TSan race reports incorrectly: the reported line is where the race is detected, not necessarily where the bug is; check both conflicting accesses
- Valgrind is ~10× slower than ASan; prefer ASan for CI, Valgrind for deep analysis

## Cross-References

- `catch2-testing.rst` — tests should be run under sanitizers
- `common-pitfalls.rst` — bugs that sanitizers detect
- `cpp-core-guidelines.rst` — clang-tidy enforces many guidelines
- `performance-tips-oop.rst` — profiling tools (perf, valgrind massif)


---

[← All Cheatsheets](index.md)
