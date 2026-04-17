---
title: "04 — Pitfalls · Day 03"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-alert: 04 — Pitfalls: Classes Encapsulation

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls — Day 03: Classes and Encapsulation

??? pitfall-lobe "⚠️ Pitfall 1: Exposing Mutable Internal State Through Reference Getters"
    **Description:** Returning a non-`const` reference or pointer to a private data member, allowing callers to bypass the class's validation logic and break invariants.

    **BAD code:**

    ``` cpp
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

    **Why it fails:** Returning `T&` to a private member is functionally equivalent to making that member public. Any caller can assign any value directly, bypassing all validation in constructors and setters. The invariant the class is supposed to maintain is effectively void.

    **GOOD code:**

    ``` cpp
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

    **Detection tip:** Review every non-`const` member function return type. A `T&` return from a getter is almost always a design flaw. `clang-tidy` check `cppcoreguidelines-avoid-non-const-global-variables` catches related patterns.

??? pitfall-lobe "⚠️ Pitfall 2: Missing `const` on Read-Only Member Functions"
    **Description:** Forgetting `const` on member functions that do not modify the object. This prevents the function from being called on `const` objects or through `const` references, breaking const-correct client code.

    **BAD code:**

    ``` cpp
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

    **Why it fails:** `const Rectangle& r` promises that `r` will not be modified. Calling `r.area()` — a function that is not `const` — violates that promise in the eyes of the compiler, even though the function does not actually modify anything. The compile error forces the caller to either remove the `const` (spreading non-`const`ness) or copy the object.

    **GOOD code:**

    ``` cpp
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

    **Detection tip:** Compile with `-Wall`. Add a `const` reference parameter to a test function and verify all accessor calls compile. `clang-tidy` check `readability-make-member-function-const` flags functions that could be `const` but are not.

??? pitfall-lobe "⚠️ Pitfall 3: Anemic Domain Model — Class as a Data Bag"
    **Description:** Designing a class with public data members or trivial getters/setters for every field and putting all logic in external free functions. The class has no behaviour; it is just a named struct.

    **BAD code:**

    ``` cpp
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

    **Why it fails:** There is no enforcement that an order is paid before it is shipped, or that the total cannot go negative. The business rules live outside the data, so they can be accidentally bypassed. Any developer can write `order.shipped = true` anywhere.

    **GOOD code:**

    ``` cpp
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

    **Detection tip:** If a class has more setters than domain operations, or if business logic lives in functions that take the class by reference and manipulate its fields directly, the design is anemic. Refactor: move the logic into the class, make fields private.

??? pitfall-lobe "⚠️ Pitfall 4: Forgetting the Explicit Keyword on Single-Argument Constructors"
    **Description:** A constructor taking one argument becomes an implicit conversion operator. Without `explicit`, the compiler can silently create objects of your class from an unrelated value.

    **BAD code:**

    ``` cpp
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

    **Why it fails:** The implicit conversion silently accepts wrong-typed arguments. Passing `true` (meaning "use a timeout") when an integer milliseconds value was expected compiles without warning and creates a `Timeout{1}` — one millisecond.

    **GOOD code:**

    ``` cpp
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

    **Detection tip:** Mark every single-argument constructor (and constructors where all but one argument have defaults) with `explicit`. `clang-tidy` check `google-explicit-constructor` flags missing `explicit` keywords.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 03:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
