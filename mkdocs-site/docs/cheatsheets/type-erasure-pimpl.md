---
title: "Type Erasure Pimpl"
tags: ["cheatsheet", "reference"]
---

# :material-book: Type Erasure Pimpl


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Type Erasure and pImpl

<div class="contents" local="" depth="2">

Sections

</div>

## pImpl: Header/Source Split

The pImpl (pointer to implementation) idiom moves all private data and implementation details into a source file, hiding them from the header.

``` cpp
// --- widget.h  (only this is distributed to clients) ---
#pragma once
#include <memory>
#include <string>

class Widget {
public:
    explicit Widget(std::string name);
    ~Widget();                          // must be defined where Impl is complete
    Widget(Widget&&) noexcept;
    Widget& operator=(Widget&&) noexcept;
    Widget(const Widget&);
    Widget& operator=(const Widget&);

    void render();
    std::string name() const;

private:
    struct Impl;                        // forward declaration only
    std::unique_ptr<Impl> pImpl_;
};

// --- widget.cpp ---
#include "widget.h"
#include "heavy_dep.h"   // only included here, not in widget.h

struct Widget::Impl {
    std::string name;
    HeavyDependency dep;
    int internal_counter = 0;
    // ... all the messy internals
};

Widget::Widget(std::string name)
    : pImpl_(std::make_unique<Impl>(Impl{std::move(name)})) {}

Widget::~Widget() = default;   // unique_ptr destructor now has full Impl type

Widget::Widget(Widget&&) noexcept = default;
Widget& Widget::operator=(Widget&&) noexcept = default;

Widget::Widget(const Widget& o)
    : pImpl_(std::make_unique<Impl>(*o.pImpl_)) {}   // deep copy

Widget& Widget::operator=(const Widget& o) {
    if (this != &o) *pImpl_ = *o.pImpl_;
    return *this;
}

void Widget::render() { pImpl_->dep.render(pImpl_->name); }
std::string Widget::name() const { return pImpl_->name; }
```

## pImpl Move Semantics Gotcha

The destructor **must** be defined in the .cpp where `Impl` is complete. If you `= default` it in the header, `unique_ptr<Impl>`'s destructor tries to call `delete` on an incomplete type — hard compile error.

``` cpp
// BAD: destructor defaulted in header
// widget.h
class Widget {
    ~Widget() = default;   // ERROR: unique_ptr<Impl> can't delete incomplete Impl
    std::unique_ptr<Impl> pImpl_;
};

// GOOD: declare in header, define in .cpp
// widget.h
class Widget {
    ~Widget();             // just declare
    std::unique_ptr<Impl> pImpl_;
};
// widget.cpp
Widget::~Widget() = default;  // unique_ptr now sees complete Impl
```

| pImpl with unique_ptr        | pImpl with shared_ptr                                                |     |
|------------------------------|----------------------------------------------------------------------|-----|
| Exclusive ownership          | Shared ownership (ref-counted)                                       |     |
| Move-only by default         | Copy is cheap (shares Impl)                                          |     |
| Destructor in .cpp mandatory | Destructor can be defaulted in \| header (shared_ptr stores deleter) |     |
| Zero copy overhead           | Atomic refcount on copy/destroy                                      |     |

## ABI Stability Use Case

pImpl is the canonical way to ship stable **binary interfaces** (ABI):

``` cpp
// v1.0 header — Impl has 3 fields
// v2.0 header — Impl gains 5 new fields
// Either way, sizeof(Widget) == sizeof(unique_ptr) stays constant.
// Recompiling just widget.cpp is enough; callers don't recompile.

// Used by: Qt (d-pointer), LLVM, many system libraries.
```

## Type Erasure: The Concept

Type erasure stores objects of **any** type that satisfies some interface, without requiring a common base class and without exposing the concrete type.

Four approaches from simple to full-custom:

### std::function — Callable Type Erasure

``` cpp
// Erases any callable matching signature void(int)
std::function<void(int)> callback;

callback = [](int x) { std::cout << x; };           // lambda
callback = &free_function;                           // function pointer
callback = std::bind(&MyClass::method, obj, _1);     // member function

callback(42);   // uniform call regardless of stored type

// Cost: heap allocation for large callables, virtual dispatch internally
// Optimization: Small Buffer Optimization (SBO) avoids heap for small callees
```

### std::any — Open Type Erasure

``` cpp
std::any a = 42;
a = std::string{"hello"};    // can change type at runtime
a = std::vector<int>{1,2,3};

// Access — throws std::bad_any_cast on type mismatch
try {
    auto& v = std::any_cast<std::vector<int>&>(a);
} catch (const std::bad_any_cast& e) { /* wrong type */ }

// Non-throwing access via pointer:
if (auto* p = std::any_cast<std::vector<int>>(&a)) {
    // p is non-null only if a holds vector<int>
}

// Query the stored type:
if (a.type() == typeid(std::string)) { /* ... */ }
```

### std::variant — Closed Type Erasure

``` cpp
using Shape = std::variant<Circle, Rectangle, Triangle>;

Shape s = Circle{5.0};

// Pattern 1: std::visit with overloaded lambda set
struct AreaVisitor {
    double operator()(const Circle& c)    { return 3.14 * c.r * c.r; }
    double operator()(const Rectangle& r) { return r.w * r.h; }
    double operator()(const Triangle& t)  { return 0.5 * t.b * t.h; }
};
double area = std::visit(AreaVisitor{}, s);

// Pattern 2: generic lambda (same behavior for all types)
std::visit([](const auto& sh){ sh.draw(); }, s);

// Pattern 3: overloaded helper (C++17)
template <typename... Fs> struct overloaded : Fs... { using Fs::operator()...; };
template <typename... Fs> overloaded(Fs...) -> overloaded<Fs...>;

std::visit(overloaded{
    [](const Circle& c)    { std::cout << "circle\n"; },
    [](const Rectangle& r) { std::cout << "rect\n"; },
    [](const Triangle& t)  { std::cout << "tri\n"; }
}, s);
```

## Hand-Rolled Type Eraser

When you need more control (e.g., SBO, no RTTI, custom calling convention):

``` cpp
// Type-erased "Drawable" — stores any type with a .draw() method
class Drawable {
public:
    template <typename T>
    explicit Drawable(T obj) : storage_(std::make_unique<Model<T>>(std::move(obj))) {}

    void draw() const { storage_->draw(); }

private:
    struct Concept {
        virtual ~Concept() = default;
        virtual void draw() const = 0;
    };

    template <typename T>
    struct Model : Concept {
        T obj;
        explicit Model(T o) : obj(std::move(o)) {}
        void draw() const override { obj.draw(); }
    };

    std::unique_ptr<Concept> storage_;
};

// Usage: no inheritance required from Circle or Square
Drawable d1{Circle{5}};
Drawable d2{Square{3}};
d1.draw();
d2.draw();
```

## When to Choose Which

| Tool                    | Type set | Interface                     | Use case                                                        |     |
|-------------------------|----------|-------------------------------|-----------------------------------------------------------------|-----|
| `std::function`         | Open     | Exactly one call signature    | Callbacks, event handlers, strategy pattern                     |     |
| `std::any`              | Open     | None (manual any_cast needed) | Configuration bags, generic property maps, scripting bridges    |     |
| `std::variant`          | Closed   | Visitor/get                   | Discriminated unions, AST nodes, error-or-value, state machines |     |
| Hand-rolled type eraser | Open     | Rich virtual interface        | Value-semantic polymorphism, SBO needed, no RTTI environments   |     |
| pImpl                   | N/A      | ABI boundary hiding           | Library headers, stable ABI, \| slow compile time reduction     |     |

## Performance Comparison

| Technique          | Heap allocation                            | Dispatch cost           | Copy cost                |
|--------------------|--------------------------------------------|-------------------------|--------------------------|
| `std::function`    | Yes (unless SBO)                           | Virtual call            | Deep copy of callable    |
| `std::any`         | Yes (unless SBO, typically \<=16B inlined) | RTTI any_cast           | Deep copy                |
| `std::variant`     | No (stack union)                           | Indexed dispatch (fast) | Copies active member     |
| Hand-rolled eraser | Configurable (SBO possible)                | Virtual call            | Clone virtual fn needed  |
| pImpl              | Yes (one alloc at construction)            | Pointer indirection     | Deep copy if implemented |

## Pitfalls

**Pitfall 1: std::function overhead in tight loops**

``` cpp
// BAD: heap allocation + virtual call per iteration
std::function<int(int)> fn = [cap](int x){ return x + cap; };
for (int i = 0; i < 1'000'000; ++i) result += fn(i);

// GOOD: template parameter, inlined
auto do_work = [cap](int x){ return x + cap; };
for (int i = 0; i < 1'000'000; ++i) result += do_work(i);
// Or store in std::function only when runtime polymorphism is actually needed
```

**Pitfall 2: std::any with non-copyable types**

``` cpp
std::any a = std::make_unique<int>(5);   // ERROR: unique_ptr not copyable
// any requires CopyConstructible stored types
```

**Pitfall 3: Accessing wrong variant alternative**

``` cpp
std::variant<int, std::string> v = 42;
std::get<std::string>(v);   // throws std::bad_variant_access

// GOOD: always use get_if or visit
if (auto* s = std::get_if<std::string>(&v)) { /* safe */ }
```

## Cross-References

- `crtp-static-polymorphism.rst` — compile-time alternative to type erasure
- `optional-variant-any.rst` — deeper coverage of variant/any/optional
- `performance-tips-oop.rst` — allocation and dispatch cost analysis
- `memory-layout-and-object-model.rst` — SBO internals and vtable layout


---

[← All Cheatsheets](index.md)
