# Day 23: Modern Features Preview — C++26

## Why This Day Matters

C++ has a three-year release cycle. C++20 delivered modules, concepts, ranges, coroutines, and `std::format`. C++23 delivered `std::expected`, `import std;`, `std::mdspan`, and `std::print`. C++26, finalised in 2026, brings transformative features that change how C++ programmers think about reflection, control flow, correctness, and concurrency. Understanding these features now lets you evaluate experimental compilers for early adoption, design abstractions today that will migrate cleanly to C++26 idioms, and understand the direction of the language for architectural decisions.

## Learning Outcomes

By the end of this day you will be able to:

* Describe the purpose of static reflection (P2996): querying type members, enumerators, and names at compile time using `^^T` and `[:r:]`.
* Explain how pattern matching with `inspect` (P2688) replaces `std::visit` + `overloaded` with readable, exhaustive type dispatch.
* Write C++26 contract annotations (`pre`/`post`) and explain how they differ from `assert()` in scope, expressiveness, and build-mode control.
* Sketch a `std::execution` sender pipeline using `schedule`, `then`, and `when_all`, and explain why it is preferable to `std::future`.
* Use `std::inplace_vector<T, N>` for fixed-capacity stack-allocated sequences and handle the full-container case with `try_push_back`.
* Assess each feature's compiler support status and choose the correct workaround for production code that must build on stable compilers today.

## Key Concepts

* **Static reflection (P2996)** — compile-time type introspection as first-class values; eliminates code generators for serialisation and enum-to-string.
* **Pattern matching (P2688)** — structured multi-way dispatch with structural, type, and value patterns in an exhaustiveness-checked `inspect` block.
* **Contracts (P2900)** — `pre()`/`post()` annotations on function declarations; express caller/callee API contracts at the language level.
* **`std::execution` (P2300)** — lazy, composable async via senders and receivers; structured concurrency with cancellation and three result channels.
* **`std::inplace_vector<T, N>`** — `std::vector` interface with fixed N-element inline storage; zero heap allocation; `try_push_back` for safe overflow handling.
* **Merged vs implemented** — "merged into C++26 draft" does not mean compiler support exists; always check `en.cppreference.com` compiler support tables.

## Theory

### Motivation — The Evolving Language

C++ has a three-year release cycle. C++20 delivered modules, concepts, ranges, coroutines, and `std::format`. C++23 delivered `std::expected`, `import std;`, `std::mdspan`, and `std::print`. C++26, finalised in 2026, brings transformative features that change how C++ programmers think about reflection, control flow, correctness, and concurrency.

This day surveys the five most significant C++26 features. Status legend:

* **Merged** — formally voted into the C++26 working draft.
* **Experimental** — available in Clang/GCC trunk under `-std=c++26` or feature flags, but not yet in all compiler releases as of early 2025.

Understanding these features now lets you:

* Evaluate experimental compilers (Clang trunk, EDG) for early adoption.
* Design abstractions today that will migrate cleanly to C++26 idioms.
* Understand the direction of the language for architectural decisions.

### Static Reflection — P2996 (Merged into C++26)

Static reflection allows querying properties of types at compile time as first-class language values, without macros or code generation.

The core construct is `^^T` (the reflection operator) which produces a `std::meta::info` constant, and `[:r:]` (the splicer) which turns a `meta::info` back into a syntactic element.

```cpp
// requires: clang trunk with -freflection or EDG compiler
#include <meta>

struct Point { int x; int y; };

// Iterate over all non-static data members at compile time:
constexpr void print_member_names() {
    // ^^Point reflects the type as a compile-time value
    constexpr auto members = std::meta::nonstatic_data_members_of(^^Point);
    // members is a range of std::meta::info values
    template for (constexpr auto m : members) {
        std::println("member: {}", std::meta::name_of(m));
    }
}
// Output: member: x
//         member: y
```

**Serialisation without macros:**

```cpp
template<typename T>
std::string to_json(const T& obj) {
    std::string result = "{";
    bool first = true;
    template for (constexpr auto m : std::meta::nonstatic_data_members_of(^^T)) {
        if (!first) result += ",";
        result += "\"";
        result += std::meta::name_of(m);
        result += "\":";
        result += std::to_string(obj.[:m:]);   // splicer accesses the member
        first = false;
    }
    return result + "}";
}

Point p{3, 7};
std::println("{}", to_json(p));   // {"x":3,"y":7}
```

This pattern — which previously required Boost.Hana, a macro + code generator, or manual boilerplate — is now expressed directly in the language.

**Enum-to-string without macros:**

```cpp
enum class Colour { Red, Green, Blue };

std::string_view colour_name(Colour c) {
    template for (constexpr auto e : std::meta::enumerators_of(^^Colour)) {
        if ([:e:] == c) return std::meta::name_of(e);
    }
    return "<unknown>";
}

std::println("{}", colour_name(Colour::Green));   // "Green"
```

### Pattern Matching — P2688 (Targeted for C++26)

Pattern matching provides a structured multi-way dispatch over values and types, extending `switch` to work with arbitrary types including `std::variant`, `std::optional`, structs, and ranges.

```cpp
// Current C++23 baseline (for comparison)
std::variant<int, double, std::string> v = 42;
std::visit([](auto&& x){
    using T = std::decay_t<decltype(x)>;
    if constexpr (std::is_same_v<T, int>)    std::println("int: {}", x);
    else if constexpr (std::is_same_v<T, double>) std::println("double: {}", x);
    else std::println("string: {}", x);
}, v);

// C++26 pattern matching (P2688 syntax — experimental):
inspect (v) {
    <int>    i => std::println("int: {}", i);
    <double> d => std::println("double: {}", d);
    <std::string> s => std::println("string: {}", s);
};
```

**Structural patterns:**

```cpp
struct Point { int x, y; };

Point p{3, 0};
inspect (p) {
    [0, 0]     => std::println("origin");
    [x, 0]     => std::println("on x-axis at {}", x);
    [0, y]     => std::println("on y-axis at {}", y);
    [x, y]     => std::println("({}, {})", x, y);
};
// prints: "on x-axis at 3"
```

**`std::optional` pattern:**

```cpp
std::optional<int> opt = 42;
inspect (opt) {
    none    => std::println("empty");
    some(v) => std::println("has value: {}", v);
};
```

Pattern matching eliminates deep `if`/`else` chains, `dynamic_cast` cascades, and the `overloaded` boilerplate currently needed for `std::visit`.

### Contracts — P2900 (Merged into C++26)

Contracts provide a language-level mechanism to specify preconditions, postconditions, and invariants. They are distinct from `assert()` in that they are part of the function declaration and can be verified, disabled, or audited by the build system.

```cpp
// Precondition: caller must ensure n >= 0 and n < size
double get_element(const std::vector<double>& v, std::size_t n)
    pre(n < v.size())
{
    return v[n];
}

// Postcondition: the function guarantees the returned value is positive
double sqrt_positive(double x)
    pre(x >= 0.0)
    post(result: result >= 0.0)   // 'result' names the return value
{
    return std::sqrt(x);
}

// Class invariant (proposed syntax):
struct BankAccount {
    double balance;
    void deposit(double amount)
        pre(amount > 0)
        post(balance == balance + amount) {}
};
```

Contracts differ from `assert()` in several ways:

* They are checked at function boundaries (call/return), not inside the body.
* The violation handler is customisable globally (`contract_violation_handler`).
* Contracts can be disabled per-build (`off`), audit-only (`audit`), or enforced (`default`).
* Postconditions can reference the return value by name.

```cpp
// Build modes:
// -fcontracts=default  → preconditions enforced at runtime
// -fcontracts=audit    → all contracts enforced (includes expensive checks)
// -fcontracts=off      → contracts compiled away, zero overhead
```

### `std::execution` — P2300 Senders/Receivers (Merged into C++26)

`std::execution` provides a composable, asynchronous programming model based on **senders** (descriptions of async work) and **receivers** (continuations).

Key concepts:

* A **sender** is a lazy description of work. It does nothing until connected to a receiver and started.
* A **receiver** has three channels: `set_value` (success), `set_error` (failure), and `set_stopped` (cancellation).
* **Algorithms** like `then`, `when_all`, `on`, and `schedule` compose senders into pipelines.

```cpp
#include <execution>
namespace ex = std::execution;

// Basic async pipeline
auto work = ex::schedule(thread_pool.get_scheduler())    // schedule on thread pool
          | ex::then([]{ return compute_heavy_thing(); }) // transform value
          | ex::then([](auto result){ return format(result); });

// Synchronously block waiting for result (in tests or main):
auto [text] = ex::sync_wait(std::move(work)).value();
std::println("{}", text);

// Composing parallel work:
auto parallel =
    ex::when_all(
        ex::schedule(pool.get_scheduler()) | ex::then([]{ return fetch_db(); }),
        ex::schedule(pool.get_scheduler()) | ex::then([]{ return fetch_api(); })
    )
    | ex::then([](auto db, auto api){ return merge(db, api); });
```

Senders/receivers compose without shared state (no `std::future` polling), support structured concurrency (child tasks are always joined before parent scope exits), and work on any executor (thread pool, CUDA, serial, coroutine).

### `std::inplace_vector` — P0843 (Merged into C++26)

A fixed-capacity vector stored entirely on the stack (or inside the parent object) — no heap allocation, no indirection, same interface as `std::vector`.

```cpp
#include <inplace_vector>

std::inplace_vector<int, 16> v;   // capacity fixed at 16; stored inline
v.push_back(1);
v.push_back(2);
v.push_back(3);

// Same as std::vector:
std::ranges::sort(v);
for (int x : v) std::print("{} ", x);

// Adding beyond capacity throws std::bad_alloc (or can use try_push_back):
v.resize(16);
auto ok = v.try_push_back(99);   // returns std::nullopt if full — no exception
assert(!ok.has_value());         // capacity exceeded

// Zero heap allocation — perfect for:
// - Embedded / real-time systems where malloc is forbidden
// - Small collections where capacity is known at compile time
// - Hot paths where allocation latency matters
```

Comparison of `inplace_vector` with alternatives:

| Container                   | Heap   | Capacity | Size  | Use case      |
|-----------------------------|--------|----------|-------|---------------|
| `std::vector`               | Yes    | Dynamic  | 24 B  | General       |
| `std::array`                | No     | Fixed    | N×E   | Fixed, no push|
| `std::inplace_vector<T,N>`  | No     | Fixed    | N×E+1 | Fixed, push OK|
| `boost::static_vector`      | No     | Fixed    | N×E+1 | Boost required|

### What Is Stable vs Experimental (Early 2025)

| Feature                     | Status        | Try with                  |
|-----------------------------|---------------|---------------------------|
| Static Reflection (P2996)   | Merged C++26  | Clang trunk `-freflection`|
| Pattern Matching (P2688)    | Targeted C++26| Clang/EDG experimental    |
| Contracts (P2900)           | Merged C++26  | GCC 14+ `-fcontracts`     |
| `std::execution` (P2300)    | Merged C++26  | stdexec library (GitHub)  |
| `std::inplace_vector`       | Merged C++26  | GCC 15+ / Clang 18+       |

Using them today:

* `stdexec` (NVIDIA's reference P2300 implementation) is available on GitHub and works on C++20 compilers.
* `boost::static_vector` provides `inplace_vector` semantics today.
* Contracts are available under `-fcontracts` in GCC 14+ and Clang 17+.
* Reflection requires Clang trunk or EDG (only for exploration, not production).

### Modern C++ Trajectory

```
C++11/14  C++17      C++20        C++23         C++26
────────  ───────    ──────────   ──────────    ──────────────────
move sem  structured modules      expected      reflection
lambdas   bindings   concepts     print/println pattern matching
smart ptr if-init    ranges       import std    contracts
          variant    coroutines   mdspan        std::execution
          optional   format       flat_map      inplace_vector
```

Each release builds on the previous. C++26's reflection will unlock code generation patterns that previously required external tools (protobuf, IDL compilers, Qt moc) to be expressed directly in C++.

## Pitfalls

### Pitfall 1 — Using C++26 Reflection in Production Without Stable Compiler Support

**Problem:** Adopting `^^T` reflection syntax in production code before the feature is available in released, stable compilers used by the whole team.

**BAD:**

```cpp
// Requires Clang trunk with -freflection — not in any released compiler yet
template<typename T>
void serialise(const T& obj) {
    template for (constexpr auto m : std::meta::nonstatic_data_members_of(^^T)) {
        write_field(std::meta::name_of(m), obj.[:m:]);
    }
}
// Committed to main branch — CI breaks on GCC 14, MSVC 2022, Clang 17
```

**Why it fails:** As of early 2025, reflection requires either Clang trunk builds or the EDG reference compiler — neither is a standard CI/CD toolchain. Teammates on stable compilers cannot build the code.

**GOOD — use a migration wrapper with today's tools:**

```cpp
// Today: use a macro or explicit field list (tedious but portable)
#define REFLECT_FIELDS(T, ...) /* boost.pfr or manual list */

// Or use Boost.PFR for structural reflection (works on C++17+):
#include <boost/pfr.hpp>

template<typename T>
void serialise(const T& obj) {
    boost::pfr::for_each_field(obj, [](const auto& field, std::size_t idx) {
        write_field(idx, field);
    });
}

// Plan a migration path: when C++26 compilers are stable (2026–2027),
// replace boost::pfr with native reflection.
```

**Detection tip:** Before using any C++26 feature, check `en.cppreference.com` for "compiler support" table. Features listed as "partial" or "experimental" are not ready for production CI.

### Pitfall 2 — Contracts Used as Defensive Programming Instead of Design

**Problem:** Adding contracts to every function as a defensive coding habit instead of using them to express caller/callee responsibilities at API boundaries.

**BAD:**

```cpp
// Contracts on a private implementation detail
int add(int a, int b)
    pre(a >= 0)           // WRONG: unnecessarily restricts caller
    pre(b >= 0)           // WRONG: add() works for all ints
    post(result: result == a + b)   // trivially true — not useful
{
    return a + b;
}
```

**Why it fails:** The precondition `a >= 0` restricts the interface unnecessarily. The postcondition merely restates the implementation. Contracts on private functions add no API-level design value and clutter the code. They also add runtime overhead in non-`off` build modes.

**GOOD — contracts on public API boundaries to express real preconditions:**

```cpp
// Public API with a real, non-trivial precondition:
double get_element(const std::vector<double>& v, std::size_t i)
    pre(i < v.size())     // caller's responsibility — not obvious from type
{
    return v[i];
}

// Internal helper: use assert() or simply trust the design
static int add(int a, int b) { return a + b; }   // no contract needed
```

**Detection tip:** Before adding a contract, ask: "Does violating this precondition indicate a bug in the *caller's* code?" If yes, it belongs. If it is always satisfied by the function's own logic, it is unnecessary.

### Pitfall 3 — Misunderstanding `inspect` Exhaustiveness

**Problem:** Assuming that an `inspect` block without a catch-all handles all cases, leading to a compile error or silent fallthrough at runtime.

**BAD (assuming the P2688 experimental syntax):**

```cpp
std::variant<int, double> v = 3.14;

inspect (v) {
    <int> i    => process_int(i);
    // Missing: <double> arm — compile error or runtime fallthrough
};
```

**Why it fails:** Pattern matching compilers enforce exhaustiveness for types where it can be determined (`std::variant`, `enum`). Missing a variant arm is a compile error. Even if a catch-all is implicit, relying on it masks unhandled cases.

**GOOD — explicitly handle all cases, or add a catch-all with a static assertion:**

```cpp
inspect (v) {
    <int>    i => process_int(i);
    <double> d => process_double(d);
    // If the variant gains a third type later, the compiler tells you here
};

// Or with a catch-all:
inspect (v) {
    <int> i => process_int(i);
    _       => std::terminate();  // explicit: unknown type is a bug
};
```

**Detection tip:** Treat missing arms as a feature — the compiler tells you everywhere you need to handle a new variant type. Resist adding `_ =>` catch-alls unless the catch-all behaviour is explicitly correct (e.g., ignore unknown events).

### Pitfall 4 — Blocking on a Sender with `sync_wait` Inside Async Contexts

**Problem:** Calling `std::execution::sync_wait` inside a coroutine or a thread-pool task, blocking a thread that should remain free for other work.

**BAD:**

```cpp
namespace ex = std::execution;

// A task running on thread pool:
ex::task<void> process_request(Request req) {
    // WRONG: sync_wait blocks the thread pool thread
    auto result = ex::sync_wait(fetch_from_db(req.id)).value();
    send_response(result);
}
```

**Why it fails:** `sync_wait` blocks the calling thread. If this task runs on a thread pool and the pool has limited threads, every thread blocked on `sync_wait` is unavailable for other work, potentially deadlocking if the database fetch also needs a thread from the same pool.

**GOOD — compose senders, don't block mid-pipeline:**

```cpp
// Compose the entire pipeline as a sender — no blocking
auto pipeline =
    fetch_from_db(req.id)
    | ex::then([req](auto result){ return send_response(result); });

// Only sync_wait at the outermost scope (main or test):
int main() {
    ex::sync_wait(pipeline);   // OK: blocks the main thread, not a pool thread
}
```

**Detection tip:** Grep for `sync_wait` in code that is itself launched via `schedule` or inside a coroutine. `sync_wait` belongs only at the outermost level, not inside composed pipelines.

### Pitfall 5 — `std::inplace_vector` Overflow Without Checking

**Problem:** Using `push_back` on a full `inplace_vector` throws `std::bad_alloc`, but this is often unexpected because "allocation failure" feels irrelevant for a stack-based container.

**BAD:**

```cpp
std::inplace_vector<int, 4> v;
v.push_back(1);
v.push_back(2);
v.push_back(3);
v.push_back(4);   // now full

// In a loop that may run more than 4 times:
for (int x : input_data) {
    v.push_back(x);   // throws std::bad_alloc when capacity exceeded!
}
```

**Why it fails:** Unlike `std::array`, `inplace_vector` grows up to its capacity, so users may forget it has an absolute upper bound. Throwing `bad_alloc` on a stack container surprises callers who expect allocation failure only from heap containers.

**GOOD — use `try_push_back` and handle the full case explicitly:**

```cpp
std::inplace_vector<int, 4> v;
for (int x : input_data) {
    auto ok = v.try_push_back(x);
    if (!ok) {
        // Container full — flush, error, or truncate explicitly
        flush_and_clear(v);
        v.push_back(x);   // safe now
    }
}

// Or: assert capacity is sufficient at the call site
assert(input_data.size() <= v.capacity());
for (int x : input_data) v.push_back(x);
```

**Detection tip:** Whenever `inplace_vector` is filled in a loop, use `try_push_back` unless you have a static proof (`static_assert` or runtime `assert`) that the loop count cannot exceed capacity.

### Pitfall 6 — Confusing Merged-into-Draft with Implemented-in-Compiler

**Problem:** Reading that a paper is "merged into C++26" and assuming it is available in released compilers immediately.

**BAD assumption:**

```cpp
// P2996 (Reflection) merged into C++26 draft — so let's use it!
// ... writes reflection code ...
// Tries to compile with GCC 14, MSVC 2022 — both fail entirely.
// "But it was merged into the standard!"
```

**Why it fails:** "Merged into the C++26 working draft" means the ISO committee voted to include the feature in the specification document being developed. It does NOT mean any production compiler implements it yet. Compiler implementors typically lag 6–24 months behind the formal specification. As of early 2025, only Clang trunk and EDG implement P2996 reflection, neither of which is suitable for production use.

**GOOD — check cppref compiler support table before writing production code:**

```
Workflow for using C++26 features:
1. Check https://en.cppreference.com/w/cpp/compiler_support for the feature.
2. If "partial" or "no" on your target compilers → use an alternative today.
3. If "yes" on all target compilers → adopt with a feature-test macro guard.
4. Write the migration plan from today's workaround to the C++26 native form.
```

```cpp
// Feature-test macro guard (safe adoption pattern):
#if __has_include(<meta>) && defined(__cpp_reflection)
    // C++26 native reflection path
    template for (constexpr auto m : std::meta::nonstatic_data_members_of(^^T)) { ... }
#else
    // Fallback: manual field list or Boost.PFR
    boost::pfr::for_each_field(obj, handler);
#endif
```

**Detection tip:** Add a `CI_REQUIRES_COMPILER_VERSION` check in CMake for any C++26 feature file. Build failures on CI are the first honest report of real compiler support.

## Code Example

```cpp
#include <iostream>

consteval int cube(int x) {
    return x * x * x;
}

int main() {
    constexpr int value = cube(4);
    std::cout << "Day 23 - Modern Features Preview\n";
    std::cout << "consteval cube(4)=" << value << "\n";
    return 0;
}
```
