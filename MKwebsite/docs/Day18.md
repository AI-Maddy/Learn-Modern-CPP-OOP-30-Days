# Day 18: SOLID Principles

## Why This Day Matters

SOLID is an acronym for five object-oriented design principles articulated by Robert C. Martin. They answer the question: "How do I structure my classes so the system stays easy to change, test, and extend over its lifetime?" Each principle names a distinct failure mode: classes that do too many things break for too many reasons; code that requires modification for every extension is fragile; subtypes that behave unexpectedly break polymorphic code silently; fat interfaces force clients to depend on methods they don't use; and classes that reach up to concrete details are hard to test.

## Learning Outcomes

By the end of this day you will be able to:

* State each of the five SOLID principles in one sentence and give a concrete C++ example of both a violation and a fix.
* Refactor a God-class into single-responsibility components with clear ownership boundaries.
* Apply the Open/Closed Principle using virtual dispatch or `std::variant` + visitor without editing existing code.
* Identify LSP violations by recognising `dynamic_cast` usage and postcondition strengthening in overrides.
* Design segregated interfaces so clients only depend on methods they use.
* Inject dependencies via constructor and explain why this is preferred over setter injection or internal construction.

## Key Concepts

* **SRP (Single Responsibility)** — one class, one actor, one reason to change; detected by counting distinct "stakeholders" who could force a change.
* **OCP (Open/Closed)** — extend via polymorphism or `std::variant`; never by editing a `switch` statement on a growing enum.
* **LSP (Liskov Substitution)** — a derived type must be usable wherever the base is used without altering the correctness of the program.
* **ISP (Interface Segregation)** — split fat interfaces by role; empty or throwing overrides signal a violation.
* **DIP (Dependency Inversion)** — high-level policy depends on an abstraction; concrete details are injected at the composition root.
* **Constructor injection** — the preferred DI style in C++; makes dependencies visible, mandatory, and amenable to `const` references.

## Theory

### Motivation — Why SOLID?

SOLID is an acronym for five object-oriented design principles articulated by Robert C. Martin. They answer the question: "How do I structure my classes so the system stays easy to change, test, and extend over its lifetime?"

Each principle names a distinct failure mode:

* SRP — classes that do too many things break for too many reasons.
* OCP — code that requires modification for every extension is fragile.
* LSP — subtypes that behave unexpectedly break polymorphic code silently.
* ISP — fat interfaces force clients to depend on methods they don't use.
* DIP — classes that reach up to concrete details are hard to test.

These principles are not rules to follow blindly. Applying them costs abstraction complexity. The right time to apply them is when the failure mode they prevent has already appeared, or when you are designing for a known axis of change.

### Single Responsibility Principle (SRP)

**A class should have only one reason to change.**

"Reason to change" maps to "actor" — the stakeholder who owns that responsibility. If two unrelated stakeholders can both force a change to the same class, it has multiple responsibilities.

**BAD — `User` class does user data, persistence, and formatting:**

```cpp
class User {
public:
    std::string name;
    std::string email;

    // Responsibility 1: business logic
    bool is_valid() const { return !name.empty() && email.contains('@'); }

    // Responsibility 2: persistence — knows about SQL
    void save_to_db(DbConnection& db) {
        db.execute("INSERT INTO users (name,email) VALUES (?,?)", name, email);
    }

    // Responsibility 3: presentation — knows about HTML
    std::string to_html() const {
        return "<p>" + name + " &lt;" + email + "&gt;</p>";
    }
};
```

If the HTML layout changes, the DBA changes the schema, OR the validation rule changes — all three force `User` to be recompiled.

**GOOD — split by responsibility:**

```cpp
struct User {
    std::string name;
    std::string email;
    bool is_valid() const { return !name.empty() && email.contains('@'); }
};

class UserRepository {
public:
    void save(DbConnection& db, const User& u) {
        db.execute("INSERT INTO users (name,email) VALUES (?,?)", u.name, u.email);
    }
};

class UserPresenter {
public:
    std::string to_html(const User& u) const {
        return "<p>" + u.name + " &lt;" + u.email + "&gt;</p>";
    }
};
```

Each class now has a single owner and a single reason to change.

### Open/Closed Principle (OCP)

**Software entities should be open for extension but closed for modification.**

New behaviour should be addable without touching existing, tested code.

**BAD — adding a new shape requires editing `area()`:**

```cpp
struct Shape { enum Type { Circle, Square } type; };

double area(const Shape& s) {
    if (s.type == Shape::Circle) return 3.14 * s.r * s.r;
    if (s.type == Shape::Square) return s.side * s.side;
    // Must modify this function every time a new shape is added!
    return 0;
}
```

**GOOD — extension via polymorphism or `std::variant`:**

```cpp
// Polymorphic OCP
struct Shape {
    virtual double area() const = 0;
    virtual ~Shape() = default;
};

struct Circle : Shape {
    double r;
    double area() const override { return 3.14159 * r * r; }
};

struct Square : Shape {
    double side;
    double area() const override { return side * side; }
};

// Adding Triangle requires no change to Circle or Square
struct Triangle : Shape {
    double base, height;
    double area() const override { return 0.5 * base * height; }
};

// OCP with std::variant (C++17) — closed via visitor, open by adding variants
using ShapeV = std::variant<Circle, Square, Triangle>;

struct AreaVisitor {
    double operator()(const Circle&   c) const { return 3.14159 * c.r * c.r; }
    double operator()(const Square&   s) const { return s.side * s.side; }
    double operator()(const Triangle& t) const { return 0.5 * t.base * t.height; }
};

double area(const ShapeV& sv) { return std::visit(AreaVisitor{}, sv); }
```

### Liskov Substitution Principle (LSP)

**Subtypes must be behaviourally substitutable for their base types.**

A derived class must honour every postcondition the base class establishes. It may weaken preconditions but must not strengthen them.

**BAD — Rectangle/Square violation:**

```cpp
class Rectangle {
public:
    virtual void set_width(double w)  { width_  = w; }
    virtual void set_height(double h) { height_ = h; }
    double area() const { return width_ * height_; }
protected:
    double width_{}, height_{};
};

class Square : public Rectangle {
public:
    // Square maintains width == height invariant
    void set_width(double w)  override { width_ = height_ = w; }
    void set_height(double h) override { width_ = height_ = h; }
};

// This code breaks with Square:
void scale(Rectangle& r) {
    r.set_width(4);
    r.set_height(3);
    assert(r.area() == 12);  // fails for Square — area() == 9
}
```

**GOOD — don't force the IS-A relationship; prefer composition:**

```cpp
struct Rectangle {
    double width, height;
    double area() const { return width * height; }
};

struct Square {
    double side;
    double area() const { return side * side; }
};

// Or use std::variant and a visitor — no inheritance hierarchy needed
using Shape = std::variant<Rectangle, Square>;
```

**Practical rule:** If you find yourself writing `if (dynamic_cast<Square*>)` inside code that takes a `Rectangle*`, LSP is violated.

### Interface Segregation Principle (ISP)

**Clients should not be forced to depend on interfaces they do not use.**

Fat interfaces force implementors to stub out methods they don't support and force callers to link against unrelated code.

**BAD — monolithic `IAnimal` interface:**

```cpp
struct IAnimal {
    virtual void eat()   = 0;
    virtual void fly()   = 0;  // dogs can't fly!
    virtual void swim()  = 0;  // eagles can't swim well!
    virtual void bark()  = 0;  // fish don't bark!
    virtual ~IAnimal() = default;
};

class Dog : public IAnimal {
public:
    void eat()  override {}
    void fly()  override { /* throw? stub? */ }  // forced to implement
    void swim() override {}
    void bark() override {}
};
```

**GOOD — segregated, role-based interfaces:**

```cpp
struct IFeedable { virtual void eat()  = 0; virtual ~IFeedable() = default; };
struct IFlyable  { virtual void fly()  = 0; virtual ~IFlyable()  = default; };
struct ISwimmable{ virtual void swim() = 0; virtual ~ISwimmable()= default; };
struct IBarkable { virtual void bark() = 0; virtual ~IBarkable() = default; };

class Dog : public IFeedable, public ISwimmable, public IBarkable {
public:
    void eat()  override {}
    void swim() override {}
    void bark() override {}
    // No fly() — Dog doesn't even know fly() exists
};

class Duck : public IFeedable, public IFlyable, public ISwimmable {
public:
    void eat()  override {}
    void fly()  override {}
    void swim() override {}
};

// A feeder function only depends on IFeedable — not on the whole animal
void feed_animal(IFeedable& a) { a.eat(); }
```

### Dependency Inversion Principle (DIP)

**High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details.**

**BAD — high-level `OrderService` depends directly on `MySQLDatabase`:**

```cpp
class MySQLDatabase {
public:
    void insert(const std::string& sql) { /* MySQL-specific */ }
};

class OrderService {
    MySQLDatabase db_;   // concrete dependency — can't test without MySQL
public:
    void place_order(Order o) {
        // ... business logic ...
        db_.insert("INSERT INTO orders ...");
    }
};
```

**GOOD — depend on an abstraction; inject the concrete at the composition root:**

```cpp
// Abstraction (interface)
struct IDatabase {
    virtual void insert(const std::string& sql) = 0;
    virtual ~IDatabase() = default;
};

// Low-level detail
class MySQLDatabase : public IDatabase {
public:
    void insert(const std::string& sql) override { /* MySQL */ }
};

// In-memory fake for tests
class FakeDatabase : public IDatabase {
public:
    void insert(const std::string& sql) override { log_.push_back(sql); }
    const std::vector<std::string>& log() const { return log_; }
private:
    std::vector<std::string> log_;
};

// High-level module — depends only on IDatabase
class OrderService {
    IDatabase& db_;   // reference to abstraction
public:
    explicit OrderService(IDatabase& db) : db_{db} {}

    void place_order(const Order& o) {
        // ... business logic ...
        db_.insert("INSERT INTO orders ...");
    }
};

// Composition root (main or test setup)
MySQLDatabase real_db;
OrderService  service{real_db};

FakeDatabase  fake_db;
OrderService  test_service{fake_db};  // fully testable without MySQL
```

### Dependency Injection via Constructor

Constructor injection is the preferred DI style in C++ because:

* Dependencies are explicit in the constructor signature.
* The object is always fully initialised after construction.
* No `set_dependency()` methods needed — no partially-constructed state.
* Works with `const` references and `unique_ptr` ownership transfer.

```cpp
class ReportGenerator {
    IDatabase&    db_;
    ILogger&      logger_;
    IEmailSender& mailer_;
public:
    ReportGenerator(IDatabase& db, ILogger& log, IEmailSender& mail)
        : db_{db}, logger_{log}, mailer_{mail} {}

    void generate(const ReportConfig& cfg) {
        logger_.log("Generating report...");
        auto data = db_.query(cfg.query);
        mailer_.send(cfg.recipient, render(data));
    }
};
```

All three dependencies are substitutable in tests. The constructor makes the dependency graph visible without any DI framework.

### SOLID Summary Table

| Code  | Principle                            | Key question to ask              |
|-------|--------------------------------------|----------------------------------|
| SRP   | Single Responsibility                | Does this class change for more than one actor? |
| OCP   | Open/Closed                          | Must I modify existing code to add new behaviour? |
| LSP   | Liskov Substitution                  | Can I use a Derived wherever Base is expected, safely? |
| ISP   | Interface Segregation                | Are clients forced to depend on methods they never call? |
| DIP   | Dependency Inversion                 | Does my high-level policy know about low-level details? |

## Pitfalls

### Pitfall 1 — God Class Violating SRP

**Problem:** A single class accumulates responsibilities over time until it becomes a central hub that every other class depends on.

**BAD:**

```cpp
class Application {
public:
    void load_config(const std::string& path);   // config management
    void connect_database();                      // persistence
    void start_http_server(int port);             // networking
    void render_dashboard();                      // UI
    void log(const std::string& msg);             // logging
    void send_alert_email(const std::string& to); // email
};
```

**Why it fails:** Six unrelated actors (DevOps, DBA, frontend, backend, sysadmin) all force changes to `Application`. Every change recompiles code for all six concerns. Testing any single concern requires the entire `Application` to be constructed.

**GOOD — extract into single-responsibility components:**

```cpp
class ConfigLoader   { public: Config  load(const std::string& path); };
class DatabasePool   { public: Conn    connect(const Config&); };
class HttpServer     { public: void    start(int port, RequestHandler&); };
class Dashboard      { public: void    render(const AppState&); };
class Logger         { public: void    log(std::string_view msg); };
class AlertMailer    { public: void    send(std::string_view to, std::string_view body); };
```

**Detection tip:** Count public methods. More than 7–10 methods doing unrelated things is a strong SRP smell. Also look for `and` in the class name: `UserManagerAndFormatter`.

### Pitfall 2 — Using `dynamic_cast` as a Workaround for LSP Violations

**Problem:** Code that `dynamic_cast`s a base pointer to a specific derived type to call methods that should be on the base interface.

**BAD:**

```cpp
struct Animal {
    virtual void move() = 0;
    virtual ~Animal() = default;
};

struct Bird  : Animal { void move() override { /* fly */ } void sing() {} };
struct Fish  : Animal { void move() override { /* swim */ } };

void process(Animal& a) {
    a.move();
    // Special-case Bird — this is an LSP warning sign
    if (auto* b = dynamic_cast<Bird*>(&a))
        b->sing();
}
```

**Why it fails:** `process` now depends on the concrete type `Bird`, not just the `Animal` abstraction. Adding a new singing type (`Parrot`) means editing `process`. This pattern grows into an if-chain of `dynamic_cast`s.

**GOOD — put the discriminating behaviour on the interface:**

```cpp
struct Animal {
    virtual void move() = 0;
    virtual void make_sound() {}   // default: silent — override if applicable
    virtual ~Animal() = default;
};

struct Bird : Animal {
    void move()        override { /* fly */ }
    void make_sound()  override { /* sing */ }
};

void process(Animal& a) {
    a.move();
    a.make_sound();   // polymorphic — no cast needed
}
```

**Detection tip:** Any `dynamic_cast` inside a function that takes a base reference is worth questioning. Most can be replaced by virtual dispatch.

### Pitfall 3 — Violating OCP by Editing a Switch on Type Tags

**Problem:** Using an enum or integer type tag to dispatch behaviour, forcing modification of multiple switch statements every time a new type is added.

**BAD:**

```cpp
enum class PaymentType { CreditCard, PayPal, Bitcoin };

double calculate_fee(PaymentType t, double amount) {
    switch (t) {
        case PaymentType::CreditCard: return amount * 0.02;
        case PaymentType::PayPal:     return amount * 0.025 + 0.30;
        case PaymentType::Bitcoin:    return amount * 0.01;
    }
    return 0;  // Adding a new payment type means editing this switch
}
```

**Why it fails:** There may be five other switch statements (`process()`, `validate()`, `format_receipt()`…) all requiring the same edit when `Stripe` is added. Each site is a potential miss.

**GOOD — each payment type owns its behaviour:**

```cpp
struct IPaymentMethod {
    virtual double fee(double amount) const = 0;
    virtual ~IPaymentMethod() = default;
};

struct CreditCard : IPaymentMethod {
    double fee(double amount) const override { return amount * 0.02; }
};

struct PayPal : IPaymentMethod {
    double fee(double amount) const override { return amount * 0.025 + 0.30; }
};

// Adding Stripe requires NO change to existing classes
struct Stripe : IPaymentMethod {
    double fee(double amount) const override { return amount * 0.015 + 0.25; }
};

double calculate_fee(const IPaymentMethod& m, double amount) {
    return m.fee(amount);   // closed for modification, open for extension
}
```

**Detection tip:** Search for `switch` on an enum type. If the enum grows over time, OCP is being violated.

### Pitfall 4 — ISP: Implementing Interface Methods with `throw` or Empty Stubs

**Problem:** An interface is too broad, so implementors are forced to stub out irrelevant methods, often by throwing or silently doing nothing.

**BAD:**

```cpp
struct IWorker {
    virtual void work()   = 0;
    virtual void eat()    = 0;
    virtual void sleep()  = 0;
    virtual ~IWorker() = default;
};

struct Robot : IWorker {
    void work()  override { /* do work */ }
    void eat()   override { throw std::logic_error("robots don't eat"); } // stub!
    void sleep() override { /* noop */ }  // silent stub
};
```

**Why it fails:** A caller that calls `eat()` on an `IWorker` and gets an exception or a silent no-op has no way of knowing this at compile time. The interface lies about what all implementors support.

**GOOD — segregate the interface:**

```cpp
struct IWorkable { virtual void work()  = 0; virtual ~IWorkable()  = default; };
struct IFeedable  { virtual void eat()   = 0; virtual ~IFeedable()   = default; };
struct ISleepable { virtual void sleep() = 0; virtual ~ISleepable() = default; };

struct Human : IWorkable, IFeedable, ISleepable {
    void work()  override {}
    void eat()   override {}
    void sleep() override {}
};

struct Robot : IWorkable {
    void work()  override {}
    // Robot doesn't implement IFeedable or ISleepable — clean absence
};
```

**Detection tip:** Review every virtual method override that is either empty or immediately throws. These are ISP violations waiting to cause bugs.

### Pitfall 5 — DIP Violation: Constructing Dependencies Inside the Class

**Problem:** A high-level class creates its own low-level dependencies with `new` or by calling a concrete constructor, making it impossible to substitute for testing or configuration.

**BAD:**

```cpp
class EmailNotifier {
    SmtpClient client_{"smtp.example.com", 587};   // hardcoded concrete
public:
    void notify(const std::string& msg) {
        client_.send("alerts@example.com", msg);
    }
};
```

**Why it fails:** `EmailNotifier` cannot be tested without a live SMTP server. The hostname and port are baked in. Switching to SendGrid requires modifying `EmailNotifier`.

**GOOD — inject the transport abstraction:**

```cpp
struct IMailTransport {
    virtual void send(std::string_view to, std::string_view body) = 0;
    virtual ~IMailTransport() = default;
};

class EmailNotifier {
    IMailTransport& transport_;   // injected — no concrete dependency
public:
    explicit EmailNotifier(IMailTransport& t) : transport_{t} {}
    void notify(const std::string& msg) {
        transport_.send("alerts@example.com", msg);
    }
};

// Test:
struct NullTransport : IMailTransport {
    void send(std::string_view, std::string_view) override {}
};

NullTransport null;
EmailNotifier notifier{null};   // testable without network
```

**Detection tip:** Look for `new SomeConcreteClass` or `SomeConcreteClass concrete{...}` as member initialisers in high-level classes. Every such construction is a DIP violation candidate.

### Pitfall 6 — Applying SOLID Prematurely to Simple Code

**Problem:** Wrapping a simple function in four layers of interface and abstraction "because SOLID", adding accidental complexity for no changeability benefit.

**BAD over-engineering:**

```cpp
struct IGreeter { virtual std::string greet(const std::string&) = 0; };
struct FormalGreeter : IGreeter {
    std::string greet(const std::string& n) override { return "Good day, " + n; }
};
struct GreeterFactory {
    static std::unique_ptr<IGreeter> create() {
        return std::make_unique<FormalGreeter>();
    }
};
// All of this for a single greeting that never changes
```

**Why it fails:** The complexity budget is wasted. Teammates spend time navigating three files and four classes to understand `"Good day, " + name`.

**GOOD — keep it simple until variability is real:**

```cpp
std::string greet(std::string_view name) {
    return std::string("Good day, ") + std::string(name);
}

// If multiple greetings become real: then introduce an abstraction
using Greeter = std::function<std::string(std::string_view)>;
```

**Detection tip:** Before introducing an interface, ask: "What are the two or more concrete implementations I have today?" If the answer is "just one", wait until the second real implementation arrives.

## Code Example

```cpp
#include <iostream>
#include <memory>

class Notifier {
  public:
    virtual ~Notifier() = default;
    virtual void send(const std::string& text) = 0;
};

class EmailNotifier : public Notifier {
  public:
    void send(const std::string& text) override { std::cout << "email: " << text << "\n"; }
};

class ReportService {
  public:
    explicit ReportService(std::unique_ptr<Notifier> notifier) : notifier_(std::move(notifier)) {}
    void publish() { notifier_->send("weekly report ready"); }

  private:
    std::unique_ptr<Notifier> notifier_;
};

int main() {
    ReportService service{std::make_unique<EmailNotifier>()};
    std::cout << "Day 18 - SOLID Principles\n";
    service.publish();
    return 0;
}
```
