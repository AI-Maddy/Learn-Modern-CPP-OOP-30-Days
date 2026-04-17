# Day 09: Templates Basics

## Why This Day Matters

Imagine writing `max()` once for `int`, then again for `double`, then again for
`std::string`. Duplicated logic, duplicated bugs, duplicated maintenance. C++
templates let you write code once and instantiate it for any type that supports the
required operations — fully type-safe, zero runtime overhead.

Templates are the foundation of the C++ Standard Library. `std::vector`,
`std::sort`, `std::pair`, `std::optional` — all templates. Mastering them
unlocks library-quality reusable code.

## Learning Outcomes

After completing this day you will be able to:

- Write function and class templates with multiple type and non-type parameters.
- Explain what template type deduction is and predict the deduced type for common argument categories (value, lvalue reference, const reference).
- Implement full and partial template specialisations for a class template.
- Write a variadic template using both the recursive pattern and C++17 fold expressions.
- Explain the instantiation cost model and apply explicit instantiation declarations to reduce compilation time.

## Key Concepts

- **Function template** — a blueprint for a family of functions; the compiler generates a concrete overload for each set of deduced argument types.
- **Class template** — a blueprint for a family of classes; both type and non-type parameters are supported.
- **Template type deduction** — the compiler infers `T` from call-site argument types; mirrors `auto` deduction rules.
- **Non-type template parameter** — a compile-time value (integer, pointer, enum) that becomes part of the type identity.
- **Full specialisation** — a hand-written implementation for one exact set of template arguments, overriding the primary template.
- **Partial specialisation** — a hand-written implementation for a family of argument patterns; available for class templates only.
- **Variadic template** — a template accepting any number of parameters; expanded using `...` and simplified in C++17 with fold expressions.
- **Instantiation cost** — each unique template argument set produces separate compiled code; explicit instantiation declarations limit duplication.

## Theory

### Motivation

Templates are the foundation of the C++ Standard Library. `std::vector`,
`std::sort`, `std::pair`, `std::optional` — all templates. Mastering them
unlocks library-quality reusable code.

### Function Templates

A function template is a blueprint. The compiler stamps out a concrete function for
each combination of template arguments it encounters.

```cpp
#include <string>
#include <iostream>

// Template parameter T is deduced from the call arguments
template <typename T>
T max_of(T a, T b) {
    return (a > b) ? a : b;
}

int    i = max_of(3, 7);          // T = int
double d = max_of(1.5, 2.7);      // T = double
// explicit template argument when deduction would be ambiguous
auto x = max_of<long>(42, 100L);
```

**Multiple template parameters**

```cpp
// Trailing return type deduced from the expression type
template <typename T, typename U>
auto add(T a, U b) -> decltype(a + b) {
    return a + b;
}

// C++14: auto return type (compiler deduces from the return statement)
template <typename T, typename U>
auto multiply(T a, U b) { return a * b; }

auto r1 = add(1, 2.5);     // double
auto r2 = multiply(3, 4L); // long
```

### Class Templates

Class templates parametrise entire classes. Every member function is itself a
template function of the class template parameters.

```cpp
#include <cassert>
#include <stdexcept>

// A fixed-capacity stack; Capacity has a default value
template <typename T, std::size_t Capacity = 16>
class FixedStack {
    T           data_[Capacity];
    std::size_t size_{0};
public:
    void push(const T& v) {
        if (size_ == Capacity) throw std::overflow_error{"stack full"};
        data_[size_++] = v;
    }
    T pop() {
        if (size_ == 0) throw std::underflow_error{"stack empty"};
        return data_[--size_];
    }
    bool        empty() const { return size_ == 0; }
    std::size_t size()  const { return size_; }
};

FixedStack<int, 8> int_stack;    // explicit capacity
FixedStack<double> dbl_stack;    // default capacity = 16

int_stack.push(1);
int_stack.push(2);
assert(int_stack.pop() == 2);
```

**Out-of-class member function definition**

```cpp
template <typename T, std::size_t Capacity>
void FixedStack<T, Capacity>::push(const T& v) {
    if (size_ == Capacity) throw std::overflow_error{"stack full"};
    data_[size_++] = v;
}
// Both template parameters must be repeated on every out-of-class definition.
```

### Template Type Deduction

The compiler infers template arguments from the function call arguments. The rules
closely mirror the rules for `auto` deduction.

```cpp
template <typename T>
void inspect(T x) {}    // T is a copy — top-level cv qualifiers stripped

int n = 42;
const int cn = 42;
inspect(n);    // T = int
inspect(cn);   // T = int   (const stripped for pass-by-value)
inspect(3.14); // T = double

template <typename T>
void inspect_ref(T& x) {}   // T deduced without ref; x binds lvalue

inspect_ref(n);    // T = int,       x is int&
// inspect_ref(42); // ERROR: cannot bind lvalue ref to rvalue

template <typename T>
void inspect_cref(const T& x) {}  // binds to anything

inspect_cref(42);  // T = int, x is const int&

// C++17: class template argument deduction (CTAD)
std::pair  p{1, 2.5};   // deduced as pair<int, double>
std::vector v{1, 2, 3}; // deduced as vector<int>
```

### Non-Type Template Parameters

Template parameters can be compile-time values, not just types. Common examples:
integer constants, enum values, and (C++20) floating-point values.

```cpp
#include <array>
#include <numeric>

// N is a compile-time constant baked into the type
template <typename T, std::size_t N>
T sum_array(const std::array<T, N>& arr) {
    return std::accumulate(arr.begin(), arr.end(), T{});
}

std::array<int, 4>    a4{1, 2, 3, 4};
std::array<double, 3> a3{1.1, 2.2, 3.3};
int    s1 = sum_array(a4);   // N deduced as 4
double s2 = sum_array(a3);   // N deduced as 3

// Compile-time dimension type: the size IS the type
template <std::size_t Rows, std::size_t Cols>
struct Matrix {
    double data[Rows][Cols]{};
    static constexpr std::size_t rows = Rows;
    static constexpr std::size_t cols = Cols;
};

Matrix<3, 4> m34;
// Matrix<3,4> and Matrix<4,3> are different types — the compiler enforces this
```

### Full and Partial Template Specialisation

A **full specialisation** provides a completely different implementation for one exact
set of template arguments. A **partial specialisation** handles a family of
argument combinations.

```cpp
#include <string>

// Primary template — works for arithmetic types
template <typename T>
struct Serialise {
    static std::string to_json(const T& v) {
        return std::to_string(v);
    }
};

// Full specialisation for bool
template <>
struct Serialise<bool> {
    static std::string to_json(bool v) {
        return v ? "true" : "false";
    }
};

// Full specialisation for std::string
template <>
struct Serialise<std::string> {
    static std::string to_json(const std::string& v) {
        return '"' + v + '"';
    }
};

// Partial specialisation — any pointer type T*
template <typename T>
struct Serialise<T*> {
    static std::string to_json(const T* p) {
        return p ? Serialise<T>::to_json(*p) : "null";
    }
};

auto j1 = Serialise<int>::to_json(42);           // "42"
auto j2 = Serialise<bool>::to_json(true);        // "true"
auto j3 = Serialise<std::string>::to_json("hi"); // "\"hi\""
int n = 7;
auto j4 = Serialise<int*>::to_json(&n);          // "7"
```

### Variadic Templates

Variadic templates accept any number of template arguments. They underpin
`std::tuple`, `std::variant`, and perfect forwarding.

```cpp
#include <iostream>

// Base case: empty pack
void print_all() { std::cout << '\n'; }

// Recursive case: peel off the first argument
template <typename First, typename... Rest>
void print_all(First&& first, Rest&&... rest) {
    std::cout << first;
    if constexpr (sizeof...(rest) > 0)
        std::cout << ", ";
    print_all(std::forward<Rest>(rest)...);  // pack expansion
}

print_all(1, 2.5, "hello", true);
// Output: 1, 2.5, hello, 1

// C++17 fold expressions — cleaner than recursion for simple operations
template <typename... Args>
auto sum_all(Args... args) {
    return (... + args);    // left fold: ((args[0]+args[1])+args[2])...
}

auto total = sum_all(1, 2, 3, 4, 5);  // 15

// Compile-time argument count
template <typename... T>
constexpr std::size_t count() { return sizeof...(T); }
static_assert(count<int, double, char>() == 3);
```

### Template Instantiation Cost

Every unique set of template arguments produces a separate compiled entity.
This has implications for compile time and binary size.

```cpp
template <typename T>
T identity(T v) { return v; }

identity(1);    // instantiates identity<int>
identity(1.0);  // instantiates identity<double>
identity('a');  // instantiates identity<char>
// Three separate functions in the binary.
```

**Explicit instantiation** — declare in a header, define in one .cpp

```cpp
// stack.h
extern template class FixedStack<int, 16>;    // suppress implicit instantiation

// stack.cpp
template class FixedStack<int, 16>;           // one explicit instantiation
```

**Non-template base class** — factor out type-independent logic

```cpp
class VectorBase {
protected:
    void*       data_;
    std::size_t size_, capacity_;
    void grow();   // shared machine code — NOT duplicated per T
};

template <typename T>
class Vector : private VectorBase {
public:
    void push_back(const T& v) {
        if (size_ == capacity_) grow();   // calls shared code
        new (static_cast<T*>(data_) + size_++) T(v);
    }
};
```

## Pitfalls

### Pitfall 1: Template Definition in a .cpp File

**Description**: Placing a template's definition in a .cpp file and its declaration
in a header. The linker cannot find the instantiation for translation units that only
see the header.

**BAD**

```cpp
// math_utils.h
template <typename T>
T square(T v);   // declaration only

// math_utils.cpp
template <typename T>
T square(T v) { return v * v; }   // definition hidden from other TUs

// main.cpp
#include "math_utils.h"
int x = square(5);   // LINKER ERROR: undefined reference to square<int>
```

**Why it fails**: The compiler instantiates `square<int>` only in translation units
that see the definition. `main.cpp` sees only the declaration, so no instantiation
is generated there. The linker finds no definition.

**GOOD**

```cpp
// math_utils.h — definition lives in the header
template <typename T>
T square(T v) { return v * v; }   // visible to all includers

// Or: use explicit instantiation if you want to keep the .cpp
// math_utils.h
extern template int square(int);   // declaration: do not instantiate here

// math_utils.cpp
template int square(int);          // explicit: instantiate exactly once
```

**Detection tip**: Linker errors about `undefined reference to foo<SomeType>`
almost always mean the template definition is not visible at the instantiation site.

### Pitfall 2: Accidental Copy in Pass-by-Value Template

**Description**: A template function taking `T` by value makes an unexpected deep
copy of a large object because the caller passed an lvalue.

**BAD**

```cpp
template <typename T>
void store(T item) {           // T deduced as std::vector<int> — deep copy!
    database.push_back(item);
}

std::vector<int> big(1'000'000, 0);
store(big);    // copies 1 million ints — unintentional
```

**GOOD**

```cpp
// Accept forwarding reference — binds to both lvalue and rvalue
template <typename T>
void store(T&& item) {
    database.push_back(std::forward<T>(item));
}

store(big);             // T = vector<int>&  — no copy, just reference used
store(std::move(big));  // T = vector<int>   — move, no copy
```

**Detection tip**: Use `-Weffc++` or clang-tidy's `performance-unnecessary-copy-initialization`
to catch unintended copies of non-trivial types.

### Pitfall 3: Specialising Function Templates — Use Overloads Instead

**Description**: Partially specialising a function template is not allowed, and full
specialisation interacts poorly with overload resolution in surprising ways.

**BAD**

```cpp
template <typename T>
std::string describe(T v) { return "generic"; }

// Attempt at full specialisation for pointer types
template <typename T>
std::string describe(T* p) { return "pointer"; }  // This is an OVERLOAD, not
                                                   // a partial specialisation.
template <>
std::string describe<int>(int v) { return "int"; } // Full spec of primary
// The specialisation is of the primary, not the overload — confusing!
```

**GOOD**

```cpp
// Use overloads or a class template with partial specialisation instead
template <typename T>
struct Describe {
    static std::string value() { return "generic"; }
};

template <typename T>
struct Describe<T*> {        // partial specialisation — well-defined
    static std::string value() { return "pointer"; }
};

template <>
struct Describe<int> {       // full specialisation — well-defined
    static std::string value() { return "int"; }
};
```

**Detection tip**: If you find yourself writing `template <> T foo<X>(...)` for a
function template, consider switching to a class template with specialisation.

### Pitfall 4: Dependent Name Lookup — Missing `typename` and `template`

**Description**: Inside a template, names that depend on a template parameter need
`typename` (for types) or `template` (for templates) to help the compiler parse correctly.

**BAD**

```cpp
template <typename Container>
void first_element(Container& c) {
    Container::iterator it = c.begin();  // ERROR: missing typename
    *it = 0;
}
```

**GOOD**

```cpp
template <typename Container>
void first_element(Container& c) {
    typename Container::iterator it = c.begin();  // OK
    *it = 0;
}

// Similarly for template member functions of a dependent type:
template <typename Alloc>
void allocate_int(Alloc& a) {
    auto p = a.template allocate<int>(1);  // 'template' keyword required
}
```

**Detection tip**: GCC and Clang error messages that say "need 'typename' before ..."
or "use 'template' keyword to treat ..." directly point to this issue.

### Pitfall 5: Infinite Recursion in Variadic Template — Missing Base Case

**Description**: A variadic template that recurses on the parameter pack without a
zero-argument base case will fail to compile with an opaque recursion error.

**BAD**

```cpp
template <typename... Args>
void log_all(Args... args) {
    // Expands forever — no base case!
    log_all(args...);   // no pack shrinkage — infinite recursion
}
```

**GOOD**

```cpp
// Base case: nothing to print
void log_all() {}

// Recursive case: peel off first element
template <typename First, typename... Rest>
void log_all(First first, Rest... rest) {
    std::cout << first << ' ';
    log_all(rest...);   // rest has one fewer element
}

// C++17 alternative using fold expression — no recursion needed
template <typename... Args>
void log_fold(Args... args) {
    ((std::cout << args << ' '), ...);  // comma fold
}
```

**Detection tip**: When template recursion errors mention hundreds of instantiation
levels, look for a missing base-case overload. Prefer fold expressions in C++17.

### Pitfall 6: Non-Type Template Parameter — ODR Violation with Inline Variables

**Description**: Using a non-type template parameter with an address that has internal
linkage can cause one-definition rule (ODR) violations when the template is
instantiated in multiple translation units.

**BAD**

```cpp
// Internal-linkage value in each TU — each TU gets its own copy
static const int kLimit = 10;

template <const int* Ptr>
struct Policy { /* uses Ptr */ };

Policy<&kLimit> p;   // each TU instantiates with a different kLimit address!
```

**GOOD**

```cpp
// External linkage — one object, one address across all TUs
// limits.h
extern const int kLimit;

// limits.cpp
const int kLimit = 10;

template <const int* Ptr>
struct Policy { /* uses Ptr */ };

Policy<&kLimit> p;   // same address everywhere — ODR satisfied
```

**Detection tip**: Use `-Wno-undefined-var-template` and `-fsanitize=address` with
`-fno-omit-frame-pointer` to catch ODR issues. In C++17+, prefer `inline`
variables for constants that must have a single address.

## Code Example

```cpp
#include <iostream>
#include <string>

template <typename T>
T max_of(T a, T b) {
    return (a < b) ? b : a;
}

int main() {
    std::cout << "Day 09 - Templates Basics\n";
    std::cout << "max(4,9)=" << max_of(4, 9) << "\n";
    std::cout << "max(cat,dog)=" << max_of(std::string{"cat"}, std::string{"dog"}) << "\n";
    return 0;
}
```
