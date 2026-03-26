Day 06 — Inheritance and Polymorphism
======================================

Why This Day Matters
--------------------

Inheritance lets you express "is-a" relationships and share behaviour across a type hierarchy.
Polymorphism lets you write code that works on the base class and automatically handles any
derived class correctly. Together, they are the foundation of extensible OOP design.

But inheritance is also the most misused feature in C++. This day teaches when to use it, what
the vtable mechanism actually does, how to upcast and downcast safely, and the Liskov
Substitution Principle that defines what "correct" inheritance means.


The is-a Relationship
----------------------

Inheritance models the "is-a" relationship: a ``Dog`` is an ``Animal``. This is distinct from
"has-a" (composition): a ``Car`` has-an ``Engine``. Use inheritance for is-a; use composition
for has-a.

.. code-block:: cpp

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

Access Specifiers in Inheritance
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    class Base { protected: int x_{0}; };

    class PublicDerived    : public    Base {};  // Base's public -> public in Derived
                                                 // Base's protected -> protected in Derived
    class ProtectedDerived : protected Base {};  // Base's public -> protected in Derived
    class PrivateDerived   : private   Base {};  // Base's public -> private in Derived

**Practical use:**

* ``public`` inheritance: the derived class "is-a" base. This is the common case.
* ``protected`` inheritance: rarely used; means "implemented in terms of" with access to
  base internals.
* ``private`` inheritance: also "implemented in terms of"; usually composition is clearer.


Virtual Functions and the vtable
----------------------------------

A virtual function is dispatched at runtime based on the actual type of the object, not the
declared type of the pointer or reference.

.. code-block:: cpp

    Shape* s = new Circle{5.0};
    double a = s->area();   // calls Circle::area(), not Shape::area()
                            // even though s is typed as Shape*

**How the vtable works:**

::

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

Each class with at least one virtual function has exactly one vtable. Every instance of that
class stores a ``vptr`` — a pointer to the vtable. This is why polymorphic objects are slightly
larger than plain structs.

.. code-block:: cpp

    struct Plain   { int x; };            // sizeof = 4 (no vptr)
    struct Poly    { virtual void f(); int x; };  // sizeof = 16 (vptr + int + padding)

The vtable lookup takes one extra pointer dereference. For hot loops with many virtual calls,
this can cause instruction cache misses. (Day 22 covers alternatives.)


``override`` and ``final``
---------------------------

``override`` tells the compiler "this function is intended to override a base class virtual
function". If the signature does not match, the compiler reports an error.

.. code-block:: cpp

    class Base {
    public:
        virtual void draw(int colour) const;
        virtual void update(float dt);
    };

    class Derived : public Base {
    public:
        void draw(int colour) const override;   // OK: matches Base::draw

        // Without override:
        void update(float dt);    // silently a new function if signature differs
                                  // e.g., if we accidentally wrote update(double dt)

        // With override:
        // void update(double dt) override;  // ERROR: no matching virtual in Base
    };

**Rule:** Always write ``override`` on every function that overrides a virtual. Never omit it.


The Slicing Problem
--------------------

Object slicing occurs when a derived class object is copied or assigned through a base class
value (not a pointer or reference). The derived part is silently discarded.

.. code-block:: cpp

    #include <iostream>

    class Animal {
    public:
        virtual std::string speak() const { return "..."; }
    };

    class Dog : public Animal {
    public:
        std::string speak() const override { return "Woof"; }
    };

    void greet(Animal a) {           // takes Animal BY VALUE — slicing!
        std::cout << a.speak();
    }

    int main() {
        Dog d;
        greet(d);      // d is sliced to Animal — speak() returns "..."
    }

    // Correct: take by reference or pointer
    void greet_ref(const Animal& a) {
        std::cout << a.speak();      // dispatches to Dog::speak() — "Woof"
    }

**Rule:** Polymorphic base classes should not be copyable. If they are, slicing is a risk.
Mark base class copy constructors deleted, or at minimum, always pass polymorphic objects by
reference or (smart) pointer.


Upcasting and Downcasting
--------------------------

**Upcasting** (derived → base) is implicit and always safe.

.. code-block:: cpp

    Dog* dog = new Dog{};
    Animal* animal = dog;   // implicit upcast: always safe
    const Animal& ref = *dog;  // also safe

**Downcasting** (base → derived) requires a runtime check via ``dynamic_cast``.

.. code-block:: cpp

    #include <iostream>
    #include <memory>

    void process(Animal* a) {
        // Attempt to downcast to Dog
        if (Dog* dog = dynamic_cast<Dog*>(a)) {
            // a actually points to a Dog — safe to use as Dog
            std::cout << "It's a Dog: " << dog->speak() << '\n';
        } else {
            // a is not a Dog — dynamic_cast returned nullptr
            std::cout << "Not a Dog\n";
        }
    }

``dynamic_cast`` requires at least one virtual function in the class hierarchy (to locate
the type information). It costs a runtime type check.

For references, ``dynamic_cast<Derived&>(base)`` throws ``std::bad_cast`` on failure (since
a null reference is not valid):

.. code-block:: cpp

    try {
        Dog& dog = dynamic_cast<Dog&>(*animal);
        // safe
    } catch (const std::bad_cast& e) {
        std::cerr << "Not a Dog\n";
    }

When is ``dynamic_cast`` appropriate?
* Visitor pattern implementations
* Plugin systems where you receive a ``Base*`` and need to query a specific capability
* When ``std::variant`` or interfaces (pure virtual) would eliminate the cast is usually better


Liskov Substitution Principle
-------------------------------

**LSP** (from SOLID — Day 18): if ``S`` is a subtype of ``T``, then objects of type ``T`` may
be replaced by objects of type ``S`` without altering correctness.

In practical terms: a derived class must honour the preconditions and postconditions of every
base class function it overrides.

.. code-block:: cpp

    class Rectangle {
    public:
        virtual void set_width(double w)  { width_  = w; }
        virtual void set_height(double h) { height_ = h; }
        double area() const { return width_ * height_; }
    protected:
        double width_{1}, height_{1};
    };

    // LSP VIOLATION: Square overrides setters to maintain the square invariant,
    // but breaks Rectangle's contract (setting width should not change height).
    class Square : public Rectangle {
    public:
        void set_width(double w)  override { width_ = height_ = w; }
        void set_height(double h) override { width_ = height_ = h; }
    };

    void test(Rectangle& r) {
        r.set_width(4);
        r.set_height(5);
        assert(r.area() == 20.0);  // fails for Square: area is 25.0
    }

**Fix:** Do not model ``Square`` as a subtype of ``Rectangle`` if the shape invariants are
incompatible. Model them as independent ``Shape`` subtypes, or make ``Rectangle`` non-virtual.


Multiple Inheritance and Virtual Bases
---------------------------------------

C++ supports multiple inheritance. Use it sparingly; prefer interface inheritance (abstract base
classes with no data) over implementation inheritance.

.. code-block:: cpp

    class Printable  { public: virtual void print()  const = 0; };
    class Serializable { public: virtual void serialize() const = 0; };

    class Document : public Printable, public Serializable {
    public:
        void print()     const override { /* ... */ }
        void serialize() const override { /* ... */ }
    };

**Diamond problem** — use ``virtual`` inheritance when a class appears at the top of a diamond:

.. code-block:: cpp

    class Base { public: int x{0}; };
    class Left  : virtual public Base {};   // virtual: share one Base subobject
    class Right : virtual public Base {};
    class Both  : public Left, public Right {};
    // Both has exactly one Base::x — no ambiguity


Self-Check Questions
--------------------

**Q1: What does the vtable contain and when is it looked up?**

The vtable is a compile-time-generated array of function pointers, one per virtual function
in the class (and its bases). Each polymorphic object stores a ``vptr`` — a hidden pointer to
its class's vtable. When a virtual function is called through a pointer or reference, the
runtime loads the ``vptr``, indexes into the vtable, and calls the function pointer stored
there. This happens on every virtual call.

**Q2: What is object slicing and how do you prevent it?**

Slicing occurs when a derived class object is assigned or passed by value to a base class
variable. The derived-specific data members are silently discarded. The fix: always pass
polymorphic objects by reference (``const Base&``) or by smart pointer (``unique_ptr<Base>``).
Optionally, delete the copy constructor in the base class to make slicing a compile error.

**Q3: What is the Liskov Substitution Principle and what does it forbid?**

LSP states that a derived class must be usable wherever its base class is expected, without
breaking any behaviour promised by the base class. It forbids strengthening preconditions
(requiring more from the caller) or weakening postconditions (guaranteeing less to the caller).
The Square/Rectangle example violates LSP because Square's setter breaks Rectangle's postcondition
that ``set_width`` does not change ``height``.

**Q4: When is ``dynamic_cast`` appropriate and what is its cost?**

``dynamic_cast`` is appropriate when you receive a ``Base*`` at a system boundary (plugin,
callback) and need to query whether the actual type supports a specific interface. Its cost is
a runtime type-information lookup — typically a few pointer comparisons, but it inhibits
inlining and requires RTTI to be enabled. In code where the type is always known, prefer
``static_cast`` or redesign with virtual functions to avoid the cast entirely.
