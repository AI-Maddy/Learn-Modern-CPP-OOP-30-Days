# C++ Cheatsheets

Quick-reference guides for Modern C++ (C++17/20/23) — organized by topic.

---

## Core Language

| Cheatsheet | What it covers |
| --- | --- |
| [Variables, Types & constexpr](cheatsheets/variables-types-constexpr.md) | Fixed-width types, auto deduction, constexpr/const/#define, brace-init, structured bindings, overflow UB |
| [Uniform Initialization](cheatsheets/uniform-initialization.md) | `{}` vs `()` vs `=`, most-vexing parse, narrowing, aggregate init, designated initializers (C++20) |
| [Functions & Lambdas](cheatsheets/functions-lambdas.md) | Overload resolution, default args, `[[nodiscard]]`, capture modes, generic lambdas, IILE, std::function |
| [Structured Bindings](cheatsheets/structured-bindings.md) | Array/pair/tuple/struct decomposition, binding qualifiers, custom tuple_size, C++20 lambda capture |

---

## OOP & Design

| Cheatsheet | What it covers |
| --- | --- |
| [Classes, Constructors & RAII](cheatsheets/classes-constructors-raii.md) | Constructor delegation, member init lists, explicit, RAII scope guard, operator overloading |
| [Inheritance & Polymorphism](cheatsheets/inheritance-polymorphism.md) | Access specifiers, vtable layout, override/final, object slicing, dynamic_cast, pure virtual |
| [Composition vs Inheritance](cheatsheets/composition-vs-inheritance.md) | When to prefer each, mixin pattern, policy classes, pros/cons table |
| [OOP Principles & SOLID](cheatsheets/oop-principles-solid.md) | SRP, OCP, LSP, ISP, DIP — each with violation and compliant code examples |
| [Advanced OOP Patterns](cheatsheets/advanced-oop-patterns.md) | Factory, Strategy, Observer, Decorator, Visitor, NVI idiom |
| [Refactoring Checklist](cheatsheets/refactoring-checklist.md) | Code smells, incremental steps, extract method, strangler fig, post-refactor verification |
| [Common Pitfalls](cheatsheets/common-pitfalls.md) | Dangling refs, use-after-move, UB hotspots, ODR violations, header include guards |

---

## Memory & Ownership

| Cheatsheet | What it covers |
| --- | --- |
| [RAII & Smart Pointers](cheatsheets/raii-smart-pointers.md) | unique_ptr, shared_ptr, weak_ptr, custom deleters, aliasing constructor, ownership transfer |
| [Rule of Five](cheatsheets/rule-of-5-cheat.md) | Rule of Zero/Three/Five, compiler auto-generation table, copy-and-swap, noexcept on move |
| [Move Semantics Gotchas](cheatsheets/move-semantics-gotchas.md) | Value categories, rvalue refs, moved-from state, NRVO/copy-elision, perfect forwarding |
| [Memory Layout & Object Model](cheatsheets/memory-layout-and-object-model.md) | sizeof/alignof, struct padding, `[[no_unique_address]]`, vtable overhead, placement new, std::launder |

---

## Templates & Generic Programming

| Cheatsheet | What it covers |
| --- | --- |
| [Templates Basics](cheatsheets/templates-basics.md) | Deduction, CTAD, NTTPs, full/partial specialization, explicit instantiation, variadic templates, fold expressions |
| [Templates + Concepts](cheatsheets/templates-concepts.md) | Concept syntax, four constraint forms, requires expressions, subsumption, SFINAE vs Concepts table |
| [CRTP & Static Polymorphism](cheatsheets/crtp-static-polymorphism.md) | CRTP base, static interfaces, mixin chaining, detecting misuse, CRTP vs virtual table |
| [Type Erasure & pImpl](cheatsheets/type-erasure-pimpl.md) | pImpl idiom, ABI stability, std::function/any/variant, hand-rolled type eraser, performance table |

---

## Modern Utilities

| Cheatsheet | What it covers |
| --- | --- |
| [Modern C++20/23](cheatsheets/modern-cpp20-23-cheat.md) | Feature overview tables, concepts, ranges, coroutines, modules, spaceship op, std::expected, std::print |
| [Modules (C++20)](cheatsheets/modules-cpp20.md) | Module interface/implementation units, partitions, header units, `import std;`, CMake 3.28+ |
| [Ranges & Views](cheatsheets/ranges-and-views.md) | Lazy evaluation, filter/transform/zip/enumerate/chunk, range algorithms with projections, custom views |
| [optional / variant / any](cheatsheets/optional-variant-any.md) | std::optional monadic ops (C++23), std::visit patterns, std::any, when-to-use-which table |
| [Error Handling & std::expected](cheatsheets/error-handling-expected.md) | Exception safety levels, noexcept, std::expected (C++23), error propagation with `and_then`/`transform` |

---

## Performance & Tooling

| Cheatsheet | What it covers |
| --- | --- |
| [Performance Tips (OOP)](cheatsheets/performance-tips-oop.md) | Virtual call cost, devirtualisation, AoS vs SoA, SBO, RVO/NRVO, `[[likely]]`, reserve(), move transfers |
| [Debugging Tools (2026)](cheatsheets/debugging-tools-2026.md) | GDB/LLDB commands, AddressSanitizer, UBSan, Valgrind, perf, Tracy profiler, compiler warnings |
| [Catch2 Testing](cheatsheets/catch2-testing.md) | TEST_CASE, SECTION, REQUIRE/CHECK, BDD macros, matchers, generators, benchmarks |
| [C++ Core Guidelines](cheatsheets/cpp-core-guidelines.md) | Key rules by category: resource management, interfaces, classes, concurrency, performance |
