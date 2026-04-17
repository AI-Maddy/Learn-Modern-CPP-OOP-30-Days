# Day 21: pImpl Idiom and Type Erasure

## Why This Day Matters

Two recurring problems plague C++ library design: the **compilation firewall** problem (changing a private member forces recompilation of all consumers of the public header) and **ABI stability** (changing private data breaks binary compatibility of shared libraries). The pImpl idiom solves both by hiding all private state behind an opaque pointer. Type erasure — through `std::function`, `std::any`, and custom patterns — solves the orthogonal problem of working with values of heterogeneous types without requiring inheritance. Together these techniques are the foundation of robust, maintainable C++ library design.

## Learning Outcomes

By the end of this day you will be able to:

* Implement the pImpl idiom with `std::unique_ptr<Impl>` and explain why the destructor, move constructor, and move assignment must be defined in the `.cpp` file.
* Explain how pImpl creates a compilation firewall and achieves ABI stability in shared libraries.
* Use `std::function` and `std::any` as standard type-erasing vocabulary types and handle type mismatches correctly.
* Implement a custom `AnyX` type-erasing wrapper using the `Concept`/`Model<T>` internal pattern with value semantics via a virtual `clone()` method.
* Choose between `std::variant` (closed-set, stack, zero virtual overhead) and custom type erasure (open-set, heap, value semantics) for a given design.
* Write an `overloaded` helper and use it with `std::visit` to dispatch over all variant alternatives.

## Key Concepts

* **pImpl (Pointer to Implementation)** — hides private state behind a forward-declared `struct Impl` and a `unique_ptr`; decouples the public header from implementation details.
* **Compilation firewall** — changing `Impl` does not recompile consumers of the public header, since only a pointer (fixed size) is in the header.
* **ABI stability** — binary layout of the public class never changes when `Impl` changes; shipped libraries remain link-compatible.
* **`std::function<Sig>`** — type-erases any callable matching `Sig`; uses SBO to avoid heap allocation for small lambdas.
* **`std::any`** — type-erases any copyable value; `any_cast<T>` retrieves it with a type check.
* **Custom type erasure** — `Concept` virtual interface + `Model<T>` template wraps any type satisfying a conceptual duck-typed interface.
* **`std::variant` + `std::visit`** — closed-set sum type; stack-allocated and dispatched through a jump table, faster than virtual dispatch.

## Theory

### Motivation — Hiding Implementation Details

Two recurring problems in C++ library design:

**Problem 1 — Compilation Firewall:** A header file for a class exposes all private members to every consumer because C++ class layout must be fully known at the point of use. Changing a private member (e.g., adding a new internal `std::string`) forces a recompilation of every translation unit that includes the header — even though the public API didn't change. On large codebases this cascades into minutes or hours of unnecessary rebuilding.

**Problem 2 — ABI Stability:** Shared libraries (.so / .dll) are compiled once and loaded at runtime. If the library's private members change (a private `int` becomes `long`, a `std::vector` is added), the binary layout of the class changes. Applications compiled against the old header become binary incompatible — a crash waiting to happen. This is the **Fragile Base Class problem** at the ABI level.

Both problems are solved by the **pImpl idiom** (Pointer to Implementation), which hides all private state behind an opaque pointer.

### The pImpl Idiom

```cpp
// widget.hpp  (public header — stable, ABI-safe)
#pragma once
#include <memory>
#include <string>

class Widget {
public:
    explicit Widget(std::string title);
    ~Widget();                    // defined in .cpp — not inline

    Widget(Widget&&) noexcept;
    Widget& operator=(Widget&&) noexcept;

    // Copy is optional — only if Impl is copyable
    Widget(const Widget&);
    Widget& operator=(const Widget&);

    void show();
    void hide();
    std::string title() const;

private:
    struct Impl;                         // forward declaration only
    std::unique_ptr<Impl> pImpl_;        // opaque pointer
};
```

```cpp
// widget.cpp  (implementation — not part of the public ABI)
#include "widget.hpp"
#include <vector>      // consumers never see these
#include <map>
#include <some_heavy_internal_library.hpp>

struct Widget::Impl {
    std::string         title;
    std::vector<int>    children;   // can change freely — no ABI impact
    bool                visible{false};
};

Widget::Widget(std::string title)
    : pImpl_{std::make_unique<Impl>()} {
    pImpl_->title = std::move(title);
}

Widget::~Widget() = default;   // MUST be defined here, not in the header
                                // (incomplete Impl type at header inclusion)

Widget::Widget(Widget&&) noexcept = default;
Widget& Widget::operator=(Widget&&) noexcept = default;

Widget::Widget(const Widget& o)
    : pImpl_{std::make_unique<Impl>(*o.pImpl_)} {}

Widget& Widget::operator=(const Widget& o) {
    if (this != &o) *pImpl_ = *o.pImpl_;
    return *this;
}

void Widget::show()  { pImpl_->visible = true; }
void Widget::hide()  { pImpl_->visible = false; }
std::string Widget::title() const { return pImpl_->title; }
```

**Why `~Widget()` must be in the `.cpp`:**

`std::unique_ptr<Impl>`'s destructor calls `delete Impl`. At the point where the destructor is generated (wherever `~Widget()` is defined), `Impl` must be a complete type. If `~Widget()` is defaulted in the header, the compiler tries to generate it there — but `Impl` is only forward-declared. Defining `~Widget() = default;` in the `.cpp` where `Impl` is complete solves this.

```
pImpl layout
─────────────
┌──────────────────────┐
│  Widget (public API) │         ← consumers only see this
│  ┌──────────────────┐│
│  │  pImpl_ ──────────┼────────► Impl (heap)
│  └──────────────────┘│         │  title: string
└──────────────────────┘         │  children: vector
                                  │  visible: bool
                                  └──────────────────
```

**ABI stability:** Adding a new member to `Impl` does not change the layout of `Widget` (still just one pointer). Recompiling only the library `.cpp` is sufficient; applications need not be recompiled.

### Type Erasure — Duck Typing at Runtime

**Type erasure** allows code to work with values of any type that satisfies a conceptual interface, without that type inheriting from a base class. `std::function`, `std::any`, and `std::shared_ptr<void>` are all type-erasing vocabulary types in the standard library.

**`std::function` — type-erasing a callable:**

```cpp
#include <functional>

// Accepts any callable matching (int) -> int
std::function<int(int)> double_fn = [](int x){ return x * 2; };
std::function<int(int)> square_fn = [](int x){ return x * x; };

// Also works with member function pointers:
struct Multiplier {
    int factor;
    int apply(int x) const { return x * factor; }
};

Multiplier m{3};
std::function<int(int)> triple_fn =
    std::bind(&Multiplier::apply, &m, std::placeholders::_1);

// Or a capturing lambda:
int factor = 5;
std::function<int(int)> times5 = [factor](int x){ return x * factor; };
```

The concrete type (lambda, function pointer, `Multiplier`) is erased — the caller only sees `std::function<int(int)>`.

**`std::any` — type-erasing a value:**

```cpp
#include <any>

std::any value = 42;              // holds int
value = std::string("hello");     // now holds string — no inheritance needed
value = std::vector<int>{1,2,3};  // now holds vector<int>

// Access with type check:
if (auto* s = std::any_cast<std::string>(&value))
    std::cout << *s << '\n';

// Throws std::bad_any_cast on type mismatch:
try {
    int i = std::any_cast<int>(value);   // value holds string — throws
} catch (const std::bad_any_cast& e) {
    std::cerr << e.what() << '\n';
}
```

### Custom Type Erasure — The `AnyDrawable` Pattern

The most powerful pattern: type-erase a whole *interface* without inheritance.

```cpp
class AnyDrawable {
public:
    template<typename T>
    AnyDrawable(T obj)
        : self_{std::make_shared<Model<T>>(std::move(obj))} {}

    void draw() const { self_->draw_impl(); }

private:
    struct Concept {
        virtual ~Concept() = default;
        virtual void draw_impl() const = 0;
    };

    template<typename T>
    struct Model : Concept {
        T value;
        explicit Model(T v) : value{std::move(v)} {}
        void draw_impl() const override { value.draw(); }  // T::draw() called here
    };

    std::shared_ptr<Concept> self_;
};

// Any type with a draw() method works — no inheritance required
struct Circle     { void draw() const { std::puts("Circle"); } };
struct Triangle   { void draw() const { std::puts("Triangle"); } };

std::vector<AnyDrawable> shapes;
shapes.emplace_back(Circle{});
shapes.emplace_back(Triangle{});

for (auto& d : shapes) d.draw();
```

```
AnyDrawable layout
──────────────────
┌──────────────────────┐
│  AnyDrawable         │
│  shared_ptr<Concept> ├─────► Concept (vtable)
└──────────────────────┘         ▲           ▲
                            Model<Circle>  Model<Triangle>
                            (holds Circle) (holds Triangle)
```

This achieves the same goal as a virtual `IDrawable` base, but `Circle` and `Triangle` do not inherit from anything — they are value types.

### `std::variant` as Closed-Set Type Erasure

When the set of types is known and fixed at compile time:

```cpp
#include <variant>

struct Circle   { double r; };
struct Square   { double s; };
struct Triangle { double b, h; };

using Shape = std::variant<Circle, Square, Triangle>;

double area(const Shape& sh) {
    return std::visit(overloaded{
        [](const Circle&   c){ return 3.14159 * c.r * c.r; },
        [](const Square&   s){ return s.s * s.s; },
        [](const Triangle& t){ return 0.5 * t.b * t.h; }
    }, sh);
}

// Helper to build an overloaded visitor from multiple lambdas (C++17):
template<typename... Ts> struct overloaded : Ts... { using Ts::operator()...; };
template<typename... Ts> overloaded(Ts...) -> overloaded<Ts...>;
```

`std::variant` is stack-allocated (no heap, no pointer indirection) and the visitor is dispatched through a jump table — faster than virtual dispatch for small type sets.

### Type Erasure Technique Comparison

| Technique           | Heap alloc   | Type set      | Use case           |
|---------------------|--------------|---------------|--------------------|
| Virtual base class  | Yes (new)    | Open          | Classic OOP        |
| `std::function`     | Sometimes*   | Open (callable)| Callbacks, Strategy|
| `std::any`          | Sometimes*   | Open (any)    | Property bags, scripting bindings |
| Custom type erasure | Yes          | Open (concept)| Value semantics containers |
| `std::variant`      | No           | Closed        | Sum types, FSMs    |

\* SBO (Small Buffer Optimisation) avoids heap for small callables/values.

## Pitfalls

### Pitfall 1 — Defaulting the Destructor in the Header

**Problem:** The most common pImpl mistake: `~Widget() = default;` in the header, where `Impl` is incomplete, causes a hard compile error about deleting an incomplete type.

**BAD:**

```cpp
// widget.hpp
class Widget {
public:
    Widget();
    ~Widget() = default;  // WRONG — unique_ptr<Impl> destructor needs complete Impl
private:
    struct Impl;
    std::unique_ptr<Impl> pImpl_;
};
```

**Why it fails:** When the compiler generates `~Widget()`, it must generate the destructor for `unique_ptr<Impl>`, which calls `delete pImpl_.get()`. This requires the full definition of `Impl` to call its destructor — but the header only has a forward declaration. Compile error: "cannot delete pointer to incomplete type."

**GOOD — declare the destructor in the header, define in the `.cpp`:**

```cpp
// widget.hpp
class Widget {
public:
    Widget();
    ~Widget();   // declared, not defined here
private:
    struct Impl;
    std::unique_ptr<Impl> pImpl_;
};

// widget.cpp
#include "widget.hpp"
struct Widget::Impl { /* full definition */ };
Widget::~Widget() = default;  // correct — Impl is complete here
```

**Detection tip:** If you see `unique_ptr<Incomplete>` as a member with `~T() = default` in the header, it will fail. The fix is always to move the destructor definition to the `.cpp`.

### Pitfall 2 — pImpl Without Move Operations (Accidentally Deleted)

**Problem:** Declaring a custom destructor suppresses the compiler-generated move constructor and move assignment operator, making the class accidentally non-movable.

**BAD:**

```cpp
// widget.hpp
class Widget {
public:
    Widget();
    ~Widget();       // declared — suppresses generated move operations
    // No move constructor declared — Widget is now non-movable!
private:
    struct Impl;
    std::unique_ptr<Impl> pImpl_;
};

std::vector<Widget> widgets;
widgets.push_back(Widget{});   // COMPILE ERROR: no move constructor
```

**Why it fails:** The Rule of 5 says: if you declare a destructor, the compiler does not auto-generate move operations. Since `unique_ptr` is move-only, `Widget` becomes immovable without explicit move declarations.

**GOOD — explicitly declare and default move operations in the header:**

```cpp
// widget.hpp
class Widget {
public:
    Widget();
    ~Widget();
    Widget(Widget&&) noexcept;
    Widget& operator=(Widget&&) noexcept;
    // Copy: explicitly deleted or defined:
    Widget(const Widget&);
    Widget& operator=(const Widget&);
private:
    struct Impl;
    std::unique_ptr<Impl> pImpl_;
};

// widget.cpp — all definitions where Impl is complete
Widget::Widget(Widget&&) noexcept = default;
Widget& Widget::operator=(Widget&&) noexcept = default;
```

**Detection tip:** After writing a pImpl class, immediately try `std::vector<Widget> v; v.push_back(Widget{});` in a test. If it doesn't compile, move operations are missing.

### Pitfall 3 — `std::any_cast` Without Checking First

**Problem:** Casting `std::any` directly to the wrong type throws `std::bad_any_cast`, which if uncaught terminates the program.

**BAD:**

```cpp
std::any value = std::string("hello");

// Assuming it holds int — will throw!
int i = std::any_cast<int>(value);   // std::bad_any_cast — uncaught → terminate
```

**Why it fails:** `std::any_cast<T>(any_value)` throws `std::bad_any_cast` if the held type is not exactly `T` (cv-qualifications and reference wrappers aside). No inheritance relationship can satisfy the check.

**GOOD — use pointer-form `any_cast` which returns `nullptr` on mismatch:**

```cpp
std::any value = std::string("hello");

if (auto* s = std::any_cast<std::string>(&value)) {
    std::cout << "String: " << *s << '\n';
} else if (auto* i = std::any_cast<int>(&value)) {
    std::cout << "Int: " << *i << '\n';
} else {
    std::cout << "Unknown type: " << value.type().name() << '\n';
}
```

**Detection tip:** Search for `std::any_cast<` that is not inside a `try`/`catch` or not using the pointer form. Both are acceptable; the pointer form is cleaner for type-dispatching logic.

### Pitfall 4 — Custom Type Erasure Wrapper With Shared Ownership When Unique Is Needed

**Problem:** Using `std::shared_ptr<Concept>` inside a type-erasing wrapper when the wrapper is supposed to behave as a value type with independent ownership.

**BAD:**

```cpp
class AnyDrawable {
    std::shared_ptr<Concept> self_;  // shared — copies share the same object!
public:
    template<typename T>
    AnyDrawable(T obj) : self_{std::make_shared<Model<T>>(std::move(obj))} {}
    void draw() const { self_->draw_impl(); }
};

AnyDrawable a{Circle{}};
AnyDrawable b = a;          // b shares the same Circle with a
// Mutating a's circle also mutates b's circle — surprising value semantics!
```

**Why it fails:** Copying a `shared_ptr`-based wrapper gives two objects that silently share state. For a type that looks like a value type (no `*` or `&` in the API), users expect independent copies.

**GOOD — use `unique_ptr` with a virtual `clone()` method for value semantics:**

```cpp
struct Concept {
    virtual ~Concept() = default;
    virtual void draw_impl() const = 0;
    virtual std::unique_ptr<Concept> clone() const = 0;  // deep copy
};

template<typename T>
struct Model : Concept {
    T value;
    explicit Model(T v) : value{std::move(v)} {}
    void draw_impl() const override { value.draw(); }
    std::unique_ptr<Concept> clone() const override {
        return std::make_unique<Model<T>>(value);
    }
};

class AnyDrawable {
    std::unique_ptr<Concept> self_;
public:
    template<typename T>
    AnyDrawable(T obj) : self_{std::make_unique<Model<T>>(std::move(obj))} {}

    AnyDrawable(const AnyDrawable& o) : self_{o.self_->clone()} {}
    AnyDrawable& operator=(const AnyDrawable& o) {
        if (this != &o) self_ = o.self_->clone();
        return *this;
    }
    AnyDrawable(AnyDrawable&&) noexcept = default;
    AnyDrawable& operator=(AnyDrawable&&) noexcept = default;

    void draw() const { self_->draw_impl(); }
};
```

**Detection tip:** If a type-erasing wrapper is copyable and uses `shared_ptr<Concept>` internally, copies alias the same state — test this by modifying through one copy and observing the other.

### Pitfall 5 — pImpl Disabling the Header-Only Benefit

**Problem:** Using pImpl on a class that is primarily used as a small, frequently-copied value type (e.g., `Point`, `Color`, `Duration`), where the heap allocation and pointer indirection hurt more than they help.

**BAD:**

```cpp
class Point {       // Two doubles — 16 bytes total
    struct Impl;
    std::unique_ptr<Impl> pImpl_;  // 8 byte pointer + heap alloc for 16 bytes
public:
    Point(double x, double y);
    double x() const;
    double y() const;
};
// Each Point construction allocates on the heap — terrible for a tiny value
```

**Why it fails:** The heap overhead (allocation, indirection, cache miss) for a 16-byte value type is enormous relative to the value. No ABI or compilation speed benefit justifies the cost for a type used in tight loops.

**GOOD — pImpl is for types with complex, changing, or large private state:**

```cpp
struct Point { double x, y; };   // value type — keep it simple

// Reserve pImpl for types like:
class NetworkConnection {   // large, platform-specific, changing internals
    struct Impl;
    std::unique_ptr<Impl> pImpl_;
};
```

**Detection tip:** If `sizeof(Impl)` is small (under ~64 bytes) and the type is frequently copied or stored by value, reconsider pImpl. The benefit only justifies the cost for complex or ABI-sensitive classes.

### Pitfall 6 — `std::variant` Visitor Missing a Type Arm

**Problem:** A `std::visit` visitor doesn't handle one of the variant alternatives, causing a compile error — but the error message is often cryptic.

**BAD:**

```cpp
using Shape = std::variant<Circle, Square, Triangle>;

double area(const Shape& s) {
    return std::visit([](const Circle& c)  { return 3.14 * c.r * c.r; },
                      s);  // COMPILE ERROR: lambda doesn't handle Square or Triangle
}
```

**Why it fails:** `std::visit` requires the visitor to be callable with every type in the variant. A single-type lambda is not a valid visitor for a multi-type variant.

**GOOD — use the `overloaded` pattern or a struct visitor:**

```cpp
template<typename... Ts>
struct overloaded : Ts... { using Ts::operator()...; };
template<typename... Ts> overloaded(Ts...) -> overloaded<Ts...>;

double area(const Shape& s) {
    return std::visit(overloaded{
        [](const Circle&   c){ return 3.14159 * c.r * c.r; },
        [](const Square&   sq){ return sq.s * sq.s; },
        [](const Triangle& t){ return 0.5 * t.b * t.h; }
    }, s);
}
```

**Detection tip:** The compile error for a missing visitor arm typically mentions "no matching overloaded function call." Count the lambda arms; there must be one for every type in the variant (or a generic `auto` catch-all).

## Code Example

```cpp
#include <functional>
#include <iostream>
#include <memory>

class Counter {
  public:
    Counter();
    ~Counter();
    void increment();
    int value() const;

  private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
};

struct Counter::Impl {
    int n{0};
};

Counter::Counter() : impl_(std::make_unique<Impl>()) {}
Counter::~Counter() = default;
void Counter::increment() { ++impl_->n; }
int Counter::value() const { return impl_->n; }

int main() {
    std::function<int(int, int)> op = [](int a, int b) { return a + b; };
    Counter counter;
    counter.increment();
    std::cout << "Day 21 - PIMPL and Type Erasure\n";
    std::cout << "counter=" << counter.value() << ", op(2,3)=" << op(2, 3) << "\n";
    return 0;
}
```
