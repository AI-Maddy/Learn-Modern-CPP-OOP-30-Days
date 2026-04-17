# Move Semantics Gotchas

Value categories, rvalue reference syntax, move constructor mechanics,
std::move as a cast, NRVO, moved-from state, and common pitfalls.

---

## Value Category Taxonomy

Every expression has a type AND a value category.

```text
expression
├── glvalue  (has identity — can take address)
│   ├── lvalue   (identity, not movable from)
│   └── xvalue   (identity, movable — "expiring value")
└── rvalue   (no persistent identity)
    ├── prvalue  (pure rvalue — computes a value, no storage)
    └── xvalue   (shared with glvalue branch)
```

Practical examples:

```cpp
int  x  = 42;
int* p  = &x;

x;              // lvalue — has name, can take address
42;             // prvalue — no name
x + 1;          // prvalue — temporary result
std::move(x);   // xvalue  — named, but treated as movable
*p;             // lvalue  — dereference of pointer
int arr[3];
arr[0];         // lvalue — array subscript

// std::string{} is a prvalue (unnamed temporary)
std::string s = std::string{"hello"};

// Function returning by value yields prvalue
std::string make_str();
make_str();     // prvalue
```

---

## Lvalue and Rvalue Reference Syntax

```cpp
int x = 5;

int&  lref = x;         // lvalue reference — binds to lvalue
int&& rref = 42;        // rvalue reference — binds to rvalue (prvalue)
int&& rref2 = std::move(x);  // binds to xvalue

// const lvalue ref binds to ANYTHING — the "universal donor" of old C++
const int& clref = 42;  // extends lifetime of temporary

// Forwarding reference (universal reference) — T&& in a deduced context
template<typename T>
void f(T&& arg);   // NOT necessarily rvalue ref — deduced based on T

f(x);     // T = int&,  arg is int& (lvalue ref)
f(42);    // T = int,   arg is int&& (rvalue ref)
f(std::move(x));  // T = int, arg is int&&
```

---

## Move Constructor Mechanics

The move constructor transfers resources from the source object, leaving it
in a valid but unspecified state.

```cpp
class Buffer {
    int*        data_;
    std::size_t size_;
public:
    // Copy constructor — deep copy
    Buffer(const Buffer& other)
        : size_(other.size_)
        , data_(new int[other.size_])
    {
        std::copy(other.data_, other.data_ + size_, data_);
    }

    // Move constructor — steal resources, null source
    Buffer(Buffer&& other) noexcept
        : data_(other.data_)    // steal pointer
        , size_(other.size_)
    {
        other.data_ = nullptr;  // leave source in valid (null) state
        other.size_ = 0;
    }

    // Move assignment
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data_;          // release own resource
            data_      = other.data_;
            size_      = other.size_;
            other.data_ = nullptr;
            other.size_ = 0;
        }
        return *this;
    }

    ~Buffer() { delete[] data_; }
};
```

Key properties of a correct move constructor:

* Marked `noexcept` — enables safe use in standard containers (resize, sort).
* Leaves source in a destructible, assignable state (not undefined behavior).
* Does NOT allocate — just transfers pointers/handles.

---

## std::move — A Cast, Not an Optimization

`std::move` does **nothing at runtime**. It is a static_cast to rvalue
reference. The actual "move" is the constructor or assignment operator that
the compiler then selects.

```cpp
std::string s = "hello";

// std::move just casts s to string&&
std::string t = std::move(s);
// The STRING MOVE CONSTRUCTOR does the actual work.
// Without a move constructor, std::move causes a COPY.

// std::forward — conditional cast in templates
template<typename T>
void wrapper(T&& arg) {
    consume(std::forward<T>(arg));  // preserves lvalue/rvalue category
    // NOT consume(std::move(arg)); -- would force rvalue even for lvalues
}

// After move, s is in "valid but unspecified" state
// Reading s after move is technically valid but unpredictable:
std::cout << s;     // implementation-defined output (often empty)
s = "new value";    // OK — reassign to known state
```

---

## Moved-From State Rules

The standard requires that moved-from objects be *destructible* and
*assignable*. Beyond that, their state is "valid but unspecified".

```cpp
std::string s = "hello";
std::string t = std::move(s);

// These are VALID after move:
s.~string();           // destructor — always OK
s = "reset";           // assignment — restores to known state
s.clear();             // modifying operations — valid
if (s.empty()) { }     // querying operations — implementation-defined result

// This is RISKY after move:
std::cout << s;        // valid but unspecified — may print "" or anything

// Best practice: treat moved-from objects as "empty" for standard types
// For your own types: document the moved-from invariant clearly
```

---

## Named Return Value Optimization (NRVO) and Copy Elision

The compiler can eliminate the copy/move entirely in return statements.

| Scenario | C++14 behavior | C++17 behavior |
| --- | --- | --- |
| Return prvalue (unnamed temp) | Elision allowed | Elision MANDATORY |
| NRVO (named local, same type) | Elision allowed | Elision allowed |
| Return parameter | Move attempted | Move attempted |
| Return with explicit std::move | Move forced | Move forced (no RVO) |

```cpp
// NRVO fires — no copy or move, object constructed in place at call site
std::string make_greeting(std::string name) {
    std::string result = "Hello, " + name;  // named local
    return result;   // NRVO: result is constructed directly into caller
}

// NRVO does NOT fire — multiple return paths with different objects
std::string pick(bool flag) {
    std::string a = "alpha";
    std::string b = "beta";
    return flag ? a : b;   // compiler may not elide (two candidates)
}

// Mandatory elision (C++17) — return of prvalue
std::string make() { return std::string{"made"}; }  // ZERO copies/moves

// KILLS NRVO — explicit std::move prevents optimization
std::string bad_make() {
    std::string s = "data";
    return std::move(s);  // forces move, defeats NRVO — slower!
}
// Fix: just return s; — let the compiler elide
```

---

## Common Gotchas Table

| Gotcha | Bad code | Fix |
| --- | --- | --- |
| Moving from const | `const T x; use(move(x));` | Silently calls COPY ctor (no error!) |
| Double move | `move(x); use(x);` | Use `x` ONLY via move destination |
| move in return kills NRVO | `return std::move(local);` | Just `return local;` |
| Not marking move noexcept | `Buffer(Buffer&&) { ... }` | Add `noexcept` — containers need it |
| Forwarding instead of moving | `push_back(move(arg))` | OK if arg is definitely rvalue |
| const T&& (almost never useful) | `void f(const T&&)` | Use `const T&` or `T&&` instead |

```cpp
// Gotcha 1: moving from const — results in COPY, not move
const std::string cs = "hello";
std::string t = std::move(cs);  // calls copy ctor (const T&)!
// No error, no warning — silent performance regression

// Gotcha 2: double move — moved-from object used again
auto process(std::string s) {
    log(std::move(s));   // s is now in unspecified state
    return s;            // BAD — reading moved-from s
}

// Gotcha 3: move in return statement kills NRVO
std::vector<int> make_vec() {
    std::vector<int> v{1, 2, 3};
    return std::move(v);  // BAD — prevents copy elision, forces move
    // return v;          // GOOD — NRVO can elide entirely
}

// Gotcha 4: move ctor not noexcept — containers fall back to copy
class Widget {
public:
    Widget(Widget&&);  // not noexcept — std::vector will COPY on realloc!
    Widget(Widget&&) noexcept;  // GOOD — vector can move on realloc
};
```

---

## Perfect Forwarding

Preserve value category when passing arguments through a template.

```cpp
// Without forwarding — always copies (lvalue ref)
template<typename T>
void bad_wrap(T arg) { consume(arg); }

// With std::forward — preserves lvalue vs rvalue
template<typename T>
void forward_wrap(T&& arg) {
    consume(std::forward<T>(arg));
}

std::string s = "hello";
forward_wrap(s);              // lvalue: consume gets string&
forward_wrap(std::move(s));   // rvalue: consume gets string&&
forward_wrap("literal");      // rvalue: consume gets string&&

// Emplace idiom — forward construction args into container
std::vector<std::string> v;
v.emplace_back("hello");       // constructs in-place, no temporary
v.push_back("hello");          // creates temporary string first
```

---

## Review Checklist

* Are all move constructors and move assignment operators marked `noexcept`?
* Are moved-from local variables never read without reassignment first?
* Is `return std::move(local)` eliminated and replaced with plain `return local`?
* Is `std::forward` used in template wrappers rather than `std::move`?
* Are const objects not passed to `std::move` (it silently falls back to copy)?
* Do custom types in `std::vector` have `noexcept` move to enable fast reallocation?
* Are emplace functions (`emplace_back`) preferred over `push_back` with temporaries?
* Is the moved-from invariant of custom types clearly documented and valid for assignment?

## Related Concepts

* `rule-of-5-cheat.rst` — when move ctor/assignment are generated
* `raii-smart-pointers.rst` — unique_ptr move semantics
* `functions-lambdas.rst` — forwarding in function templates
* `classes-constructors-raii.rst` — member initialization interaction with move
* `templates-concepts.rst` — std::is_nothrow_move_constructible
