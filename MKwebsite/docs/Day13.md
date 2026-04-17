# Day 13: Move Semantics and Rvalue References

## Why This Day Matters

Before C++11, returning a `std::vector<int>` from a function meant a deep copy:
allocate new memory, copy every element, deallocate the old. For a vector with a
million elements, that is expensive.

Move semantics allow the ownership of resources to be *transferred* instead of
*copied*. A moved-from object is left in a valid but unspecified state; the
receiving object acquires the resources without any allocation.

C++11 achieves this through **rvalue references** — a new reference category that
binds only to temporaries and explicitly moved-from objects.

## Learning Outcomes

After completing this day you will be able to:

- Classify any C++ expression as lvalue, prvalue, or xvalue and explain the practical consequence of each category.
- Write a move constructor and move assignment operator for a resource-owning class and verify correctness with `static_assert(std::is_nothrow_move_constructible_v<T>)`.
- Explain what `std::move` does (and does not do) at runtime.
- Identify when NRVO applies and avoid the common mistake of `return std::move(x)`.
- Describe perfect forwarding and explain why forwarding references preserve the original value category.

## Key Concepts

- **lvalue** — an expression that refers to a persistent object; has a stable address; binds to `T&` and `const T&`.
- **rvalue / prvalue** — a temporary or computed value with no stable address; binds to `T&&` and `const T&`.
- **xvalue** — an expiring value produced by `std::move` or a function returning `T&&`; has an address but its resources may be transferred.
- **Rvalue reference** `T&&` — binds only to rvalues/xvalues; signals "I can steal this object's resources."
- **Move constructor** — transfers resources from a source object in O(1) time; leaves the source valid but empty.
- **Move assignment** — same transfer semantics for the assignment operator.
- **`std::move`** — a compile-time cast; converts an lvalue to an xvalue to enable move operations; does nothing at runtime by itself.
- **NRVO** — Named Return Value Optimisation; the compiler may construct a local return variable directly in the caller's frame, avoiding any copy or move.
- **`noexcept` on moves** — required for standard containers to use move during reallocation instead of falling back to copy.

## Theory

### Motivation

Move semantics allow the ownership of resources to be *transferred* instead of
*copied*. A moved-from object is left in a valid but unspecified state; the
receiving object acquires the resources without any allocation.

C++11 achieves this through **rvalue references** — a new reference category that
binds only to temporaries and explicitly moved-from objects.

### Value Categories — lvalue, rvalue, xvalue

Every expression in C++ has a **type** and a **value category**.

- **lvalue** (locator value) — an expression that refers to a persistent object in memory. You can take its address. Examples: named variables, dereferenced pointers, subscript expressions on arrays.

- **rvalue** (right-hand-side value) — an expression that does not refer to a persistent object. It is a temporary or a computed value. You cannot take its address in the usual sense. Examples: literals (`42`, `3.14`), function calls returning by value.

- **xvalue** (expiring value) — an rvalue that names an object whose resources can be moved. Produced by `std::move()`, `std::forward()`, or a function returning `T&&`.

```cpp
int x = 42;
int& lref   = x;       // lvalue reference — binds to x (an lvalue)
int&& rref  = 42;      // rvalue reference — binds to the temporary 42
int&& rref2 = std::move(x);  // xvalue — x is about to be moved from

// &x is valid (lvalue has an address)
// &42 is NOT valid (rvalue does not)
```

Value categories hierarchy:

```
Expressions
├── glvalue (has identity — can be referred to)
│     ├── lvalue  (persistent object: named variable, *ptr, a[i])
│     └── xvalue  (expiring: std::move(x), function returning T&&)
└── rvalue  (no persistent identity)
      ├── prvalue (pure rvalue: 42, true, "hi", f() returning T)
      └── xvalue  (shared with glvalue — "moved-from" objects)
```

### Rvalue References

An rvalue reference `T&&` binds to rvalues (including xvalues) but not to lvalues.
It signals "this object can be pillaged — it won't be needed again."

```cpp
void sink(std::string&&  s) { /* can steal s's buffer */ }
void keep(const std::string& s) { /* read-only, binds to anything */ }

std::string name = "Alice";
keep(name);            // OK: lvalue binds to const&
sink(std::move(name)); // OK: xvalue binds to &&; name is now valid but empty
// sink(name);         // ERROR: lvalue does NOT bind to &&
```

### Move Constructor and Move Assignment

The **move constructor** transfers resources from a source object, leaving the source
valid but empty. The **move assignment operator** does the same for assignment.

```cpp
#include <cstring>
#include <algorithm>
#include <utility>
#include <iostream>

class Buffer {
    char*       data_{nullptr};
    std::size_t size_{0};
public:
    // Regular constructor
    explicit Buffer(std::size_t n)
        : data_(new char[n]()), size_(n) {}

    // Copy constructor — deep copy
    Buffer(const Buffer& other)
        : data_(new char[other.size_]), size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
        std::cout << "copy\n";
    }

    // Move constructor — steal resources; O(1)
    Buffer(Buffer&& other) noexcept
        : data_(std::exchange(other.data_, nullptr))
        , size_(std::exchange(other.size_, 0)) {
        std::cout << "move\n";
    }

    // Move assignment operator
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = std::exchange(other.data_, nullptr);
            size_ = std::exchange(other.size_, 0);
        }
        return *this;
    }

    ~Buffer() { delete[] data_; }

    std::size_t size() const { return size_; }
};

Buffer a{1024};
Buffer b = std::move(a);   // move constructor called — "move" printed
// a.data_ is now nullptr; b.data_ owns the 1024-byte allocation
```

**Key invariants**:

- After a move, the moved-from object must be in a *valid but unspecified* state.
- Destructors must work on moved-from objects.
- Mark move operations `noexcept` — the standard library uses them only when `noexcept`.

### `std::move` Semantics

`std::move` does **not** move anything. It is a cast that converts an lvalue to
an xvalue, allowing move operations to be selected.

```cpp
#include <utility>

// std::move is essentially:
template <typename T>
constexpr std::remove_reference_t<T>&& move(T&& t) noexcept {
    return static_cast<std::remove_reference_t<T>&&>(t);
}

std::string s = "hello";
std::string t = std::move(s);  // move constructor called
// After: t == "hello", s is valid but empty (or unspecified content)

// After std::move, do not use s for its value!
// It is safe to assign to s or destroy it.
```

**When to use** `std::move`:

- When passing a local variable to a function/constructor for the last time.
- When returning a named local from a function (though NRVO may handle this).
- When inserting into a container: `v.push_back(std::move(local_string))`.

### Perfect Forwarding — Preview

A **forwarding reference** (also called a universal reference) `T&&` in a template
context binds to both lvalues and rvalues. Combined with `std::forward<T>`, it
forwards the argument with its original value category preserved.

```cpp
#include <utility>
#include <memory>

// factory: forwards all arguments to T's constructor
template <typename T, typename... Args>
std::unique_ptr<T> make(Args&&... args) {
    return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
}

// std::forward preserves value category:
// - lvalue argument → forwarded as lvalue (copy)
// - rvalue argument → forwarded as rvalue (move)

auto p = make<std::string>(5, 'x');  // constructs std::string(5, 'x')
```

### NRVO and RVO — Named and Unnamed Return Value Optimisation

The compiler is allowed (and in C++17, sometimes required) to construct a returned
object directly in the caller's stack frame, eliding the copy or move entirely.

```cpp
std::string make_greeting(const std::string& name) {
    std::string result = "Hello, " + name;
    return result;  // NRVO: result is constructed in-place in caller's frame
    // No copy or move — the Buffer example above would print nothing here
}

std::string greet = make_greeting("Alice");  // Zero copies
```

**RVO** (unnamed): returning a temporary.
**NRVO** (named): returning a named local variable.

- In C++17, RVO (`return T{...}`) is *guaranteed* copy elision (mandatory).
- NRVO is a permitted but not guaranteed optimisation.
- Do **not** write `return std::move(local)` — it defeats NRVO.

```cpp
std::string bad_return(const std::string& s) {
    std::string result = s + " world";
    return std::move(result);  // BAD: prevents NRVO; forces a move instead
}

std::string good_return(const std::string& s) {
    std::string result = s + " world";
    return result;  // GOOD: NRVO can kick in; compiler chooses best strategy
}
```

## Pitfalls

### Pitfall 1: Using a Moved-From Object

**Description**: After calling `std::move` on a variable and passing it to a
function, the variable's value is indeterminate. Reading from it is a logical
error (and may be UB for some types).

**BAD**

```cpp
#include <string>
#include <vector>
#include <iostream>

std::string name = "Alice";
std::vector<std::string> names;
names.push_back(std::move(name));   // name is now valid but empty (or unspecified)

std::cout << name.size() << '\n';   // BAD: reads moved-from object
if (name == "Alice")                // BAD: comparing moved-from — likely false
    do_something();
```

**GOOD**

```cpp
std::string name = "Alice";
names.push_back(std::move(name));
// name is now "spent" — either reassign it or let it go out of scope
name = "Bob";                       // safe: reassignment restores a known state
std::cout << name << '\n';          // "Bob" — now well-defined
```

**Detection tip**: Clang-tidy check `bugprone-use-after-move` flags reads of
moved-from variables.

### Pitfall 2: `return std::move(local)` — Defeating NRVO

**Description**: Wrapping the return value in `std::move` seems like an
optimisation but actually prevents the compiler from applying NRVO, which would
eliminate the move entirely.

**BAD**

```cpp
std::vector<int> build_data() {
    std::vector<int> result;
    result.reserve(1000);
    for (int i = 0; i < 1000; ++i) result.push_back(i);
    return std::move(result);  // BAD: prevents NRVO, forces a move
}
```

**GOOD**

```cpp
std::vector<int> build_data() {
    std::vector<int> result;
    result.reserve(1000);
    for (int i = 0; i < 1000; ++i) result.push_back(i);
    return result;   // GOOD: NRVO applies; zero copies, zero moves
}
```

**Detection tip**: Clang-tidy `performance-move-const-arg` and
`performance-no-automatic-move` warn about redundant `std::move` in return statements.

### Pitfall 3: Move Constructor Not Marked `noexcept` — Silent Performance Loss

**Description**: Forgetting `noexcept` on a move constructor causes `std::vector`
(and other standard containers) to use the copy constructor instead of the move
constructor during reallocation.

**BAD**

```cpp
class BigData {
    std::vector<double> payload_;
public:
    BigData(std::vector<double> p) : payload_(std::move(p)) {}

    // Move constructor WITHOUT noexcept
    BigData(BigData&& other)   // missing noexcept!
        : payload_(std::move(other.payload_)) {}
};

std::vector<BigData> v;
v.reserve(1);
v.push_back(BigData{std::vector<double>(1000)});  // move used (capacity not exceeded)
v.push_back(BigData{std::vector<double>(1000)});  // reallocation: COPY not MOVE!
// 1000 doubles copied unnecessarily because move is not noexcept
```

**GOOD**

```cpp
BigData(BigData&& other) noexcept
    : payload_(std::move(other.payload_)) {}

// Verify at compile time:
static_assert(std::is_nothrow_move_constructible_v<BigData>);
```

**Detection tip**: Always `static_assert(std::is_nothrow_move_constructible_v<T>)`
for types stored in standard containers. Use `= default` for move operations when
possible — the compiler marks them `noexcept` automatically when all members are.

### Pitfall 4: Moving a `const` Object — Silent Copy

**Description**: Calling `std::move` on a `const` object has no effect — the move
constructor cannot bind to a `const&&`, so the copy constructor is silently selected.

**BAD**

```cpp
const std::string s = "large string data";
std::string t = std::move(s);  // looks like a move...
// std::move casts s to const std::string&&
// Move constructor expects std::string&&  (non-const)
// The const&& does NOT match; copy constructor is called instead!
// s is unchanged; t is a copy.
```

**GOOD**

```cpp
// If you need to move, the source must be non-const
std::string s = "large string data";   // not const
std::string t = std::move(s);          // genuine move — s is emptied

// If you genuinely have a const and want to "move", you must copy:
const std::string source = get_value();
std::string copy = source;             // explicit copy — honest about the cost
```

**Detection tip**: Clang-tidy `performance-move-const-arg` warns when `std::move`
is applied to a const variable, since it will always produce a copy.

### Pitfall 5: Rvalue Reference Parameter Is an Lvalue Inside the Function

**Description**: Inside a function that takes an rvalue reference parameter, the
parameter itself is an lvalue (it has a name and an address). Forgetting to
`std::move` it when passing it further results in a copy.

**BAD**

```cpp
void store(std::string&& data) {
    database_.push_back(data);  // BAD: data is an lvalue here — COPY!
}

store(std::string{"expensive large string"});  // caller moves, function copies
```

**GOOD**

```cpp
void store(std::string&& data) {
    database_.push_back(std::move(data));  // explicit re-move into push_back
}

// Even better: take by value (caller decides move vs copy at the call site)
void store_v2(std::string data) {
    database_.push_back(std::move(data));
}

store_v2(std::string{"expensive"});  // move into parameter, then move into vector
store_v2(existing_string);           // copy into parameter, then move into vector
```

**Detection tip**: When you see a `&&` parameter and no `std::move` inside the
body, it is almost certainly missing. Exception: `std::forward` for forwarding references.

## Code Example

```cpp
#include <iostream>
#include <utility>
#include <vector>

class Buffer {
  public:
    explicit Buffer(std::size_t n) : data_(n, 0) {}
    Buffer(Buffer&& other) noexcept : data_(std::move(other.data_)) {}
    Buffer& operator=(Buffer&& other) noexcept {
        data_ = std::move(other.data_);
        return *this;
    }

    std::size_t size() const { return data_.size(); }

  private:
    std::vector<int> data_;
};

int main() {
    Buffer a{1024};
    Buffer b{1};
    b = std::move(a);
    std::cout << "Day 13 - Move Semantics and Rvalue Refs\n";
    std::cout << "Moved buffer size: " << b.size() << "\n";
    return 0;
}
```
