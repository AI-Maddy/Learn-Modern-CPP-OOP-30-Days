---
title: "02 — Definition · Day 04"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-book: 02 — Definition: Constructors Destructors RAII

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)

!!! info "🔵 Blue = Theory — Precise, formal, complete"
    Read this section carefully. Every word matters.
    After reading, close the page and explain it back in your own words.

---


## :material-book: Why This Day Matters

Resource management is the hardest problem in systems programming. C++ solves it elegantly with one principle: **Resource Acquisition Is Initialization (RAII)**. Tie a resource's lifetime to an object's lifetime, and the language guarantees cleanup — even when exceptions are thrown, even when early returns happen, even when the code path is convoluted.

This day covers every constructor type, the member initialiser list, RAII in depth with practical examples, destructor semantics, and the guarantees you can make about exception safety.

## :material-book: Constructor Types

C++ provides six special member functions. Today we cover the constructor family.

### Default Constructor

A constructor that can be called with no arguments.

``` cpp
class Timer {
public:
    Timer() : start_{std::chrono::steady_clock::now()} {}  // (1)

    // Compiler-generated default constructor (when all members have defaults)
    // Nothing to write.

private:
    std::chrono::steady_clock::time_point start_;
};

// (1): The member initialiser list sets start_ before the body runs.
//      This is the preferred way to initialise members.
```

### Parameterised Constructor

``` cpp
class Buffer {
public:
    explicit Buffer(std::size_t size)   // explicit: no silent int->Buffer conversion
        : data_(size), size_{size} {}

    std::size_t size() const { return size_; }

private:
    std::vector<std::byte> data_;
    std::size_t            size_;
};
```

### Delegating Constructor (C++11)

A constructor that calls another constructor of the same class. Avoids duplicating initialisation logic.

``` cpp
class Connection {
public:
    Connection(std::string host, int port, bool tls)
        : host_{std::move(host)}, port_{port}, tls_{tls} {}

    // Delegating: uses the three-argument constructor with a default for TLS
    Connection(std::string host, int port)
        : Connection{std::move(host), port, true} {}

    // Delegating: uses canonical defaults
    explicit Connection(std::string host)
        : Connection{std::move(host), 443} {}

private:
    std::string host_;
    int         port_;
    bool        tls_;
};
```

### Converting Constructor (and `explicit`)

A constructor callable with one argument acts as an implicit conversion unless marked `explicit`. Always mark single-argument constructors `explicit` unless you explicitly want the conversion.

``` cpp
class Seconds {
public:
    explicit Seconds(double s) : value_{s} {}
    double value() const { return value_; }
private:
    double value_;
};

void wait(Seconds duration);

wait(Seconds{5.0});   // explicit: clear and safe
// wait(5.0);         // ERROR: implicit conversion blocked by explicit
```

## :material-book: Member Initialiser List

Members are initialised **in declaration order**, not in the order they appear in the initialiser list. Initialise all members in the initialiser list rather than assigning in the constructor body.

``` cpp
class Rectangle {
public:
    Rectangle(double w, double h)
        : width_{w}      // (1) initialised first — in declaration order
        , height_{h}     // (2) initialised second
        , area_{w * h}   // (3) both available since w and h are already in scope
    {}
    // Body is empty — all work done in initialiser list

private:
    double width_;
    double height_;
    double area_;   // declared after width_ and height_
};
```

**Why prefer the initialiser list over the body?**

Assigning in the body first default-initialises each member, then assigns — two operations. The initialiser list constructs directly into the member — one operation. For objects with expensive copy constructors (like `std::string` or `std::vector`), this matters.

``` cpp
class Log {
public:
    // BAD: default-initialise then assign
    Log(std::string path) {
        path_ = std::move(path);   // string is default-init'd (empty), then move-assigned
    }

    // GOOD: direct construction in initialiser list
    Log(std::string path)
        : path_{std::move(path)} {}   // one move construction

private:
    std::string path_;
};
```

The `const` members and reference members **must** be initialised in the member initialiser list — they cannot be assigned in the constructor body.

``` cpp
class Config {
public:
    Config(int id, const std::string& source)
        : id_{id}        // const member: must be in initialiser list
        , source_{source} {}
private:
    const int   id_;
    std::string& source_;   // reference member: must be in initialiser list
};
```


---

## :material-vector-polyline: Knowledge Map (SPATIAL MEMORY — Feature 7)

```mermaid
graph TD
    ROOT["Constructors Destructors RAII"] --> A["class"]
    Constructors_Destructors_RAII --> class["class"]
    Constructors_Destructors_RAII --> RAII["RAII"]
    Constructors_Destructors_RAII --> virtual["virtual"]
    Constructors_Destructors_RAII --> override["override"]
    style ROOT fill:#8b5cf6,color:#fff
    style A    fill:#3b82f6,color:#fff
```


---

## :material-memory: Quick Definitions Table

| Term | Meaning |
|------|---------|
| `class` | _class — key concept for Constructors Destructors RAII_ |
| `RAII` | _RAII — key concept for Constructors Destructors RAII_ |
| `virtual` | _virtual — key concept for Constructors Destructors RAII_ |
| `override` | _override — key concept for Constructors Destructors RAII_ |
| `unique_ptr` | _unique_ptr — key concept for Constructors Destructors RAII_ |


---

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)
