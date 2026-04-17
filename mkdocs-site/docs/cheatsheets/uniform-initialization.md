---
title: "Uniform Initialization"
tags: ["cheatsheet", "reference"]
---

# :material-book: Uniform Initialization


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Uniform Initialization

<div class="contents" local="" depth="2">

Sections

</div>

## Three Initialization Syntaxes

``` cpp
int a = 5;    // copy-initialization (C-style; implicit conversions allowed)
int b(5);     // direct-initialization (constructor call style)
int c{5};     // direct-list-initialization (brace-init, C++11)

// For class types:
std::string s1 = "hello";   // copy-init from const char*
std::string s2("hello");    // direct-init
std::string s3{"hello"};    // brace-init (preferred in modern C++)

// With auto:
auto x = 5;    // x is int
auto y{5};     // y is int (C++17: deduces int, not initializer_list<int>)
auto z = {5};  // z is std::initializer_list<int> — often unintended!
```

## Most Vexing Parse — Solved by Braces

The most vexing parse occurs when the compiler interprets what looks like a variable definition as a function declaration.

``` cpp
// BAD: most vexing parse — Widget w() is a function declaration!
Widget w();         // declares function w returning Widget
Timer t(Clock());   // declares function t taking a function ptr

// GOOD: brace-init always a variable definition
Widget w{};         // default-constructed Widget object
Timer  t{Clock{}};  // Timer object with Clock object argument
```

## Narrowing Conversion Detection

Brace-init **rejects** narrowing conversions at compile time. Parenthesis-init silently truncates.

``` cpp
double pi = 3.14159;

int a(pi);    // OK: silently truncates to 3
int b{pi};    // ERROR: narrowing conversion double -> int

long  big = 1000000;
short s1(big);   // OK: silently truncates (implementation-defined)
short s2{big};   // ERROR: narrowing

// Narrowing rules: any conversion that may lose information:
// double -> float, double -> int, long -> short, etc.
// char -> int is NOT narrowing (always safe); int -> char IS narrowing.

// Constant expressions: OK if value fits
int c{42};        // OK: 42 fits in int
short d{42};      // OK: 42 fits in short
short e{300000};  // ERROR: 300000 doesn't fit in short
```

## initializer_list Preference Problem

When a class has a constructor taking `std::initializer_list<T>`, brace-init **prefers** it over other constructors — even if another constructor is a better match.

``` cpp
std::vector<int> v1(5, 3);   // 5 elements, each 3   -> {3,3,3,3,3}
std::vector<int> v2{5, 3};   // initializer_list{5,3} -> {5,3}

// Same problem with custom classes:
struct Widget {
    Widget(int n, double d) { std::cout << "A\n"; }
    Widget(std::initializer_list<int> l) { std::cout << "B\n"; }
};

Widget w1(5, 3.0);   // calls A (int, double)
Widget w2{5, 3};     // calls B (initializer_list) — 3.0 narrowed to 3
Widget w3{5, 3.0};   // ERROR: 3.0 narrowing to int in initializer_list
```

| Use `{}`                                   | Use `()`                                           |     |
|--------------------------------------------|----------------------------------------------------|-----|
| Default-constructing to avoid vexing parse | Calling a constructor that takes count/value pairs |     |
| Aggregate init / struct fields             | `vector(n, val)` intent                            |     |
| Prevents narrowing (safety first)          | Conversion allowed intentionally                   |     |
| Initializer list construction intended     | Bypassing init-list overload                       |     |

## Aggregate Initialization

An **aggregate** is a class/struct with no user-provided constructors, no private/protected data members, no virtual functions, and (C++17+) no base classes with constructors.

``` cpp
struct Point { int x, y, z; };
Point p1{1, 2, 3};     // aggregate init (order = declaration order)
Point p2 = {1, 2, 3};  // same
Point p3{};             // zero-initialises all members

// C++20: aggregate init allowed with base classes
struct ColorPoint : Point { uint8_t r, g, b; };
ColorPoint cp{{1,2,3}, 255, 0, 128};   // C++20 OK; C++17 ERROR

// Array aggregate:
int arr[5]{1, 2, 3};   // arr = {1,2,3,0,0} — trailing zeros guaranteed
```

## Designated Initializers (C++20)

Name the members you are initializing. Must be in declaration order.

``` cpp
struct Config {
    int    width     = 800;
    int    height    = 600;
    bool   fullscreen = false;
    double aspect     = 1.333;
};

Config cfg{ .width = 1920, .height = 1080, .fullscreen = true };
// .aspect not mentioned → uses default 1.333

// BAD: out-of-order designators (compile error in C++20)
Config bad{ .height = 1080, .width = 1920 };   // ERROR: height before width

// C++20 aggregate: all existing initializers + designated
struct Point3D { float x = 0, y = 0, z = 0; };
Point3D q{ .y = 5.0f };   // x=0, y=5, z=0
```

## Zero-Initialization Guarantee

``` cpp
// Value-initialization via {} zero-initializes members with no initializer
struct Data { int a; double b; char c[10]; };
Data d{};   // a=0, b=0.0, c={0,0,...}

// Contrast with default-initialization (uninitialized!):
Data e;     // indeterminate values for all members

// For scalar types:
int n{};    // 0
double x{}; // 0.0
char* p{};  // nullptr

// Arrays:
int arr[5]{};   // all zeros
int arr2[5];    // garbage (stack) or zero (static/thread-local)

// Static and thread-local variables are always zero-initialized:
static int s;   // guaranteed 0 even without {}
```

## Initialization Order Summary

For a class object, initialization proceeds in this order:

1.  Virtual base classes (in depth-first, left-to-right order)
2.  Direct base classes (left to right)
3.  Non-static data members (in **declaration order**, not member-init-list order)
4.  Constructor body

``` cpp
struct Foo {
    int b;
    int a;
    // Member init list order doesn't matter; declaration order does:
    Foo() : a(1), b(a) {}   // WARNING: b initialized with UNINITIALIZED a!
    // GOOD:
    Foo(int) : b(0), a(1) {} // still: b uses declaration order, a initialized after
};
// Reorder declarations or use literal 0 for b
```

## Pitfalls

**Pitfall 1: auto z = {42} deduces initializer_list**

``` cpp
auto z = {42};    // z is std::initializer_list<int>, not int!
auto w{42};       // w is int (C++17 single-element rule)
```

**Pitfall 2: Empty braces call default constructor, not zero-init on class**

``` cpp
struct Widget {
    Widget() { /* does NOT zero-fill members */ }
    int x;   // uninitialized after Widget{}
};
Widget w{};   // calls default ctor — x may be garbage
```

**Pitfall 3: Nested aggregates need nested braces**

``` cpp
struct Inner { int a, b; };
struct Outer { Inner i; int c; };

Outer o{1, 2, 3};          // OK but fragile: brace elision
Outer o2{{1, 2}, 3};       // clear: 1,2 go to Inner, 3 to c
```

**Pitfall 4: Designated initializers don't compile in C++17**

``` cpp
Config cfg{ .width = 1920 };   // C++20 only; use -std=c++20
```

## Cross-References

- `structured-bindings.rst` — aggregate decomposition
- `common-pitfalls.rst` — narrowing, implicit conversions, most-vexing-parse
- `modern-cpp20-23-cheat.rst` — designated initializers and aggregate changes
- `memory-layout-and-object-model.rst` — struct padding and member ordering


---

[← All Cheatsheets](index.md)
