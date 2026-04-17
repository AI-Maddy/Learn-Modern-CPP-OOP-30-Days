---
title: "Cpp Core Guidelines"
tags: ["cheatsheet", "reference"]
---

# :material-book: Cpp Core Guidelines


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# C++ Core Guidelines — Top Rules

<div class="contents" local="" depth="2">

Sections

</div>

## Overview

The C++ Core Guidelines (<https://isocpp.github.io/CppCoreGuidelines/>) document best practices maintained by Bjarne Stroustrup and Herb Sutter. The rules below are the highest-value ones for modern OOP codebases.

## Philosophy (P.)

**P.1 — Express intent in code, not comments**

``` cpp
// BAD: intent hidden in comment
void* p = malloc(100);   // allocates a buffer for ints

// GOOD: type and intent are in the code
auto buf = std::vector<int>(25);
```

**P.2 — Write in ISO Standard C++**

Avoid compiler extensions (`__attribute__`, `__declspec`) except behind `#ifdef` macros that have standard alternatives. Prefer `[[nodiscard]]` over GCC's `__attribute__((warn_unused_result))`.

**P.3 — Express intent**

``` cpp
// BAD: raw loop — what does it do?
for (int i = 0; i < v.size(); ++i) if (v[i] > 0) v[i] *= 2;

// GOOD: algorithm expresses intent
for (auto& x : v | std::views::filter([](int x){ return x > 0; })) x *= 2;
```

**P.5 — Prefer compile-time checking over runtime checking**

``` cpp
// BAD: runtime check
void process(int* data, int size) {
    if (size < 0) throw std::invalid_argument("size < 0");
}

// GOOD: type system prevents negative size
void process(std::span<int> data) { /* size_t is always non-negative */ }
```

## Function Rules (F.)

**F.1 — Package meaningful operations as functions**

A function should do one thing and have a name that says what it does. If you need a comment to explain the body, consider extracting a function.

**F.2 — A function should perform a single logical operation**

``` cpp
// BAD: one function does parsing AND logging AND storing
void process_input(std::string_view s);

// GOOD: separate steps
auto parsed  = parse_record(s);
log_record(parsed);
store_record(db, parsed);
```

**F.3 — Keep functions short and simple**

Target: fits on one screen (~40 lines). If it doesn't, extract helpers.

**F.4 — If a function must be evaluated at compile time, declare it constexpr**

``` cpp
constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
static_assert(factorial(5) == 120);
```

**F.6 — If a function must not throw, declare it noexcept**

``` cpp
void swap(Buffer& a, Buffer& b) noexcept {
    using std::swap;
    swap(a.ptr, b.ptr);
    swap(a.sz,  b.sz);
}
// noexcept enables move-based reallocation in std::vector
```

## Class Rules (C.)

**C.1 — Organise related data into structs**

``` cpp
// BAD: free-standing related parameters
void draw(int x, int y, int w, int h, Color c);

// GOOD: group into a type
struct Rect { int x, y, w, h; };
void draw(Rect r, Color c);
```

**C.2 — Use class if the invariant must be maintained; struct if all public**

``` cpp
struct Point { int x, y; };   // struct: no invariant

class BankAccount {            // class: balance must stay >= 0
    double balance_ = 0;
public:
    bool withdraw(double amount) {
        if (amount > balance_) return false;
        balance_ -= amount;
        return true;
    }
};
```

**C.4 — Make a function a member only if it needs direct access to the internal representation**

``` cpp
class String { /*...*/ };

// BAD: concatenation as member — widens String's interface unnecessarily
class String { String operator+(const String&) const; };

// GOOD: free function — can be implemented using public API
String operator+(const String& a, const String& b);
```

**C.7 — Don't define a class or enum and declare a variable in the same statement**

``` cpp
// BAD: two separate concerns on one line
struct { int x; } obj;

// GOOD: separate declarations
struct Temp { int x; };
Temp obj;
```

**C.9 — Minimise exposure of members**

Data members should be `private`. Expose only through a documented API. This allows invariant enforcement and future implementation changes.

**C.10 — Prefer concrete types over class hierarchies**

``` cpp
// BAD: class hierarchy for simple value types
class Shape { virtual double area() const = 0; };
class Circle : public Shape { ... };

// GOOD: std::variant when type set is closed
using Shape = std::variant<Circle, Rectangle, Triangle>;
double area = std::visit([](const auto& s){ return s.area(); }, shape);
```

## Resource Management (R.)

**R.1 — Manage resources automatically using resource handles**

``` cpp
// BAD: manual memory management
void process() {
    Bitmap* bmp = new Bitmap{1920, 1080};
    // ... exception here leaks bmp!
    delete bmp;
}

// GOOD: RAII wrapper (smart pointer)
void process() {
    auto bmp = std::make_unique<Bitmap>(1920, 1080);
    // destructor called automatically, even on exception
}
```

**R.3 — A raw pointer (T\*) is non-owning**

``` cpp
// BAD: ambiguous ownership
Foo* create();    // does caller own this? must they delete it?

// GOOD: express ownership in the type
std::unique_ptr<Foo> create();   // unique ownership, caller deletes
std::shared_ptr<Foo> get_shared();  // shared ownership
Foo* observe(Container& c);     // non-owning: valid as long as c is alive
```

**R.4 — A raw reference (T&) is non-owning**

A reference parameter means the caller retains ownership. A function returning a reference must ensure the referent outlives the reference.

**R.5 — Prefer scoped objects, don't heap-allocate unnecessarily**

``` cpp
// BAD: unnecessary heap allocation
auto p = std::make_unique<std::vector<int>>();
p->push_back(1);

// GOOD: stack-allocated vector is fine; unique_ptr is overhead
std::vector<int> v;
v.push_back(1);
```

## Expressions and Statements (ES.)

**ES.1 — Prefer the standard library to other libraries**

Prefer `std::sort` over a hand-rolled sort; `std::string` over `char[]`; `std::span` over raw pointer + size.

**ES.5 — Keep scopes small**

Declare variables at the point of first use, not at the top of a function.

``` cpp
// BAD: variables declared far from use
int result;
// ... 30 lines of code ...
result = compute();
return result;

// GOOD:
return compute();
```

**ES.10 — Declare one name per declaration**

``` cpp
// BAD: easy to misread, especially with pointers
int* a, b;   // a is int*, b is int — surprising!

// GOOD:
int* a;
int  b;
```

**ES.6 — Declare loop variables in for-loop initializers**

``` cpp
// BAD: i leaks into surrounding scope
int i;
for (i = 0; i < n; ++i) { ... }

// GOOD: i is scoped to the loop
for (int i = 0; i < n; ++i) { ... }
```

## Enum Rules (Enum.)

**Enum.3 — Prefer class enums over plain enums**

``` cpp
// BAD: plain enum pollutes the enclosing namespace
enum Color { Red, Green, Blue };   // Red, Green, Blue visible everywhere

// GOOD: scoped enum
enum class Color { Red, Green, Blue };
Color c = Color::Red;   // no namespace pollution
```

**Enum.5 — Don't use ALL_CAPS for enumerators**

``` cpp
// BAD: ALL_CAPS suggest macros
enum class Dir { NORTH, SOUTH, EAST, WEST };

// GOOD: CamelCase or snake_case with enum class
enum class Dir { North, South, East, West };
```

## Checklist for Code Review

- Every raw owning pointer replaced by `unique_ptr` or `shared_ptr`?
- Every class with virtual functions has a virtual destructor?
- Every destructor, move ctor, move assignment declared noexcept?
- Data members private unless the type is a pure value struct?
- Constructor establishes and destructor maintains the class invariant?
- Functions shorter than ~40 lines, each doing one thing?
- No `new` or `delete` in application code (only in custom RAII types)?
- No C-style casts; only `static_cast`, `reinterpret_cast`, `dynamic_cast`?
- No global mutable state; singletons replaced by dependency injection?
- All output-only parameters replaced by return values?
- All in/out parameters passed as non-const reference; inputs as `const ref` or value?
- Exception specifications: noexcept where guaranteed, nothing otherwise?
- Constructors that may fail do not throw in the initializer list (or use factory)?

## Cross-References

- `common-pitfalls.rst` — concrete examples of guideline violations
- `raii-smart-pointers.rst` — R. rules in depth
- `error-handling-expected.rst` — alternative to throwing constructors
- `debugging-tools-2026.rst` — clang-tidy enforces many Core Guideline rules


---

[← All Cheatsheets](index.md)
