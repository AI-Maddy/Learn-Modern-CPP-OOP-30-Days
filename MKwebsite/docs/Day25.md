# Day 25: Mini Project 2 – Shape Editor

## Why This Day Matters

The shape editor teaches you how to choose between four modern C++ patterns
for the same problem: virtual dispatch, the Visitor pattern, `std::variant`,
and factory + `std::ranges`. Knowing *when* to reach for each tool
separates intermediate C++ programmers from seniors.

## Learning Outcomes

After completing this day you will be able to:

* Build a polymorphic shape hierarchy with pure virtual `area()`,
  `perimeter()`, and `describe()` methods.
* Implement the Visitor pattern to add serialisation and area reporting
  as new operations without modifying shape classes.
* Rewrite the same hierarchy using `std::variant` and `std::visit`
  with the overloaded-lambda idiom, and explain the tradeoffs.
* Use a factory (with a runtime registry map) to construct shapes from
  string type tags.
* Filter and transform a shape collection with `std::ranges::views::filter`
  and `std::views::transform` in a lazy pipeline.

## Key Concepts

* **Virtual dispatch** — stable operation set, easy to add new types;
  each shape subclass provides its own implementation.
* **Visitor pattern** — stable type set, easy to add new operations;
  new behaviour is added by writing a new visitor class.
* **std::variant** — compile-time exhaustive dispatch; zero heap overhead
  for the shape itself; best when the type set is small and fixed.
* **Shape factory** — decouples construction from usage; a registry map
  lets new shapes register themselves at startup.
* **std::ranges views** — lazy filtering and transformation pipelines that
  compose without intermediate allocations.

## Theory

### Motivation

The shape editor is the classic OOP teaching example — but this day goes
beyond the introductory version. You will see four progressively modern
approaches to the same problem:

1. Classic virtual-function polymorphism (Open/Closed Principle via vtable).
2. The Visitor pattern (add new operations without modifying shape classes).
3. `std::variant` as a type-safe union alternative to inheritance.
4. `std::ranges` for filtering and transforming shape collections.

By comparing the tradeoffs you will develop the judgment to choose the right
tool for each situation in real code.

### Domain Overview

```text
Shape (abstract base)
├── Circle     — radius
├── Rectangle  — width, height
└── Triangle   — base, height
```

Operations needed:

* Compute area and perimeter of any shape.
* Render / describe any shape as a string.
* Serialise a collection to JSON.
* Filter a collection (e.g., keep only shapes with area > threshold).
* Create shapes from a string type tag (factory).

### Approach 1: Classic Virtual Polymorphism

The foundational approach — each shape overrides a pure virtual interface.

```cpp
#include <cmath>
#include <numbers>   // C++20: std::numbers::pi
#include <string>

class Shape {
public:
    virtual ~Shape() = default;

    // Pure virtual interface — every shape MUST implement these
    [[nodiscard]] virtual double area()      const = 0;
    [[nodiscard]] virtual double perimeter() const = 0;
    [[nodiscard]] virtual std::string describe() const = 0;
    [[nodiscard]] virtual std::string type_name() const = 0;
};

class Circle : public Shape {
public:
    explicit Circle(double radius) : r_{radius} {
        if (r_ <= 0.0)
            throw std::invalid_argument("Circle radius must be positive");
    }

    double area()      const override {
        return std::numbers::pi * r_ * r_;
    }
    double perimeter() const override {
        return 2.0 * std::numbers::pi * r_;
    }
    std::string describe()   const override {
        return "Circle(r=" + std::to_string(r_) + ")";
    }
    std::string type_name()  const override { return "circle"; }
    double radius() const { return r_; }

private:
    double r_;
};

class Rectangle : public Shape {
public:
    Rectangle(double w, double h) : w_{w}, h_{h} {
        if (w_ <= 0.0 || h_ <= 0.0)
            throw std::invalid_argument("Rectangle dimensions must be positive");
    }

    double area()      const override { return w_ * h_; }
    double perimeter() const override { return 2.0 * (w_ + h_); }
    std::string describe()   const override {
        return "Rectangle(" + std::to_string(w_) +
               "x" + std::to_string(h_) + ")";
    }
    std::string type_name()  const override { return "rectangle"; }

private:
    double w_, h_;
};

class Triangle : public Shape {
public:
    Triangle(double base, double height, double a, double b, double c)
        : base_{base}, height_{height}, a_{a}, b_{b}, c_{c}
    {}

    double area()      const override { return 0.5 * base_ * height_; }
    double perimeter() const override { return a_ + b_ + c_; }
    std::string describe()   const override {
        return "Triangle(b=" + std::to_string(base_) +
               " h=" + std::to_string(height_) + ")";
    }
    std::string type_name()  const override { return "triangle"; }

private:
    double base_, height_, a_, b_, c_;
};
```

**When to use**: when you have a stable set of types but expect to add new
operations rarely. Virtual dispatch has a small runtime cost but is
readable and extensible through subclassing.

### Approach 2: The Visitor Pattern

Add operations (area, serialise, render) without modifying shape classes.
This is the Open/Closed Principle applied to operations rather than types.

```cpp
// Forward declarations required by Visitor
class Circle;
class Rectangle;
class Triangle;

// Abstract visitor: one visit() overload per concrete shape
class ShapeVisitor {
public:
    virtual ~ShapeVisitor() = default;
    virtual void visit(const Circle&)    = 0;
    virtual void visit(const Rectangle&) = 0;
    virtual void visit(const Triangle&)  = 0;
};

// Shapes must accept visitors
class Shape {
public:
    virtual ~Shape() = default;
    virtual void accept(ShapeVisitor&) const = 0;
    // ... other virtuals as before
};

class Circle : public Shape {
public:
    void accept(ShapeVisitor& v) const override { v.visit(*this); }
    // ... rest of Circle unchanged
};

// Concrete visitor: prints area/perimeter
class AreaPrinter : public ShapeVisitor {
public:
    void visit(const Circle& c) override {
        std::cout << "Circle area: " << c.area() << '\n';
    }
    void visit(const Rectangle& r) override {
        std::cout << "Rectangle area: " << r.area() << '\n';
    }
    void visit(const Triangle& t) override {
        std::cout << "Triangle area: " << t.area() << '\n';
    }
};

// Concrete visitor: serialises to JSON
class JsonSerializer : public ShapeVisitor {
public:
    void visit(const Circle& c) override {
        result_ += "{\"type\":\"circle\",\"radius\":" +
                   std::to_string(c.radius()) + "}";
    }
    void visit(const Rectangle& r) override { /* ... */ }
    void visit(const Triangle& t)  override { /* ... */ }

    std::string result() const { return "[" + result_ + "]"; }
private:
    std::string result_;
};
```

**Tradeoff**: Visitor is powerful when operations are added frequently but
the type set is fixed. Adding a new shape type (e.g., Ellipse) requires
updating *every* visitor.

### Approach 3: std::variant — The Modern Alternative

C++17 `std::variant` models a type-safe discriminated union. No vtable,
no heap allocation for the shape itself, and `std::visit` dispatches at
compile time via a generated jump table.

```cpp
#include <variant>
#include <string>
#include <cmath>
#include <numbers>

// Plain structs — no inheritance required
struct Circle    { double radius; };
struct Rectangle { double width, height; };
struct Triangle  { double base, height, a, b, c; };

// The variant is the "shape type"
using ShapeV = std::variant<Circle, Rectangle, Triangle>;

// Overloaded visitor using the overloaded-lambda idiom (C++17)
template<typename... Ts>
struct overloaded : Ts... { using Ts::operator()...; };

// Compute area for any variant shape
double area(const ShapeV& s) {
    return std::visit(overloaded{
        [](const Circle& c)    { return std::numbers::pi * c.radius * c.radius; },
        [](const Rectangle& r) { return r.width * r.height; },
        [](const Triangle& t)  { return 0.5 * t.base * t.height; }
    }, s);
}

// Describe any variant shape
std::string describe(const ShapeV& s) {
    return std::visit(overloaded{
        [](const Circle& c)    {
            return "Circle(r=" + std::to_string(c.radius) + ")";
        },
        [](const Rectangle& r) {
            return "Rect(" + std::to_string(r.width) + "x" +
                   std::to_string(r.height) + ")";
        },
        [](const Triangle& t)  {
            return "Tri(b=" + std::to_string(t.base) + ")";
        }
    }, s);
}
```

**When to use `std::variant`**: when the set of types is small and fixed
at compile time, you want stack allocation, or you want exhaustive switching
(the compiler warns if a new type is added but a visitor is not updated).

### Approach 4: Factory + std::ranges Filtering

A factory creates shapes from runtime string tags. `std::ranges` provides
pipeline-style filtering and transformation.

```cpp
#include <memory>
#include <ranges>
#include <string>
#include <stdexcept>
#include <map>
#include <functional>
#include <vector>

// Factory using a registry map
class ShapeFactory {
public:
    using Creator = std::function<std::unique_ptr<Shape>()>;

    static ShapeFactory& instance() {
        static ShapeFactory factory;
        return factory;
    }

    void register_shape(const std::string& tag, Creator creator) {
        registry_[tag] = std::move(creator);
    }

    std::unique_ptr<Shape> create(const std::string& tag) const {
        auto it = registry_.find(tag);
        if (it == registry_.end())
            throw std::invalid_argument("Unknown shape type: " + tag);
        return it->second();
    }

private:
    std::map<std::string, Creator> registry_;
};

// std::ranges: filter shapes whose area exceeds a threshold
void print_large_shapes(
    const std::vector<std::unique_ptr<Shape>>& shapes,
    double min_area)
{
    auto large = shapes
        | std::views::filter([&](const auto& sp) {
              return sp->area() > min_area;
          })
        | std::views::transform([](const auto& sp) {
              return sp->describe();
          });

    for (const auto& desc : large)
        std::cout << desc << '\n';
}
```

### ASCII Diagram: Four Approaches Compared

```text
┌─────────────────┬────────────────────┬──────────────────┐
│ Approach        │ Add new TYPE easy? │ Add new OP easy? │
├─────────────────┼────────────────────┼──────────────────┤
│ Virtual funcs   │ Yes (subclass)     │ No (touch base)  │
│ Visitor         │ No (touch all vis) │ Yes (new visitor) │
│ std::variant    │ No (recompile)     │ Yes (new visit)  │
│ Type-erasure    │ Yes                │ Yes (complex)    │
└─────────────────┴────────────────────┴──────────────────┘
```

This is the **Expression Problem**: no solution is perfect for both axes
without additional machinery (type erasure / concept-based polymorphism).

### Serialisation

```cpp
// Serialise a collection of shapes to a JSON array string
std::string serialise_shapes(
    const std::vector<std::unique_ptr<Shape>>& shapes)
{
    std::string json = "[\n";
    bool first = true;
    for (const auto& sp : shapes) {
        if (!first) json += ",\n";
        json += "  {\"type\":\"" + sp->type_name() + "\""
              + ",\"area\":"      + std::to_string(sp->area())
              + ",\"perimeter\":" + std::to_string(sp->perimeter())
              + "}";
        first = false;
    }
    return json + "\n]";
}
```

## Pitfalls

### Pitfall 1: Switch-on-Type Instead of Polymorphism

**Description**
Querying a pointer's dynamic type with `dynamic_cast` or a type-tag
enum inside a switch is a red flag. It duplicates the virtual dispatch the
compiler already provides and breaks every time a new shape is added.

**BAD code**

```cpp
void print_area(const Shape* s) {
    if (auto* c = dynamic_cast<const Circle*>(s)) {
        std::cout << 3.14159 * c->radius() * c->radius() << '\n';
    } else if (auto* r = dynamic_cast<const Rectangle*>(s)) {
        std::cout << r->width() * r->height() << '\n';
    }
    // Adding Triangle requires editing this function
}
```

**GOOD code**

```cpp
// area() is a pure virtual in Shape — each subtype implements it
void print_area(const Shape& s) {
    std::cout << s.area() << '\n';
}

// OR with std::variant — exhaustive at compile time
void print_area(const ShapeV& s) {
    std::cout << area(s) << '\n';  // std::visit dispatches correctly
}
```

---

### Pitfall 2: Ignoring `[[nodiscard]]` on Geometry Functions

**Description**
Calling `shape.area()` without using the return value is almost always
a programming error.

**BAD code**

```cpp
class Circle : public Shape {
public:
    double area() const override { return 3.14159 * r_ * r_; }
    // No [[nodiscard]] — silent bug goes undetected
};

Circle c{5.0};
c.area();       // compiles silently; result discarded — almost certainly a bug
```

**GOOD code**

```cpp
class Circle : public Shape {
public:
    [[nodiscard]] double area() const override {
        return std::numbers::pi * r_ * r_;
    }
};
```

**Detection tip:** Enable `-Wunused-result` (GCC/Clang). Apply `[[nodiscard]]` to all
pure query functions.

---

### Pitfall 3: Storing Polymorphic Objects by Value (Object Slicing)

**Description**
Putting a derived object into a container of base-class *values* silently
discards the derived portion. Virtual dispatch then uses the wrong vtable.

**BAD code**

```cpp
std::vector<Shape> shapes;     // stores Shape objects BY VALUE
shapes.push_back(Circle{5.0}); // SLICED: only Shape portion kept
shapes[0].area();              // returns 0 or calls Shape::area (pure virtual UB)
```

**GOOD code**

```cpp
std::vector<std::unique_ptr<Shape>> shapes;
shapes.push_back(std::make_unique<Circle>(5.0));
shapes[0]->area();   // calls Circle::area correctly
```

---

### Pitfall 4: Unchecked `std::get` on `std::variant`

**Description**
`std::get<T>(v)` throws `std::bad_variant_access` if the variant does
not currently hold type `T`.

**BAD code**

```cpp
ShapeV s = Rectangle{3.0, 4.0};
// Programmer assumes it's a Circle — incorrect assumption
double r = std::get<Circle>(s).radius;  // throws std::bad_variant_access
```

**GOOD code**

```cpp
// Option A: check with std::holds_alternative first
if (std::holds_alternative<Circle>(s)) {
    double r = std::get<Circle>(s).radius;
}

// Option B: use std::get_if which returns nullptr on type mismatch
if (auto* c = std::get_if<Circle>(&s)) {
    double r = c->radius;
}

// Option C: use std::visit — exhaustive by construction
std::visit(overloaded{
    [](const Circle& c)    { /* handle circle */    },
    [](const Rectangle& r) { /* handle rectangle */ },
    [](const Triangle& t)  { /* handle triangle */  }
}, s);
```

---

### Pitfall 5: Forgetting the Visitor `accept()` in Derived Classes

**Description**
If a concrete shape forgets to override `accept()`, the visitor dispatches
to the wrong overload silently.

**BAD code**

```cpp
class Triangle : public Shape {
public:
    // Forgot to override accept() — linker error or wrong visitor overload
    double area()      const override { return 0.5 * base_ * height_; }
    double perimeter() const override { return a_ + b_ + c_; }
};
```

**GOOD code**

```cpp
class Triangle : public Shape {
public:
    void accept(ShapeVisitor& v) const override { v.visit(*this); }
    double area()      const override { return 0.5 * base_ * height_; }
    double perimeter() const override { return a_ + b_ + c_; }
};
```

**Detection tip:** Use `= 0` (pure virtual) for `accept()` in the base class so the
compiler forces every concrete subclass to provide an implementation.

---

### Pitfall 6: Missing Validation in Shape Constructors

**Description**
Creating a `Circle` with radius zero or a `Rectangle` with a negative
dimension produces a mathematically invalid shape.

**BAD code**

```cpp
Circle c{-5.0};          // negative radius: area() returns positive (squared)
Rectangle r{0.0, 4.0};  // zero width: area() returns 0 silently
```

**GOOD code**

```cpp
Circle::Circle(double radius) : r_{radius} {
    if (r_ <= 0.0)
        throw std::invalid_argument(
            "Circle radius must be positive, got: " + std::to_string(r_));
}

Rectangle::Rectangle(double w, double h) : w_{w}, h_{h} {
    if (w_ <= 0.0 || h_ <= 0.0)
        throw std::invalid_argument(
            "Rectangle dimensions must be positive");
}
```

## Code Example

```cpp
#include <cmath>
#include <iostream>
#include <memory>
#include <vector>

class Shape {
  public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
};

class Circle : public Shape {
  public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.1415926535 * r_ * r_; }

  private:
    double r_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> canvas;
    canvas.push_back(std::make_unique<Circle>(2.0));
    std::cout << "Day 25 - Mini Project Shape Editor\n";
    std::cout << "Area: " << canvas.front()->area() << "\n";
    return 0;
}
```
