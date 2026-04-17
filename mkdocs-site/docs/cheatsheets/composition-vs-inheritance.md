---
title: "Composition Vs Inheritance"
tags: ["cheatsheet", "reference"]
---

# :material-book: Composition Vs Inheritance


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Composition vs Inheritance

Choosing the right relationship model, the diamond problem, mixins, delegation, and private inheritance for Modern C++ (C++11/17).

<div class="contents" local="" depth="2">

Sections

</div>

------------------------------------------------------------------------

## The Core Rule

**Favor composition over inheritance** unless a true *is-a* relationship exists and Liskov Substitution holds. Inheritance is the tightest coupling in OOP; misuse locks you into fragile hierarchies.

| Composition (has-a)     | Inheritance (is-a)            |
|-------------------------|-------------------------------|
| Loose coupling          | Tight coupling to base layout |
| Runtime policy swapping | Compile-time hierarchy        |
| Easy to unit-test parts | Must test hierarchy together  |
| Any number of "parts"   | Multiple inheritance is risky |
| No slicing risk         | Value semantics cause slicing |

------------------------------------------------------------------------

## When Inheritance IS the Right Choice

Use inheritance when ALL of the following are true:

1.  **Is-a relationship**: a `Dog` truly is an `Animal`.
2.  **Liskov Substitution holds**: code using `Animal&` works with `Dog&`.
3.  **Behavioral polymorphism needed**: virtual dispatch is the goal.
4.  **No extra state needed in most derived classes** (prefer thin hierarchies).

``` cpp
// GOOD inheritance — polymorphic interface with varied behavior
class IRenderer {
public:
    virtual void render(const Scene& scene) = 0;
    virtual ~IRenderer() = default;
};

class OpenGLRenderer : public IRenderer {
public:
    void render(const Scene& scene) override { /* GL calls */ }
};

class VulkanRenderer : public IRenderer {
public:
    void render(const Scene& scene) override { /* Vk calls */ }
};

// Caller is decoupled from concrete type
void display(IRenderer& r, const Scene& s) { r.render(s); }
```

------------------------------------------------------------------------

## When NOT to Inherit

``` cpp
// BAD — Stack should not inherit from vector; "is-a" is false
// Stack exposes push_back, insert, erase from vector — breaks contract
class Stack : public std::vector<int> {
public:
    void push(int v) { push_back(v); }
    void pop()       { pop_back(); }
    int  top()       { return back(); }
};

Stack s;
s.insert(s.begin(), 42);  // VALID via vector — but Stack contract broken!

// GOOD — composition: Stack owns a vector, exposes only needed interface
class Stack {
    std::vector<int> data_;
public:
    void push(int v) { data_.push_back(v); }
    void pop()       { data_.pop_back(); }
    int  top() const { return data_.back(); }
    bool empty() const { return data_.empty(); }
};
```

------------------------------------------------------------------------

## Composition Pattern — Dependency Injection

Inject behavior as a composited object (or interface). Swappable at construction time or runtime.

``` cpp
class Logger {
public:
    virtual void log(std::string_view msg) = 0;
    virtual ~Logger() = default;
};

class ConsoleLogger : public Logger {
public:
    void log(std::string_view msg) override {
        std::cout << "[LOG] " << msg << '\n';
    }
};

class FileLogger : public Logger {
public:
    explicit FileLogger(std::string path);
    void log(std::string_view msg) override;
};

// Service composes a logger — does not inherit from it
class PaymentService {
    std::unique_ptr<Logger> logger_;
public:
    explicit PaymentService(std::unique_ptr<Logger> log)
        : logger_(std::move(log)) {}

    void process(const Payment& p) {
        logger_->log("Processing payment");
        // ...
    }
};

// Swap logger without changing PaymentService
auto svc = PaymentService(std::make_unique<FileLogger>("pay.log"));
```

------------------------------------------------------------------------

## Multiple Inheritance and the Diamond Problem

``` cpp
// Diamond — B and C both inherit A; D inherits B and C
struct A { int value; void hello(); };
struct B : A {};
struct C : A {};
struct D : B, C {};

D d;
// d.value;   // AMBIGUOUS — which A::value? B::A::value or C::A::value?
// d.hello(); // AMBIGUOUS

// Qualify explicitly
d.B::value = 1;
d.C::value = 2;   // TWO separate A subobjects

// FIX — virtual inheritance: only one A subobject in D
struct A { int value; };
struct B : virtual A {};
struct C : virtual A {};
struct D : B, C {};   // single A subobject shared

D d2;
d2.value = 42;  // unambiguous — one A
```

Virtual inheritance costs:

- Additional pointer per virtual base in each object.
- Construction of virtual base is responsibility of most-derived class.
- Slight performance overhead on access.

------------------------------------------------------------------------

## Mixin Pattern — Adding Capabilities Orthogonally

Mixins add reusable behavior to a class without a full inheritance hierarchy. Implemented in C++ via CRTP (see `crtp-static-polymorphism.rst`) or simple multiple inheritance of interface-only classes.

``` cpp
// Mixin: adds serialization capability to any class
template<typename Derived>
class Serializable {
public:
    std::string to_json() const {
        return static_cast<const Derived*>(this)->serialize_impl();
    }
};

// Mixin: adds comparison operators
template<typename Derived>
class Comparable {
public:
    bool operator==(const Derived& o) const {
        return static_cast<const Derived*>(this)->compare(o) == 0;
    }
    bool operator< (const Derived& o) const {
        return static_cast<const Derived*>(this)->compare(o) <  0;
    }
};

// User class inherits from multiple mixins
class Product : public Serializable<Product>,
                public Comparable<Product>
{
    std::string sku_;
    int price_;
public:
    std::string serialize_impl() const;
    int compare(const Product& o) const { return sku_.compare(o.sku_); }
};

Product a, b;
bool eq = (a == b);         // from Comparable
auto json = a.to_json();    // from Serializable
```

------------------------------------------------------------------------

## Delegation Pattern

Forward method calls to a contained object. More explicit than inheritance, keeps the wrapper's interface narrow.

``` cpp
class FileWriter {
public:
    void open(const std::string& path);
    void write(std::string_view data);
    void close();
};

// Buffered writer — delegates to FileWriter, adds buffering logic
class BufferedWriter {
    FileWriter  writer_;
    std::string buffer_;
    std::size_t flush_size_;
public:
    explicit BufferedWriter(std::string path, std::size_t flush = 4096)
        : flush_size_(flush)
    { writer_.open(path); }

    void write(std::string_view data) {
        buffer_ += data;
        if (buffer_.size() >= flush_size_) flush();
    }
    void flush() {
        writer_.write(buffer_);
        buffer_.clear();
    }
    ~BufferedWriter() { flush(); writer_.close(); }
};
```

------------------------------------------------------------------------

## Private Inheritance as Composition

`class D : private B` means "D is implemented-in-terms-of B". It is composition with controlled exposure of base members. Rarely needed; prefer explicit composition.

``` cpp
// Private inheritance — exposes nothing from B publicly
class Timer : private std::chrono::steady_clock {
public:
    auto now() { return std::chrono::steady_clock::now(); }
};
// Timer t; t.now();   // only now() is accessible — all clock internals hidden

// Use 'using' to expose specific base members selectively
class LoggedVector : private std::vector<int> {
public:
    using std::vector<int>::push_back;  // expose only push_back
    using std::vector<int>::size;
    // insert, erase, etc. remain private
};
```

When to prefer private inheritance over composition:

- When you need to override a virtual function from the base.
- When you need access to protected members of the base.
- Otherwise, prefer an explicit member (composition).

------------------------------------------------------------------------

## Approach Comparison Table

| Scenario               | Composition | Public inh.  | Private inh. |
|------------------------|-------------|--------------|--------------|
| Policy/strategy swap   | Best        | Possible     | No           |
| True is-a / LSP        | No          | Best         | No           |
| Reuse without exposing | Best        | No           | Good         |
| Access protected base  | No          | Yes          | Yes          |
| Override virtual base  | No          | Yes          | Yes          |
| Add orthogonal traits  | No          | Mixin (CRTP) | No           |
| Avoid slicing risk     | Yes         | No           | Yes          |

------------------------------------------------------------------------

## Common Pitfalls

**Inheriting for code reuse only:**

``` cpp
// BAD — Logger is not a "kind of" std::ofstream
class Logger : public std::ofstream { ... };

// GOOD — Logger contains an ofstream
class Logger {
    std::ofstream file_;
public:
    void log(std::string_view msg) { file_ << msg << '\n'; }
};
```

**Diamond without virtual inheritance:**

``` cpp
// BAD — two copies of Animal subobject; ambiguous access
class Flyable : public Animal {};
class Swimmable : public Animal {};
class Duck : public Flyable, public Swimmable {};
Duck d; d.eat();  // AMBIGUOUS

// GOOD — virtual inheritance for shared base
class Flyable   : public virtual Animal {};
class Swimmable : public virtual Animal {};
class Duck      : public Flyable, public Swimmable {};
Duck d; d.eat();  // OK — one Animal
```

**Interface inheritance broken by slicing:**

``` cpp
// If code accepts Animal by value, polymorphism is lost
void process(Animal a);      // SLICES
void process(Animal& a);     // SAFE — polymorphism preserved
void process(Animal* a);     // SAFE
```

------------------------------------------------------------------------

## Review Checklist

- Is every inheritance relationship a genuine is-a (Liskov holds)?
- Could composition replace any inheritance in the design without losing functionality?
- Are all containers of polymorphic types using pointer/reference (not value)?
- Does any virtual base (diamond) use `virtual` inheritance?
- Are mixin classes stateless (CRTP or interface-only) to avoid multiple data copies?
- Is private inheritance used only when overriding a virtual or accessing protected members?
- Are delegation wrappers restricting the wrapped interface to only needed operations?
- Is std::variant considered as an alternative to small polymorphic hierarchies?

## Related Concepts

- `cheatsheets/inheritance-polymorphism.rst` — access specifiers and vtable
- `cheatsheets/oop-principles-solid.rst` — Open/Closed and Dependency Inversion
- `cheatsheets/advanced-oop-patterns.rst` — Strategy, Decorator, CRTP mixin
- `cheatsheets/crtp-static-polymorphism.rst` — CRTP mixins in depth
- `cheatsheets/raii-smart-pointers.rst` — unique_ptr for polymorphic ownership


---

[← All Cheatsheets](index.md)
