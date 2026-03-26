Pitfalls — Day 08: Advanced OOP Patterns
========================================

Pitfall 1: Inheriting Implementation for Code Reuse
----------------------------------------------------

**Description**: Using inheritance purely to reuse code from a base class, even when
no IS-A relationship exists.  The derived class silently inherits a public interface
it does not want, and callers can misuse it.

**BAD**

.. code-block:: cpp

    // Stack "reuses" vector's storage by inheriting from it
    class Stack : public std::vector<int> {
    public:
        void push(int v) { push_back(v); }
        int  pop()       { int v = back(); pop_back(); return v; }
        // Problem: callers can also call insert(), erase(), operator[] !
    };

    Stack s;
    s.push(1);
    s.push(2);
    s.insert(s.begin(), 99);  // bypasses stack invariant!

**Why it fails**: ``std::vector`` has no virtual destructor, so deleting a ``Stack*``
through a ``vector<int>*`` is undefined behaviour.  The derived class also exposes the
entire ``vector`` interface, breaking encapsulation.

**GOOD**

.. code-block:: cpp

    // Compose — contain the vector, expose only stack operations
    class Stack {
        std::vector<int> data_;
    public:
        void push(int v)  { data_.push_back(v); }
        int  pop()        { int v = data_.back(); data_.pop_back(); return v; }
        int  top() const  { return data_.back(); }
        bool empty() const{ return data_.empty(); }
        // insert(), erase() are gone — Stack invariant is protected
    };

**Detection tip**: If a derived class hides or ``delete``s base-class methods, or if
the base class has no virtual destructor, inheritance is almost certainly wrong.

Pitfall 2: CRTP — Forgetting the ``static_cast``
-------------------------------------------------

**Description**: In a CRTP base, calling derived methods via ``*this`` instead of
``static_cast<Derived&>(*this)`` produces a compilation error or calls the wrong
overload.

**BAD**

.. code-block:: cpp

    template <typename Derived>
    class Logger {
    public:
        void log() const {
            // ERROR: Base class has no name() method;
            // this->name() would require a virtual call
            std::cout << name() << '\n';  // does not compile
        }
    };

**Why it fails**: Inside ``Logger<Derived>``, ``name()`` is looked up in ``Logger``,
not in ``Derived``.  The compiler finds no such member.

**GOOD**

.. code-block:: cpp

    template <typename Derived>
    class Logger {
    public:
        void log() const {
            // Cast to the derived type first; then call the derived method
            const auto& self = static_cast<const Derived&>(*this);
            std::cout << self.name() << '\n';
        }
    };

    class Server : public Logger<Server> {
    public:
        std::string name() const { return "Server"; }
    };

**Detection tip**: Compiler errors mentioning ``no member named 'X' in 'Logger<...>'``
inside a CRTP base are usually a missing ``static_cast``.

Pitfall 3: ``std::function`` Overhead in Hot Loops
----------------------------------------------------

**Description**: Wrapping a trivial callable in ``std::function`` and calling it
millions of times per second incurs type-erasure overhead that erases performance gains.

**BAD**

.. code-block:: cpp

    #include <functional>
    #include <vector>

    std::function<int(int)> transform = [](int x){ return x * 2; };

    // Called 10 million times — function stores lambda on heap if > SBO size,
    // and every call goes through a virtual-dispatch-like indirect call.
    for (int i = 0; i < 10'000'000; ++i)
        result += transform(i);

**Why it fails**: ``std::function`` uses type erasure with a possible heap allocation
and an indirect call through a function pointer stored in the wrapper.  The compiler
cannot inline through it.

**GOOD**

.. code-block:: cpp

    // Option A: template parameter — fully inlined
    template <typename F>
    void process(const std::vector<int>& data, F transform) {
        for (int v : data)
            result += transform(v);
    }
    process(data, [](int x){ return x * 2; });   // lambda inlined

    // Option B: C++20 abbreviated template with concept
    auto process_modern(const std::vector<int>& data,
                        std::invocable<int> auto transform) {
        for (int v : data)
            result += transform(v);
    }

**Detection tip**: Profile before optimising.  ``std::function`` is fine for
low-frequency callbacks (button clicks, event handlers).  Avoid it in tight loops.

Pitfall 4: Mixing Value and Reference Semantics Accidentally
-------------------------------------------------------------

**Description**: Storing a reference or raw pointer to an object that may be moved or
destroyed, then accessing it later — classic dangling reference.

**BAD**

.. code-block:: cpp

    #include <vector>

    struct Config { int timeout; };

    std::vector<Config> configs;
    configs.push_back({30});

    const Config& ref = configs[0];  // reference to element

    configs.push_back({60});   // reallocation may move all elements!
    std::cout << ref.timeout;  // UB: ref is dangling after reallocation

**Why it fails**: ``push_back`` may reallocate the internal buffer, invalidating all
iterators and references into the vector.

**GOOD**

.. code-block:: cpp

    // Option A: copy the value you need
    Config cfg = configs[0];
    configs.push_back({60});
    std::cout << cfg.timeout;  // safe — independent copy

    // Option B: reserve capacity upfront to prevent reallocation
    configs.reserve(10);
    const Config& ref2 = configs[0];
    configs.push_back({60});   // no reallocation if capacity not exceeded
    std::cout << ref2.timeout; // safe

**Detection tip**: Address Sanitiser (``-fsanitize=address``) catches use-after-free
and many dangling-reference bugs at runtime.

Pitfall 5: Fat Virtual Interfaces — Forcing Unused Implementations
-------------------------------------------------------------------

**Description**: Defining one large abstract class with many pure virtual methods
forces every concrete class to implement functions it does not need.

**BAD**

.. code-block:: cpp

    class IShape {
    public:
        virtual ~IShape() = default;
        virtual double area()        = 0;
        virtual double perimeter()   = 0;
        virtual void   draw()        = 0;
        virtual void   serialize()   = 0;
        virtual void   animate()     = 0;   // not all shapes are animated!
    };

    class Circle : public IShape {
    public:
        double area()      override { return 3.14 * r * r; }
        double perimeter() override { return 2 * 3.14 * r; }
        void   draw()      override { /* ... */ }
        void   serialize() override { /* ... */ }
        void   animate()   override { /* empty stub — Circle doesn't animate */ }
    private:
        double r;
    };

**Why it fails**: ``animate()`` is a forced stub that does nothing.  If ``IShape``
gains a new method, every concrete class must be updated even if the method is
irrelevant to them.

**GOOD**

.. code-block:: cpp

    class IGeometry  { public: virtual ~IGeometry()=default;
                                virtual double area()      = 0;
                                virtual double perimeter() = 0; };
    class IDrawable  { public: virtual ~IDrawable()=default;
                                virtual void draw()        = 0; };
    class IAnimated  { public: virtual ~IAnimated()=default;
                                virtual void animate()     = 0; };

    // Circle is Geometry + Drawable but NOT Animated
    class Circle : public IGeometry, public IDrawable {
    public:
        double area()      override { return 3.14159 * r_ * r_; }
        double perimeter() override { return 2.0 * 3.14159 * r_; }
        void   draw()      override { /* render */ }
    private:
        double r_{1.0};
    };

**Detection tip**: Any class that implements a method with an empty body or a comment
``// not applicable`` is a strong signal the interface needs splitting.

Pitfall 6: pImpl Without Move Support — Broken Moves
-----------------------------------------------------

**Description**: Defining pImpl with ``std::unique_ptr<Impl>`` but not declaring move
operations causes the class to be non-movable (or accidentally deleted).

**BAD**

.. code-block:: cpp

    class Widget {
    public:
        Widget();
        ~Widget();          // defined in .cpp
        void draw();
    private:
        struct Impl;
        std::unique_ptr<Impl> pimpl_;
        // No move constructor declared!
    };
    // Widget w1; Widget w2 = std::move(w1);  // ERROR or unexpected behaviour

**Why it fails**: The user-defined destructor suppresses the implicitly-generated move
constructor and move assignment operator (they become deleted).

**GOOD**

.. code-block:: cpp

    class Widget {
    public:
        Widget();
        ~Widget();                        // defined in .cpp
        Widget(Widget&&) noexcept;        // declared here
        Widget& operator=(Widget&&) noexcept;

        Widget(const Widget&)            = delete;   // or implement deep copy
        Widget& operator=(const Widget&) = delete;

        void draw();
    private:
        struct Impl;
        std::unique_ptr<Impl> pimpl_;
    };
    // Widget.cpp
    // Widget::Widget(Widget&&) noexcept = default;
    // Widget& Widget::operator=(Widget&&) noexcept = default;

**Detection tip**: Always check whether move operations are implicitly deleted when a
user-defined destructor is present.  Use ``static_assert(std::is_move_constructible_v<Widget>)``.
