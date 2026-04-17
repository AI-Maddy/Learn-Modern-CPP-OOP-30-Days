---
title: "04 — Pitfalls · Day 09"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-alert: 04 — Pitfalls: Templates Basics

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls — Day 09: Templates Basics

??? pitfall-lobe "⚠️ Pitfall 1: Template Definition in a .cpp File"
    **Description**: Placing a template's definition in a .cpp file and its declaration in a header. The linker cannot find the instantiation for translation units that only see the header.

    **BAD**

    ``` cpp
    // math_utils.h
    template <typename T>
    T square(T v);   // declaration only

    // math_utils.cpp
    template <typename T>
    T square(T v) { return v * v; }   // definition hidden from other TUs

    // main.cpp
    #include "math_utils.h"
    int x = square(5);   // LINKER ERROR: undefined reference to square<int>
    ```

    **Why it fails**: The compiler instantiates `square<int>` only in translation units that see the definition. `main.cpp` sees only the declaration, so no instantiation is generated there. The linker finds no definition.

    **GOOD**

    ``` cpp
    // math_utils.h — definition lives in the header
    template <typename T>
    T square(T v) { return v * v; }   // visible to all includers

    // Or: use explicit instantiation if you want to keep the .cpp
    // math_utils.h
    extern template int square(int);   // declaration: do not instantiate here

    // math_utils.cpp
    template int square(int);          // explicit: instantiate exactly once
    ```

    **Detection tip**: Linker errors about `undefined reference to foo<SomeType>` almost always mean the template definition is not visible at the instantiation site.

??? pitfall-lobe "⚠️ Pitfall 2: Accidental Copy in Pass-by-Value Template"
    **Description**: A template function taking `T` by value makes an unexpected deep copy of a large object because the caller passed an lvalue.

    **BAD**

    ``` cpp
    template <typename T>
    void store(T item) {           // T deduced as std::vector<int> — deep copy!
        database.push_back(item);
    }

    std::vector<int> big(1'000'000, 0);
    store(big);    // copies 1 million ints — unintentional
    ```

    **Why it fails**: When `T` is deduced as `std::vector<int>`, the parameter `item` is a copy. The caller did not ask for a copy.

    **GOOD**

    ``` cpp
    // Accept forwarding reference — binds to both lvalue and rvalue
    template <typename T>
    void store(T&& item) {
        database.push_back(std::forward<T>(item));
    }

    store(big);             // T = vector<int>&  — no copy, just reference used
    store(std::move(big));  // T = vector<int>   — move, no copy
    ```

    **Detection tip**: Use `-Weffc++` or clang-tidy's `performance-unnecessary-copy-initialization` to catch unintended copies of non-trivial types.

??? pitfall-lobe "⚠️ Pitfall 3: Specialising Function Templates — Use Overloads Instead"
    **Description**: Partially specialising a function template is not allowed, and full specialisation interacts poorly with overload resolution in surprising ways.

    **BAD**

    ``` cpp
    template <typename T>
    std::string describe(T v) { return "generic"; }

    // Attempt at full specialisation for pointer types
    template <typename T>
    std::string describe(T* p) { return "pointer"; }  // This is an OVERLOAD, not
                                                       // a partial specialisation.
                                                       // Overloading is fine here,
                                                       // but full specialisation:
    template <>
    std::string describe<int>(int v) { return "int"; } // Full spec of primary
    // The specialisation is of the primary, not the overload — confusing!
    ```

    **Why it fails**: When you add overloads and specialisations, the resolution order is: pick the overload first (ignoring specialisations), then check specialisations of the chosen overload. Specialising the wrong base template produces the wrong result.

    **GOOD**

    ``` cpp
    // Use overloads or a class template with partial specialisation instead
    template <typename T>
    struct Describe {
        static std::string value() { return "generic"; }
    };

    template <typename T>
    struct Describe<T*> {        // partial specialisation — well-defined
        static std::string value() { return "pointer"; }
    };

    template <>
    struct Describe<int> {       // full specialisation — well-defined
        static std::string value() { return "int"; }
    };
    ```

    **Detection tip**: If you find yourself writing `template <> T foo<X>(...)` for a function template, consider switching to a class template with specialisation.

??? pitfall-lobe "⚠️ Pitfall 4: Dependent Name Lookup — Missing `typename` and `template`"
    **Description**: Inside a template, names that depend on a template parameter need `typename` (for types) or `template` (for templates) to help the compiler parse correctly.

    **BAD**

    ``` cpp
    template <typename Container>
    void first_element(Container& c) {
        Container::iterator it = c.begin();  // ERROR: missing typename
        *it = 0;
    }
    ```

    **Why it fails**: When the compiler first parses the template body, it does not know what `Container::iterator` is — it might be a static member variable, not a type. The standard requires `typename` to disambiguate.

    **GOOD**

    ``` cpp
    template <typename Container>
    void first_element(Container& c) {
        typename Container::iterator it = c.begin();  // OK
        *it = 0;
    }

    // Similarly for template member functions of a dependent type:
    template <typename Alloc>
    void allocate_int(Alloc& a) {
        auto p = a.template allocate<int>(1);  // 'template' keyword required
    }
    ```

    **Detection tip**: GCC and Clang error messages that say "need 'typename' before ..." or "use 'template' keyword to treat ..." directly point to this issue.

??? pitfall-lobe "⚠️ Pitfall 5: Infinite Recursion in Variadic Template — Missing Base Case"
    **Description**: A variadic template that recurses on the parameter pack without a zero-argument base case will fail to compile with an opaque recursion error.

    **BAD**

    ``` cpp
    template <typename... Args>
    void log_all(Args... args) {
        // Expands forever — no base case!
        log_all(args...);   // no pack shrinkage — infinite recursion
    }
    ```

    **Why it fails**: The pack never shrinks; the recursion never terminates. The compiler runs out of template instantiation depth and reports a truncated error.

    **GOOD**

    ``` cpp
    // Base case: nothing to print
    void log_all() {}

    // Recursive case: peel off first element
    template <typename First, typename... Rest>
    void log_all(First first, Rest... rest) {
        std::cout << first << ' ';
        log_all(rest...);   // rest has one fewer element
    }

    // C++17 alternative using fold expression — no recursion needed
    template <typename... Args>
    void log_fold(Args... args) {
        ((std::cout << args << ' '), ...);  // comma fold
    }
    ```

    **Detection tip**: When template recursion errors mention hundreds of instantiation levels, look for a missing base-case overload. Prefer fold expressions in C++17.

??? pitfall-lobe "⚠️ Pitfall 6: Non-Type Template Parameter — ODR Violation with Inline Variables"
    **Description**: Using a non-type template parameter with an address that has internal linkage can cause one-definition rule (ODR) violations when the template is instantiated in multiple translation units.

    **BAD**

    ``` cpp
    // Internal-linkage value in each TU — each TU gets its own copy
    static const int kLimit = 10;

    template <const int* Ptr>
    struct Policy { /* uses Ptr */ };

    Policy<&kLimit> p;   // each TU instantiates with a different kLimit address!
    ```

    **Why it fails**: `static` variables have internal linkage, so each translation unit has a distinct object. The template instantiation is technically different in each TU, which violates ODR.

    **GOOD**

    ``` cpp
    // External linkage — one object, one address across all TUs
    // limits.h
    extern const int kLimit;

    // limits.cpp
    const int kLimit = 10;

    template <const int* Ptr>
    struct Policy { /* uses Ptr */ };

    Policy<&kLimit> p;   // same address everywhere — ODR satisfied
    ```

    **Detection tip**: Use `-Wno-undefined-var-template` and `-fsanitize=address` with `-fno-omit-frame-pointer` to catch ODR issues. In C++17+, prefer `inline` variables for constants that must have a single address.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 09:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
