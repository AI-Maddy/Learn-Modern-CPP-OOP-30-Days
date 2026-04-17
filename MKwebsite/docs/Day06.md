# Day 06: Inheritance and Polymorphism

## Why This Day Matters

Inheritance is C++'s primary tool for expressing "is-a" relationships and enabling open-ended
extension. Used correctly, it lets you write `draw(shapes)` once and have it work for every
`Shape` subtype ever added. Used incorrectly, it produces slicing bugs, virtual destructor
leaks, and fragile hierarchies. This day teaches you to tell the difference.

## Learning Outcomes

By the end of this day you will be able to:

* Identify when a relationship is truly "is-a" and when composition is more appropriate.
* Explain the vtable mechanism and the cost of a virtual function call.
* Declare virtual destructors in all polymorphic base classes.
* Write `override` on every overriding function and explain what the compiler checks.
* Recognise and prevent object slicing by always using references or pointers for polymorphism.
* Apply `dynamic_cast` safely for runtime type queries and handle both success and failure.
* Describe the Liskov Substitution Principle and identify a violation.

## Key Concepts

* **Virtual functions** — dispatched at runtime via the vtable; enable polymorphism through
  base class pointers and references.
* **`override`** — tells the compiler to verify the signature matches a base virtual; prevents
  silent hiding due to signature mismatches.
* **Virtual destructor** — required in any class used as a polymorphic base; ensures the correct
  destructor chain runs when deleting through a base pointer.
* **Object slicing** — the derived part is discarded when a derived object is copied into a base
  value; prevented by using references and pointers.
* **`dynamic_cast`** — runtime-checked downcast; returns null pointer on failure (pointer form)
  or throws `std::bad_cast` (reference form).
* **Liskov Substitution Principle** — derived types must honour the contracts of their base types;
  the Square/Rectangle problem is the canonical violation.

## Theory

### Why This Day Matters

Inheritance lets you express "is-a" relationships and share behaviour across a type hierarchy.
Polymorphism lets you write code that works on the base class and automatically handles any
derived class correctly. Together, they are the foundation of extensible OOP design.

But inheritance is also the most misused feature in C++. This day teaches when to use it, what
the vtable mechanism actually does, how to upcast and downcast safely, and the Liskov
Substitution Principle that defines what "correct" inheritance means.

### The is-a Relationship

Inheritance models the "is-a" relationship: a `Dog` is an `Animal`. This is distinct from
"has-a" (composition): a `Car` has-an `Engine`. Use inheritance for is-a; use composition
for has-a.

```cpp
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

#### Access Specifiers in Inheritance

```cpp
class Base { protected: int x_{0}; };

class PublicDerived    : public    Base {};  // Base's public -> public in Derived
                                             // Base's protected -> protected in Derived
class ProtectedDerived : protected Base {};  // Base's public -> protected in Derived
class PrivateDerived   : private   Base {};  // Base's public -> private in Derived
```

**Practical use:**

* `public` inheritance: the derived class "is-a" base. This is the common case.
* `protected` inheritance: rarely used; means "implemented in terms of" with access to
  base internals.
* `private` inheritance: also "implemented in terms of"; usually composition is clearer.

### Virtual Functions and the vtable

A virtual function is dispatched at runtime based on the actual type of the object, not the
declared type of the pointer or reference.

```cpp
Shape* s = new Circle{5.0};
double a = s->area();   // calls Circle::area(), not Shape::area()
                        // even though s is typed as Shape*
```

**How the vtable works:**

```
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
```

Each class with at least one virtual function has exactly one vtable. Every instance of that
class stores a `vptr` — a pointer to the vtable. This is why polymorphic objects are slightly
larger than plain structs.

```cpp
struct Plain   { int x; };            // sizeof = 4 (no vptr)
struct Poly    { virtual void f(); int x; };  // sizeof = 16 (vptr + int + padding)
```

The vtable lookup takes one extra pointer dereference. For hot loops with many virtual calls,
this can cause instruction cache misses. (Day 22 covers alternatives.)

### `override` and `final`

`override` tells the compiler "this function is intended to override a base class virtual
function". If the signature does not match, the compiler reports an error.

```cpp
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
```

**Rule:** Always write `override` on every function that overrides a virtual. Never omit it.

### The Slicing Problem

Object slicing occurs when a derived class object is copied or assigned through a base class
value (not a pointer or reference). The derived part is silently discarded.

```cpp
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
```

**Rule:** Polymorphic base classes should not be copyable. If they are, slicing is a risk.
Mark base class copy constructors deleted, or at minimum, always pass polymorphic objects by
reference or (smart) pointer.

### Upcasting and Downcasting

**Upcasting** (derived → base) is implicit and always safe.

```cpp
Dog* dog = new Dog{};
Animal* animal = dog;   // implicit upcast: always safe
const Animal& ref = *dog;  // also safe
```

**Downcasting** (base → derived) requires a runtime check via `dynamic_cast`.

```cpp
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
```

`dynamic_cast` requires at least one virtual function in the class hierarchy (to locate
the type information). It costs a runtime type check.

For references, `dynamic_cast<Derived&>(base)` throws `std::bad_cast` on failure (since
a null reference is not valid):

```cpp
try {
    Dog& dog = dynamic_cast<Dog&>(*animal);
    // safe
} catch (const std::bad_cast& e) {
    std::cerr << "Not a Dog\n";
}
```

When is `dynamic_cast` appropriate?

* Visitor pattern implementations
* Plugin systems where you receive a `Base*` and need to query a specific capability
* When `std::variant` or interfaces (pure virtual) would eliminate the cast is usually better

### Liskov Substitution Principle

**LSP** (from SOLID — Day 18): if `S` is a subtype of `T`, then objects of type `T` may
be replaced by objects of type `S` without altering correctness.

In practical terms: a derived class must honour the preconditions and postconditions of every
base class function it overrides.

```cpp
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
```

**Fix:** Do not model `Square` as a subtype of `Rectangle` if the shape invariants are
incompatible. Model them as independent `Shape` subtypes, or make `Rectangle` non-virtual.

### Multiple Inheritance and Virtual Bases

C++ supports multiple inheritance. Use it sparingly; prefer interface inheritance (abstract base
classes with no data) over implementation inheritance.

```cpp
class Printable  { public: virtual void print()  const = 0; };
class Serializable { public: virtual void serialize() const = 0; };

class Document : public Printable, public Serializable {
public:
    void print()     const override { /* ... */ }
    void serialize() const override { /* ... */ }
};
```

**Diamond problem** — use `virtual` inheritance when a class appears at the top of a diamond:

```cpp
class Base { public: int x{0}; };
class Left  : virtual public Base {};   // virtual: share one Base subobject
class Right : virtual public Base {};
class Both  : public Left, public Right {};
// Both has exactly one Base::x — no ambiguity
```

## Pitfalls

### Pitfall 1: Missing Virtual Destructor in a Polymorphic Base Class

**Description:** Deleting a derived class object through a base class pointer when the base
class destructor is not virtual. Only the base destructor runs — the derived part leaks.

**BAD code:**

```cpp
#include <iostream>
#include <memory>

class Base {
public:
    ~Base() { std::cout << "Base destroyed\n"; }  // NOT virtual
};

class Derived : public Base {
public:
    Derived() : data_{new int[1000]} {}
    ~Derived() {
        delete[] data_;
        std::cout << "Derived destroyed\n";
    }
private:
    int* data_;
};

int main() {
    Base* p = new Derived{};
    delete p;   // Only ~Base() runs — Derived::data_ leaks!
}
// Output: Base destroyed
// "Derived destroyed" never printed — 4000 bytes leaked
```

**Why it fails:** When the destructor is non-virtual, `delete p` uses the static type
(`Base*`) to find the destructor. `Base::~Base()` runs. The compiler never generates a call
to `Derived::~Derived()`, so the heap allocation in `Derived` is leaked. This is undefined
behaviour according to the standard.

**GOOD code:**

```cpp
#include <iostream>
#include <memory>

class Base {
public:
    virtual ~Base() { std::cout << "Base destroyed\n"; }  // virtual!
};

class Derived : public Base {
public:
    Derived() : data_{new int[1000]} {}
    ~Derived() override {
        delete[] data_;
        std::cout << "Derived destroyed\n";
    }
private:
    int* data_;
};

int main() {
    std::unique_ptr<Base> p = std::make_unique<Derived>();
    // At scope exit: virtual dispatch calls Derived::~Derived(), then Base::~Base()
}
// Output: Derived destroyed
//         Base destroyed
```

**Detection tip:** `clang-tidy` check `cppcoreguidelines-virtual-class-destructor` and
compiler warning `-Wnon-virtual-dtor` flag base classes with virtual functions but
non-virtual destructors.

### Pitfall 2: Using Inheritance for Code Reuse (Has-a Disguised as Is-a)

**Description:** Inheriting from a class solely to reuse its member functions, when the derived
class is not actually a specialisation of the base.

**BAD code:**

```cpp
#include <vector>

// std::vector<int> has useful methods — let's "inherit" them all
class IntStack : public std::vector<int> {
public:
    void push(int v) { push_back(v); }
    int  pop()       { int v = back(); pop_back(); return v; }
    int  top() const { return back(); }
};

IntStack s;
s.push(1);
s.push(2);
// But also:
s.insert(s.begin(), 99);   // exposes std::vector's full API — invariant broken
s[0] = 42;                 // direct access: not stack behaviour
std::vector<int>& ref = s; // implicit upcast: now treated as a plain vector
ref.push_back(100);        // still works; IntStack is not restricting anything
```

**Why it fails:** `std::vector` has no virtual destructor. Deleting `IntStack` through a
`std::vector<int>*` is undefined behaviour. The full `vector` API leaks through, exposing
operations that violate the stack invariant. The relationship is "has-a", not "is-a".

**GOOD code:**

```cpp
#include <vector>
#include <stdexcept>

// Composition: IntStack HAS a vector, does not inherit from it
class IntStack {
public:
    void push(int v) { data_.push_back(v); }

    int pop() {
        if (data_.empty()) throw std::underflow_error{"stack is empty"};
        int v = data_.back();
        data_.pop_back();
        return v;
    }

    int  top()   const { return data_.back(); }
    bool empty() const { return data_.empty(); }
    std::size_t size() const { return data_.size(); }

private:
    std::vector<int> data_;   // implementation detail; not exposed
};
```

**Detection tip:** Ask: "Is every operation of the base class valid and meaningful for the
derived class?" If the answer is no, use composition. Never inherit from STL containers.

### Pitfall 3: Object Slicing Through Value Parameters

**Description:** Passing a derived class object by value to a function that takes the base class
by value. The derived members are silently discarded ("sliced off").

**BAD code:**

```cpp
#include <iostream>
#include <string>

class Vehicle {
public:
    virtual std::string describe() const { return "Vehicle"; }
};

class Car : public Vehicle {
public:
    std::string describe() const override { return "Car"; }
};

// Takes Vehicle BY VALUE — slicing!
void print_vehicle(Vehicle v) {
    std::cout << v.describe() << '\n';
}

int main() {
    Car c;
    print_vehicle(c);   // Car sliced to Vehicle — prints "Vehicle", not "Car"
}
```

**Why it fails:** `print_vehicle` has a `Vehicle` local variable. Constructing it from
`Car c` calls the `Vehicle` copy constructor, which only copies the `Vehicle` subobject.
The `Car`-specific data and the `vptr` pointing to `Car`'s vtable are replaced with
`Vehicle`'s vtable. The virtual dispatch now resolves to `Vehicle::describe`.

**GOOD code:**

```cpp
#include <iostream>

// Take by const reference — no copy, correct virtual dispatch
void print_vehicle(const Vehicle& v) {
    std::cout << v.describe() << '\n';   // prints "Car" for Car objects
}

// Or by pointer for optional/nullable scenarios
void print_vehicle_ptr(const Vehicle* v) {
    if (v) std::cout << v->describe() << '\n';
}
```

**Detection tip:** Any function parameter of a polymorphic type taken by value is a slicing
candidate. `clang-tidy` check `cppcoreguidelines-slicing` flags this pattern.

### Pitfall 4: Calling Virtual Functions in Constructors or Destructors

**Description:** Calling a virtual function from a constructor or destructor. The virtual
dispatch mechanism is not fully active at these points, so the call resolves to the class
being constructed or destroyed — not the most-derived class.

**BAD code:**

```cpp
#include <iostream>

class Base {
public:
    Base() {
        init();   // calls virtual function — does NOT dispatch to Derived::init()
    }
    virtual void init() { std::cout << "Base::init\n"; }
};

class Derived : public Base {
public:
    void init() override { std::cout << "Derived::init\n"; }
};

int main() {
    Derived d;
    // Output: Base::init   (not Derived::init!)
}
```

**Why it fails:** During `Base::Base()`, the `Derived` portion of the object does not yet
exist. The `vptr` points to `Base`'s vtable. Calling `init()` dispatches to
`Base::init`, even though the final object is a `Derived`. This is well-defined in C++
(unlike some other languages) but almost always not what the programmer intended.

**GOOD code:**

```cpp
#include <iostream>

class Base {
public:
    Base() = default;
    virtual void init() { std::cout << "Base::init\n"; }

    // Factory function: constructs fully, then calls init() — now virtual dispatch works
    static std::unique_ptr<Base> create() {
        auto obj = std::make_unique<Derived>();
        obj->init();   // Derived is fully constructed — dispatches to Derived::init()
        return obj;
    }
};

class Derived : public Base {
public:
    void init() override { std::cout << "Derived::init\n"; }
};

int main() {
    auto d = Base::create();
    // Output: Derived::init
}
```

**Detection tip:** Search for `virtual` function calls in constructors and destructors.
`clang-tidy` check `clang-analyzer-cplusplus.VirtualCall` flags these.

## Code Example

```cpp
#include <iostream>
#include <memory>
#include <vector>

class Shape {
  public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
};

class Rectangle : public Shape {
  public:
    Rectangle(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }

  private:
    double w_;
    double h_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Rectangle>(3.0, 4.0));

    std::cout << "Day 06 - Inheritance and Polymorphism\n";
    std::cout << "First area: " << shapes.front()->area() << "\n";
    return 0;
}
```
