# Day 08: Advanced OOP Patterns

## Why This Day Matters

Classic object-oriented design teaches inheritance as the primary tool for code reuse.
In practice, deep inheritance hierarchies become brittle: every change to a base class
ripples through dozens of derived classes, and adding cross-cutting behaviour (logging,
serialisation, thread-safety) forces awkward multiple-inheritance gymnastics.

Modern C++ offers sharper tools: composition over inheritance, CRTP mixins for zero-cost
behaviour injection, strategy via `std::function`, value vs reference semantics, pImpl,
and interface segregation. Each pattern solves a specific recurring pain. Knowing *when*
to apply which one is the mark of an experienced C++ designer.

## Learning Outcomes

After completing this day you will be able to:

- Refactor an inheritance hierarchy into a composition-based design and explain why the result is more maintainable.
- Implement a CRTP mixin that injects at least two operators into a class with zero runtime overhead.
- Store a runtime-selectable algorithm in a class using `std::function` and swap strategies without recompiling the class.
- Distinguish value semantics from reference semantics and choose correctly for a given domain type.
- Apply the Interface Segregation Principle to split a fat abstract class into focused role interfaces.

## Key Concepts

- **Composition over inheritance** — assemble objects from small, independent capability components instead of creating deep hierarchies.
- **CRTP mixin** — a base class template that uses `static_cast<Derived&>(*this)` to call derived-class methods at compile time, injecting shared behaviour for free.
- **Strategy pattern** — encapsulate an interchangeable algorithm behind `std::function<Signature>` so it can be replaced at runtime.
- **Value semantics** — objects own their data; copies are fully independent; the preferred model for regular C++ types.
- **Reference semantics** — objects are shared via pointers; mutation is globally visible; needed for polymorphism and shared ownership.
- **pImpl idiom** — forward-declare a private `Impl` struct and hold it via `unique_ptr` to decouple interface from implementation.
- **Interface Segregation Principle** — split large abstract classes into narrow role interfaces so clients depend only on what they use.

## Theory

### Motivation

Classic object-oriented design teaches inheritance as the primary tool for code reuse.
In practice, deep inheritance hierarchies become brittle: every change to a base class
ripples through dozens of derived classes, and adding cross-cutting behaviour (logging,
serialisation, thread-safety) forces awkward multiple-inheritance gymnastics.

Modern C++ offers sharper tools:

- **Composition over inheritance** — assemble behaviour from small, focused objects.
- **CRTP mixins** — inject zero-cost behaviour at compile time without virtual calls.
- **Strategy via** `std::function` — swap algorithms at runtime with clean syntax.
- **Value vs reference semantics** — choose the right ownership model for the domain.
- **pImpl** — hide implementation details behind a pointer wall.
- **Interface segregation** — small, precise abstractions instead of fat interfaces.

### Composition over Inheritance

The canonical rule from the Gang of Four: *favour object composition over class
inheritance*. Inheritance models an IS-A relationship; composition models HAS-A.

**Why inheritance hurts at scale**

```cpp
// BAD: "animal farm" hierarchy explosion
class Animal { public: virtual void move() = 0; };
class FlyingAnimal   : public Animal { /* ... */ };
class SwimmingAnimal : public Animal { /* ... */ };
// Need a duck: flies AND swims.
// Multiple inheritance causes diamond ambiguity.
class Duck : public FlyingAnimal, public SwimmingAnimal { /* oops */ };
```

Every new combination demands a new class. With N independent behaviour axes you
can need 2^N classes — the classic "class explosion" anti-pattern.

**Composition solves this**

```cpp
#include <string>
#include <iostream>

// Small, focused capability objects
struct Flyer   { void move() const { std::cout << "flap flap\n"; } };
struct Runner  { void move() const { std::cout << "run run\n";   } };
struct Swimmer { void move() const { std::cout << "splash\n";    } };

// Generic Animal parameterised on its locomotion strategy
template <typename Locomotion>
class Animal {
    std::string name_;
    Locomotion  loco_;
public:
    explicit Animal(std::string n) : name_(std::move(n)) {}
    void move()                     { loco_.move(); }
    const std::string& name() const { return name_; }
};

// Duck composes two locomotion strategies
struct FlySwim {
    Flyer   f;
    Swimmer s;
    void move() const { f.move(); s.move(); }
};

using Duck = Animal<FlySwim>;
using Hawk = Animal<Flyer>;
using Dog  = Animal<Runner>;
```

Composition makes adding new locomotion styles a non-event: write one struct, compose.

### CRTP Mixins — Zero-Cost Behaviour Injection

The **Curiously Recurring Template Pattern** lets a base class call methods on its
derived class without virtual dispatch. Use it to inject reusable behaviour
(comparable, printable, serialisable) at compile time.

```cpp
#include <string>

// Mixin: gives Derived operator<=, >, >= for free.
// Derived must supply operator== and operator<.
template <typename Derived>
class Comparable {
public:
    bool operator<=(const Derived& rhs) const {
        const auto& self = static_cast<const Derived&>(*this);
        return self == rhs || self < rhs;
    }
    bool operator>(const Derived& rhs) const {
        const auto& self = static_cast<const Derived&>(*this);
        return !(self <= rhs);
    }
    bool operator>=(const Derived& rhs) const {
        const auto& self = static_cast<const Derived&>(*this);
        return !(self < rhs);
    }
};

// Mixin: gives Derived a to_string() that calls describe()
template <typename Derived>
class Printable {
public:
    std::string to_string() const {
        return static_cast<const Derived&>(*this).describe();
    }
};

// Compose multiple mixins — Temperature inherits both
class Temperature
    : public Comparable<Temperature>
    , public Printable<Temperature>
{
    double celsius_;
public:
    explicit Temperature(double c) : celsius_(c) {}
    bool operator==(const Temperature& o) const { return celsius_ == o.celsius_; }
    bool operator< (const Temperature& o) const { return celsius_ <  o.celsius_; }
    std::string describe() const {
        return std::to_string(celsius_) + " C";
    }
};
```

**CRTP cost model**: the generated code is identical to hand-written functions.
The base class is a compile-time detail; no vtable, no indirection.

**When to use CRTP mixins**

- Cross-cutting concerns that many unrelated classes share.
- Performance-critical code where virtual dispatch overhead is measurable.
- Libraries where you control neither the base nor the derived class type.

**When to avoid**

- When runtime polymorphism is genuinely needed (heterogeneous collections).
- When the mixin logic is complex — readability suffers.
- In C++20+ consider concepts + free functions over CRTP for cleaner interfaces.

### Strategy Pattern with `std::function`

The Strategy pattern replaces hard-coded algorithms with interchangeable policies.
`std::function<Signature>` is the modern C++ way to store any callable — lambda,
function pointer, or functor — behind a uniform interface.

```cpp
#include <functional>
#include <vector>
#include <algorithm>
#include <string>
#include <iostream>
#include <iomanip>

struct Order {
    std::string id;
    double      total;
    int         priority;
};

// Strategy type alias — any callable matching this signature works
using SortStrategy = std::function<bool(const Order&, const Order&)>;

class OrderProcessor {
    std::vector<Order> orders_;
    SortStrategy       sort_by_;
public:
    explicit OrderProcessor(SortStrategy s) : sort_by_(std::move(s)) {}

    void set_strategy(SortStrategy s) { sort_by_ = std::move(s); }
    void add(Order o)                 { orders_.push_back(std::move(o)); }

    void process() {
        std::ranges::sort(orders_, sort_by_);
        for (const auto& o : orders_)
            std::cout << o.id << ": $" << std::fixed << std::setprecision(2)
                      << o.total << "  priority=" << o.priority << '\n';
    }
};

// Strategies are just lambdas — composable, testable in isolation
auto by_total    = [](const Order& a, const Order& b){ return a.total    < b.total;    };
auto by_priority = [](const Order& a, const Order& b){ return a.priority > b.priority; };
auto by_id       = [](const Order& a, const Order& b){ return a.id       < b.id;       };
```

**Design note**: `std::function` has a small allocation cost for large callables
(when the small-buffer optimisation does not apply). For zero-overhead strategies,
use a template parameter. Reserve `std::function` for runtime-switchable strategies.

### Value Semantics vs Reference Semantics

This is one of the most consequential design decisions in C++.

**Reference semantics** — objects are shared via pointers or references; mutation is
visible everywhere. This is Java's default model.

**Value semantics** — objects own their data; copies are independent; mutation is local.
This is C++'s preferred model for regular types.

```cpp
#include <memory>
#include <iostream>

// --- Reference semantics (shared mutable state) ---
struct NodeRef {
    int value;
    std::shared_ptr<NodeRef> next;
};
auto a = std::make_shared<NodeRef>();
a->value = 42;
auto b = a;       // b IS a — same object in memory
b->value = 99;    // a->value is now 99 too!  Spooky action at a distance.

// --- Value semantics (independent copies) ---
struct Point { int x, y; };
Point p1{1, 2};
Point p2 = p1;    // independent copy
p2.x = 99;        // p1.x is still 1
```

**Guidelines**

- Prefer value semantics for small, plain data (`Point`, `Color`, `Duration`).
- Use reference semantics (smart pointers) only when sharing or polymorphism is needed.
- `std::vector`, `std::string` are value types with efficient move operations.
- Avoid raw owning pointers; use `std::unique_ptr` for exclusive ownership.

### pImpl Idiom — Preview

The **pointer-to-implementation** idiom separates a class's public interface from its
private implementation details, reducing compilation coupling and hiding internals.

```cpp
// Widget.h — only forward-declares Impl; no private details exposed to clients
#include <memory>
#include <string>

class Widget {
public:
    explicit Widget(std::string name);
    ~Widget();                  // must be defined where Impl is complete
    Widget(Widget&&) noexcept;
    Widget& operator=(Widget&&) noexcept;

    void draw() const;
    void resize(int w, int h);

private:
    struct Impl;                // forward declaration — clients see nothing
    std::unique_ptr<Impl> pimpl_;
};

// Widget.cpp — Impl details are invisible to all clients
struct Widget::Impl {
    std::string name;
    int width{0}, height{0};
    // heavy third-party or OS headers go here only
};
Widget::Widget(std::string n)
    : pimpl_(std::make_unique<Impl>(std::move(n))) {}
Widget::~Widget() = default;    // destructor defined here — Impl is complete
```

**Benefits**: client translation units recompile only when the header changes, not
when the Impl struct changes. Covered in depth on Day 21.

### Interface Segregation

The Interface Segregation Principle (ISP) from SOLID: *clients should not be forced to
depend on interfaces they do not use.* In C++ this means small, focused abstract
classes rather than one monolithic base.

```cpp
#include <string>
#include <vector>

// BAD: fat interface forces every implementor to implement everything
class IDataManager {
public:
    virtual ~IDataManager() = default;
    virtual std::vector<std::string> load()                    = 0;
    virtual void save(const std::vector<std::string>&)         = 0;
    virtual void compress()                                    = 0;
    virtual void encrypt()                                     = 0;
    virtual void sendToCloud()                                 = 0;
};

// GOOD: small, focused interfaces — each client depends on only what it uses
class ILoader {
public:
    virtual ~ILoader() = default;
    virtual std::vector<std::string> load() = 0;
};
class ISaver {
public:
    virtual ~ISaver() = default;
    virtual void save(const std::vector<std::string>&) = 0;
};
class IEncryptor {
public:
    virtual ~IEncryptor() = default;
    virtual void encrypt() = 0;
};

// A simple file store only needs ILoader + ISaver
class FileStore : public ILoader, public ISaver {
public:
    std::vector<std::string> load() override { return {}; }
    void save(const std::vector<std::string>&) override {}
    // Not forced to implement encrypt() or sendToCloud()
};
```

ISP pays dividends in testability: mock only the interface the system-under-test uses.

### Design Tradeoffs Summary

| Pattern | Strength | Weakness | Choose when |
|---------|----------|----------|-------------|
| Composition | Flexible, no explosion | Forwarding boilerplate | Behaviours vary independently |
| CRTP Mixin | Zero overhead, inlined | Complex errors, no poly | Fixed behaviours, perf-critical |
| Strategy (function) | Runtime switchable | Small heap alloc cost | Algorithm varies at runtime |
| pImpl | Binary stability | Heap alloc, no inlining | Library ABI stability needed |

## Pitfalls

### Pitfall 1: Inheriting Implementation for Code Reuse

**Description**: Using inheritance purely to reuse code from a base class, even when
no IS-A relationship exists. The derived class silently inherits a public interface
it does not want, and callers can misuse it.

**BAD**

```cpp
// Stack "reuses" vector's storage by inheriting from it
class Stack : public std::vector<int> {
public:
    void push(int v) { push_back(v); }
    int  pop()       { int v = back(); pop_back(); return v; }
    // Problem: callers can also call insert(), erase(), operator[] !
};

Stack s;
s.push(1);
s.push(2);
s.insert(s.begin(), 99);  // bypasses stack invariant!
```

**Why it fails**: `std::vector` has no virtual destructor, so deleting a `Stack*`
through a `vector<int>*` is undefined behaviour. The derived class also exposes the
entire `vector` interface, breaking encapsulation.

**GOOD**

```cpp
// Compose — contain the vector, expose only stack operations
class Stack {
    std::vector<int> data_;
public:
    void push(int v)  { data_.push_back(v); }
    int  pop()        { int v = data_.back(); data_.pop_back(); return v; }
    int  top() const  { return data_.back(); }
    bool empty() const{ return data_.empty(); }
    // insert(), erase() are gone — Stack invariant is protected
};
```

**Detection tip**: If a derived class hides or `delete`s base-class methods, or if
the base class has no virtual destructor, inheritance is almost certainly wrong.

### Pitfall 2: CRTP — Forgetting the `static_cast`

**Description**: In a CRTP base, calling derived methods via `*this` instead of
`static_cast<Derived&>(*this)` produces a compilation error or calls the wrong overload.

**BAD**

```cpp
template <typename Derived>
class Logger {
public:
    void log() const {
        // ERROR: Base class has no name() method;
        // this->name() would require a virtual call
        std::cout << name() << '\n';  // does not compile
    }
};
```

**Why it fails**: Inside `Logger<Derived>`, `name()` is looked up in `Logger`,
not in `Derived`. The compiler finds no such member.

**GOOD**

```cpp
template <typename Derived>
class Logger {
public:
    void log() const {
        // Cast to the derived type first; then call the derived method
        const auto& self = static_cast<const Derived&>(*this);
        std::cout << self.name() << '\n';
    }
};

class Server : public Logger<Server> {
public:
    std::string name() const { return "Server"; }
};
```

**Detection tip**: Compiler errors mentioning `no member named 'X' in 'Logger<...>'`
inside a CRTP base are usually a missing `static_cast`.

### Pitfall 3: `std::function` Overhead in Hot Loops

**Description**: Wrapping a trivial callable in `std::function` and calling it
millions of times per second incurs type-erasure overhead that erases performance gains.

**BAD**

```cpp
#include <functional>
#include <vector>

std::function<int(int)> transform = [](int x){ return x * 2; };

// Called 10 million times — function stores lambda on heap if > SBO size,
// and every call goes through a virtual-dispatch-like indirect call.
for (int i = 0; i < 10'000'000; ++i)
    result += transform(i);
```

**Why it fails**: `std::function` uses type erasure with a possible heap allocation
and an indirect call through a function pointer stored in the wrapper. The compiler
cannot inline through it.

**GOOD**

```cpp
// Option A: template parameter — fully inlined
template <typename F>
void process(const std::vector<int>& data, F transform) {
    for (int v : data)
        result += transform(v);
}
process(data, [](int x){ return x * 2; });   // lambda inlined

// Option B: C++20 abbreviated template with concept
auto process_modern(const std::vector<int>& data,
                    std::invocable<int> auto transform) {
    for (int v : data)
        result += transform(v);
}
```

**Detection tip**: Profile before optimising. `std::function` is fine for
low-frequency callbacks (button clicks, event handlers). Avoid it in tight loops.

### Pitfall 4: Mixing Value and Reference Semantics Accidentally

**Description**: Storing a reference or raw pointer to an object that may be moved or
destroyed, then accessing it later — classic dangling reference.

**BAD**

```cpp
#include <vector>

struct Config { int timeout; };

std::vector<Config> configs;
configs.push_back({30});

const Config& ref = configs[0];  // reference to element

configs.push_back({60});   // reallocation may move all elements!
std::cout << ref.timeout;  // UB: ref is dangling after reallocation
```

**Why it fails**: `push_back` may reallocate the internal buffer, invalidating all
iterators and references into the vector.

**GOOD**

```cpp
// Option A: copy the value you need
Config cfg = configs[0];
configs.push_back({60});
std::cout << cfg.timeout;  // safe — independent copy

// Option B: reserve capacity upfront to prevent reallocation
configs.reserve(10);
const Config& ref2 = configs[0];
configs.push_back({60});   // no reallocation if capacity not exceeded
std::cout << ref2.timeout; // safe
```

**Detection tip**: Address Sanitiser (`-fsanitize=address`) catches use-after-free
and many dangling-reference bugs at runtime.

### Pitfall 5: Fat Virtual Interfaces — Forcing Unused Implementations

**Description**: Defining one large abstract class with many pure virtual methods
forces every concrete class to implement functions it does not need.

**BAD**

```cpp
class IShape {
public:
    virtual ~IShape() = default;
    virtual double area()        = 0;
    virtual double perimeter()   = 0;
    virtual void   draw()        = 0;
    virtual void   serialize()   = 0;
    virtual void   animate()     = 0;   // not all shapes are animated!
};
```

**GOOD**

```cpp
class IGeometry  { public: virtual ~IGeometry()=default;
                            virtual double area()      = 0;
                            virtual double perimeter() = 0; };
class IDrawable  { public: virtual ~IDrawable()=default;
                            virtual void draw()        = 0; };
class IAnimated  { public: virtual ~IAnimated()=default;
                            virtual void animate()     = 0; };

// Circle is Geometry + Drawable but NOT Animated
class Circle : public IGeometry, public IDrawable {
public:
    double area()      override { return 3.14159 * r_ * r_; }
    double perimeter() override { return 2.0 * 3.14159 * r_; }
    void   draw()      override { /* render */ }
private:
    double r_{1.0};
};
```

**Detection tip**: Any class that implements a method with an empty body or a comment
`// not applicable` is a strong signal the interface needs splitting.

### Pitfall 6: pImpl Without Move Support — Broken Moves

**Description**: Defining pImpl with `std::unique_ptr<Impl>` but not declaring move
operations causes the class to be non-movable (or accidentally deleted).

**BAD**

```cpp
class Widget {
public:
    Widget();
    ~Widget();          // defined in .cpp
    void draw();
private:
    struct Impl;
    std::unique_ptr<Impl> pimpl_;
    // No move constructor declared!
};
// Widget w1; Widget w2 = std::move(w1);  // ERROR or unexpected behaviour
```

**Why it fails**: The user-defined destructor suppresses the implicitly-generated move
constructor and move assignment operator (they become deleted).

**GOOD**

```cpp
class Widget {
public:
    Widget();
    ~Widget();                        // defined in .cpp
    Widget(Widget&&) noexcept;        // declared here
    Widget& operator=(Widget&&) noexcept;

    Widget(const Widget&)            = delete;   // or implement deep copy
    Widget& operator=(const Widget&) = delete;

    void draw();
private:
    struct Impl;
    std::unique_ptr<Impl> pimpl_;
};
// Widget.cpp
// Widget::Widget(Widget&&) noexcept = default;
// Widget& Widget::operator=(Widget&&) noexcept = default;
```

**Detection tip**: Always check whether move operations are implicitly deleted when a
user-defined destructor is present. Use `static_assert(std::is_move_constructible_v<Widget>)`.

## Code Example

```cpp
#include <iostream>
#include <memory>

class PricingStrategy {
  public:
    virtual ~PricingStrategy() = default;
    virtual double apply(double basePrice) const = 0;
};

class PercentageDiscount : public PricingStrategy {
  public:
    explicit PercentageDiscount(double ratio) : ratio_(ratio) {}
    double apply(double basePrice) const override { return basePrice * (1.0 - ratio_); }

  private:
    double ratio_;
};

class Checkout {
  public:
    explicit Checkout(std::unique_ptr<PricingStrategy> strategy) : strategy_(std::move(strategy)) {}
    double total(double basePrice) const { return strategy_->apply(basePrice); }

  private:
    std::unique_ptr<PricingStrategy> strategy_;
};

int main() {
    Checkout checkout{std::make_unique<PercentageDiscount>(0.15)};
    std::cout << "Day 08 - Advanced OOP Patterns\n";
    std::cout << "Total: " << checkout.total(200.0) << "\n";
    return 0;
}
```
