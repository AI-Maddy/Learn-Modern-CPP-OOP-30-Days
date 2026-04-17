---
title: "02 — Definition · Day 03"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-book: 02 — Definition: Classes Encapsulation

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)

!!! info "🔵 Blue = Theory — Precise, formal, complete"
    Read this section carefully. Every word matters.
    After reading, close the page and explain it back in your own words.

---


## :material-book: Why This Day Matters

A class is more than a bundle of data and functions. A well-designed class establishes an **invariant** — a guarantee about its internal state that holds at all observable points. Every member function enforces or relies on that invariant. Encapsulation is the mechanism that prevents external code from violating the invariant by accident.

This day covers the mechanics of C++ classes: `class` vs `struct`, access specifiers, member functions and their `const` qualifiers, the `this` pointer, `friend`, and the design tradeoffs around getters, setters, and data hiding.

## :material-book: `class` vs `struct`

In C++ there is only one real difference between `class` and `struct`: default access.

``` cpp
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

- Use `struct` for passive data carriers with no invariants — aggregates where all members can be set independently without breaking anything.
- Use `class` when there is an invariant — where some members must be set consistently with others, or where some operations must be restricted.

``` cpp
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

## :material-book: Access Specifiers

``` cpp
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

    Access visibility:

    private   ──> only BankAccount member functions + friends
    protected ──> BankAccount + derived classes
    public    ──> anyone

**Design guidance:** Start with everything private. Promote to protected only when a derived class genuinely needs it. Promote to public only when the operation is part of the stable API. Defaulting to public is the most common encapsulation mistake.


---

## :material-vector-polyline: Knowledge Map (SPATIAL MEMORY — Feature 7)

```mermaid
graph TD
    ROOT["Classes Encapsulation"] --> A["class"]
    Classes_Encapsulation --> class["class"]
    Classes_Encapsulation --> RAII["RAII"]
    Classes_Encapsulation --> virtual["virtual"]
    Classes_Encapsulation --> override["override"]
    style ROOT fill:#8b5cf6,color:#fff
    style A    fill:#3b82f6,color:#fff
```


---

## :material-memory: Quick Definitions Table

| Term | Meaning |
|------|---------|
| `class` | _class — key concept for Classes Encapsulation_ |
| `RAII` | _RAII — key concept for Classes Encapsulation_ |
| `virtual` | _virtual — key concept for Classes Encapsulation_ |
| `override` | _override — key concept for Classes Encapsulation_ |
| `unique_ptr` | _unique_ptr — key concept for Classes Encapsulation_ |


---

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)
