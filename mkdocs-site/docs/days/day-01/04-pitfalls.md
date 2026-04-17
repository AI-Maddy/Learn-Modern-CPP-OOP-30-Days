---
title: "04 — Pitfalls · Day 01"
---

<div class="brain-cluster-banner" data-cluster="foundations">
  🔵 &nbsp; **Foundations** &nbsp;·&nbsp; Frontal Lobe
</div>



# :material-alert: 04 — Pitfalls: Variables Types Constexpr

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls — Day 01: Variables, Types, Constexpr

??? pitfall-lobe "⚠️ Pitfall 1: Uninitialised Variables"
    **Description:** Declaring a variable without an initialiser and then reading from it before a guaranteed assignment. The value is indeterminate — reading it is undefined behaviour.

    **BAD code:**

    ``` cpp
    #include <iostream>

    int main() {
        int result;             // uninitialised: value is garbage
        int x = 5;
        if (x > 10) {
            result = x * 2;
        }
        std::cout << result << '\n';   // UB when x <= 10: reads indeterminate value
    }
    ```

    **Why it fails:** The compiler is not required to zero-initialise local variables. With optimisations, it may reuse a register that happened to hold any value. With UBSan enabled, this is flagged as "use of uninitialised value". Without sanitisers, the program produces unpredictable output or crashes.

    **GOOD code:**

    ``` cpp
    #include <iostream>

    int main() {
        int result{0};          // explicitly zero-initialised
        int x = 5;
        if (x > 10) {
            result = x * 2;
        }
        std::cout << result << '\n';   // always defined: prints 0 when x <= 10
    }
    ```

    **Detection tip:** Compile with `-Wuninitialized` (included in `-Wall`). Enable UBSan (`-fsanitize=undefined`) in Debug builds. `clang-tidy` check `cppcoreguidelines-init-variables` also catches this pattern.

??? pitfall-lobe "⚠️ Pitfall 2: Silent Narrowing Conversion"
    **Description:** Assigning a wider type to a narrower type using `=` or `()`, which silently truncates or changes the value with no diagnostic.

    **BAD code:**

    ``` cpp
    double precise = 3.99999;
    int truncated = precise;       // silently becomes 3 — fractional part lost
    int also_bad(precise);         // also silently truncates

    long long big = 4'000'000'000LL;
    int overflow = big;            // wraps to a negative number on 32-bit int

    void configure(float scale) {
        int pixels = scale * 1920; // double arithmetic, silent narrowing to int
    }
    ```

    **Why it fails:** The implicit narrowing is a legacy C behaviour that C++ inherited. With `-Wconversion` the compiler warns, but without it the truncation is silent. The result is a value that is wrong in a way that may not be immediately obvious.

    **GOOD code:**

    ``` cpp
    double precise = 3.99999;
    int truncated{static_cast<int>(precise)};  // explicit: intent is clear

    // Brace init catches narrowing at compile time
    // int bad{precise};   // ERROR: narrowing conversion

    long long big = 4'000'000'000LL;
    // Use the wider type, or check the range before converting
    if (big <= std::numeric_limits<int>::max()) {
        int safe = static_cast<int>(big);
    }
    ```

    **Detection tip:** Enable `-Wconversion -Wsign-conversion`. Use `{}` brace initialisation everywhere — it makes narrowing a hard compile error rather than a warning.

??? pitfall-lobe "⚠️ Pitfall 3: Using `#define` for Constants"
    **Description:** Defining compile-time constants with the C preprocessor macro `#define` instead of `constexpr`. Macros have no type, no scope, and no debugger visibility.

    **BAD code:**

    ``` cpp
    #define MAX_CONNECTIONS 100
    #define PI 3.14159
    #define SQUARE(x) ((x) * (x))   // function-like macro — many subtle bugs

    void process(int n) {
        for (int i = 0; i < MAX_CONNECTIONS; ++i) { /* ... */ }
    }

    int area = SQUARE(3 + 1);   // expands to ((3+1)*(3+1)) = 16: OK by accident
    int bad  = SQUARE(++i);     // expands to ((++i)*(++i)): double increment — UB
    ```

    **Why it fails:** `#define` macros are textual substitution with no type checking. They can cause double evaluation (see `SQUARE(++i)`), pollute all scopes, cannot be namespaced, and do not appear in the debugger symbol table. Name collisions with system headers or other code produce confusing diagnostics.

    **GOOD code:**

    ``` cpp
    #include <numbers>   // C++20 mathematical constants

    constexpr int MAX_CONNECTIONS{100};
    constexpr double PI{3.14159265358979};   // or std::numbers::pi

    // Use a constexpr function instead of a function-like macro
    constexpr int square(int x) { return x * x; }

    void process(int n) {
        for (int i{0}; i < MAX_CONNECTIONS; ++i) { /* ... */ }
    }

    constexpr int area = square(4);   // evaluated at compile time: 16
    ```

    **Detection tip:** `clang-tidy` check `cppcoreguidelines-macro-usage` flags macros that should be replaced with `constexpr` or inline functions.

??? pitfall-lobe "⚠️ Pitfall 4: Signed/Unsigned Comparison"
    **Description:** Comparing a signed integer to an unsigned integer (e.g., comparing an `int` loop counter to `std::vector::size()` which returns `std::size_t`).

    **BAD code:**

    ``` cpp
    #include <vector>

    int main() {
        std::vector<int> v{1, 2, 3};
        for (int i = 0; i < v.size(); ++i) {   // WARNING: signed/unsigned mismatch
            // v.size() returns std::size_t (unsigned)
            // comparison of int and size_t is implementation-defined when int is negative
        }
    }
    ```

    **Why it fails:** If `i` wraps to a large negative number (which is UB for signed overflow but could happen in unusual circumstances), converting it to `std::size_t` produces a huge positive number, making the comparison `i < v.size()` false when you might expect it to be true. The `-Wsign-conversion` flag warns about this.

    **GOOD code:**

    ``` cpp
    #include <vector>
    #include <cstddef>

    int main() {
        std::vector<int> v{1, 2, 3};

        // Option 1: use std::size_t for the loop counter
        for (std::size_t i{0}; i < v.size(); ++i) { /* ... */ }

        // Option 2: range-for (preferred — no index arithmetic at all)
        for (const auto& elem : v) { /* ... */ }

        // Option 3: explicit cast (when you need the index as signed elsewhere)
        for (int i{0}; i < static_cast<int>(v.size()); ++i) { /* ... */ }
    }
    ```

    **Detection tip:** Enable `-Wsign-conversion`. Prefer range-based for loops to eliminate index arithmetic entirely.

??? pitfall-lobe "⚠️ Pitfall 5: Misunderstanding `auto` Reference Semantics"
    **Description:** Using `auto` without `&` when iterating over a container, causing an unexpected copy of each element.

    **BAD code:**

    ``` cpp
    #include <vector>
    #include <string>

    int main() {
        std::vector<std::string> names{"Alice", "Bob", "Charlie"};

        // Copies each string — expensive and mutations don't affect the vector
        for (auto name : names) {
            name += " Smith";   // modifies the copy, not the original
        }
        // names is unchanged — likely a bug
    }
    ```

    **Why it fails:** `auto name` deduces `std::string` (a value), not `std::string&` (a reference). Each iteration copies the string. For large objects this is expensive, and if the intent was to mutate the container elements the mutations are silently discarded.

    **GOOD code:**

    ``` cpp
    #include <vector>
    #include <string>

    int main() {
        std::vector<std::string> names{"Alice", "Bob", "Charlie"};

        // Const reference: read-only, no copy
        for (const auto& name : names) {
            std::cout << name << '\n';
        }

        // Mutable reference: modify in place
        for (auto& name : names) {
            name += " Smith";   // modifies the original element
        }
        // names is now {"Alice Smith", "Bob Smith", "Charlie Smith"}
    }
    ```

    **Detection tip:** `clang-tidy` check `performance-for-range-copy` flags range-for loops that copy an element when a `const` reference would suffice.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 01:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
