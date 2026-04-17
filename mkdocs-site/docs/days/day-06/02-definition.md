---
title: "02 — Definition · Day 06"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-book: 02 — Definition: Inheritance Polymorphism

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)

!!! info "🔵 Blue = Theory — Precise, formal, complete"
    Read this section carefully. Every word matters.
    After reading, close the page and explain it back in your own words.

---


## :material-book: Why This Day Matters

Inheritance lets you express "is-a" relationships and share behaviour across a type hierarchy. Polymorphism lets you write code that works on the base class and automatically handles any derived class correctly. Together, they are the foundation of extensible OOP design.

But inheritance is also the most misused feature in C++. This day teaches when to use it, what the vtable mechanism actually does, how to upcast and downcast safely, and the Liskov Substitution Principle that defines what "correct" inheritance means.

## :material-book: The is-a Relationship

Inheritance models the "is-a" relationship: a `Dog` is an `Animal`. This is distinct from "has-a" (composition): a `Car` has-an `Engine`. Use inheritance for is-a; use composition for has-a.

``` cpp
// IS-A: correct use of inheritance
class Shape {
public:
    virtual double area() const = 0;
    virtual ~Shape() = default;
};

class Circle : public Shape {
public:
    explicit Circle(double r) : radius_{r} {}
    double area() const override { return 3.14159 * radius_ * radius_; }
private:
    double radius_;
};

class Rectangle : public Shape {
public:
    Rectangle(double w, double h) : width_{w}, height_{h} {}
    double area() const override { return width_ * height_; }
private:
    double width_, height_;
};

// HAS-A: prefer composition over inheritance when the relationship is not is-a
class Car {
    Engine engine_;     // Car has-an Engine — not Car is-an Engine
    Wheels wheels_;
};
```

### Access Specifiers in Inheritance

``` cpp
class Base { protected: int x_{0}; };

class PublicDerived    : public    Base {};  // Base's public -> public in Derived
                                             // Base's protected -> protected in Derived
class ProtectedDerived : protected Base {};  // Base's public -> protected in Derived
class PrivateDerived   : private   Base {};  // Base's public -> private in Derived
```

**Practical use:**

- `public` inheritance: the derived class "is-a" base. This is the common case.
- `protected` inheritance: rarely used; means "implemented in terms of" with access to base internals.
- `private` inheritance: also "implemented in terms of"; usually composition is clearer.

## :material-book: Virtual Functions and the vtable

A virtual function is dispatched at runtime based on the actual type of the object, not the declared type of the pointer or reference.

``` cpp
Shape* s = new Circle{5.0};
double a = s->area();   // calls Circle::area(), not Shape::area()
                        // even though s is typed as Shape*
```

**How the vtable works:**

    Memory layout of a polymorphic object:

    Circle object:
    ┌─────────────────────────┐
    │  vptr ──────────────────┼──→  Circle vtable
    │  radius_                │      ┌─────────────────────────┐
    └─────────────────────────┘      │  &Circle::area          │
                                     │  &Shape::~Shape (dtor)  │
                                     └─────────────────────────┘

    Calling s->area():
    1. Load vptr from the object
    2. Look up slot for area() in the vtable
    3. Call the function pointer stored there -> Circle::area

Each class with at least one virtual function has exactly one vtable. Every instance of that class stores a `vptr` — a pointer to the vtable. This is why polymorphic objects are slightly larger than plain structs.

``` cpp
struct Plain   { int x; };            // sizeof = 4 (no vptr)
struct Poly    { virtual void f(); int x; };  // sizeof = 16 (vptr + int + padding)
```

The vtable lookup takes one extra pointer dereference. For hot loops with many virtual calls, this can cause instruction cache misses. (Day 22 covers alternatives.)


---

## :material-vector-polyline: Knowledge Map (SPATIAL MEMORY — Feature 7)

```mermaid
graph TD
    ROOT["Inheritance Polymorphism"] --> A["class"]
    Inheritance_Polymorphism --> class["class"]
    Inheritance_Polymorphism --> RAII["RAII"]
    Inheritance_Polymorphism --> virtual["virtual"]
    Inheritance_Polymorphism --> override["override"]
    style ROOT fill:#8b5cf6,color:#fff
    style A    fill:#3b82f6,color:#fff
```


---

## :material-memory: Quick Definitions Table

| Term | Meaning |
|------|---------|
| `class` | _class — key concept for Inheritance Polymorphism_ |
| `RAII` | _RAII — key concept for Inheritance Polymorphism_ |
| `virtual` | _virtual — key concept for Inheritance Polymorphism_ |
| `override` | _override — key concept for Inheritance Polymorphism_ |
| `unique_ptr` | _unique_ptr — key concept for Inheritance Polymorphism_ |


---

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)
