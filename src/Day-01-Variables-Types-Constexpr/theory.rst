Day 01 — Variables, Types, and Constexpr
=========================================

Why This Day Matters
--------------------

Types are the backbone of C++. The type system lets the compiler prove correctness, enable
optimisations, and catch entire classes of bugs before the program ever runs. Choosing the right
type, initialising it correctly, and understanding when a value is known at compile time versus
runtime determines the quality of code you write for the rest of the course.

This day covers the vocabulary every subsequent day relies on: fundamental types, ``auto``,
``const``, ``constexpr``, structured bindings, value categories, brace initialisation, and the
hazards of implicit narrowing.


Fundamental Types
-----------------

C++ provides a set of built-in types with platform-defined but bounded sizes.

.. code-block:: cpp

    #include <cstdint>   // fixed-width types
    #include <climits>   // INT_MAX, UINT_MAX, ...

    // Prefer fixed-width types whenever bit width matters
    std::int32_t  sensor_id   = 42;       // exactly 32 bits, signed
    std::uint64_t packet_count = 0;       // exactly 64 bits, unsigned
    std::int8_t   flags        = 0x0F;    // exactly 8 bits

    // Use native types when performance matters and width is not the concern
    int           loop_counter = 0;       // fast integer on this platform
    std::size_t   index        = 0;       // correct type for array indices
    std::ptrdiff_t diff        = p2 - p1; // correct type for pointer differences

    // Floating-point
    float       single_precision = 3.14f;  // 32-bit, suffix 'f' avoids narrowing
    double      result           = 0.0;    // 64-bit, default for most calculations
    long double extended         = 0.0L;   // 80 or 128-bit platform-dependent

**Why avoid ``int`` for everything?**

``int`` is at least 16 bits but commonly 32. On a 32-bit embedded system, ``int`` is 32 bits;
on a 64-bit desktop, ``long`` might be 32 or 64 bits depending on the ABI. Use ``std::int32_t``
when the exact width is a protocol requirement.


Brace Initialisation — The Modern Default
------------------------------------------

C++11 introduced uniform brace initialisation, which should be your default. It prevents
narrowing conversions at compile time.

.. code-block:: cpp

    // Brace init: safe, consistent, prevents narrowing
    int   a{42};           // OK
    int   b{3.7};          // ERROR: narrowing conversion from double to int
    float c{1.0};          // WARNING/ERROR: double -> float may lose precision

    // Old-style init: silent narrowing
    int   d = 3.7;         // silently truncates to 3 — a bug that compiles cleanly
    int   e(3.7);          // also silently truncates — confusingly allowed

    // Value-initialise to zero with empty braces
    int   f{};             // f == 0
    double g{};            // g == 0.0

    // Aggregate initialisation
    struct Point { int x; int y; };
    Point p{10, 20};       // clear, no constructor needed

    // std::vector with element list
    std::vector<int> v{1, 2, 3, 4, 5};

**Design rule:** Prefer ``{}`` for all variable initialisation. Use ``=`` only when the right-hand
side is the same type and you want to communicate "copy this value".


``auto`` — Type Deduction
--------------------------

``auto`` asks the compiler to deduce the type from the initialiser. It eliminates redundancy and
makes code more resilient to type changes during refactoring.

.. code-block:: cpp

    #include <vector>
    #include <map>
    #include <string>

    // Without auto — verbose and fragile
    std::map<std::string, std::vector<int>>::iterator it = m.begin();

    // With auto — concise and correct
    auto it2 = m.begin();

    // auto deduces the value type, not a reference
    std::vector<int> nums{1, 2, 3};
    auto  val = nums[0];   // int — a copy
    auto& ref = nums[0];   // int& — a reference; changes affect nums

    // Use auto with care: it hides the type, which can obscure intent
    auto x = compute();    // What type is x? Reader must check compute()'s signature

**When to use auto:**

* Iterator types: always — they are unreadably long.
* Lambda variables: always — the type is unnamed.
* Range-for loops: use ``const auto&`` for non-mutating access.
* When the type is obvious from the right-hand side: ``auto ptr = std::make_unique<Foo>()``.

**When to avoid auto:**

* When the type communicates important domain semantics: ``Price total_cost{...}`` is clearer
  than ``auto total_cost{...}``.
* When the initialiser's type is ambiguous or surprising.


``const`` vs ``constexpr``
---------------------------

These two keywords are related but serve distinct purposes.

.. code-block:: cpp

    // const: the value cannot change after initialisation
    //        but the value is determined at runtime
    const int user_age = get_age_from_input();  // runtime value, immutable

    // constexpr: the value is computed at compile time
    //            the compiler evaluates it during compilation
    constexpr int MAX_PLAYERS = 64;             // embedded in the binary as a constant
    constexpr double PI = 3.14159265358979;

    // constexpr function: can be evaluated at compile time
    constexpr int square(int n) { return n * n; }

    constexpr int area = square(10);   // evaluated at compile time: area == 100
    int side = get_side();
    int runtime_area = square(side);   // evaluated at runtime: also valid

    // C++20: consteval — MUST be evaluated at compile time
    consteval int cube(int n) { return n * n * n; }

    constexpr int c1 = cube(3);   // OK: compile-time evaluation
    // int c2 = cube(x);          // ERROR: x is not a constant expression

**Why prefer ``constexpr`` over ``#define``?**

``#define MAX 64`` is a textual substitution with no type, no scope, and no debugger visibility.
``constexpr int MAX{64}`` is a typed, scoped constant that appears in the debugger, respects
namespaces, and enables overload resolution.

.. code-block:: cpp

    // BAD: C-style macro constant
    #define BUFFER_SIZE 1024

    // GOOD: constexpr constant
    constexpr std::size_t BUFFER_SIZE{1024};

    // GOOD: in a namespace for additional scoping
    namespace net {
        constexpr std::size_t MAX_PACKET_SIZE{65535};
    }


Structured Bindings (C++17)
----------------------------

Structured bindings let you unpack tuples, pairs, arrays, and aggregates into named variables,
eliminating ``.first``, ``.second``, and ``get<N>`` noise.

.. code-block:: cpp

    #include <map>
    #include <string>
    #include <tuple>

    // Unpack a pair
    std::map<std::string, int> scores;
    scores["Alice"] = 95;

    for (const auto& [name, score] : scores) {
        // name: const std::string&, score: const int&
        std::cout << name << ": " << score << '\n';
    }

    // Unpack a tuple
    auto get_config() -> std::tuple<int, std::string, bool> {
        return {8080, "localhost", true};
    }

    auto [port, host, tls] = get_config();

    // Unpack an aggregate struct
    struct BoundingBox { float x, y, width, height; };
    BoundingBox bb{10.f, 20.f, 100.f, 50.f};
    auto [bx, by, bw, bh] = bb;

    // Structured binding with map::insert result
    auto [iter, inserted] = scores.emplace("Bob", 88);
    if (inserted) { /* new element */ }


Value Categories: lvalue and rvalue
-------------------------------------

Every expression in C++ belongs to a value category. Understanding this is essential for writing
efficient code and understanding move semantics (covered in depth on Day 13).

::

    Value Categories
    ┌────────────────────────────────────────────────┐
    │  glvalue (has identity)                        │
    │  ┌───────────┐   ┌──────────────────────────┐  │
    │  │  lvalue   │   │        xvalue             │  │
    │  │ (storable)│   │ (movable named result)    │  │
    │  └───────────┘   └──────────────────────────┘  │
    └────────────────────────────────────────────────┘
    ┌────────────────────────────────────────────────┐
    │  rvalue (no persistent identity)               │
    │  ┌───────────┐   ┌──────────────────────────┐  │
    │  │  prvalue  │   │        xvalue             │  │
    │  │(temporary)│   │ (std::move result)        │  │
    │  └───────────┘   └──────────────────────────┘  │
    └────────────────────────────────────────────────┘

.. code-block:: cpp

    int x = 10;         // x is an lvalue: has a name, has an address
    int y = x + 5;      // (x + 5) is a prvalue: temporary, no address
    int&& r = x + 5;    // bind a temporary to an rvalue reference

    // You can take the address of an lvalue
    int* p = &x;        // OK

    // You cannot take the address of a prvalue
    // int* q = &(x + 5);  // ERROR

    // std::move casts lvalue to xvalue — enabling the move constructor
    std::string s1 = "hello";
    std::string s2 = std::move(s1);  // s1 is now in a valid but unspecified state

**Practical rule:** pass by ``const T&`` to read without copying; pass by ``T&&`` to transfer
ownership; pass by value when the function always needs its own copy.


Integer Overflow and Narrowing
--------------------------------

These are two of the most common sources of silent bugs in C++.

**Integer overflow (signed):**

.. code-block:: cpp

    #include <climits>
    #include <cstdint>

    int a = INT_MAX;
    int b = a + 1;          // UB: signed overflow; do NOT rely on wrap-around
                            // UBSan will report: signed integer overflow

    // Safe: use unsigned if wrapping is intentional
    unsigned int ua = UINT_MAX;
    unsigned int ub = ua + 1;   // defined: wraps to 0

    // Safe: check before operating
    bool will_overflow(int x, int y) {
        return x > 0 && y > INT_MAX - x;
    }

    // Safe: use wider type
    std::int64_t result = static_cast<std::int64_t>(a) + 1;  // no overflow

**Narrowing conversion:**

.. code-block:: cpp

    double d = 3.99;
    int i = d;         // silently truncates to 3 — no warning without -Wconversion
    int j{d};          // compile ERROR: narrowing conversion in brace init

    // Explicit cast communicates intent
    int k = static_cast<int>(d);   // truncates to 3, but you meant to do it

    // When converting between integer widths
    long long big = 1'000'000'000'000LL;
    int small = big;           // silent overflow without -Wconversion
    int small2{big};           // ERROR: narrowing

**Rule:** Always use brace initialisation. Use ``static_cast`` when a narrowing conversion is
genuinely needed. Never use C-style casts.


Modern C++ Best Practices Summary
----------------------------------

* Use ``{}``) for all initialisations — prevents narrowing silently.
* Use ``constexpr`` for compile-time constants instead of ``#define``.
* Use ``auto`` for iterator types and obvious initialisers; spell out the type for domain clarity.
* Use fixed-width types (``std::int32_t``) when bit width is part of the contract.
* Never rely on signed integer overflow — it is undefined behaviour.
* Use structured bindings to unpack pair/tuple/aggregate results cleanly.


Self-Check Questions
--------------------

**Q1: What is the difference between ``const`` and ``constexpr``? Can a ``constexpr`` variable
be used at runtime?**

``const`` declares a variable whose value cannot change after initialisation; the value may be
determined at runtime. ``constexpr`` declares a variable (or function) whose value is computed at
compile time and embedded in the binary. A ``constexpr`` variable can also be used at runtime —
the guarantee is that it *can* be evaluated at compile time, not that it *only* exists there.

**Q2: Why does ``int x{3.7};`` fail to compile while ``int x = 3.7;`` succeeds?**

Brace initialisation forbids narrowing conversions. Assigning a ``double`` to an ``int`` loses the
fractional part, which the compiler treats as a narrowing conversion and rejects inside ``{}``.
The assignment form ``= 3.7`` allows the implicit conversion (a historical C legacy) and silently
truncates to 3.

**Q3: When should you use ``std::size_t`` instead of ``int`` for a loop counter?**

Use ``std::size_t`` (which is an unsigned type) when the loop index is used to access a container
or array, because container sizes and indices are unsigned. Comparing a signed ``int`` to an
unsigned ``std::size_t`` triggers ``-Wsign-conversion``. If you mix signed and unsigned arithmetic
and the signed value is negative, the comparison produces surprising results due to unsigned
wrap-around.

**Q4: What is an xvalue and when do you create one?**

An xvalue ("expiring value") is an object that has identity (like an lvalue) but whose resources
can be transferred (like an rvalue). You create an xvalue by calling ``std::move(obj)``, which
casts the lvalue ``obj`` to ``T&&``. The move constructor or move assignment operator of the
target type then transfers the resources, leaving ``obj`` in a valid but unspecified state.
