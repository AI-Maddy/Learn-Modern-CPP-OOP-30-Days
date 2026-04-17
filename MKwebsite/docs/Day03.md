# Day 03: Classes and Encapsulation

## Why This Day Matters

Classes are the unit of abstraction in object-oriented C++. A class that properly encapsulates
its invariants is reliable, testable, and safe to extend. A class that exposes its internals is
just a struct with extra syntax. This day teaches you the difference and how to design for the
former.

## Learning Outcomes

By the end of this day you will be able to:

* Distinguish `class` from `struct` by invariant ownership, not just by default access.
* Write a class that establishes an invariant in the constructor and maintains it in all mutating
  member functions.
* Apply `const`-correctness to member functions so that the class works through `const`
  references.
* Use `explicit` on single-argument constructors to prevent unintended implicit conversions.
* Explain "tell, don't ask" and refactor an anemic domain model to embed its logic.
* Use `friend` appropriately for operator overloading and tightly coupled abstractions.

## Key Concepts

* **Class invariant** — the condition that must hold true of internal state at all observable
  points; enforced in the constructor and maintained by every mutating member function.
* **Access specifiers** — `private`, `protected`, `public`: start private and promote only
  as needed.
* **`const` member functions** — callable on `const` objects; do not modify observable state.
* **`this` pointer** — implicit first parameter; use for method chaining (fluent interface) and
  self-disambiguation.
* **`explicit`** — prevents single-argument constructors from being used as implicit
  conversions; always apply unless a conversion is intentional.
* **`friend`** — grants targeted access to private members; use for operators and
  closely-coupled abstractions, not as an encapsulation bypass.

## Theory

### Why This Day Matters

A class is more than a bundle of data and functions. A well-designed class establishes an
**invariant** — a guarantee about its internal state that holds at all observable points. Every
member function enforces or relies on that invariant. Encapsulation is the mechanism that prevents
external code from violating the invariant by accident.

This day covers the mechanics of C++ classes: `class` vs `struct`, access specifiers,
member functions and their `const` qualifiers, the `this` pointer, `friend`, and the design
tradeoffs around getters, setters, and data hiding.

### `class` vs `struct`

In C++ there is only one real difference between `class` and `struct`: default access.

```cpp
struct Point {
    int x;   // public by default
    int y;
};

class Circle {
    double radius_;  // private by default
public:
    double area() const;
};
```

**Convention:**

* Use `struct` for passive data carriers with no invariants — aggregates where all members can
  be set independently without breaking anything.
* Use `class` when there is an invariant — where some members must be set consistently with
  others, or where some operations must be restricted.

```cpp
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
```

### Access Specifiers

```cpp
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
```

```
Access visibility:

private   ──> only BankAccount member functions + friends
protected ──> BankAccount + derived classes
public    ──> anyone
```

**Design guidance:** Start with everything private. Promote to protected only when a derived
class genuinely needs it. Promote to public only when the operation is part of the stable API.
Defaulting to public is the most common encapsulation mistake.

### Member Functions and `const`-Correctness

`const` on a member function means "this function does not modify the observable state of the
object". It lets you call the function through a `const` reference or pointer.

```cpp
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
```

**The `mutable` keyword:** Sometimes a member must be modifiable even in a `const` function
(e.g., a lazy cache or a mutex). Mark it `mutable`.

```cpp
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
```

### The `this` Pointer

Inside every non-static member function, `this` is an implicit pointer to the current object.
It is used to disambiguate between member variables and parameters, and for method chaining.

```cpp
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
```

### Encapsulation Principles

**Invariant preservation:** Every constructor must establish the invariant. Every mutating member
function must maintain it. The invariant is the implicit contract of the class.

```cpp
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
```

**Tell, don't ask:** Instead of getting a value, checking it, and acting — ask the object to
perform the operation itself. This keeps logic inside the class where the invariant is known.

```cpp
// BAD: asking for internals, logic leaks outside the class
if (account.balance() >= amount) {
    account.set_balance(account.balance() - amount);
}

// GOOD: tell the object to do it; it knows its own rules
account.withdraw(amount);  // returns false if insufficient funds
```

### Getters and Setters — Design Tradeoffs

Not every private member needs a getter and setter pair. Over-providing accessors is a common
anti-pattern that reduces encapsulation to a formality.

```cpp
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
```

**Rule of thumb for accessors:**

* Const getter (read-only access): usually fine, communicates the value is observable.
* Setter with validation: acceptable if there is a genuine need to mutate post-construction.
* Raw setter without validation: almost always a design smell — it bypasses the invariant.

### `friend` Declarations

`friend` grants a specific function or class access to private members. It should be used
sparingly, as it tightly couples two classes.

```cpp
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
```

Good uses of `friend`:

* Overloaded stream operators (`operator<<`, `operator>>`)
* Closely coupled classes that form a single abstraction (e.g., iterator + container)
* Unit-test fixtures that need to inspect internals

Bad uses of `friend`:

* Granting access to work around encapsulation instead of redesigning
* Friending a class just because it is "related"

### Static Members

`static` members belong to the class, not to any instance. They are useful for counters,
singletons, factory functions, and compile-time constants.

```cpp
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
```

## Pitfalls

### Pitfall 1: Exposing Mutable Internal State Through Reference Getters

**Description:** Returning a non-`const` reference or pointer to a private data member,
allowing callers to bypass the class's validation logic and break invariants.

**BAD code:**

```cpp
#include <string>

class Employee {
public:
    std::string& name() { return name_; }   // returns mutable reference
    int& age()          { return age_; }    // returns mutable reference

private:
    std::string name_;
    int         age_{0};
};

int main() {
    Employee e;
    e.name() = "";      // empty name: is this valid? No validation runs.
    e.age()  = -5;      // negative age: invariant violation, no error
}
```

**Why it fails:** Returning `T&` to a private member is functionally equivalent to making
that member public. Any caller can assign any value directly, bypassing all validation in
constructors and setters. The invariant the class is supposed to maintain is effectively void.

**GOOD code:**

```cpp
#include <string>
#include <stdexcept>

class Employee {
public:
    Employee(std::string name, int age)
        : name_{validate_name(name)}, age_{validate_age(age)} {}

    // Read-only access: const& is fine — cannot be assigned through
    const std::string& name() const { return name_; }
    int                age()  const { return age_; }

    // Mutation goes through a validated setter
    void set_name(std::string name) { name_ = validate_name(std::move(name)); }

private:
    static std::string validate_name(const std::string& n) {
        if (n.empty()) throw std::invalid_argument{"name must not be empty"};
        return n;
    }
    static int validate_age(int a) {
        if (a < 0 || a > 150) throw std::out_of_range{"invalid age"};
        return a;
    }
    std::string name_;
    int         age_;
};
```

**Detection tip:** Review every non-`const` member function return type. A `T&` return from
a getter is almost always a design flaw. `clang-tidy` check
`cppcoreguidelines-avoid-non-const-global-variables` catches related patterns.

### Pitfall 2: Missing `const` on Read-Only Member Functions

**Description:** Forgetting `const` on member functions that do not modify the object. This
prevents the function from being called on `const` objects or through `const` references,
breaking const-correct client code.

**BAD code:**

```cpp
class Rectangle {
public:
    Rectangle(double w, double h) : w_{w}, h_{h} {}

    double area()   { return w_ * h_; }   // should be const but isn't
    double width()  { return w_; }
    double height() { return h_; }

private:
    double w_, h_;
};

void print(const Rectangle& r) {
    // ERROR: cannot call non-const area() on const Rectangle&
    std::cout << r.area() << '\n';
}
```

**Why it fails:** `const Rectangle& r` promises that `r` will not be modified. Calling
`r.area()` — a function that is not `const` — violates that promise in the eyes of the
compiler, even though the function does not actually modify anything. The compile error forces
the caller to either remove the `const` (spreading non-`const`ness) or copy the object.

**GOOD code:**

```cpp
class Rectangle {
public:
    Rectangle(double w, double h) : w_{w}, h_{h} {}

    double area()   const { return w_ * h_; }   // callable on const objects
    double width()  const { return w_; }
    double height() const { return h_; }

private:
    double w_, h_;
};
```

**Detection tip:** Compile with `-Wall`. Add a `const` reference parameter to a test
function and verify all accessor calls compile. `clang-tidy` check `readability-make-member-function-const`
flags functions that could be `const` but are not.

### Pitfall 3: Anemic Domain Model — Class as a Data Bag

**Description:** Designing a class with public data members or trivial getters/setters for every
field and putting all logic in external free functions. The class has no behaviour; it is just
a named struct.

**BAD code:**

```cpp
struct Order {
    int    id{0};
    double total{0.0};
    bool   paid{false};
    bool   shipped{false};
};

// Logic scattered in external functions — no invariant enforcement
void pay_order(Order& o, double amount) {
    o.total -= amount;    // no check: can go negative
    if (o.total <= 0) o.paid = true;
}

void ship_order(Order& o) {
    o.shipped = true;     // no check: can ship unpaid order
}
```

**Why it fails:** There is no enforcement that an order is paid before it is shipped, or that
the total cannot go negative. The business rules live outside the data, so they can be
accidentally bypassed. Any developer can write `order.shipped = true` anywhere.

**GOOD code:**

```cpp
class Order {
public:
    explicit Order(int id, double total)
        : id_{id}, total_{total} {}

    bool pay(double amount) {
        if (amount <= 0.0 || paid_) return false;
        total_ = std::max(0.0, total_ - amount);
        if (total_ == 0.0) paid_ = true;
        return true;
    }

    bool ship() {
        if (!paid_ || shipped_) return false;
        shipped_ = true;
        return true;
    }

    int    id()       const { return id_; }
    double total()    const { return total_; }
    bool   is_paid()  const { return paid_; }
    bool   is_shipped() const { return shipped_; }

private:
    int    id_;
    double total_;
    bool   paid_{false};
    bool   shipped_{false};
};
```

**Detection tip:** If a class has more setters than domain operations, or if business logic
lives in functions that take the class by reference and manipulate its fields directly, the
design is anemic. Refactor: move the logic into the class, make fields private.

### Pitfall 4: Forgetting the Explicit Keyword on Single-Argument Constructors

**Description:** A constructor taking one argument becomes an implicit conversion operator.
Without `explicit`, the compiler can silently create objects of your class from an unrelated
value.

**BAD code:**

```cpp
class Timeout {
public:
    Timeout(int milliseconds) : ms_{milliseconds} {}   // implicit!
private:
    int ms_;
};

void wait(Timeout t);

// Somewhere in user code:
wait(5000);   // silently converts int 5000 to Timeout — intended?
wait(true);   // silently converts bool true to Timeout(1) — almost certainly a bug
```

**Why it fails:** The implicit conversion silently accepts wrong-typed arguments. Passing
`true` (meaning "use a timeout") when an integer milliseconds value was expected compiles
without warning and creates a `Timeout{1}` — one millisecond.

**GOOD code:**

```cpp
class Timeout {
public:
    explicit Timeout(int milliseconds) : ms_{milliseconds} {}
private:
    int ms_;
};

void wait(Timeout t);

wait(Timeout{5000});  // explicit — intent is clear
// wait(5000);        // ERROR: no implicit conversion
// wait(true);        // ERROR: no implicit conversion
```

**Detection tip:** Mark every single-argument constructor (and constructors where all but one
argument have defaults) with `explicit`. `clang-tidy` check
`google-explicit-constructor` flags missing `explicit` keywords.

## Code Example

```cpp
#include <iostream>
#include "bank_account.hpp"

int main() {
    BankAccount account{"Madhavan", 1000.0};
    account.deposit(250.0);
    account.withdraw(80.0);
    std::cout << "Day 03 - Classes and Encapsulation\n";
    std::cout << account.owner() << " balance: " << account.balance() << "\n";
    return 0;
}
```
