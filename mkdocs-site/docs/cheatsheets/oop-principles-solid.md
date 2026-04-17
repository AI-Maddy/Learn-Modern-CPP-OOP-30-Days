---
title: "Oop Principles Solid"
tags: ["cheatsheet", "reference"]
---

# :material-book: Oop Principles Solid


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# OOP Principles and SOLID

One section per SOLID letter: definition, C++ violation, C++ compliant version, one-sentence test, and common misapplication.

<div class="contents" local="" depth="2">

Sections

</div>

------------------------------------------------------------------------

## S — Single Responsibility Principle

**Definition:** A class should have one reason to change — it should encapsulate a single concept or responsibility.

**One-sentence test:** *Does your class change for only one type of requirement (data model, persistence, rendering, validation, etc.)?*

**Violation:**

``` cpp
// BAD — Order does THREE things: domain logic, formatting, persistence
class Order {
    std::vector<Item> items_;
public:
    double total() const;              // domain logic — OK
    std::string to_html() const;       // rendering    — different reason
    void save_to_database(DB& db);     // persistence  — different reason
};
// Change in HTML template forces recompile of Order.
// Change in DB schema forces recompile of Order.
```

**Compliant:**

``` cpp
class Order {
    std::vector<Item> items_;
public:
    double total() const;
    const std::vector<Item>& items() const;
};

class OrderHtmlRenderer {
public:
    std::string render(const Order& o) const;
};

class OrderRepository {
    DB& db_;
public:
    explicit OrderRepository(DB& db) : db_(db) {}
    void save(const Order& o);
    Order load(int id);
};
```

**Common misapplication:** Splitting too aggressively — `EmailAddressValidator`, `EmailAddressParser`, `EmailAddressNormalizer` as three separate classes when one cohesive `EmailAddress` value type is cleaner. SRP means one *reason to change*, not one function per class.

------------------------------------------------------------------------

## O — Open/Closed Principle

**Definition:** Software entities should be **open for extension** but **closed for modification**. Add new behavior without editing existing code.

**One-sentence test:** *Can you add a new behavior (e.g., a new shape, a new export format) by adding a new class/function without editing existing ones?*

**Violation:**

``` cpp
// BAD — adding a new shape requires editing AreaCalculator
class AreaCalculator {
public:
    double calculate(const Shape& s) {
        if (s.type == ShapeType::Circle)
            return 3.14 * s.radius * s.radius;
        else if (s.type == ShapeType::Rectangle)
            return s.w * s.h;
        // Adding Triangle requires editing this function
        return 0.0;
    }
};
```

**Compliant:**

``` cpp
// OCP via virtual dispatch — extend by adding derived classes
class Shape {
public:
    virtual double area() const = 0;
    virtual ~Shape() = default;
};
class Circle    : public Shape { public: double area() const override; };
class Rectangle : public Shape { public: double area() const override; };
class Triangle  : public Shape { public: double area() const override; }; // new!

double total_area(const std::vector<std::unique_ptr<Shape>>& shapes) {
    double sum = 0;
    for (const auto& s : shapes) sum += s->area();
    return sum;
}
// Adding Triangle does NOT touch total_area or other shapes.

// OCP via std::variant + overloaded visitor (no virtual overhead)
using ShapeV = std::variant<Circle, Rectangle, Triangle>;
double area(const ShapeV& s) {
    return std::visit([](const auto& shape){ return shape.area(); }, s);
}
```

**Common misapplication:** Treating OCP as "never change existing code". OCP applies to stable abstractions; fixing bugs or refactoring internals is fine. Over-engineering with abstract factories for every type violates YAGNI.

------------------------------------------------------------------------

## L — Liskov Substitution Principle

**Definition:** If S is a subtype of T, then objects of type T may be replaced with objects of type S without altering program correctness.

**One-sentence test:** *Does every function that accepts a Base& work correctly when given any Derived& without extra preconditions or weakened postconditions?*

**Violation:**

``` cpp
// BAD — Square violates Rectangle's postcondition (independent w/h)
class Rectangle {
public:
    virtual void set_width (int w);
    virtual void set_height(int h);
    int area() const { return w_ * h_; }
protected: int w_, h_;
};

class Square : public Rectangle {
public:
    void set_width (int w) override { w_ = h_ = w; }  // side effect!
    void set_height(int h) override { w_ = h_ = h; }
};

void test_area(Rectangle& r) {
    r.set_width(4); r.set_height(5);
    assert(r.area() == 20);  // FAILS for Square — area is 25
}
```

**Compliant:**

``` cpp
// Model different shapes without forcing incorrect subtyping
class IShape { public: virtual int area() const = 0; };

class Rectangle : public IShape {
    int w_, h_;
public:
    Rectangle(int w, int h) : w_(w), h_(h) {}
    void resize(int w, int h) { w_ = w; h_ = h; }
    int area() const override { return w_ * h_; }
};

class Square : public IShape {
    int side_;
public:
    explicit Square(int s) : side_(s) {}
    void resize(int s) { side_ = s; }
    int area() const override { return side_ * side_; }
};
```

**Common misapplication:** Assuming all subclasses automatically satisfy LSP. Override responsibilities: strengthen postconditions, weaken preconditions, preserve invariants. If you add a precondition in an override, LSP is violated.

------------------------------------------------------------------------

## I — Interface Segregation Principle

**Definition:** No client should be forced to depend on methods it does not use. Split fat interfaces into smaller, focused ones.

**One-sentence test:** *Does every class implementing your interface use every method in it, or are some implementations throwing "not supported"?*

**Violation:**

``` cpp
// BAD — fat interface forces all implementors to handle all ops
class IDevice {
public:
    virtual void print(Document&)  = 0;
    virtual void scan(Document&)   = 0;
    virtual void fax(Document&)    = 0;
    virtual void staple(Document&) = 0;
    virtual ~IDevice() = default;
};

class BasicPrinter : public IDevice {
public:
    void print(Document& d) override { /* real impl */ }
    void scan  (Document&)  override { throw std::logic_error{"not supported"}; }
    void fax   (Document&)  override { throw std::logic_error{"not supported"}; }
    void staple(Document&)  override { throw std::logic_error{"not supported"}; }
};
```

**Compliant:**

``` cpp
class IPrinter  { public: virtual void print (Document&) = 0; virtual ~IPrinter()  = default; };
class IScanner  { public: virtual void scan  (Document&) = 0; virtual ~IScanner()  = default; };
class IFaxer    { public: virtual void fax   (Document&) = 0; virtual ~IFaxer()    = default; };

class BasicPrinter : public IPrinter {
public:
    void print(Document& d) override { /* real impl */ }
};

class AllInOne : public IPrinter, public IScanner, public IFaxer {
public:
    void print(Document& d) override;
    void scan (Document& d) override;
    void fax  (Document& d) override;
};

// Clients depend only on what they need
void make_copy(IScanner& s, IPrinter& p, Document& d) {
    s.scan(d);
    p.print(d);
}
```

**Common misapplication:** Going so granular that interfaces have only one method each everywhere. ISP is about removing *forced dependency*, not enforcing micro-interfaces universally. Group related methods that always change together.

------------------------------------------------------------------------

## D — Dependency Inversion Principle

**Definition:** (1) High-level modules should not depend on low-level modules; both should depend on abstractions. (2) Abstractions should not depend on details; details should depend on abstractions.

**One-sentence test:** *Does your high-level class reference concrete low-level types (MySQL, filesystem, clock) directly, or does it reference an abstract interface?*

**Violation:**

``` cpp
// BAD — UserService directly depends on concrete MySQLDatabase
class MySQLDatabase {
public:
    User find_user(int id);
    void save_user(const User& u);
};

class UserService {
    MySQLDatabase db_;   // tight coupling to MySQL
public:
    User get_user(int id) { return db_.find_user(id); }
};
// Switching to PostgreSQL requires changing UserService.
// Unit testing UserService requires a real MySQL connection.
```

**Compliant:**

``` cpp
// Abstract interface — detail-free
class IUserRepository {
public:
    virtual User   find(int id)          = 0;
    virtual void   save(const User& u)   = 0;
    virtual ~IUserRepository() = default;
};

// High-level service depends only on abstraction
class UserService {
    IUserRepository& repo_;
public:
    explicit UserService(IUserRepository& repo) : repo_(repo) {}
    User get_user(int id) { return repo_.find(id); }
};

// Details depend on the abstraction
class MySQLUserRepository : public IUserRepository {
public:
    User find(int id) override { /* MySQL impl */ }
    void save(const User& u) override { /* MySQL impl */ }
};

class InMemoryUserRepository : public IUserRepository {
    std::map<int, User> store_;
public:
    User find(int id) override { return store_.at(id); }
    void save(const User& u) override { store_[u.id] = u; }
};

// Production
MySQLUserRepository mysql_repo;
UserService svc{mysql_repo};

// Test — no database needed
InMemoryUserRepository mem_repo;
UserService test_svc{mem_repo};
```

**Common misapplication:** Creating an interface for every class "just in case". DIP applies at architectural boundaries where the direction of dependency matters. A `std::vector` of ints does not need an `IContainer` abstraction.

------------------------------------------------------------------------

## SOLID at a Glance

| Princ | Name            | Key question              | C++ mechanism                 |
|-------|-----------------|---------------------------|-------------------------------|
| S     | Single Resp.    | One reason to change?     | Separate classes              |
| O     | Open/Closed     | Extend without modifying? | Virtual / variant / template  |
| L     | Liskov Subst.   | Derived substitutable?    | Correct virtual overrides     |
| I     | Interface Seg.  | Client uses all methods?  | Small pure-virtual interfaces |
| D     | Dependency Inv. | Depend on abstractions?   | Inject interface references   |

------------------------------------------------------------------------

## Review Checklist

- Does each class change for only one type of requirement (S)?
- Can new behavior be added with a new class, not by editing existing ones (O)?
- Do all overrides maintain the postconditions of the base method (L)?
- Does every implementor of an interface use all its methods (I)?
- Do high-level components reference abstract interfaces, not concrete classes (D)?
- Are `throw "not supported"` overrides eliminated by splitting interfaces (I)?
- Are concrete dependencies injected (constructor or method injection) rather than constructed internally (D)?
- Is `std::variant` considered as a closed-set alternative to open virtual hierarchies (O)?

## Related Concepts

- `cheatsheets/inheritance-polymorphism.rst` — virtual dispatch mechanics
- `cheatsheets/composition-vs-inheritance.rst` — composition as DIP tool
- `cheatsheets/advanced-oop-patterns.rst` — Strategy, Observer implementing SOLID
- `cheatsheets/raii-smart-pointers.rst` — injecting unique_ptr dependencies


---

[← All Cheatsheets](index.md)
