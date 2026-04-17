---
title: "02 — Definition · Day 08"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-book: 02 — Definition: Advanced OOP Patterns

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)

!!! info "🔵 Blue = Theory — Precise, formal, complete"
    Read this section carefully. Every word matters.
    After reading, close the page and explain it back in your own words.

---


## :material-book: Motivation

Classic object-oriented design teaches inheritance as the primary tool for code reuse. In practice, deep inheritance hierarchies become brittle: every change to a base class ripples through dozens of derived classes, and adding cross-cutting behaviour (logging, serialisation, thread-safety) forces awkward multiple-inheritance gymnastics.

Modern C++ offers sharper tools:

- **Composition over inheritance** — assemble behaviour from small, focused objects.
- **CRTP mixins** — inject zero-cost behaviour at compile time without virtual calls.
- **Strategy via** `std::function` — swap algorithms at runtime with clean syntax.
- **Value vs reference semantics** — choose the right ownership model for the domain.
- **pImpl** — hide implementation details behind a pointer wall.
- **Interface segregation** — small, precise abstractions instead of fat interfaces.

Each pattern solves a specific recurring pain. Knowing *when* to apply which one is the mark of an experienced C++ designer.

## :material-book: Composition over Inheritance

The canonical rule from the Gang of Four: *favour object composition over class inheritance*. Inheritance models an IS-A relationship; composition models HAS-A.

**Why inheritance hurts at scale**

``` cpp
// BAD: "animal farm" hierarchy explosion
class Animal { public: virtual void move() = 0; };
class FlyingAnimal   : public Animal { /* ... */ };
class SwimmingAnimal : public Animal { /* ... */ };
// Need a duck: flies AND swims.
// Multiple inheritance causes diamond ambiguity.
class Duck : public FlyingAnimal, public SwimmingAnimal { /* oops */ };
```

Every new combination demands a new class. With N independent behaviour axes you can need 2^N classes — the classic "class explosion" anti-pattern.

**Composition solves this**

``` cpp
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

ASCII diagram — inheritance vs composition:

    Inheritance (class explosion)      Composition (linear growth)
    ─────────────────────────────────  ─────────────────────────────────
    Animal                             Animal<Loco>
      ├── FlyingAnimal                   name_ : string
      │     └── FlyingSwimmingAnimal     loco_ : Loco
      └── SwimmingAnimal                          │
                                       ┌──────────┤
                                       │ FlySwim  │
                                       │ ┌──────┐ │
                                       │ │Flyer │ │
                                       │ └──────┘ │
                                       │ ┌───────┐│
                                       │ │Swimmer││
                                       │ └───────┘│
                                       └──────────┘

## :material-book: CRTP Mixins — Zero-Cost Behaviour Injection

The **Curiously Recurring Template Pattern** lets a base class call methods on its derived class without virtual dispatch. Use it to inject reusable behaviour (comparable, printable, serialisable) at compile time.

``` cpp
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

// Usage — all comparison operators work; zero virtual calls
// Temperature a{20.0}, b{37.0};
// bool result = a <= b;   // calls Comparable<Temperature>::operator<=
```

**CRTP cost model**: the generated code is identical to hand-written functions. The base class is a compile-time detail; no vtable, no indirection.

**When to use CRTP mixins**

- Cross-cutting concerns that many unrelated classes share.
- Performance-critical code where virtual dispatch overhead is measurable.
- Libraries where you control neither the base nor the derived class type.

**When to avoid**

- When runtime polymorphism is genuinely needed (heterogeneous collections).
- When the mixin logic is complex — readability suffers.
- In C++20+ consider concepts + free functions over CRTP for cleaner interfaces.


---

## :material-vector-polyline: Knowledge Map (SPATIAL MEMORY — Feature 7)

```mermaid
graph TD
    ROOT["Advanced OOP Patterns"] --> A["class"]
    Advanced_OOP_Patterns --> class["class"]
    Advanced_OOP_Patterns --> RAII["RAII"]
    Advanced_OOP_Patterns --> virtual["virtual"]
    Advanced_OOP_Patterns --> override["override"]
    style ROOT fill:#8b5cf6,color:#fff
    style A    fill:#3b82f6,color:#fff
```


---

## :material-memory: Quick Definitions Table

| Term | Meaning |
|------|---------|
| `class` | _class — key concept for Advanced OOP Patterns_ |
| `RAII` | _RAII — key concept for Advanced OOP Patterns_ |
| `virtual` | _virtual — key concept for Advanced OOP Patterns_ |
| `override` | _override — key concept for Advanced OOP Patterns_ |
| `unique_ptr` | _unique_ptr — key concept for Advanced OOP Patterns_ |


---

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)
