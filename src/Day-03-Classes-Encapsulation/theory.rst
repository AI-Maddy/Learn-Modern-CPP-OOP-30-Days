Day 03 — Classes and Encapsulation
====================================

Why This Day Matters
--------------------

A class is more than a bundle of data and functions. A well-designed class establishes an
**invariant** — a guarantee about its internal state that holds at all observable points. Every
member function enforces or relies on that invariant. Encapsulation is the mechanism that prevents
external code from violating the invariant by accident.

This day covers the mechanics of C++ classes: ``class`` vs ``struct``, access specifiers,
member functions and their ``const`` qualifiers, the ``this`` pointer, ``friend``, and the design
tradeoffs around getters, setters, and data hiding.


``class`` vs ``struct``
------------------------

In C++ there is only one real difference between ``class`` and ``struct``: default access.

.. code-block:: cpp

    struct Point {
        int x;   // public by default
        int y;
    };

    class Circle {
        double radius_;  // private by default
    public:
        double area() const;
    };

**Convention:**

* Use ``struct`` for passive data carriers with no invariants — aggregates where all members can
  be set independently without breaking anything.
* Use ``class`` when there is an invariant — where some members must be set consistently with
  others, or where some operations must be restricted.

.. code-block:: cpp

    // struct: fine — x and y are independent
    struct Vec2 { float x{}; float y{}; };

    // class: right — radius must be non-negative; direct mutation is unsafe
    class Circle {
    public:
        explicit Circle(double r) : radius_{validate(r)} {}
        double radius() const { return radius_; }
        void   set_radius(double r) { radius_ = validate(r); }
        double area()   const { return 3.14159 * radius_ * radius_; }
    private:
        static double validate(double r) {
            if (r < 0.0) throw std::invalid_argument{"radius must be non-negative"};
            return r;
        }
        double radius_;
    };


Access Specifiers
-----------------

.. code-block:: cpp

    class BankAccount {
    public:
        // Accessible to everyone
        explicit BankAccount(std::string owner, double initial_balance);
        void deposit(double amount);
        bool withdraw(double amount);
        double balance() const;      // read-only access to internal state
        std::string owner() const;

    protected:
        // Accessible to this class and derived classes
        void apply_interest(double rate);

    private:
        // Accessible only to this class (and friends)
        std::string owner_;
        double      balance_{0.0};

        void audit_log(double amount, const std::string& op) const;
    };

::

    Access visibility:

    private   ──> only BankAccount member functions + friends
    protected ──> BankAccount + derived classes
    public    ──> anyone

**Design guidance:** Start with everything private. Promote to protected only when a derived
class genuinely needs it. Promote to public only when the operation is part of the stable API.
Defaulting to public is the most common encapsulation mistake.


Member Functions and ``const``-Correctness
-------------------------------------------

``const`` on a member function means "this function does not modify the observable state of the
object". It lets you call the function through a ``const`` reference or pointer.

.. code-block:: cpp

    class Rectangle {
    public:
        Rectangle(double w, double h) : width_{w}, height_{h} {}

        // const member function: safe to call on a const Rectangle
        double area()   const { return width_ * height_; }
        double width()  const { return width_; }
        double height() const { return height_; }

        // non-const member function: modifies the object
        void scale(double factor) {
            width_  *= factor;
            height_ *= factor;
        }

    private:
        double width_;
        double height_;
    };

    void print_info(const Rectangle& r) {
        std::cout << "Area: " << r.area() << '\n';   // OK: area() is const
        // r.scale(2.0);   // ERROR: scale() is non-const; r is const
    }

**The ``mutable`` keyword:** Sometimes a member must be modifiable even in a ``const`` function
(e.g., a lazy cache or a mutex). Mark it ``mutable``.

.. code-block:: cpp

    class ExpensiveQuery {
    public:
        double result() const {
            if (!cached_) {
                cache_  = compute();   // OK: cache_ is mutable
                cached_ = true;
            }
            return cache_;
        }
    private:
        double compute() const;
        mutable double cache_{0.0};
        mutable bool   cached_{false};
    };


The ``this`` Pointer
--------------------

Inside every non-static member function, ``this`` is an implicit pointer to the current object.
It is used to disambiguate between member variables and parameters, and for method chaining.

.. code-block:: cpp

    class Builder {
    public:
        Builder& set_name(std::string name) {
            name_ = std::move(name);   // move into member
            return *this;              // return self for chaining
        }

        Builder& set_port(int port) {
            port_ = port;
            return *this;
        }

        Connection build() {
            return Connection{name_, port_};
        }

    private:
        std::string name_;
        int port_{443};
    };

    // Method chaining (fluent interface) enabled by returning *this
    auto conn = Builder{}
                    .set_name("api.example.com")
                    .set_port(8080)
                    .build();


Encapsulation Principles
-------------------------

**Invariant preservation:** Every constructor must establish the invariant. Every mutating member
function must maintain it. The invariant is the implicit contract of the class.

.. code-block:: cpp

    // Invariant: 0 <= size_ <= capacity_, and data_[0..size_-1] are valid
    class Stack {
    public:
        void push(int v) {
            if (size_ >= capacity_) grow();
            data_[size_++] = v;
            // invariant maintained: size_ increased by 1, new element is valid
        }

        int pop() {
            if (size_ == 0) throw std::underflow_error{"pop from empty stack"};
            return data_[--size_];
            // invariant maintained: size_ decreased by 1
        }

        int top() const {
            if (size_ == 0) throw std::underflow_error{"top of empty stack"};
            return data_[size_ - 1];
        }

        bool empty() const { return size_ == 0; }
        std::size_t size() const { return size_; }

    private:
        void grow();
        int*        data_{nullptr};
        std::size_t size_{0};
        std::size_t capacity_{0};
    };

**Tell, don't ask:** Instead of getting a value, checking it, and acting — ask the object to
perform the operation itself. This keeps logic inside the class where the invariant is known.

.. code-block:: cpp

    // BAD: asking for internals, logic leaks outside the class
    if (account.balance() >= amount) {
        account.set_balance(account.balance() - amount);
    }

    // GOOD: tell the object to do it; it knows its own rules
    account.withdraw(amount);  // returns false if insufficient funds


Getters and Setters — Design Tradeoffs
---------------------------------------

Not every private member needs a getter and setter pair. Over-providing accessors is a common
anti-pattern that reduces encapsulation to a formality.

.. code-block:: cpp

    // BAD: plain getters and setters for each field — effectively public data
    class Person {
    public:
        int get_age() const { return age_; }
        void set_age(int age) { age_ = age; }   // no validation — invariant violation possible
        std::string get_name() const { return name_; }
        void set_name(std::string name) { name_ = name; }
    private:
        int age_{0};
        std::string name_;
    };

    // GOOD: only expose operations that make sense for the domain
    class Person {
    public:
        Person(std::string name, int age)
            : name_{std::move(name)}, age_{validate_age(age)} {}

        const std::string& name() const { return name_; }
        int age() const { return age_; }

        void birthday() { ++age_; }   // domain operation, not a raw setter

    private:
        static int validate_age(int a) {
            if (a < 0 || a > 150) throw std::out_of_range{"invalid age"};
            return a;
        }
        std::string name_;
        int age_;
    };

**Rule of thumb for accessors:**

* Const getter (read-only access): usually fine, communicates the value is observable.
* Setter with validation: acceptable if there is a genuine need to mutate post-construction.
* Raw setter without validation: almost always a design smell — it bypasses the invariant.


``friend`` Declarations
-----------------------

``friend`` grants a specific function or class access to private members. It should be used
sparingly, as it tightly couples two classes.

.. code-block:: cpp

    class Matrix;

    // friend function: operator<< needs access to private data for formatting
    class Vector {
        friend std::ostream& operator<<(std::ostream& os, const Vector& v);
        friend class Matrix;   // Matrix algorithms can read Vector's internals
    public:
        explicit Vector(std::size_t n) : data_(n, 0.0) {}
    private:
        std::vector<double> data_;
    };

    std::ostream& operator<<(std::ostream& os, const Vector& v) {
        os << '[';
        for (std::size_t i{0}; i < v.data_.size(); ++i) {
            if (i) os << ", ";
            os << v.data_[i];
        }
        return os << ']';
    }

Good uses of ``friend``:
* Overloaded stream operators (``operator<<``, ``operator>>``)
* Closely coupled classes that form a single abstraction (e.g., iterator + container)
* Unit-test fixtures that need to inspect internals

Bad uses of ``friend``:
* Granting access to work around encapsulation instead of redesigning
* Friending a class just because it is "related"


Static Members
--------------

``static`` members belong to the class, not to any instance. They are useful for counters,
singletons, factory functions, and compile-time constants.

.. code-block:: cpp

    class IdGenerator {
    public:
        static int next() { return ++counter_; }
        static int current() { return counter_; }
        static void reset() { counter_ = 0; }   // useful in tests

    private:
        inline static int counter_{0};   // C++17: initialised inline
    };

    int id1 = IdGenerator::next();  // 1
    int id2 = IdGenerator::next();  // 2


Self-Check Questions
--------------------

**Q1: What is a class invariant? Give an example from the ``Circle`` class.**

A class invariant is a condition that must hold true of an object's internal state at all
observable points (before and after any public member function call). For ``Circle``, the
invariant is: ``radius_ >= 0.0``. The constructor enforces it by calling ``validate()``. The
setter enforces it by doing the same. Any function that reads ``radius_`` can rely on this
without re-checking.

**Q2: What is the difference between ``const`` and non-``const`` member functions?**

A ``const`` member function may be called on a ``const`` object or through a ``const`` reference.
Inside it, the object is treated as immutable: you cannot call non-``const`` member functions, and
you cannot modify non-``mutable`` data members. A non-``const`` member function can only be called
on a non-``const`` object and may modify data members freely.

**Q3: Why is "tell, don't ask" a better encapsulation principle than providing getters?**

"Ask-then-act" code puts decision logic outside the class, scattering the invariant enforcement
everywhere. The class's private knowledge about valid state transitions must be duplicated at
every call site. "Tell" concentrates the logic inside the class, so the invariant is enforced
in one place. External code becomes simpler and more readable: ``account.withdraw(amount)`` is
clearer than the three-line balance-check pattern.

**Q4: When is ``friend`` appropriate and when is it a design smell?**

``friend`` is appropriate when two entities form a single logical abstraction but must be in
separate classes for technical reasons — the classic example is ``operator<<``, which cannot
be a member function (the left operand is ``ostream``), but needs access to private fields. It
is a design smell when it is used to "break into" a class because the public API is insufficient
— that usually signals the API needs to be redesigned.
