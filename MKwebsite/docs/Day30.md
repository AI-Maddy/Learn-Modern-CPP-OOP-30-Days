# Day 30: Review, Certification Prep, and Next Steps

## Why This Day Matters

This is the capstone of the course. Today you consolidate 30 days of
learning into a coherent mental model, identify and close any remaining
gaps, and build a concrete plan for continued growth. The skills you
have built are foundational — this day maps them to career paths and
gives you the resources to go significantly deeper in any direction.

## Learning Outcomes

After completing this day you will be able to:

* Score at least 16/20 on the self-assessment quiz (covering all 30 days)
  and identify which days to revisit for each wrong answer.
* Produce a 30-day knowledge map from memory, grouping concepts into the
  four weekly themes (foundations, inheritance/polymorphism, modern C++,
  integration).
* Name at least two concrete next-learning resources for three different
  specialisation paths (concurrency, embedded, game dev).
* Articulate what separates an intermediate C++ programmer from a senior
  one in one paragraph, using specific technical examples.
* Commit to a 4-week continued practice plan with measurable weekly goals.

## Key Concepts Reviewed

* **RAII and smart pointers** — the mechanism that makes modern C++ safe;
  every resource is tied to a scope-managed object.
* **Polymorphism** — virtual dispatch, object slicing, vtable, abstract
  interfaces; the foundation of every extensible OOP design.
* **Move semantics** — transferring resource ownership without copying;
  essential for performance in containers and factories.
* **Exception safety** — basic, strong, and no-throw guarantees; knowing
  which your code provides and proving it.
* **constexpr / consteval** — moving computation from runtime to compile
  time; zero-cost lookup tables, static assertions, type safety.
* **Coroutines** — cooperative suspension for asynchronous and lazy code
  without callbacks or thread overhead.

## Theory

### Motivation

Thirty days of focused study have given you a complete foundation in modern
C++ object-oriented programming. Today is not about new syntax — it is about
consolidating what you know, finding gaps, and building a sustainable plan
for continued growth.

### 30-Day Knowledge Map

```text
Week 1 — Foundations
─────────────────────
Day 01: Classes, constructors, destructors, access control
Day 02: const, references, value vs reference semantics
Day 03: Memory model, stack vs heap, sizeof
Day 04: Encapsulation, getters/setters, invariants
Day 05: Operator overloading (arithmetic, comparison, stream)
Day 06: Copy semantics, Rule of Three
Day 07: Move semantics, Rule of Five, rvalue references

Week 2 — Inheritance & Polymorphism
─────────────────────────────────────
Day 08: Inheritance basics, is-a vs has-a
Day 09: Virtual functions, vtable, virtual destructor
Day 10: Abstract classes, pure virtual, interfaces
Day 11: Multiple inheritance, virtual bases, diamond problem
Day 12: Polymorphic containers, object slicing prevention
Day 13: CRTP, static polymorphism, mixin patterns
Day 14: Templates, function/class templates, specialisation

Week 3 — Modern C++ Features
──────────────────────────────
Day 15: RAII, Rule of Zero/Three/Five, smart pointers intro
Day 16: unique_ptr, shared_ptr, weak_ptr, make_unique
Day 17: Lambda expressions, std::function, closures
Day 18: STL containers review, iterator categories
Day 19: Algorithms, ranges (C++20), views, pipelines
Day 20: std::variant, std::optional, std::expected
Day 21: Exception handling, exception hierarchy, noexcept

Week 4 — Integration & Mastery
────────────────────────────────
Day 22: Design patterns (Strategy, Observer, Factory, Builder)
Day 23: Concurrency introduction, std::thread, mutex, atomic
Day 24: Mini Project 1 — Bank Account System
Day 25: Mini Project 2 — Shape Editor
Day 26: Mini Project 3 — Game Entities
Day 27: Refactoring Legacy Code
Day 28: Code Review and Common Pitfalls
Day 29: Advanced Topics (coroutines, consteval, bit_cast, pmr)
Day 30: Review, Quiz, Next Steps (this day)
```

### Self-Assessment Quiz (20 Questions)

Work through each question on paper before reading the answer.

**Q1.** What is the difference between `= default` and `= delete` for a special member function?

**A1.** `= default` asks the compiler to generate the standard implementation for that special member following the usual rules. `= delete` prevents the function from being called at all; any attempt to call it is a compile error.

---

**Q2.** Why does `std::vector<Base>` cause object slicing when you push a `Derived` object into it?

**A2.** `std::vector<Base>` stores elements of type `Base` by value. When you push a `Derived`, it is *copy-constructed* into a `Base` slot. Only the `Base` portion is copied; the derived-class data and the derived vtable entry are discarded.

---

**Q3.** What is undefined behaviour and why is it dangerous in C++?

**A3.** Undefined behaviour (UB) means the C++ standard places no requirements on what happens. The compiler is free to assume UB never occurs; it may optimise away your guard conditions, corrupt memory, or produce unreliable output — silently, and only in some build configurations.

---

**Q4.** Explain RAII in one sentence and give a concrete example.

**A4.** RAII (Resource Acquisition Is Initialisation) ties a resource's lifetime to the lifetime of an object: the resource is acquired in the constructor and released in the destructor, guaranteeing cleanup even if an exception is thrown. Example: `std::ofstream` — the file is opened on construction and closed when the object goes out of scope.

---

**Q5.** When would you choose `std::shared_ptr` over `std::unique_ptr`?

**A5.** When multiple objects genuinely need to share ownership of a single resource — e.g., a texture object referenced by many rendering components. `shared_ptr` uses reference counting; when the last owner is destroyed, the object is deleted.

---

**Q6.** What is the move constructor and why does it exist?

**A6.** The move constructor transfers ownership of resources from a temporary (expiring) object to a new one, leaving the source in a valid but unspecified state. It avoids expensive deep copies for heap-allocated data.

---

**Q7.** Describe the virtual table (vtable) mechanism briefly.

**A7.** Each polymorphic class has one vtable: an array of function pointers, one per virtual function. Every instance stores a hidden pointer (vptr) to its class's vtable. When a virtual function is called through a base-class pointer, the CPU follows the vptr, looks up the function pointer in the vtable, and calls it — resolving the correct derived-class implementation at runtime.

---

**Q8.** What is the problem with unsigned integer subtraction `size_t a = 3; size_t b = 5; size_t diff = a - b;`?

**A8.** Unsigned arithmetic wraps modulo 2^N. Since `3 < 5`, the mathematical result is `-2`, but `-2` as an unsigned 64-bit value is `18446744073709551614`. Using this as a loop bound or array index causes catastrophic out-of-bounds access.

---

**Q9.** What does `[[nodiscard]]` do and when should you apply it?

**A9.** `[[nodiscard]]` causes the compiler to emit a warning if the return value of the annotated function is discarded. Apply it to pure query functions (`area()`, `size()`, `is_valid()`) and factory functions where discarding the return value is almost certainly a programming mistake.

---

**Q10.** Explain the difference between `constexpr` and `consteval`.

**A10.** A `constexpr` function *may* be evaluated at compile time or at runtime depending on whether its arguments are constant expressions. A `consteval` function *must* be evaluated at compile time; calling it with a runtime argument is a compile error.

---

**Q11.** What is the Visitor pattern and what problem does it solve?

**A11.** The Visitor pattern separates operations from the objects they operate on. A visitor class provides one `visit()` overload per concrete type. Shapes call `accept(visitor)` which dispatches to the right overload. This allows new operations to be added by writing new visitor classes, without modifying the shape classes.

---

**Q12.** What is the Entity-Component System pattern and how does it differ from deep inheritance?

**A12.** In ECS, an entity is just an ID. Behaviour comes from attaching components (plain data structs) at runtime. Systems iterate over entities with specific component combinations. This avoids the combinatorial explosion of deep inheritance.

---

**Q13.** Name three `clang-tidy` checks that are most useful for modernising legacy C++ code.

**A13.** (1) `modernize-use-smart-ptr` — replaces raw `new`/`delete` with `std::make_unique`/`std::make_shared`. (2) `modernize-use-override` — adds missing `override` keywords. (3) `cppcoreguidelines-avoid-magic-numbers` — flags unexplained integer and float literals in logic.

---

**Q14.** When is `noexcept` harmful?

**A14.** When applied to a function whose call tree can actually throw. If a `noexcept` function propagates an exception, `std::terminate()` is called immediately (no stack unwinding, no catch blocks).

---

**Q15.** What is object slicing and how do you prevent it?

**A15.** Object slicing occurs when a derived object is copied or assigned into a base-class value slot; only the base portion is kept. Prevention: store polymorphic objects by pointer (preferably `unique_ptr<Base>` or `shared_ptr<Base>`), never by value.

---

**Q16.** What is the Strangler Fig refactoring strategy?

**A16.** Building a replacement system incrementally alongside the existing legacy system. Traffic is gradually redirected to the new code (one function, one class, one feature at a time). When the old code is no longer called, it is deleted.

---

**Q17.** Explain co_yield vs co_return in coroutines.

**A17.** `co_yield value` suspends the coroutine, makes `value` available to the caller, and allows the coroutine to be resumed later. `co_return value` terminates the coroutine, provides the final value, and prevents any further resumption.

---

**Q18.** Why is `std::bit_cast` preferable to `reinterpret_cast` for type punning?

**A18.** Accessing an object's value representation through a pointer of a different type (via `reinterpret_cast`) violates the strict aliasing rule and is undefined behaviour. `std::bit_cast` is defined behaviour, is `constexpr`, and statically checks that source and destination are the same size and trivially copyable.

---

**Q19.** What is the expression problem in the context of OOP?

**A19.** The difficulty of extending a type system in two independent dimensions — adding new types and adding new operations — without modifying existing code. OOP (virtual dispatch) makes adding types easy but adding operations hard. The Visitor pattern reverses this. No single pattern solves both without additional machinery.

---

**Q20.** Describe two ways to prevent memory leaks in exception-unsafe code.

**A20.** (1) Replace raw `new`/`delete` with `std::make_unique` / `std::make_shared` — the destructor is guaranteed to run during stack unwinding. (2) Use RAII wrappers: file handles in `std::fstream`, mutexes in `std::lock_guard`, and any custom resource in a class whose destructor releases it.

---

### What to Learn Next

After mastering this course, the next logical specialisations are:

**Concurrency and Parallelism**
`std::thread`, `std::atomic`, `std::mutex`, lock-free data structures,
`std::jthread` (C++20), executors, and the C++23 `std::mdspan`.
Resources: *C++ Concurrency in Action* by Anthony Williams.

**Networking**
Asio (standalone or via Boost), `co_await`-based networking servers,
HTTP/2 with nghttp2, TLS with BoringSSL.

**Embedded / Systems Programming**
`-fno-exceptions`, `-fno-rtti`, linker scripts, memory-mapped I/O,
interrupt service routines, MISRA C++ guidelines, FreeRTOS integration.
Resources: Embedded Artistry blog.

**Game Development**
Full ECS frameworks (EnTT, Flecs), rendering pipelines (Vulkan, OpenGL),
physics engines (Box2D, Bullet), audio (OpenAL).
Resources: *Game Engine Architecture* by Jason Gregory.

**Template Metaprogramming / Library Design**
Concepts (C++20), SFINAE vs Concepts, policy-based design, expression
templates, the design of standard library facilities.
Resources: *Modern C++ Design* by Andrei Alexandrescu.

### Recommended Books

* *Effective Modern C++* — Scott Meyers (C++11/14 idioms, still essential)
* *C++ Core Guidelines* — Bjarne Stroustrup & Herb Sutter (free online)
* *A Tour of C++* — Bjarne Stroustrup (concise, up to C++20)
* *The C++ Programming Language* — Bjarne Stroustrup (comprehensive reference)
* *C++ Concurrency in Action* — Anthony Williams
* *Game Engine Architecture* — Jason Gregory

### Online Resources

* `cppreference.com` — the definitive C++ reference; more accurate than cplusplus.com for C++17/20 features.
* `godbolt.org` (Compiler Explorer) — inspect assembly output for any snippet across 30+ compilers.
* `quick-bench.com` — micro-benchmark two snippets side by side.
* CppCon talks on YouTube — annual conference; the best accessible coverage of cutting-edge C++ features.
* C++ Core Guidelines (isocpp.github.io) — authoritative best practices.

### Career Paths for C++ Engineers

```text
┌─────────────────────────────────────────────────────────┐
│              C++ Engineer Career Paths                  │
├──────────────────┬──────────────────┬───────────────────┤
│ Systems / Kernel │ Game / Graphics  │ Finance / HFT     │
│                  │                 │                   │
│ OS internals     │ Rendering        │ Low-latency       │
│ Drivers          │ Physics          │ Order matching    │
│ Compilers        │ Networking       │ Risk engines      │
│ Hypervisors      │ ECS frameworks   │ Quant libraries   │
├──────────────────┼──────────────────┼───────────────────┤
│ Embedded/IoT     │ Tooling / Dev    │ Scientific        │
│                  │ Infrastructure   │ Computing         │
│ MCU firmware     │ Build systems    │ HPC / MPI         │
│ RTOS             │ CI pipelines     │ Simulation        │
│ Safety-critical  │ Profilers        │ ML inference      │
└──────────────────┴──────────────────┴───────────────────┘
```

## Pitfalls

### Pitfall 1: Passive Re-Reading Without Active Recall

**Description**
Reading through notes or theory files feels productive but produces
almost no retention compared to active recall: closing the material
and attempting to reproduce concepts from memory.

**BAD approach**

```text
Student reads theory.rst for Day 9 (virtual functions).
Student feels confident.
Three days later: cannot write a vtable explanation from scratch.
```

**GOOD approach**

```text
After reading, close the file.
1. Write down the key concept definitions on paper.
2. Implement the day's example from scratch (no copy-paste).
3. Answer each self-check question out loud or in writing.
4. Only re-open the file to check specific details, not to re-read.
```

---

### Pitfall 2: Stopping After Completing the 30 Days

**Description**
Treating the 30-day course as a destination rather than a foundation.
Skills not used regularly atrophy quickly, especially the subtler C++
rules around UB, move semantics, and exception safety.

**GOOD approach**

```text
Schedule one of:
- 30 minutes of C++ reading per week (cppreference, CppCon talks).
- One small project per month that uses a concept from the course.
- Contributing to an open-source C++ project (LLVM, Abseil, etc.).
- Solving one C++ kata on Exercism.io or LeetCode per week.
```

---

### Pitfall 3: Skipping Weak Topics and Only Studying Strengths

**Description**
Spending review time on concepts you already know well while avoiding
the topics that feel uncomfortable.

**GOOD approach**

```text
After the quiz, list the questions answered incorrectly.
Group them by day. Rank days by number of wrong answers.
Spend 70% of review time on the bottom half of the ranking.
Re-take the quiz two weeks later to confirm improvement.
```

---

### Pitfall 4: Learning Only the Theory, Never the Toolchain

**Description**
Understanding C++ language features but being unable to set up a
project, configure CMake, run sanitizers, or use a debugger efficiently.

**GOOD approach**

```cpp
// Hands-on toolchain exercise:
// 1. Create a new CMakeLists.txt for a two-file project from scratch.
// 2. Add: -Wall -Wextra -Wconversion -fsanitize=address,undefined
// 3. Introduce a deliberate bug (unsigned underflow).
// 4. Build and run — observe the sanitizer output.
// 5. Fix the bug and confirm the sanitizer is silent.
```

---

### Pitfall 5: Focusing Only on Language Features, Ignoring Design

**Description**
Mastering C++ syntax and semantics without practising design decisions:
when to use inheritance vs composition, when an exception is right vs
an error code, when to use a factory.

**BAD approach**

```cpp
// Technically correct but poor design:
// Uses CRTP, variant, coroutines, pmr allocators, consteval, bit_cast
// all in one class — because they were learned this week.
class MegaEntity : public EntityBase<MegaEntity>,
                   public std::enable_shared_from_this<MegaEntity> {
    std::variant<StateA, StateB, StateC> state_;
    std::pmr::vector<Component> components_;
    // ... 500 lines of over-engineered class
};
```

**GOOD approach**

```text
For each design decision, ask:
1. What is the simplest solution that correctly solves the problem?
2. What would I need to change for this solution to break?
3. Only use a more complex pattern if the simple one demonstrably fails.
```

---

### Pitfall 6: Treating the Quiz Score as the Final Verdict

**Description**
Scoring well on the Day 30 quiz but never writing production-quality code.
Quiz knowledge and engineering judgment are different things.

**GOOD conclusion**

```text
Scored 20/20 on the quiz.
Next step: implement a non-trivial project that uses concepts from
at least 10 different days simultaneously. Review the code yourself
against the Day 28 checklist. Then have someone else review it.
Iterate until no checklist item produces a finding.
```

**Detection tip:** The best indicator of genuine skill is not quiz scores but the quality
of code you write without references when the problem is novel.

## Code Example

```cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> confidence{{"OOP", 8}, {"Templates", 7}, {"Ranges", 6}};
    std::cout << "Day 30 - Review and Next Steps\n";
    for (const auto& [topic, score] : confidence) {
        std::cout << topic << " confidence=" << score << "/10\n";
    }
    return 0;
}
```
