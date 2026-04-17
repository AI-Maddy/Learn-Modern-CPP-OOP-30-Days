# Day 14: Rule of Five, Copy and Move

## Why This Day Matters

Every class that manages a resource — raw memory, a file handle, a network socket,
a mutex — must answer six questions about object lifetime:

1. How is the resource created? (constructor)
2. How is the resource released? (destructor)
3. What happens when the object is copied? (copy constructor)
4. What happens when the object is copy-assigned? (copy assignment operator)
5. What happens when the object is moved? (move constructor)
6. What happens when the object is move-assigned? (move assignment operator)

Answering these questions correctly and consistently is what the **Rule of Five**
(and its modern companion the **Rule of Zero**) is about.

## Learning Outcomes

After completing this day you will be able to:

- Apply the Rule of Zero — identify classes that need no special members and let the compiler generate all five correctly.
- Implement all five special members for a resource-owning class using the copy-and-swap idiom for exception-safe assignment.
- Use `= default` and `= delete` correctly to express intent and prevent accidental copies or moves.
- Identify the three levels of exception safety (nothrow, strong, basic) and implement copy-and-swap to achieve the strong guarantee for assignment.
- Explain why a user-defined destructor suppresses the implicit move operations and how to re-enable them safely.

## Key Concepts

- **Rule of Zero** — classes that use RAII member types (smart pointers, containers) need no hand-written special members; the compiler composes them correctly.
- **Rule of Five** — if you define any one of {destructor, copy ctor, copy assign, move ctor, move assign}, explicitly handle all five.
- **Copy constructor** — creates a new object as a deep copy of an existing one; should leave the source unchanged.
- **Copy assignment** — replaces a live object's state with a deep copy; must handle self-assignment and provide exception safety.
- **Move constructor** — transfers resources from a source object in O(1); source left valid but empty; must be `noexcept`.
- **Move assignment** — same transfer semantics; must guard against self-assignment.
- **`= default`** — explicitly requests the compiler-generated version; enables trivial-copy and `noexcept` propagation.
- **`= delete`** — prevents an operation at compile time; preferred over `private`.
- **Copy-and-swap idiom** — implement copy assignment by constructing a copy as a parameter, then swapping; achieves the strong exception guarantee automatically.
- **Exception safety levels** — nothrow (never throws), strong (rollback on throw), basic (valid state after throw), no-guarantee (avoid).

## Theory

### Rule of Zero

The best rule: **if a class does not directly manage a resource, define none of
the five special members**. Let the compiler generate them all.

```cpp
#include <string>
#include <vector>

// No raw pointers, no handles — all members are themselves Rule-of-Zero types
class Person {
    std::string           name_;
    int                   age_{0};
    std::vector<std::string> hobbies_;
public:
    explicit Person(std::string name, int age)
        : name_(std::move(name)), age_(age) {}

    // No destructor, no copy ctor, no copy assign, no move ctor, no move assign
    // The compiler generates all five correctly from the members' operations.
};

Person a{"Alice", 30};
Person b = a;             // deep copy of string and vector — correct
Person c = std::move(a);  // move of string and vector — correct, no allocation
```

### Rule of Five

**If you define (or `=delete`) any one of the five special members, you must
explicitly handle all five** — because the compiler's implicit generation rules
become unreliable once you intervene.

The five special members:

1. Destructor
2. Copy constructor
3. Copy assignment operator
4. Move constructor
5. Move assignment operator

```cpp
#include <cstring>
#include <stdexcept>
#include <utility>

class String {
    char*       data_{nullptr};
    std::size_t len_{0};

    static char* allocate_copy(const char* src, std::size_t n) {
        char* p = new char[n + 1];
        std::memcpy(p, src, n + 1);
        return p;
    }

public:
    // 1. Constructor
    explicit String(const char* s = "")
        : data_(allocate_copy(s, std::strlen(s)))
        , len_(std::strlen(s)) {}

    // 2. Destructor
    ~String() { delete[] data_; }

    // 3. Copy constructor — deep copy
    String(const String& other)
        : data_(allocate_copy(other.data_, other.len_))
        , len_(other.len_) {}

    // 4. Copy assignment operator — copy-and-swap idiom
    String& operator=(String other) {   // pass by value = copy already made
        swap(*this, other);
        return *this;
    }

    // 5. Move constructor — steal resources, O(1)
    String(String&& other) noexcept
        : data_(std::exchange(other.data_, nullptr))
        , len_(std::exchange(other.len_, 0)) {}

    // 6. Move assignment — handled by copy assignment above (pass-by-value)
    //    or explicitly:
    String& operator=(String&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = std::exchange(other.data_, nullptr);
            len_  = std::exchange(other.len_,  0);
        }
        return *this;
    }

    friend void swap(String& a, String& b) noexcept {
        std::swap(a.data_, b.data_);
        std::swap(a.len_,  b.len_);
    }

    std::size_t length() const { return len_; }
    const char* c_str()  const { return data_ ? data_ : ""; }
};
```

### `=default` and `=delete`

`= default` asks the compiler to generate an operation explicitly.
`= delete` prevents the operation entirely.

```cpp
class MoveOnly {
    std::unique_ptr<int> resource_;
public:
    explicit MoveOnly(int v) : resource_(std::make_unique<int>(v)) {}

    // Allow moves
    MoveOnly(MoveOnly&&)            noexcept = default;
    MoveOnly& operator=(MoveOnly&&) noexcept = default;

    // Forbid copies — unique_ptr is not copyable anyway, but explicit is clearer
    MoveOnly(const MoveOnly&)            = delete;
    MoveOnly& operator=(const MoveOnly&) = delete;

    ~MoveOnly() = default;

    int value() const { return *resource_; }
};

MoveOnly a{42};
MoveOnly b = std::move(a);  // OK: move constructor
// MoveOnly c = a;           // Error: copy constructor deleted
```

**When to use** `= default`:

- After suppressing an operation, to re-enable another that was implicitly deleted.
- To make intent explicit in the source code.
- The generated version is correct — prefer it over a hand-written identical body.

### The Copy-and-Swap Idiom

Copy-and-swap implements copy assignment in terms of the copy constructor and
`swap`. It provides the **strong exception guarantee**: if an exception is thrown
during the copy, the original object is unchanged.

```cpp
String& operator=(String other) noexcept {  // 'other' is a copy (may throw)
    swap(*this, other);                     // swap is noexcept
    return *this;                           // old data destroyed with 'other'
}
```

Copy-and-swap sequence:

```
a = b   (copy-and-swap)
───────────────────────
Step 1: construct 'other' as a copy of b  ← may throw here; a is untouched
Step 2: swap a and other                  ← noexcept; a now has b's data
Step 3: other destroyed                   ← a's old data freed here
```

### Exception Safety Guarantees

Every function provides one of four levels:

- **nothrow**: guaranteed not to throw. Must be marked `noexcept`.
- **strong**: if an exception is thrown, state is as-if the operation never happened.
- **basic**: if an exception is thrown, the object is in a valid (but unspecified) state.
- **no-guarantee**: state is undefined after an exception — to be avoided.

```cpp
// nothrow: swap, move constructor, move assignment
void swap(String& a, String& b) noexcept { /* exchanges raw pointers */ }

// strong: copy-and-swap assignment
String& operator=(String other) noexcept {
    swap(*this, other);
    return *this;
}

// strong: copy constructor (exception during allocation leaves *this unchanged)
String(const String& other) {
    data_ = allocate_copy(other.data_, other.len_);  // may throw
    len_  = other.len_;
    // If allocate_copy throws, data_ is nullptr, destructor is safe
}

// basic: push_back in std::vector (if realloc throws, vector is still valid)
v.push_back(expensive_object);
```

## Pitfalls

### Pitfall 1: Rule of Three Violation — Missing Copy Assignment

**Description**: Defining a destructor and copy constructor but forgetting the copy
assignment operator leaves the class with a compiler-generated memberwise copy
assignment that does a shallow copy — a double-free waiting to happen.

**BAD**

```cpp
class Buffer {
    char*       data_;
    std::size_t size_;
public:
    explicit Buffer(std::size_t n) : data_(new char[n]), size_(n) {}
    ~Buffer() { delete[] data_; }

    Buffer(const Buffer& other)           // copy constructor defined — OK
        : data_(new char[other.size_])
        , size_(other.size_) {
        std::copy_n(other.data_, size_, data_);
    }
    // Copy assignment NOT defined — compiler generates shallow copy!
};

Buffer a{10};
Buffer b{5};
b = a;           // compiler-generated: b.data_ = a.data_  (shallow!)
// Both a and b now point to the same memory.
// When a or b is destroyed, the other's pointer is dangling — double free.
```

**GOOD**

```cpp
// Apply copy-and-swap — one function handles both copy and move assignment
Buffer& operator=(Buffer other) noexcept {  // copy made in parameter
    std::swap(data_, other.data_);           // swap pointers
    std::swap(size_, other.size_);
    return *this;                            // other's destructor frees old data
}
```

**Detection tip**: Valgrind's `--tool=memcheck` and AddressSanitizer both catch
double-free errors. If you define a destructor, always check whether you need all
five special members.

### Pitfall 2: Self-Assignment in Move Assignment

**Description**: A move assignment operator that frees `this`'s resources before
copying from `other` will corrupt the object if it is called with `obj = std::move(obj)`.

**BAD**

```cpp
Buffer& operator=(Buffer&& other) noexcept {
    delete[] data_;                // frees *this's memory
    data_ = other.data_;           // if other == *this, data_ is now dangling!
    size_ = other.size_;
    other.data_ = nullptr;
    other.size_ = 0;
    return *this;
}

Buffer b{10};
b = std::move(b);   // self-move: delete[] data_ frees data, then data_ = data_
                    // UB: reading a freed pointer
```

**GOOD**

```cpp
Buffer& operator=(Buffer&& other) noexcept {
    if (this != &other) {           // self-move guard
        delete[] data_;
        data_ = std::exchange(other.data_, nullptr);
        size_ = std::exchange(other.size_, 0);
    }
    return *this;
}

// Alternatively, use swap (always safe for self-assignment):
Buffer& operator=(Buffer&& other) noexcept {
    std::swap(data_, other.data_);
    std::swap(size_, other.size_);
    return *this;   // other destroyed with old data
}
```

**Detection tip**: Use `-fsanitize=address,undefined` during tests and always test
`obj = std::move(obj)` for any class with a custom move assignment.

### Pitfall 3: Defining Destructor Suppresses Move Operations

**Description**: Adding a user-defined destructor causes the compiler to suppress the
implicit move constructor and move assignment operator. The class silently falls back
to copies everywhere a move was expected.

**BAD**

```cpp
class Resource {
    int* handle_;
public:
    explicit Resource(int v) : handle_(new int(v)) {}
    ~Resource() { delete handle_; }  // user-defined destructor

    // No move operations declared!
    // Compiler does NOT generate them because destructor is user-defined.
};

Resource a{42};
Resource b = std::move(a);   // silently calls copy constructor — expensive!
```

**GOOD**

```cpp
class Resource {
    int* handle_;
public:
    explicit Resource(int v) : handle_(new int(v)) {}
    ~Resource() { delete handle_; }

    Resource(Resource&& other)            noexcept = default;   // re-enable move
    Resource& operator=(Resource&& other) noexcept = default;
    Resource(const Resource&)                       = delete;   // or implement
    Resource& operator=(const Resource&)            = delete;
};

// Verify:
static_assert(std::is_nothrow_move_constructible_v<Resource>);
```

**Detection tip**: Add `static_assert(std::is_move_constructible_v<T>)` for every
class that should be movable but has a user-defined destructor.

### Pitfall 4: Throwing in a Move Constructor — Strong Guarantee Lost

**Description**: A move constructor that throws can leave both the source and the
destination in a partially-moved state — a violation of the basic guarantee.

**GOOD**

```cpp
class Document {
    std::string           content_;
    std::filesystem::path path_;
public:
    // Declare noexcept — if members throw, fix those members
    Document(Document&& other) noexcept
        : content_(std::move(other.content_))
        , path_(std::move(other.path_)) {}

    Document& operator=(Document&& other) noexcept {
        if (this != &other) {
            content_ = std::move(other.content_);
            path_    = std::move(other.path_);
        }
        return *this;
    }
};

static_assert(std::is_nothrow_move_constructible_v<Document>);
```

**Detection tip**: If the `static_assert` on `noexcept` move fails, find which
member is not `noexcept` movable and either fix it or provide a swap-based implementation.

### Pitfall 5: Slicing with Copy — Copying a Derived Object as Base

**Description**: Copying a derived-class object by value into a base-class variable
slices off the derived part. The copy constructor of the base is called, not the
derived, and the derived-specific data is lost.

**BAD**

```cpp
struct Animal {
    std::string name;
    virtual std::string sound() const { return "..."; }
};

struct Dog : Animal {
    std::string breed;
    std::string sound() const override { return "Woof"; }
};

Dog fido{"Fido", "Labrador"};
Animal a = fido;   // SLICING: copies only the Animal part
                   // a.breed does not exist; a.sound() returns "..." not "Woof"
```

**GOOD**

```cpp
// Option A: use polymorphism through pointers/references
std::unique_ptr<Animal> animal = std::make_unique<Dog>("Fido", "Labrador");
std::cout << animal->sound();   // "Woof" — virtual dispatch preserved

// Option B: prevent slicing by making Animal non-copyable or abstract
struct Animal {
    Animal() = default;
    Animal(const Animal&) = delete;             // prevent slice-copy
    Animal& operator=(const Animal&) = delete;
    virtual std::string sound() const = 0;
    virtual ~Animal() = default;
};
```

**Detection tip**: Clang-tidy `cppcoreguidelines-slicing` warns when a derived
object is copied or assigned to a base object by value.

## Code Example

```cpp
#include <cstring>
#include <iostream>
#include <utility>

class Text {
  public:
    Text() : data_(new char[1]{'\0'}) {}

    explicit Text(const char* s) {
        std::size_t n = std::strlen(s);
        data_ = new char[n + 1];
        std::memcpy(data_, s, n + 1);
    }

    ~Text() { delete[] data_; }

    Text(const Text& other) : Text(other.data_) {}

    Text& operator=(const Text& other) {
        if (this != &other) {
            Text tmp(other);
            swap(tmp);
        }
        return *this;
    }

    Text(Text&& other) noexcept : data_(other.data_) { other.data_ = nullptr; }

    Text& operator=(Text&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            other.data_ = nullptr;
        }
        return *this;
    }

    void swap(Text& other) noexcept { std::swap(data_, other.data_); }
    const char* c_str() const { return data_ ? data_ : ""; }

  private:
    char* data_{};
};

int main() {
    Text a{"rule-of-five"};
    Text b = a;
    Text c = std::move(b);
    std::cout << "Day 14 - Rule of 5\n";
    std::cout << c.c_str() << "\n";
    return 0;
}
```
