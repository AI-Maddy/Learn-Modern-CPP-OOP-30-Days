---
title: "Common Pitfalls"
tags: ["cheatsheet", "reference"]
---

# :material-book: Common Pitfalls


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Common C++ OOP Pitfalls

<div class="contents" local="" depth="2">

Sections

</div>

Each pitfall includes: name, bad code, problem explanation, and fixed code.

------------------------------------------------------------------------

## Pitfall 1: Missing Virtual Destructor

``` cpp
// BAD
struct Base {
    virtual void run() {}
    // NO virtual destructor
};
struct Derived : Base { std::vector<int> data; };

Base* p = new Derived{};
delete p;   // UB: ~Derived never called; data vector leaks

// GOOD
struct Base {
    virtual void run() {}
    virtual ~Base() = default;   // destructor is virtual
};
```

**Rule**: Any class with at least one virtual function needs a virtual destructor.

------------------------------------------------------------------------

## Pitfall 2: Object Slicing

``` cpp
// BAD
void process(Shape shape) {        // takes by value
    shape.area();
}
Circle c{5.0};
process(c);    // c is sliced to Shape — Circle part is discarded

// GOOD: pass by pointer or reference
void process(const Shape& shape) { shape.area(); }
void process(Shape* shape)       { shape->area(); }

// Also bad: storing derived in a container of bases
std::vector<Shape> shapes;
shapes.push_back(Circle{5});   // sliced to Shape

// GOOD: store pointers
std::vector<std::unique_ptr<Shape>> shapes;
shapes.push_back(std::make_unique<Circle>(5));
```

------------------------------------------------------------------------

## Pitfall 3: Raw new/delete in Application Code

``` cpp
// BAD: exception between new and delete leaks memory
Widget* w = new Widget{};
do_something_that_might_throw();   // if this throws, w leaks
delete w;

// GOOD: RAII via smart pointer
auto w = std::make_unique<Widget>();
do_something_that_might_throw();   // w destroyed automatically
```

------------------------------------------------------------------------

## Pitfall 4: Signed/Unsigned Comparison

``` cpp
// BAD: mixing signed and unsigned in comparison
int index = get_index();
if (index < v.size()) {   // WARNING: signed/unsigned mismatch
    // if index == -1, this comparison wraps to a huge unsigned value!
    v[index];             // potential OOB access
}

// GOOD: compare correctly
if (index >= 0 && static_cast<std::size_t>(index) < v.size()) { ... }

// Or use std::ssize (C++20) to get signed size:
if (index < std::ssize(v)) { ... }
```

------------------------------------------------------------------------

## Pitfall 5: Using a Moved-From Object

``` cpp
// BAD
std::string s = "hello";
auto t = std::move(s);
std::cout << s.length();   // UB: s is in a valid but unspecified state
s.push_back('x');          // also problematic without re-assignment

// GOOD: either don't use after move, or explicitly reassign
std::string s = "hello";
auto t = std::move(s);
s = "new value";           // OK: s re-initialised; now valid
std::cout << s.length();   // safe
```

------------------------------------------------------------------------

## Pitfall 6: Dangling Reference from Temporary

``` cpp
// BAD: reference binds to a temporary that is immediately destroyed
const std::string& name = get_name();   // get_name returns by value
// name may dangle if get_name() returns a local std::string

// Wait — const& CAN extend the lifetime of a direct temporary:
const std::string& ok = std::string{"hello"};  // lifetime extended to ok

// BUT NOT through a function call return value in all cases:
auto& bad = *std::make_unique<int>(5);   // unique_ptr destroyed; bad dangles

// GOOD: store by value
std::string name = get_name();

// Also BAD: returning reference to local variable
const int& get_max(int a, int b) {
    int m = (a > b) ? a : b;
    return m;    // ERROR: m is a local variable
}
```

------------------------------------------------------------------------

## Pitfall 7: Implicit Conversion Bugs

``` cpp
// BAD: single-argument constructor enables implicit conversion
class Duration {
public:
    Duration(int seconds) : sec_(seconds) {}  // implicit!
    int sec_;
};

void sleep_for(Duration d) { /* ... */ }
sleep_for(5);    // silently constructs Duration{5} — is 5 seconds or ms?

// GOOD: mark single-argument constructors explicit
class Duration {
public:
    explicit Duration(int seconds) : sec_(seconds) {}
};
// sleep_for(5);              // ERROR: no implicit conversion
sleep_for(Duration{5});       // GOOD: explicit and readable
```

------------------------------------------------------------------------

## Pitfall 8: Include-Order Dependencies

``` cpp
// BAD: file_a.h must be included before file_b.h
// file_b.h relies on a type declared in file_a.h but doesn't include it

// In main.cpp:
#include "file_a.h"   // accidentally declares Foo
#include "file_b.h"   // silently depends on Foo from file_a.h
// If order changes, or file_a.h removed → compile error

// GOOD: every header is self-contained
// file_b.h should have:
#include "file_a.h"   // declares Foo explicitly

// Also GOOD: include guards or #pragma once in every header
// Use include-what-you-use tool to detect missing includes
```

------------------------------------------------------------------------

## Pitfall 9: Forgetting to Initialize Members

``` cpp
// BAD: members with indeterminate values
struct Sensor {
    int id;
    double value;
    bool active;
    Sensor(int i) : id(i) {}   // value and active not initialized!
};

Sensor s{1};
if (s.active) { /* reads garbage */ }

// GOOD: in-class default initializers
struct Sensor {
    int    id     = 0;
    double value  = 0.0;
    bool   active = false;
    explicit Sensor(int i) : id(i) {}   // value and active use defaults
};
```

------------------------------------------------------------------------

## Pitfall 10: Capturing this in a Lambda that Outlives the Object

``` cpp
// BAD: lambda captures this; object may be destroyed before lambda runs
class Timer {
public:
    void start() {
        schedule_after(1s, [this]{ on_tick(); });  // 'this' may dangle!
    }
};

auto* t = new Timer{};
t->start();
delete t;   // t destroyed; scheduled lambda will access dead object

// GOOD: capture a shared_ptr or copy necessary data
class Timer : public std::enable_shared_from_this<Timer> {
public:
    void start() {
        auto self = shared_from_this();
        schedule_after(1s, [self]{ self->on_tick(); });
    }
};
```

------------------------------------------------------------------------

## Pitfall 11: std::vector Iterator Invalidation

``` cpp
// BAD: push_back may reallocate, invalidating existing iterators
std::vector<int> v{1, 2, 3};
auto it = v.begin();
v.push_back(4);   // possible reallocation!
std::cout << *it; // UB: it may be dangling

// GOOD: use index instead of iterator if you need to modify
std::size_t idx = 0;
v.push_back(4);
std::cout << v[idx];  // safe

// Or: reserve first so no reallocation occurs
v.reserve(10);
auto it2 = v.begin();
v.push_back(4);   // safe: no reallocation if size <= capacity
```

------------------------------------------------------------------------

## Pitfall 12: Incorrect Exception Safety in Constructors

``` cpp
// BAD: resource leak if second allocation throws
class Widget {
    int* data1_;
    int* data2_;
public:
    Widget() {
        data1_ = new int[100];    // succeeds
        data2_ = new int[200];    // throws std::bad_alloc
        // data1_ leaks! destructor is NOT called for partially-constructed objects
    }
    ~Widget() { delete[] data1_; delete[] data2_; }
};

// GOOD: use RAII members so partial construction auto-cleans
class Widget {
    std::unique_ptr<int[]> data1_;
    std::unique_ptr<int[]> data2_;
public:
    Widget()
        : data1_(std::make_unique<int[]>(100))
        , data2_(std::make_unique<int[]>(200)) {}
    // If data2_ ctor throws, data1_ is destroyed automatically
};
```

------------------------------------------------------------------------

## Pitfall 13: Overloading vs Overriding

``` cpp
// BAD: hiding a base function with a different signature
struct Base {
    virtual void draw(int x, int y) {}
};

struct Derived : Base {
    void draw(int x) {}  // different signature — hides, not overrides!
    // Base::draw(int,int) is NOT overridden
};

// Calling via Base* will use Base::draw, not Derived::draw
Base* p = new Derived{};
p->draw(1, 2);   // calls Base::draw, never Derived::draw

// GOOD: use override keyword — compiler catches signature mismatch
struct Derived : Base {
    void draw(int x, int y) override {}  // correct signature
};
```

------------------------------------------------------------------------

## Pitfall 14: Self-Assignment in Copy Operator

``` cpp
// BAD: self-assignment corrupts state
Buffer& operator=(const Buffer& other) {
    delete[] data_;        // frees data_
    data_ = new int[other.size_];
    std::copy(other.data_, other.data_ + other.size_, data_);
    // If this == &other: other.data_ is the same as (now-freed) data_!
    return *this;
}

// GOOD: copy-and-swap idiom
Buffer& operator=(Buffer other) {   // pass by value — calls copy ctor
    swap(*this, other);
    return *this;
}
```

------------------------------------------------------------------------

## Pitfall 15: std::string_view Dangling

``` cpp
// BAD: string_view pointing to a temporary string
std::string_view get_view() {
    std::string s = "hello";
    return s;          // s is destroyed; view dangles
}

// BAD: string_view to a concatenation result
std::string_view sv = std::string("a") + "b";  // temporary destroyed

// GOOD: string_view from a stable owner
const std::string owner = "hello";
std::string_view view = owner;   // safe: view valid as long as owner is
```

------------------------------------------------------------------------

## Pitfall 16: Multiple Definitions Across TUs

``` cpp
// BAD: non-inline definition in a header included by multiple TUs
// myutils.h
void utility() { /* ... */ }   // defined in header!
// Each TU that includes myutils.h gets its own definition → ODR violation

// GOOD: declare in header, define in .cpp
// myutils.h
void utility();   // declaration

// myutils.cpp
void utility() { /* ... */ }   // single definition

// OR: inline in header
inline void utility() { /* ... */ }
```

------------------------------------------------------------------------

## Pitfall 17: Incorrect use of std::enable_if (C++17 and earlier)

``` cpp
// BAD: enable_if on return type creates ambiguous overloads
template <typename T>
std::enable_if_t<std::is_integral_v<T>, void> process(T x);

template <typename T>
std::enable_if_t<!std::is_integral_v<T>, void> process(T x);
// Hard to read, error messages are unintelligible

// GOOD (C++20): use concepts instead
template <std::integral T>     void process(T x);
template <std::floating_point T> void process(T x);
```

------------------------------------------------------------------------

## Pitfall 18: Wrong Return Type for Prefix vs Postfix Increment

``` cpp
// BAD: postfix returns reference (should return by value)
struct Counter {
    int n = 0;
    Counter& operator++(int) { return *this; }  // wrong!
};

// GOOD: prefix returns reference, postfix returns value
struct Counter {
    int n = 0;
    Counter& operator++()    { ++n; return *this; }  // prefix: ++c
    Counter  operator++(int) { Counter old = *this; ++n; return old; } // postfix: c++
};
```

------------------------------------------------------------------------

## Pitfall 19: Using assert() in Release Builds

``` cpp
// BAD: NDEBUG disables assert in release — important check silently gone
void divide(int a, int b) {
    assert(b != 0);   // compiled out with -DNDEBUG!
    return a / b;
}

// GOOD: use static_assert for compile-time, throw/expected for runtime
void divide(int a, int b) {
    if (b == 0) throw std::invalid_argument("division by zero");
    return a / b;
}

// Or define a always-active assertion:
#define ENSURE(cond, msg) \
    do { if (!(cond)) throw std::logic_error(msg); } while(0)
```

------------------------------------------------------------------------

## Pitfall 20: Forgetting noexcept on Move Operations

``` cpp
// BAD: move ctor not noexcept — std::vector uses copy instead of move!
class BigBuffer {
public:
    BigBuffer(BigBuffer&& other) { /* not marked noexcept */ }
};

std::vector<BigBuffer> v;
v.push_back(BigBuffer{});   // vector may COPY instead of MOVE on realloc
// Copying is O(n) for each reallocation — O(n²) total!

// GOOD: always mark move operations noexcept
class BigBuffer {
public:
    BigBuffer(BigBuffer&& other) noexcept { /* ... */ }
    BigBuffer& operator=(BigBuffer&& other) noexcept { /* ... */ }
};
```

## Cross-References

- `cpp-core-guidelines.rst` — guideline rules behind each pitfall
- `debugging-tools-2026.rst` — sanitizers that detect many of these bugs
- `catch2-testing.rst` — write regression tests for each pitfall you encounter
- `memory-layout-and-object-model.rst` — pitfall 2 (slicing) and layout bugs


---

[← All Cheatsheets](index.md)
