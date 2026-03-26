Advanced OOP Patterns
=====================

Motivation
----------

Classic object-oriented design teaches inheritance as the primary tool for code reuse.
In practice, deep inheritance hierarchies become brittle: every change to a base class
ripples through dozens of derived classes, and adding cross-cutting behaviour (logging,
serialisation, thread-safety) forces awkward multiple-inheritance gymnastics.

Modern C++ offers sharper tools:

* **Composition over inheritance** — assemble behaviour from small, focused objects.
* **CRTP mixins** — inject zero-cost behaviour at compile time without virtual calls.
* **Strategy via** ``std::function`` — swap algorithms at runtime with clean syntax.
* **Value vs reference semantics** — choose the right ownership model for the domain.
* **pImpl** — hide implementation details behind a pointer wall.
* **Interface segregation** — small, precise abstractions instead of fat interfaces.

Each pattern solves a specific recurring pain.  Knowing *when* to apply which one is
the mark of an experienced C++ designer.

Composition over Inheritance
----------------------------

The canonical rule from the Gang of Four: *favour object composition over class
inheritance*.  Inheritance models an IS-A relationship; composition models HAS-A.

**Why inheritance hurts at scale**

.. code-block:: cpp

    // BAD: "animal farm" hierarchy explosion
    class Animal { public: virtual void move() = 0; };
    class FlyingAnimal   : public Animal { /* ... */ };
    class SwimmingAnimal : public Animal { /* ... */ };
    // Need a duck: flies AND swims.
    // Multiple inheritance causes diamond ambiguity.
    class Duck : public FlyingAnimal, public SwimmingAnimal { /* oops */ };

Every new combination demands a new class.  With N independent behaviour axes you
can need 2^N classes — the classic "class explosion" anti-pattern.

**Composition solves this**

.. code-block:: cpp

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

Composition makes adding new locomotion styles a non-event: write one struct, compose.

ASCII diagram — inheritance vs composition::

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

CRTP Mixins — Zero-Cost Behaviour Injection
-------------------------------------------

The **Curiously Recurring Template Pattern** lets a base class call methods on its
derived class without virtual dispatch.  Use it to inject reusable behaviour
(comparable, printable, serialisable) at compile time.

.. code-block:: cpp

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

**CRTP cost model**: the generated code is identical to hand-written functions.
The base class is a compile-time detail; no vtable, no indirection.

**When to use CRTP mixins**

* Cross-cutting concerns that many unrelated classes share.
* Performance-critical code where virtual dispatch overhead is measurable.
* Libraries where you control neither the base nor the derived class type.

**When to avoid**

* When runtime polymorphism is genuinely needed (heterogeneous collections).
* When the mixin logic is complex — readability suffers.
* In C++20+ consider concepts + free functions over CRTP for cleaner interfaces.

Strategy Pattern with ``std::function``
----------------------------------------

The Strategy pattern replaces hard-coded algorithms with interchangeable policies.
``std::function<Signature>`` is the modern C++ way to store any callable — lambda,
function pointer, or functor — behind a uniform interface.

.. code-block:: cpp

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

    // At runtime you can switch strategy without changing OrderProcessor
    // proc.set_strategy(by_total);

**Design note**: ``std::function`` has a small allocation cost for large callables
(when the small-buffer optimisation does not apply).  For zero-overhead strategies,
use a template parameter.  Reserve ``std::function`` for runtime-switchable strategies.

Value Semantics vs Reference Semantics
---------------------------------------

This is one of the most consequential design decisions in C++.

**Reference semantics** — objects are shared via pointers or references; mutation is
visible everywhere.  This is Java's default model.

**Value semantics** — objects own their data; copies are independent; mutation is local.
This is C++'s preferred model for regular types.

.. code-block:: cpp

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

**Guidelines**

* Prefer value semantics for small, plain data (``Point``, ``Color``, ``Duration``).
* Use reference semantics (smart pointers) only when sharing or polymorphism is needed.
* ``std::vector``, ``std::string`` are value types with efficient move operations.
* Avoid raw owning pointers; use ``std::unique_ptr`` for exclusive ownership.

pImpl Idiom — Preview
----------------------

The **pointer-to-implementation** idiom separates a class's public interface from its
private implementation details, reducing compilation coupling and hiding internals.

.. code-block:: cpp

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

**Benefits**: client translation units recompile only when the header changes, not
when the Impl struct changes.  Covered in depth on Day 21.

Interface Segregation
----------------------

The Interface Segregation Principle (ISP) from SOLID: *clients should not be forced to
depend on interfaces they do not use.*  In C++ this means small, focused abstract
classes rather than one monolithic base.

.. code-block:: cpp

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

    // A cloud store adds IEncryptor on top
    class CloudStore : public ILoader, public ISaver, public IEncryptor {
    public:
        std::vector<std::string> load() override { return {}; }
        void save(const std::vector<std::string>&) override {}
        void encrypt() override {}
    };

ISP pays dividends in testability: mock only the interface the system-under-test uses.

Design Tradeoffs Summary
-------------------------

===================  ========================  ========================  =========================
Pattern              Strength                  Weakness                  Choose when
===================  ========================  ========================  =========================
Composition          Flexible, no explosion    Forwarding boilerplate    Behaviours vary independently
CRTP Mixin           Zero overhead, inlined    Complex errors, no poly   Fixed behaviours, perf-critical
Strategy (function)  Runtime switchable        Small heap alloc cost     Algorithm varies at runtime
pImpl                Binary stability          Heap alloc, no inlining   Library ABI stability needed
===================  ========================  ========================  =========================

Self-Check Questions
---------------------

#. **Why does composition over inheritance reduce the number of required classes?**

   Each independent behaviour axis is a separate composable component.  N axes require
   only N classes, not 2^N combinations.

#. **What is the CRTP trick that allows a base class to call derived methods without
   virtual dispatch?**

   ``static_cast<Derived&>(*this)`` inside the base template uses the known static type
   to call derived methods directly — no vtable lookup needed.

#. **When should you prefer a template parameter strategy over** ``std::function``?

   When the strategy is fixed at compile time and you cannot afford the type-erasure
   overhead of ``std::function`` (which may heap-allocate large callables).

#. **What problem does interface segregation solve in unit testing?**

   Small interfaces mean test doubles only implement methods the system-under-test
   actually calls.  Fat interfaces force implementors to stub irrelevant methods.

#. **Why does C++ prefer value semantics for "regular" types?**

   Value types are easy to reason about (no aliasing), work well with standard
   containers, enable copy elision and move optimisation, and eliminate
   shared-mutation bugs.
