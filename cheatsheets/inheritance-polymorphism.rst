Inheritance and Polymorphism
============================

Access specifiers, vtable mechanics, override/final, the object slicing
problem, safe casting, and Liskov Substitution for Modern C++ (C++11/17/20).

.. contents:: Sections
   :local:
   :depth: 2

----

Inheritance Access Specifiers
------------------------------

The access specifier on the base class controls how the outside world sees the
inherited members, not whether the derived class itself can see them.

+------------------+--------------------+------------------+-------------------+
| Base member      | public inheritance | protected inh.   | private inh.      |
+==================+====================+==================+===================+
| ``public``       | public             | protected        | private           |
+------------------+--------------------+------------------+-------------------+
| ``protected``    | protected          | protected        | private           |
+------------------+--------------------+------------------+-------------------+
| ``private``      | inaccessible       | inaccessible     | inaccessible      |
+------------------+--------------------+------------------+-------------------+

.. code-block:: cpp

    struct Base {
        void pub();
    protected:
        void prot();
    private:
        void priv();
    };

    struct PubDerived   : public    Base {};  // pub() is public
    struct ProtDerived  : protected Base {};  // pub() is protected
    struct PrivDerived  : private   Base {};  // pub() is private

    PubDerived  pd; pd.pub();    // OK
    ProtDerived rd; rd.pub();    // ERROR: pub() is now protected
    PrivDerived vd; vd.pub();    // ERROR: pub() is now private

    // struct default inherits public; class default inherits private
    struct S : Base {};    // public inheritance
    class  C : Base {};    // private inheritance

----

vtable Layout and Virtual Dispatch
------------------------------------

Each class with at least one virtual function gets a *vtable* (virtual
function table). Each object carries a hidden ``vptr`` to its class's vtable.

Conceptual layout:

.. code-block:: text

    +------------------+          +--------------------------+
    | Animal object    |          | Animal vtable            |
    |  vptr  ----------+--------> | [0] Animal::speak()      |
    |  name_           |          | [1] Animal::move()       |
    +------------------+          +--------------------------+

    +------------------+          +--------------------------+
    | Dog object       |          | Dog vtable               |
    |  vptr  ----------+--------> | [0] Dog::speak()  <--override
    |  name_           |          | [1] Animal::move() (inherited)
    |  breed_          |          +--------------------------+
    +------------------+

.. code-block:: cpp

    class Animal {
    public:
        virtual void speak() const { std::cout << "...\n"; }
        virtual void move()  const { std::cout << "moves\n"; }
        virtual ~Animal() = default;
    };

    class Dog : public Animal {
    public:
        void speak() const override { std::cout << "Woof\n"; }
        // move() not overridden — inherits Animal::move()
    };

    Animal* a = new Dog{};
    a->speak();  // "Woof" — resolved at runtime via vtable[0]
    a->move();   // "moves" — resolved at runtime via vtable[1]
    delete a;    // ~Dog() called, then ~Animal() — works because virtual dtor

----

override and final
-------------------

``override`` — compiler verifies function actually overrides a base virtual.
``final`` — prevents further overrides (on a function) or inheritance (on a class).

.. code-block:: cpp

    class Shape {
    public:
        virtual double area() const = 0;
        virtual void   draw() const;
        virtual ~Shape() = default;
    };

    class Circle : public Shape {
    public:
        double area()  const override;          // OK — overrides Shape::area
        void   draw()  const override;          // OK — overrides Shape::draw
        // double areea() const override;       // ERROR: typo caught at compile!
        double area(int scale) const override;  // ERROR: different signature
    };

    class SpecialCircle : public Circle {
    public:
        double area() const override final;     // no further override allowed
    };

    class Immutable final : public Shape {  // no subclassing allowed
    public:
        double area() const override;
    };
    // class Bad : public Immutable {};  // ERROR: Immutable is final

----

Virtual Destructor Rule
-------------------------

**If a class has any virtual function, its destructor must be virtual.**
Without it, deleting through a base pointer skips the derived destructor — UB.

.. code-block:: cpp

    // BAD — non-virtual destructor in polymorphic base
    class BadBase {
    public:
        virtual void process();
        ~BadBase() {}           // non-virtual!
    };
    class Derived : public BadBase {
        int* data_;
    public:
        Derived()  : data_(new int[100]) {}
        ~Derived() { delete[] data_; }   // never called!
    };
    BadBase* p = new Derived{};
    delete p;   // UB: only ~BadBase() called, data_ leaked

    // GOOD — virtual destructor ensures correct destruction
    class GoodBase {
    public:
        virtual void process();
        virtual ~GoodBase() = default;  // virtual + defaulted
    };

    // Interface-only classes — pure virtual + virtual dtor
    class IWriter {
    public:
        virtual void write(std::string_view data) = 0;
        virtual ~IWriter() = default;
    };

----

Object Slicing Problem
-----------------------

Copying a derived object into a base object *slices off* the derived part.

.. code-block:: cpp

    struct Animal {
        std::string name;
        virtual std::string sound() const { return "..."; }
    };
    struct Dog : Animal {
        std::string breed;
        std::string sound() const override { return "Woof"; }
    };

    Dog d; d.name = "Rex"; d.breed = "Husky";

    // SLICING — Dog copied into Animal; breed and overridden sound() lost
    Animal a = d;
    a.sound();  // "..." — not "Woof"!

    // SAFE — store by pointer or reference to preserve polymorphism
    Animal* ptr  = &d;   ptr->sound();  // "Woof"
    Animal& ref  = d;    ref.sound();   // "Woof"
    std::unique_ptr<Animal> up = std::make_unique<Dog>(d);  // heap

    // Prevent slicing in base class — delete copy constructor
    class NonSliceable {
    public:
        NonSliceable(const NonSliceable&) = delete;
        NonSliceable& operator=(const NonSliceable&) = delete;
        virtual ~NonSliceable() = default;
    };

    // std::vector of polymorphic objects — use pointer-to-base
    std::vector<std::unique_ptr<Animal>> animals;
    animals.push_back(std::make_unique<Dog>());

----

dynamic_cast — Safe Downcasting
---------------------------------

``dynamic_cast`` performs a runtime type check. Returns null (pointer) or
throws ``std::bad_cast`` (reference) if the cast is invalid.

.. code-block:: cpp

    class Base { public: virtual ~Base() = default; };
    class Derived : public Base { public: void extra(); };

    Base* b = new Derived{};

    // Pointer downcast — check for null
    Derived* d = dynamic_cast<Derived*>(b);
    if (d) d->extra();  // safe
    else   std::cerr << "not a Derived\n";

    // Reference downcast — catch std::bad_cast
    try {
        Derived& dr = dynamic_cast<Derived&>(*b);
        dr.extra();
    } catch (const std::bad_cast& e) {
        std::cerr << e.what() << '\n';
    }

    // Sidecast — across siblings in multiple-inheritance hierarchy
    class A { public: virtual ~A() = default; };
    class B { public: virtual ~B() = default; };
    class C : public A, public B {};

    A* a = new C{};
    B* b2 = dynamic_cast<B*>(a);  // sidecast — valid if a points to C

    // dynamic_cast requires RTTI — disable with -fno-rtti breaks this

----

static_cast for Downcasting
-----------------------------

``static_cast`` does NOT check at runtime. Use only when you are certain of
the dynamic type.

.. code-block:: cpp

    Base* base = obtain_as_derived();  // known to return Derived*

    // Only safe if you KNOW the runtime type is Derived
    Derived* d = static_cast<Derived*>(base);

    // If base is NOT a Derived, behavior is UNDEFINED — no protection
    // Use static_cast in performance-critical code after verifying type once

    // Prefer dynamic_cast in general correctness code
    // Use static_cast only in provably-safe paths (e.g., CRTP, visitor pattern)

Cast comparison:

+-------------------+-------------------+-------------------------+
| Cast              | Runtime check     | When to use             |
+===================+===================+=========================+
| ``static_cast``   | No (compile only) | Known-safe downcast     |
+-------------------+-------------------+-------------------------+
| ``dynamic_cast``  | Yes (RTTI)        | Unknown / checked cast  |
+-------------------+-------------------+-------------------------+
| ``reinterpret``   | No                | Low-level bit punning   |
+-------------------+-------------------+-------------------------+
| ``const_cast``    | No                | Remove const (use rare) |
+-------------------+-------------------+-------------------------+

----

Pure Virtual Functions and Interface Classes
---------------------------------------------

.. code-block:: cpp

    // Interface — no data, no implementation (except destructor)
    class ISerializer {
    public:
        virtual void   serialize(const std::string& key, int value)    = 0;
        virtual void   serialize(const std::string& key, double value) = 0;
        virtual std::string to_string() const                          = 0;
        virtual ~ISerializer() = default;
    };

    // Provide a default implementation for a pure virtual (unusual but valid)
    class ILogger {
    public:
        virtual void log(std::string_view msg) = 0;  // must override
        virtual ~ILogger() = default;
    };
    void ILogger::log(std::string_view) { /* default no-op */ }

    // Concrete class must override all pure virtuals
    class JsonSerializer : public ISerializer {
        std::ostringstream buf_;
    public:
        void serialize(const std::string& k, int    v) override;
        void serialize(const std::string& k, double v) override;
        std::string to_string() const override;
    };

----

Liskov Substitution Principle
-------------------------------

*Any code using a Base& should work correctly with a Derived& substituted in.*

.. code-block:: cpp

    // VIOLATION — Square inherits Rectangle but breaks the contract
    class Rectangle {
    public:
        virtual void set_width (int w) { w_ = w; }
        virtual void set_height(int h) { h_ = h; }
        int area() const { return w_ * h_; }
    protected: int w_, h_;
    };

    class Square : public Rectangle {
    public:
        // Square must keep w == h, so it overrides both setters
        void set_width (int w) override { w_ = h_ = w; }
        void set_height(int h) override { w_ = h_ = h; }
    };

    // Breaks: caller of Rectangle& assumes independent width/height
    void test(Rectangle& r) {
        r.set_width(4);
        r.set_height(5);
        assert(r.area() == 20);  // FAILS for Square: area is 25
    }

    // SOLUTION — don't inherit; model has-a or use a common interface
    class IShape { public: virtual int area() const = 0; };
    class Rectangle2 : public IShape { /* independent w and h */ };
    class Square2    : public IShape { /* single side */ };

----

Common Pitfalls
----------------

**Forgetting virtual destructor:**

.. code-block:: cpp

    // EASY MISTAKE — adding a virtual method but forgetting the dtor
    class Plugin {
    public:
        virtual void run();
        ~Plugin();   // non-virtual — memory leak / UB when deleting Plugin*
    };
    // Fix: virtual ~Plugin() = default;

**Calling virtual functions in constructor/destructor:**

.. code-block:: cpp

    class Base {
    public:
        Base()  { init(); }       // calls Base::init(), NOT Derived::init()
        virtual void init();
    };
    // During Base construction, derived part is not yet alive.
    // Solution: use a factory function or two-phase init pattern.

**Hiding base member functions instead of overriding:**

.. code-block:: cpp

    class Base { public: virtual void f(int); };
    class Derived : public Base {
    public:
        void f(double);  // HIDES Base::f(int) — compiler warning -Woverloaded-virtual
        // Fix: either add 'override' to catch the mismatch, or
        //      using Base::f; to bring the base version into scope
    };

----

Review Checklist
-----------------

* Does every polymorphic base class have a virtual destructor?
* Is ``override`` applied to every intended virtual override?
* Is ``final`` used on leaf classes or performance-critical virtual methods?
* Are polymorphic objects stored by pointer/reference (never by value in containers)?
* Is ``dynamic_cast`` null-checked (pointer) or try/catch (reference) at every use?
* Does the class hierarchy satisfy the Liskov Substitution Principle?
* Are pure virtual interfaces free of data members?
* Is slicing prevented by deleting the copy constructor in non-leaf polymorphic bases?
* Are virtual functions in constructors/destructors avoided?
* Are ``-Wnon-virtual-dtor`` and ``-Woverloaded-virtual`` compiler warnings enabled?

Related Concepts
-----------------

* ``cheatsheets/classes-constructors-raii.rst`` — destructor mechanics
* ``cheatsheets/composition-vs-inheritance.rst`` — when NOT to inherit
* ``cheatsheets/oop-principles-solid.rst`` — LSP and Open/Closed in depth
* ``cheatsheets/advanced-oop-patterns.rst`` — Visitor pattern, CRTP
* ``cheatsheets/raii-smart-pointers.rst`` — polymorphic ownership with unique_ptr
