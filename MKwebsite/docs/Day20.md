# Day 20: Static Polymorphism and CRTP

## Why This Day Matters

Virtual dispatch is essential for runtime polymorphism but carries costs: indirect calls through vtable pointers, no inlining, hidden `vptr` overhead, and non-value semantics. When the set of types is known at compile time, the **Curiously Recurring Template Pattern (CRTP)** provides compile-time polymorphism with zero runtime overhead. Understanding both virtual dispatch and CRTP lets you choose the right tool: CRTP for hot paths where all types are known at compile time, virtual dispatch for runtime-selected types and heterogeneous containers.

## Learning Outcomes

By the end of this day you will be able to:

* Explain the CRTP mechanics — the base class takes `Derived` as a template argument and uses `static_cast<Derived*>(this)` to call derived methods.
* Implement a CRTP mixin that provides default behaviour by calling a customisation point on the derived class.
* Stack multiple CRTP bases (mixin accumulation) and explain the layout implications (zero-overhead — no added data members).
* Compare virtual dispatch and CRTP on the dimensions of overhead, inlining, heterogeneous containers, and compile-time vs runtime type selection.
* Use `std::span` as a CRTP-free way to write polymorphic code over contiguous ranges without virtual dispatch or inheritance.
* Combine CRTP with C++20 Concepts for self-documenting interface constraints.

## Key Concepts

* **CRTP base** — a class template whose parameter is the derived type; provides methods that call `static_cast<Derived*>(this)->hook()`.
* **Static interface enforcement** — if the derived class omits the required hook, the compiler reports the error at the call site (not at runtime).
* **Mixin accumulation** — inherit multiple CRTP bases; each adds methods to the derived type with zero data overhead.
* **`static_cast<Derived*>(this)`** — the canonical downcast; safe within CRTP because `Base<Derived>` is only ever a base of `Derived`.
* **`std::span<T>`** — C++20 non-owning range view; erases container type while keeping element type, providing sequence polymorphism without CRTP.
* **Devirtualisation** — compiler optimisation that converts a virtual call to a direct call; CRTP makes this unnecessary by eliminating the vtable.

## Theory

### Motivation — The Cost of Virtual Dispatch

Virtual dispatch is essential for runtime polymorphism but carries costs:

* **Indirect call** — every virtual method call goes through a vtable pointer; the CPU must load the vtable, load the function pointer, then call it. On a modern CPU this is 3–5 extra memory accesses if the vtable is cold.
* **No inlining** — compilers generally cannot inline a virtual call through a pointer-to-base because the target is unknown at compile time.
* **Object overhead** — every polymorphic object carries a hidden `vptr` (typically 8 bytes on 64-bit systems) pointing to its vtable.
* **Non-value semantics** — polymorphic objects must be passed by pointer or reference, complicating containers and ownership.

When the set of types is known at compile time, **Curiously Recurring Template Pattern (CRTP)** provides compile-time polymorphism with zero runtime overhead.

### CRTP Mechanics

CRTP is the idiom where a base class template takes the derived class as its template argument:

```cpp
template<typename Derived>
struct Base {
    void interface() {
        // Downcast to Derived — safe because Base<Derived> is only
        // ever instantiated as a base of Derived
        static_cast<Derived*>(this)->implementation();
    }
};

struct ConcreteA : Base<ConcreteA> {
    void implementation() { std::puts("ConcreteA"); }
};

struct ConcreteB : Base<ConcreteB> {
    void implementation() { std::puts("ConcreteB"); }
};
```

```
Class hierarchy (CRTP)
──────────────────────
Base<ConcreteA>          Base<ConcreteB>
     ▲                        ▲
ConcreteA                ConcreteB

No common base class — these are distinct types.
interface() in Base<D> is resolved at compile time via static_cast<D*>(this).
```

The call `Base<ConcreteA>::interface()` expands to `static_cast<ConcreteA*>(this)->implementation()` — the compiler sees the concrete type statically and can inline the call.

### Static Interface Enforcement

CRTP enforces that a derived class implements required methods. If `ConcreteA` forgets `implementation()`, the program fails to compile when `base.interface()` is instantiated — not at runtime.

```cpp
template<typename Derived>
struct Serialisable {
    std::string serialise() const {
        return static_cast<const Derived*>(this)->to_string();
    }
    // Optionally add a static_assert for a cleaner error message:
    static void check() {
        static_assert(
            requires(const Derived& d){ d.to_string(); },
            "Derived must implement to_string() const");
    }
};

struct Point : Serialisable<Point> {
    double x, y;
    std::string to_string() const {
        return std::format("({},{})", x, y);
    }
};

struct Missing : Serialisable<Missing> {
    // no to_string() — compile error when serialise() is called
};
```

With C++20 Concepts, static interface enforcement is even cleaner (see Day 10), but CRTP remains useful for **providing default implementations** that call customisation points.

### CRTP for Default Implementations (Mixin Pattern)

The base class provides default behaviour by calling the derived class's customisation hook. The derived class only overrides what it needs.

```cpp
// Provides !=, >, <=, >= from operator== and operator<
template<typename Derived>
struct Comparable {
    bool operator!=(const Derived& o) const {
        return !(*static_cast<const Derived*>(this) == o);
    }
    bool operator>(const Derived& o) const { return o < *static_cast<const Derived*>(this); }
    bool operator<=(const Derived& o) const { return !(o < *static_cast<const Derived*>(this)); }
    bool operator>=(const Derived& o) const { return !(*static_cast<const Derived*>(this) < o); }
};

struct Weight : Comparable<Weight> {
    double kg;
    bool operator==(const Weight& o) const { return kg == o.kg; }
    bool operator< (const Weight& o) const { return kg <  o.kg; }
};

Weight w1{70.0}, w2{80.0};
bool heavier = w1 > w2;   // calls Comparable<Weight>::operator> — zero overhead
```

Note: C++20 `<=>` (spaceship operator) makes this specific use case unnecessary, but the pattern applies to many other mixins (`Printable`, `Hashable`, `Clonable`, etc.).

### Mixin Accumulation — Stacking Multiple CRTP Bases

CRTP bases compose cleanly because each is a distinct template instantiation:

```cpp
template<typename D> struct Printable {
    void print() const { std::cout << static_cast<const D*>(this)->to_string() << '\n'; }
};

template<typename D> struct Serialisable {
    std::string serialise() const {
        return static_cast<const D*>(this)->to_string();
    }
};

template<typename D> struct Cloneable {
    D clone() const { return *static_cast<const D*>(this); }
};

struct Config
    : Printable<Config>
    , Serialisable<Config>
    , Cloneable<Config> {

    std::string name;
    int         value;

    std::string to_string() const {
        return std::format("{}={}", name, value);
    }
};

Config c{"timeout", 30};
c.print();                       // "timeout=30"
auto s = c.serialise();          // "timeout=30"
Config c2 = c.clone();           // copy
```

```
Config object layout (CRTP mixins add NO data, only methods)
─────────────────────────────────────────────────────────────
┌─────────────────────┐
│  name  (std::string)│
│  value (int)        │
│  [no vptr!]         │
└─────────────────────┘

Methods available: print(), serialise(), clone(), to_string()
All resolved at compile time — inlined by optimiser.
```

### CRTP vs Virtual — Performance Comparison

| Property                   | Virtual dispatch | CRTP              |
|----------------------------|------------------|-------------------|
| Call overhead              | Indirect (vtable)| Direct / inlined  |
| Inlining possible          | Rarely           | Always            |
| Object size overhead       | +8 bytes (vptr)  | Zero              |
| Heterogeneous container    | Yes              | No (same type)    |
| Runtime type selection     | Yes              | No                |
| Error reporting            | Runtime crash    | Compile error     |
| Code bloat                 | One vtable entry | One template inst.|

CRTP is the right choice when:

* All concrete types are known at compile time.
* Performance is critical (tight loops, game entities, DSP processing).
* You want compile-time enforcement of an interface.

Virtual dispatch is the right choice when:

* Types are loaded at runtime (plugins, configuration-driven factories).
* You need a heterogeneous collection (`std::vector<IShape*>`).
* The call frequency is low and clarity outweighs the small overhead.

### `std::span` as a CRTP-Free Alternative for Read-Only Ranges

`std::span<T>` (C++20) provides a non-owning view over any contiguous range without inheritance. It is a form of **concept-based** static polymorphism for sequences:

```cpp
#include <span>

// Works with any contiguous range — no CRTP, no inheritance
double sum(std::span<const double> values) {
    double total = 0;
    for (double v : values) total += v;
    return total;
}

std::vector<double> vec{1.0, 2.0, 3.0};
std::array<double, 3> arr{4.0, 5.0, 6.0};
double raw[] = {7.0, 8.0, 9.0};

sum(vec);   // 6.0
sum(arr);   // 15.0
sum(raw);   // 24.0
```

No template required at the call site; `std::span` erases the concrete container type while keeping performance (no heap, no virtual dispatch).

### CRTP with C++20 Concepts for Better Error Messages

```cpp
template<typename T>
concept HasToString = requires(const T& t) {
    { t.to_string() } -> std::convertible_to<std::string>;
};

template<HasToString Derived>
struct Printable {
    void print() const {
        std::cout << static_cast<const Derived*>(this)->to_string() << '\n';
    }
};

// If Derived doesn't satisfy HasToString, the error message
// says "constraint not satisfied" — far clearer than a 40-line
// template instantiation stack.
```

## Pitfalls

### Pitfall 1 — Incorrect `static_cast` Direction in CRTP

**Problem:** Casting `this` to the derived type in the wrong direction, or casting to an unrelated type, producing undefined behaviour.

**BAD:**

```cpp
template<typename Derived>
struct Base {
    void interface() {
        // WRONG: reinterpret_cast bypasses type checking
        reinterpret_cast<Derived*>(this)->implementation();
    }
};

// Also WRONG: casting base pointer to unrelated type
template<typename Derived>
struct BadBase {
    void interface() {
        Derived* d = (Derived*)this;  // C-style cast — no type safety
        d->implementation();
    }
};
```

**Why it fails:** `reinterpret_cast` and C-style casts bypass the type system. If `Derived` has virtual bases or a layout that differs from `Base` (unusual but possible with complex hierarchies), the pointer arithmetic is wrong. In practice, with simple single-inheritance CRTP, `static_cast` is both safe and the conventional choice.

**GOOD — always use `static_cast` in CRTP:**

```cpp
template<typename Derived>
struct Base {
    void interface() {
        static_cast<Derived*>(this)->implementation();
    }
    void const_interface() const {
        static_cast<const Derived*>(this)->implementation();
    }
};
```

**Detection tip:** Review every `reinterpret_cast` or C-style cast from `this` inside a CRTP base. Replace with `static_cast<Derived*>(this)` and `static_cast<const Derived*>(this)` for const methods.

### Pitfall 2 — Forgetting `const` Overloads in the CRTP Base

**Problem:** The CRTP base provides only a non-`const` `interface()` method, so `const` instances of the derived class cannot call it.

**BAD:**

```cpp
template<typename Derived>
struct Printable {
    void print() {   // non-const only
        static_cast<Derived*>(this)->to_string();
    }
};

struct Point : Printable<Point> {
    double x, y;
    std::string to_string() const { return std::format("({},{})", x, y); }
};

const Point p{1.0, 2.0};
p.print();   // compile error: cannot call non-const print() on const object
```

**Why it fails:** `const Point` can only call `const` member functions. `print()` is not `const`, so the call is rejected.

**GOOD — provide `const` overload:**

```cpp
template<typename Derived>
struct Printable {
    void print() const {   // const method — works on const and non-const objects
        std::cout << static_cast<const Derived*>(this)->to_string() << '\n';
    }
};
```

**Detection tip:** For every CRTP base method that only reads state, mark it `const`. Test by declaring a `const` derived object and calling all interface methods.

### Pitfall 3 — CRTP Base Has Virtual Destructor (Unintended vtable)

**Problem:** Adding a `virtual` destructor to a CRTP base defeats the purpose by introducing a vtable and a `vptr` in every derived object.

**BAD:**

```cpp
template<typename Derived>
struct Comparable {
    virtual ~Comparable() = default;   // WRONG for CRTP — creates vtable!

    bool operator!=(const Derived& o) const { ... }
};

struct Weight : Comparable<Weight> { double kg; };
// sizeof(Weight) = sizeof(double) + sizeof(vptr) = 16 bytes instead of 8
```

**Why it fails:** A `virtual` destructor forces a vtable on every instantiation of `Comparable<D>`. Each `Weight` object now carries a hidden 8-byte `vptr`, negating the zero-overhead goal.

**GOOD — non-virtual, protected destructor prevents misuse without overhead:**

```cpp
template<typename Derived>
struct Comparable {
    ~Comparable() = default;   // non-virtual — no vtable
protected:
    // Making destructor protected prevents deletion via Base* pointer,
    // catching the misuse at compile time
};
```

**Detection tip:** Check every CRTP base for `virtual` members. Unless you specifically need polymorphic deletion through the base pointer, keep CRTP bases free of virtual functions.

### Pitfall 4 — Using CRTP Where `std::variant` Is Simpler

**Problem:** Applying CRTP to a small closed set of types when `std::variant` + visitor would be cleaner and more maintainable.

**BAD (over-engineered CRTP for two shapes):**

```cpp
template<typename D>
struct Shape {
    double area() const { return static_cast<const D*>(this)->area_impl(); }
};

struct Circle   : Shape<Circle>   { double r; double area_impl() const { return 3.14*r*r; } };
struct Square   : Shape<Square>   { double s; double area_impl() const { return s*s; } };

// Can't store in a single container without another layer of type erasure
```

**Why it fails:** CRTP produces distinct types. You cannot put `Circle` and `Square` in the same `std::vector` without additional type erasure. The complexity is not justified for two types.

**GOOD — `std::variant` for a small closed set:**

```cpp
struct Circle { double r; };
struct Square { double s; };
using Shape = std::variant<Circle, Square>;

double area(const Shape& sh) {
    return std::visit([](auto& s) {
        if constexpr (std::is_same_v<std::decay_t<decltype(s)>, Circle>)
            return 3.14159 * s.r * s.r;
        else
            return s.s * s.s;
    }, sh);
}

std::vector<Shape> shapes{Circle{1.0}, Square{2.0}, Circle{3.0}};
double total = 0;
for (auto& sh : shapes) total += area(sh);
```

**Detection tip:** If you find yourself writing another layer of type erasure on top of CRTP just to get a heterogeneous container, switch to `std::variant`.

### Pitfall 5 — Accidentally Instantiating Two `Base<Derived>` Chains

**Problem:** A derived class inherits from two CRTP bases that each inherit from a common third CRTP base, creating ambiguous member access (the diamond problem).

**BAD:**

```cpp
template<typename D> struct Logger  { void log() { static_cast<D*>(this)->log_impl(); } };
template<typename D> struct Auditor : Logger<D> { /* adds audit trail */ };
template<typename D> struct Monitor : Logger<D> { /* adds monitoring */ };

struct Service : Auditor<Service>, Monitor<Service> {
    void log_impl() {}
};

Service s;
s.log();   // ambiguous: Auditor<Service>::log() or Monitor<Service>::log()?
```

**Why it fails:** Both `Auditor<Service>` and `Monitor<Service>` inherit from `Logger<Service>`, so `Service` has two copies of `Logger<Service>` — a classic diamond. The call is ambiguous.

**GOOD — use virtual inheritance for the shared base, or restructure:**

```cpp
// Option A: flatten — Auditor and Monitor both directly use Logger independently
template<typename D> struct Logger  { void log() { static_cast<D*>(this)->log_impl(); } };
template<typename D> struct Auditor { void audit() { static_cast<D*>(this)->log_impl(); } };
template<typename D> struct Monitor { void monitor(){static_cast<D*>(this)->log_impl(); } };

struct Service : Logger<Service>, Auditor<Service>, Monitor<Service> {
    void log_impl() {}
};
// Now log(), audit(), monitor() are all unambiguous
```

**Detection tip:** Draw the CRTP inheritance graph. Any diamond (a node reachable via two distinct paths) requires restructuring or virtual inheritance.

### Pitfall 6 — Excessively Deep CRTP Chains Hiding Code Paths

**Problem:** Stacking five or more CRTP mixins makes it very hard to trace which base class provides a given method.

**BAD:**

```cpp
struct Config
    : Printable<Config>
    , Serialisable<Config>
    , Cloneable<Config>
    , Hashable<Config>
    , Comparable<Config>
    , Validatable<Config>
    , Diffable<Config> {
    // ...
};
// Navigating to the implementation of Config::diff() requires
// hunting through seven base templates
```

**Why it fails:** IDE navigation degrades; a `go to definition` on `config.diff()` may require multiple jumps. Compilation errors inside deep mixin chains produce confusing, multi-level template traces.

**GOOD — compose via helpers or use concepts directly for small interfaces:**

```cpp
// Use free functions constrained by concepts instead of mixin bases
template<typename T>
concept Stringifiable = requires(const T& t) {
    { t.to_string() } -> std::convertible_to<std::string>;
};

void print_any(const Stringifiable auto& obj) {
    std::cout << obj.to_string() << '\n';
}

// Config only inherits what genuinely needs shared implementation
struct Config : Comparable<Config> {
    std::string name; int value;
    bool operator==(const Config&) const = default;
    bool operator< (const Config& o) const { return name < o.name; }
    std::string to_string() const { return name + "=" + std::to_string(value); }
};

print_any(Config{"x", 1});   // works via concept constraint — no extra base
```

**Detection tip:** If a class inherits from more than three CRTP bases, question whether each mixin provides reusable implementation or merely a method signature. The latter is better expressed as a concept.

## Code Example

```cpp
#include <iostream>

template <typename Derived>
class AnimalBase {
  public:
    void speak() const { static_cast<const Derived*>(this)->speak_impl(); }
};

class Dog : public AnimalBase<Dog> {
  public:
    void speak_impl() const { std::cout << "woof\n"; }
};

int main() {
    Dog dog;
    std::cout << "Day 20 - Static Polymorphism and CRTP\n";
    dog.speak();
    return 0;
}
```
