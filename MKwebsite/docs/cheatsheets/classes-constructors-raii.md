# Classes, Constructors, and RAII

Class layout, construction mechanics, member initialization order, RAII
idiom, and const-correctness for Modern C++ (C++11/14/17/20).

---

## Class Layout and Memory

Member order in the class definition determines layout (with padding).

```cpp
// BAD layout — excessive padding
struct Wasteful {
    char   a;      // 1 byte
    // 7 bytes padding
    double b;      // 8 bytes
    char   c;      // 1 byte
    // 7 bytes padding
};                 // sizeof = 24

// GOOD layout — sorted largest-first
struct Packed {
    double b;      // 8 bytes
    char   a;      // 1 byte
    char   c;      // 1 byte
    // 6 bytes padding (alignment to 8)
};                 // sizeof = 16

// alignas — explicit alignment control
struct alignas(64) CacheAligned {
    int data[16];  // occupies one cache line
};

// offsetof — inspect member offset (only for standard-layout types)
#include <cstddef>
static_assert(offsetof(Packed, b) == 0);
```

---

## Member Initialization List — Order Rules

Members are initialized in **declaration order**, not init-list order.

```cpp
class Buffer {
    std::size_t capacity_;  // declared first
    int*        data_;      // declared second
public:
    // WRONG — init list order != declaration order: data_ init uses
    // capacity_ before it is initialized (UB)
    Buffer(std::size_t cap)
        : data_(new int[capacity_])   // capacity_ not yet initialized!
        , capacity_(cap)
    {}

    // CORRECT — match init list order to declaration order
    Buffer(std::size_t cap)
        : capacity_(cap)
        , data_(new int[capacity_])   // capacity_ is valid here
    {}
};
```

Rules for initializing members:

```cpp
class Example {
    const int  id_;      // const — MUST be in init list
    int&       ref_;     // reference — MUST be in init list
    std::string name_;   // class type — init list preferred (avoids default+assign)
    int        count_{}; // NSDMI — default member initializer (C++11)
public:
    Example(int id, int& r, std::string n)
        : id_(id)
        , ref_(r)
        , name_(std::move(n))
        // count_ gets 0 from NSDMI unless overridden here
    {}
};
```

---

## Delegating Constructors

One constructor calls another in the same class to avoid code duplication.

```cpp
class Connection {
    std::string host_;
    uint16_t    port_;
    bool        tls_;

    void init_socket() { /* common setup */ }
public:
    // Primary constructor — does all the work
    Connection(std::string host, uint16_t port, bool tls)
        : host_(std::move(host)), port_(port), tls_(tls)
    { init_socket(); }

    // Delegating constructors — call the primary
    Connection(std::string host, uint16_t port)
        : Connection(std::move(host), port, /*tls=*/true) {}

    Connection(std::string host)
        : Connection(std::move(host), 443) {}
};
```

Note: once a constructor delegates, **its own member init list ends**. You
cannot mix delegation and member initialization in the same constructor.

---

## Converting Constructors and explicit

Any constructor callable with a single argument is a *converting constructor*
and enables implicit conversion unless marked `explicit`.

```cpp
class Radius {
public:
    Radius(double r) : r_(r) {}   // implicit: double -> Radius
    explicit Radius(std::string s);  // must be written explicitly

private:
    double r_;
};

void draw_circle(Radius r);

draw_circle(5.0);         // OK — implicit Radius(5.0) — often surprising!
draw_circle(Radius{5.0}); // BETTER — explicit at call site

// With explicit — no implicit conversion
class SafeRadius {
public:
    explicit SafeRadius(double r) : r_(r) {}
private: double r_;
};

void draw(SafeRadius r);
// draw(5.0);            // ERROR — good, forces clear intent
draw(SafeRadius{5.0});   // OK

// explicit(bool) — C++20 conditional explicitness
template<typename T>
class Optional {
    explicit(!std::is_convertible_v<T, int>) Optional(T val);
};
```

---

## Aggregate Initialization

An *aggregate* has no user-provided constructors, no private/protected
non-static data members, no virtual functions, no base classes (C++17: public
base allowed if it is also an aggregate).

```cpp
struct Point { int x; int y; };
Point p{3, 4};        // aggregate init — no constructor needed
Point q = {3, 4};     // same
Point r{.x=3, .y=4};  // designated initializers (C++20) — preferred

struct Config {
    std::string host = "localhost";  // NSDMI allowed in aggregates (C++14)
    uint16_t    port = 8080;
    bool        tls  = false;
};

Config c1{};                     // all NSDMIs
Config c2{"prod.example.com"};   // host overridden, others default
Config c3{.host="prod.example.com", .tls=true};  // C++20 designated

// Aggregates cannot have user-declared constructors
struct NotAggregate {
    int x;
    NotAggregate(int v) : x(v) {}  // user-declared => not an aggregate
};
// NotAggregate n{5};  // calls constructor, not aggregate init
```

---

## RAII Pattern — Resource Acquisition Is Initialization

Tie resource lifetime to object lifetime. Destructor releases unconditionally.

```cpp
// RAII file handle
class ScopedFile {
    FILE* fp_;
public:
    explicit ScopedFile(const char* path, const char* mode)
        : fp_(std::fopen(path, mode))
    {
        if (!fp_) throw std::runtime_error{"Cannot open file"};
    }
    ~ScopedFile() {
        if (fp_) std::fclose(fp_);  // always called, even on exception
    }
    // Non-copyable — resource is unique
    ScopedFile(const ScopedFile&)            = delete;
    ScopedFile& operator=(const ScopedFile&) = delete;
    // Movable
    ScopedFile(ScopedFile&& o) noexcept : fp_(o.fp_) { o.fp_ = nullptr; }
    ScopedFile& operator=(ScopedFile&& o) noexcept {
        if (this != &o) { if (fp_) std::fclose(fp_); fp_ = o.fp_; o.fp_ = nullptr; }
        return *this;
    }
    FILE* get() const noexcept { return fp_; }
};

// RAII mutex lock
class ScopedLock {
    std::mutex& mtx_;
public:
    explicit ScopedLock(std::mutex& m) : mtx_(m) { mtx_.lock(); }
    ~ScopedLock() { mtx_.unlock(); }
    ScopedLock(const ScopedLock&)            = delete;
    ScopedLock& operator=(const ScopedLock&) = delete;
};

// Usage — resources released automatically, even on exception
void process_file(const char* path) {
    ScopedFile f{path, "r"};
    // ... use f.get() ...
}  // f.~ScopedFile() called here
```

RAII comparison:

| Manual resource management | RAII with custom class | RAII with stdlib |
| --- | --- | --- |
| `FILE* f = fopen(...)` `fclose(f)` (forget?) | `ScopedFile f{...}` auto-closed in destructor | (no stdlib equiv.) |
| `new T` `delete p` (forget?) | custom RAII wrapper | `std::unique_ptr` |
| `mtx.lock()` `mtx.unlock()` (forget?) | `ScopedLock lk{mtx}` auto-unlocked | `std::lock_guard` |

---

## Destructor Guarantees

```cpp
class Resource {
public:
    // Destructors must never throw — mark noexcept
    // If an exception is thrown from a destructor during stack unwinding,
    // std::terminate() is called immediately
    ~Resource() noexcept {
        try {
            cleanup();  // wrap any potentially-throwing ops
        } catch (...) {
            // log, but do not propagate
        }
    }
private:
    void cleanup();
};

// virtual destructor is required if the class has virtual functions
// OR if it is designed to be used as a polymorphic base
class Base {
public:
    virtual ~Base() = default;  // virtual, defaulted
    virtual void process() = 0;
};

// Deleting through a Base* without virtual destructor = UB
Base* b = new Derived{};
delete b;  // OK only if Base has virtual destructor
```

---

## Member Function const Overloading

Provide both `const` and non-`const` versions to enable use in both
read-only and mutable contexts.

```cpp
class Buffer {
    std::vector<uint8_t> data_;
public:
    // Non-const — returns mutable reference
          uint8_t& operator[](std::size_t i)       { return data_[i]; }
    // Const — returns read-only reference
    const uint8_t& operator[](std::size_t i) const { return data_[i]; }

    // Non-const accessor
          std::vector<uint8_t>& raw()       { return data_; }
    // Const accessor
    const std::vector<uint8_t>& raw() const { return data_; }
};

void read(const Buffer& b) {
    const uint8_t& byte = b[0];  // calls const overload
}
void modify(Buffer& b) {
    b[0] = 0xFF;  // calls non-const overload
}

// Avoid code duplication via const_cast pattern (advanced)
const uint8_t& Buffer::operator[](std::size_t i) const {
    return data_[i];
}
uint8_t& Buffer::operator[](std::size_t i) {
    return const_cast<uint8_t&>(
        static_cast<const Buffer&>(*this)[i]  // call const version
    );
}
```

---

## Common Pitfalls

**Using member before it's initialized (init list order):**

```cpp
// BAD — declaration order: size_ then buf_; but init list uses buf_ first
class Vec {
    int* buf_;
    int  size_;
public:
    Vec(int n) : buf_(new int[size_]), size_(n) {}  // UB: size_ uninitialized
};

// GOOD — match declaration order in init list
class Vec {
    int  size_;  // declared first
    int* buf_;
public:
    Vec(int n) : size_(n), buf_(new int[size_]) {}  // size_ ready
};
```

**Implicit conversion through single-argument constructors:**

```cpp
// BAD — silently converts int to MyString
class MyString { public: MyString(int len); };
void render(MyString s);
render(42);   // surprise: constructs MyString(42) silently

// GOOD — explicit blocks implicit conversion
class MyString { public: explicit MyString(int len); };
// render(42);  // ERROR — caught at compile time
```

**RAII broken by exception in constructor body before all members initialized:**

```cpp
// BAD — raw pointer never deleted if second allocation throws
class Pair {
    int* a_; int* b_;
public:
    Pair() : a_(new int{1}), b_(new int{2}) {}
    ~Pair() { delete a_; delete b_; }
};

// GOOD — use unique_ptr so automatic cleanup happens even on throw
class Pair {
    std::unique_ptr<int> a_, b_;
public:
    Pair() : a_(std::make_unique<int>(1)), b_(std::make_unique<int>(2)) {}
};
```

---

## Review Checklist

* Is the member declaration order in the class consistent with the init list order?
* Are all `const` and reference members initialized in the init list (not the body)?
* Are single-argument constructors marked `explicit` unless implicit conversion is desired?
* Does every RAII class delete its copy constructor/assignment (or implement them properly)?
* Is the destructor marked `noexcept` and protected against throwing?
* If the class is a polymorphic base, does it have a `virtual` destructor?
* Are both `const` and non-`const` overloads of accessors provided where mutation is needed?
* Do delegating constructors avoid re-initializing members after delegation?
* Are aggregates used (with designated initializers) instead of constructors for POD-like types?
* Is RAII applied to every resource (file, socket, lock, allocation) rather than manual cleanup?

## Related Concepts

* `cheatsheets/rule-of-5-cheat.rst` — copy/move constructor generation rules
* `cheatsheets/raii-smart-pointers.rst` — smart pointers as RAII wrappers
* `cheatsheets/inheritance-polymorphism.rst` — virtual destructors in base classes
* `cheatsheets/move-semantics-gotchas.rst` — move constructors and move assignment
* `cheatsheets/uniform-initialization.rst` — brace init edge cases
