---
title: "04 — Pitfalls · Day 25"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-alert: 04 — Pitfalls: Mini Project 2 Shape Editor

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls – Day 25: Mini Project 2: Shape Editor

??? pitfall-lobe "⚠️ Pitfall 1: Switch-on-Type Instead of Polymorphism"
    **Description**  
    Querying a pointer's dynamic type with `dynamic_cast` or a type-tag enum inside a switch is a red flag. It duplicates the virtual dispatch the compiler already provides and breaks every time a new shape is added.

    **BAD code**

    ``` cpp
    void print_area(const Shape* s) {
        if (auto* c = dynamic_cast<const Circle*>(s)) {
            std::cout << 3.14159 * c->radius() * c->radius() << '\n';
        } else if (auto* r = dynamic_cast<const Rectangle*>(s)) {
            std::cout << r->width() * r->height() << '\n';
        }
        // Adding Triangle requires editing this function
    }
    ```

    **Why it fails**  
    Every new shape type requires finding and updating every switch/if-chain in the codebase. Forgetting one site causes silent wrong behaviour (no compiler error). This violates the Open/Closed Principle.

    **GOOD code**

    ``` cpp
    // area() is a pure virtual in Shape — each subtype implements it
    void print_area(const Shape& s) {
        std::cout << s.area() << '\n';
    }

    // OR with std::variant — exhaustive at compile time
    void print_area(const ShapeV& s) {
        std::cout << area(s) << '\n';  // std::visit dispatches correctly
    }
    ```

    **Detection tip**  
    `clang-tidy` check `cppcoreguidelines-pro-type-cstyle-cast` and `modernize-use-using` flag many style issues; grep for `dynamic_cast` and review each occurrence manually.

??? pitfall-lobe "⚠️ Pitfall 2: Ignoring `[[nodiscard]]` on Geometry Functions"
    **Description**  
    Calling `shape.area()` without using the return value is almost always a programming error (e.g., calling the function for a side-effect it does not have, or forgetting to store the result).

    **BAD code**

    ``` cpp
    class Circle : public Shape {
    public:
        double area() const override { return 3.14159 * r_ * r_; }
        // No [[nodiscard]] — silent bug goes undetected
    };

    Circle c{5.0};
    c.area();       // compiles silently; result discarded — almost certainly a bug
    ```

    **Why it fails**  
    There is no diagnostic. A reviewer may miss that the result was never used.

    **GOOD code**

    ``` cpp
    class Circle : public Shape {
    public:
        [[nodiscard]] double area() const override {
            return std::numbers::pi * r_ * r_;
        }
    };

    // Now this produces a compiler warning:
    // c.area();   // warning: ignoring return value of function declared
                   //          with 'nodiscard' attribute
    ```

    **Detection tip**  
    Enable `-Wunused-result` (GCC/Clang). Apply `[[nodiscard]]` to all pure query functions that have no observable side effects.

??? pitfall-lobe "⚠️ Pitfall 3: Storing Polymorphic Objects by Value (Object Slicing)"
    **Description**  
    Putting a derived object into a container of base-class *values* silently discards the derived portion. Virtual dispatch then uses the wrong vtable.

    **BAD code**

    ``` cpp
    std::vector<Shape> shapes;     // stores Shape objects BY VALUE
    shapes.push_back(Circle{5.0}); // SLICED: only Shape portion kept
    shapes[0].area();              // returns 0 or calls Shape::area (pure virtual UB)
    ```

    **Why it fails**  
    `std::vector<Shape>` copies shapes into `Shape` slots. The derived-class data (radius, etc.) and the vtable pointer for the derived type are both lost.

    **GOOD code**

    ``` cpp
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(5.0));
    shapes[0]->area();   // calls Circle::area correctly
    ```

    **Detection tip**  
    If your base class is abstract (has a pure virtual), the compiler will refuse `std::vector<Shape>`. Make the abstract interface abstract to get this protection for free.

??? pitfall-lobe "⚠️ Pitfall 4: Unchecked `std::get` on `std::variant`"
    **Description**  
    `std::get<T>(v)` throws `std::bad_variant_access` if the variant does not currently hold type `T`. Calling it without checking the active type first causes runtime exceptions.

    **BAD code**

    ``` cpp
    ShapeV s = Rectangle{3.0, 4.0};
    // Programmer assumes it's a Circle — incorrect assumption
    double r = std::get<Circle>(s).radius;  // throws std::bad_variant_access
    ```

    **Why it fails**  
    The variant holds a `Rectangle`, not a `Circle`. The unchecked `std::get` throws at runtime with a not-very-helpful error message.

    **GOOD code**

    ``` cpp
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

    **Detection tip**  
    Prefer `std::visit` for all variant operations. Reserve `std::get` only for cases where the active type is genuinely guaranteed by invariants.

??? pitfall-lobe "⚠️ Pitfall 5: Forgetting the Visitor `accept()` in Derived Classes"
    **Description**  
    If a concrete shape forgets to override `accept()`, it inherits the base class version (or has no `accept` at all). The visitor dispatches to the wrong overload silently.

    **BAD code**

    ``` cpp
    class Triangle : public Shape {
    public:
        // Forgot to override accept() — inherits Shape::accept (pure virtual)
        // or, worse, inherits a default that calls the wrong visit()
        double area()      const override { return 0.5 * base_ * height_; }
        double perimeter() const override { return a_ + b_ + c_; }
    };

    AreaPrinter printer;
    Triangle t{6.0, 8.0, 6.0, 8.0, 10.0};
    t.accept(printer);  // linker error (pure virtual) or wrong visitor overload
    ```

    **Why it fails**  
    The visitor pattern requires *every* concrete class to call `v.visit(*this)`. Omitting the override breaks dispatch entirely.

    **GOOD code**

    ``` cpp
    class Triangle : public Shape {
    public:
        void accept(ShapeVisitor& v) const override { v.visit(*this); }
        double area()      const override { return 0.5 * base_ * height_; }
        double perimeter() const override { return a_ + b_ + c_; }
    };
    ```

    **Detection tip**  
    Use `= 0` (pure virtual) for `accept()` in the base class so the compiler forces every concrete subclass to provide an implementation. Pair with `-Woverride` (or `override` keyword) to catch omissions.

??? pitfall-lobe "⚠️ Pitfall 6: Missing Validation in Shape Constructors"
    **Description**  
    Creating a `Circle` with radius zero or a `Rectangle` with a negative dimension produces a mathematically invalid shape that silently poisons every subsequent calculation.

    **BAD code**

    ``` cpp
    Circle c{-5.0};          // negative radius: area() returns positive (squared)
    Rectangle r{0.0, 4.0};  // zero width: area() returns 0 silently
    ```

    **Why it fails**  
    The objects are constructed with impossible geometry. No error is raised, and callers receive nonsensical values from `area()` and `perimeter()`.

    **GOOD code**

    ``` cpp
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

    **Detection tip**  
    Write a unit test for each constructor with zero and negative values and assert they throw `std::invalid_argument`. Run the tests in CI.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 25:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
