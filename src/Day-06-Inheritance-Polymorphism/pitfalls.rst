Pitfalls — Day 06: Inheritance and Polymorphism
================================================

Pitfall 1: Missing Virtual Destructor in a Polymorphic Base Class
-----------------------------------------------------------------

**Description:** Deleting a derived class object through a base class pointer when the base
class destructor is not virtual. Only the base destructor runs — the derived part leaks.

**BAD code:**

.. code-block:: cpp

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

**Why it fails:** When the destructor is non-virtual, ``delete p`` uses the static type
(``Base*``) to find the destructor. ``Base::~Base()`` runs. The compiler never generates a call
to ``Derived::~Derived()``, so the heap allocation in ``Derived`` is leaked. This is undefined
behaviour according to the standard.

**GOOD code:**

.. code-block:: cpp

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

**Detection tip:** ``clang-tidy`` check ``cppcoreguidelines-virtual-class-destructor`` and
compiler warning ``-Wnon-virtual-dtor`` flag base classes with virtual functions but
non-virtual destructors.


Pitfall 2: Using Inheritance for Code Reuse (Has-a Disguised as Is-a)
----------------------------------------------------------------------

**Description:** Inheriting from a class solely to reuse its member functions, when the derived
class is not actually a specialisation of the base.

**BAD code:**

.. code-block:: cpp

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

**Why it fails:** ``std::vector`` has no virtual destructor. Deleting ``IntStack`` through a
``std::vector<int>*`` is undefined behaviour. The full ``vector`` API leaks through, exposing
operations that violate the stack invariant. The relationship is "has-a", not "is-a".

**GOOD code:**

.. code-block:: cpp

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

**Detection tip:** Ask: "Is every operation of the base class valid and meaningful for the
derived class?" If the answer is no, use composition. Never inherit from STL containers.


Pitfall 3: Object Slicing Through Value Parameters
---------------------------------------------------

**Description:** Passing a derived class object by value to a function that takes the base class
by value. The derived members are silently discarded ("sliced off").

**BAD code:**

.. code-block:: cpp

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

**Why it fails:** ``print_vehicle`` has a ``Vehicle`` local variable. Constructing it from
``Car c`` calls the ``Vehicle`` copy constructor, which only copies the ``Vehicle`` subobject.
The ``Car``-specific data and the ``vptr`` pointing to ``Car``'s vtable are replaced with
``Vehicle``'s vtable. The virtual dispatch now resolves to ``Vehicle::describe``.

**GOOD code:**

.. code-block:: cpp

    #include <iostream>

    // Take by const reference — no copy, correct virtual dispatch
    void print_vehicle(const Vehicle& v) {
        std::cout << v.describe() << '\n';   // prints "Car" for Car objects
    }

    // Or by pointer for optional/nullable scenarios
    void print_vehicle_ptr(const Vehicle* v) {
        if (v) std::cout << v->describe() << '\n';
    }

**Detection tip:** Any function parameter of a polymorphic type taken by value is a slicing
candidate. ``clang-tidy`` check ``cppcoreguidelines-slicing`` flags this pattern.


Pitfall 4: Calling Virtual Functions in Constructors or Destructors
--------------------------------------------------------------------

**Description:** Calling a virtual function from a constructor or destructor. The virtual
dispatch mechanism is not fully active at these points, so the call resolves to the class
being constructed or destroyed — not the most-derived class.

**BAD code:**

.. code-block:: cpp

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

**Why it fails:** During ``Base::Base()``, the ``Derived`` portion of the object does not yet
exist. The ``vptr`` points to ``Base``'s vtable. Calling ``init()`` dispatches to
``Base::init``, even though the final object is a ``Derived``. This is well-defined in C++
(unlike some other languages) but almost always not what the programmer intended.

**GOOD code:**

.. code-block:: cpp

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

**Detection tip:** Search for ``virtual`` function calls in constructors and destructors.
``clang-tidy`` check ``clang-analyzer-cplusplus.VirtualCall`` flags these.
