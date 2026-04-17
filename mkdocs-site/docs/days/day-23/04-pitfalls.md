---
title: "04 — Pitfalls · Day 23"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-alert: 04 — Pitfalls: Modern Features Preview C++26

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls — Day 23: C++26 Modern Features Preview

??? pitfall-lobe "⚠️ Pitfall 1 — Using C++26 Reflection in Production Without Stable Compiler Support"
    **Problem:** Adopting `^^T` reflection syntax in production code before the feature is available in released, stable compilers used by the whole team.

    **BAD:**

    ``` cpp
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

    ``` cpp
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

??? pitfall-lobe "⚠️ Pitfall 2 — Contracts Used as Defensive Programming Instead of Design"
    **Problem:** Adding contracts to every function as a defensive coding habit instead of using them to express caller/callee responsibilities at API boundaries.

    **BAD:**

    ``` cpp
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

    ``` cpp
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

??? pitfall-lobe "⚠️ Pitfall 3 — Misunderstanding `inspect` Exhaustiveness"
    **Problem:** Assuming that an `inspect` block without a catch-all handles all cases, leading to a compile error or silent fallthrough at runtime.

    **BAD (assuming the P2688 experimental syntax):**

    ``` cpp
    std::variant<int, double> v = 3.14;

    inspect (v) {
        <int> i    => process_int(i);
        // Missing: <double> arm — compile error or runtime fallthrough
    };
    ```

    **Why it fails:** Pattern matching compilers enforce exhaustiveness for types where it can be determined (`std::variant`, `enum`). Missing a variant arm is a compile error. Even if a catch-all is implicit, relying on it masks unhandled cases.

    **GOOD — explicitly handle all cases, or add a catch-all with a static assertion:**

    ``` cpp
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

??? pitfall-lobe "⚠️ Pitfall 4 — Blocking on a Sender with `sync_wait` Inside Async Contexts"
    **Problem:** Calling `std::execution::sync_wait` inside a coroutine or a thread-pool task, blocking a thread that should remain free for other work.

    **BAD:**

    ``` cpp
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

    ``` cpp
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

??? pitfall-lobe "⚠️ Pitfall 5 — `std::inplace_vector` Overflow Without Checking"
    **Problem:** Using `push_back` on a full `inplace_vector` throws `std::bad_alloc`, but this is often unexpected because "allocation failure" feels irrelevant for a stack-based container.

    **BAD:**

    ``` cpp
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

    **GOOD — use \`\`try_push_back\`\` and handle the full case explicitly:**

    ``` cpp
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

??? pitfall-lobe "⚠️ Pitfall 6 — Confusing Merged-into-Draft with Implemented-in-Compiler"
    **Problem:** Reading that a paper is "merged into C++26" and assuming it is available in released compilers immediately.

    **BAD assumption:**

    ``` cpp
    // P2996 (Reflection) merged into C++26 draft — so let's use it!
    // ... writes reflection code ...
    // Tries to compile with GCC 14, MSVC 2022 — both fail entirely.
    // "But it was merged into the standard!"
    ```

    **Why it fails:** "Merged into the C++26 working draft" means the ISO committee voted to include the feature in the specification document being developed. It does NOT mean any production compiler implements it yet. Compiler implementors typically lag 6–24 months behind the formal specification. As of early 2025, only Clang trunk and EDG implement P2996 reflection, neither of which is suitable for production use.

    **GOOD — check cppref compiler support table before writing production code:**

    ``` text
    Workflow for using C++26 features:
    1. Check https://en.cppreference.com/w/cpp/compiler_support for the feature.
    2. If "partial" or "no" on your target compilers → use an alternative today.
    3. If "yes" on all target compilers → adopt with a feature-test macro guard.
    4. Write the migration plan from today's workaround to the C++26 native form.
    ```

    ``` cpp
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


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 23:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
