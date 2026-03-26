Day 25 – Mini Project 2: Shape Editor
======================================

Motivation
----------

The shape editor is the classic OOP teaching example — but this day goes
beyond the introductory version. You will see four progressively modern
approaches to the same problem:

#. Classic virtual-function polymorphism (Open/Closed Principle via vtable).
#. The Visitor pattern (add new operations without modifying shape classes).
#. ``std::variant`` as a type-safe union alternative to inheritance.
#. ``std::ranges`` for filtering and transforming shape collections.

By comparing the tradeoffs you will develop the judgment to choose the right
tool for each situation in real code.

Domain Overview
---------------

.. code-block:: text

    Shape (abstract base)
    ├── Circle     — radius
    ├── Rectangle  — width, height
    └── Triangle   — base, height

Operations needed:

* Compute area and perimeter of any shape.
* Render / describe any shape as a string.
* Serialise a collection to JSON.
* Filter a collection (e.g., keep only shapes with area > threshold).
* Create shapes from a string type tag (factory).

Approach 1: Classic Virtual Polymorphism
-----------------------------------------

The foundational approach — each shape overrides a pure virtual interface.

.. code-block:: cpp

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

**When to use**: when you have a stable set of types but expect to add new
operations rarely. Virtual dispatch has a small runtime cost but is
readable and extensible through subclassing.

Approach 2: The Visitor Pattern
--------------------------------

Add operations (area, serialise, render) without modifying shape classes.
This is the Open/Closed Principle applied to operations rather than types.

.. code-block:: cpp

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

**Tradeoff**: Visitor is powerful when operations are added frequently but
the type set is fixed. Adding a new shape type (e.g., Ellipse) requires
updating *every* visitor — the exact opposite tradeoff from virtual dispatch.

Approach 3: std::variant — The Modern Alternative
--------------------------------------------------

C++17 ``std::variant`` models a type-safe discriminated union. No vtable,
no heap allocation for the shape itself, and ``std::visit`` dispatches at
compile time via a generated jump table.

.. code-block:: cpp

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

    // Usage
    std::vector<ShapeV> shapes = {
        Circle{5.0},
        Rectangle{3.0, 4.0},
        Triangle{6.0, 8.0, 6.0, 8.0, 10.0}
    };

    for (const auto& s : shapes)
        std::cout << describe(s) << " area=" << area(s) << '\n';

**When to use ``std::variant``**: when the set of types is small and fixed
at compile time, you want stack allocation, or you want exhaustive switching
(the compiler warns if a new type is added but a visitor is not updated).

Approach 4: Factory + std::ranges Filtering
--------------------------------------------

A factory creates shapes from runtime string tags. ``std::ranges`` provides
pipeline-style filtering and transformation.

.. code-block:: cpp

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

    // Register at program startup
    void register_default_shapes() {
        auto& f = ShapeFactory::instance();
        f.register_shape("circle",    [] {
            return std::make_unique<Circle>(1.0);
        });
        f.register_shape("rectangle", [] {
            return std::make_unique<Rectangle>(1.0, 1.0);
        });
    }

    // std::ranges: filter shapes whose area exceeds a threshold
    void print_large_shapes(
        const std::vector<std::unique_ptr<Shape>>& shapes,
        double min_area)
    {
        // ranges::filter works with ranges of smart pointers via *ptr
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

ASCII Diagram: Four Approaches Compared
----------------------------------------

.. code-block:: text

    ┌─────────────────┬────────────────────┬──────────────────┐
    │ Approach        │ Add new TYPE easy? │ Add new OP easy? │
    ├─────────────────┼────────────────────┼──────────────────┤
    │ Virtual funcs   │ Yes (subclass)     │ No (touch base)  │
    │ Visitor         │ No (touch all vis) │ Yes (new visitor) │
    │ std::variant    │ No (recompile)     │ Yes (new visit)  │
    │ Type-erasure    │ Yes                │ Yes (complex)    │
    └─────────────────┴────────────────────┴──────────────────┘

This is the **Expression Problem**: no solution is perfect for both axes
without additional machinery (type erasure / concept-based polymorphism).

Serialisation
-------------

.. code-block:: cpp

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

Design Tradeoffs
----------------

* **Virtual dispatch vs variant**: vtable costs one indirect call per
  virtual function. ``std::variant`` dispatches via a generated jump table
  with no heap allocation — measurably faster in tight loops over many shapes.

* **Visitor vs direct virtual**: Visitor keeps shape classes stable (good
  for library headers) but forces you to update every visitor when a new
  shape is added. Virtual dispatch requires touching the base class interface
  but makes adding shapes trivial.

* **Factory registry vs switch**: A registry map allows shapes to be
  registered at runtime (plugins, DLLs). A switch statement is simpler
  but requires recompilation to add a new shape.

Self-Check Questions
--------------------

#. **When would you choose std::variant over a virtual-function hierarchy?**

   When the set of types is small and known at compile time, you want
   stack allocation (no heap), or you need the compiler to enforce exhaustive
   handling (adding a new type without updating all visitors becomes a
   compile error).

#. **What is the Expression Problem?**

   The difficulty of extending a system in two dimensions simultaneously:
   adding new types (easy with OOP) and adding new operations (easy with
   Visitor/variant). No single pattern solves both without some coupling.

#. **What does [[nodiscard]] on area() communicate?**

   That discarding the return value is almost certainly a bug. A caller
   writing ``shape.area();`` without using the result gets a compiler warning.

#. **Why does std::ranges::filter return a lazy view rather than a vector?**

   A view is a zero-cost abstraction: it does not allocate memory or compute
   results until the range is iterated. This composes well — you can chain
   multiple view adaptors before materialising into a container.

#. **What happens if you store Shape objects by value in std::vector?**

   Object slicing: the vector holds ``Shape`` objects, truncating all
   derived-class data. Virtual dispatch stops working because the vtable
   pointer belongs to ``Shape``, not the original derived type. Always store
   via ``unique_ptr<Shape>`` or ``shared_ptr<Shape>``.
