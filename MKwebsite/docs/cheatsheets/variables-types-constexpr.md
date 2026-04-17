# Variables, Types, and constexpr

Fundamental types, compile-time computation, and initialization best practices
for Modern C++ (C++17/20).

---

## Fundamental Integer Types and Widths

Use `<cstdint>` types when exact width matters. Platform types (`int`,
`long`) have implementation-defined sizes.

```cpp
#include <cstdint>

// Exact-width types — portable and self-documenting
int8_t   a = -5;          // always 8-bit signed
uint16_t b = 65535u;      // always 16-bit unsigned
int32_t  c = 2'147'483'647;
uint64_t d = 18'446'744'073'709'551'615ULL;

// Fastest/smallest at-least-N-bit types
int_fast32_t fast = 0;    // fastest >= 32-bit signed
int_least8_t small = 0;   // smallest >= 8-bit signed

// std::size_t — always use for array indices / sizes
std::size_t idx = vec.size();

// ptrdiff_t — signed difference of pointers
ptrdiff_t diff = ptr2 - ptr1;
```

| Type | Width | Typical use |
| --- | --- | --- |
| `bool` | 1 byte | flags, predicates |
| `char` | 1 byte | character / byte (signedness impl) |
| `int` | >=16 b | general arithmetic (usually 32) |
| `long long` | >=64 b | large integers portably |
| `std::size_t` | ptr sz | container sizes, loop indices |
| `int32_t` | =32 b | serialization, network protocols |

## Floating-Point Precision

```cpp
float  f = 3.14f;           // ~7 significant digits,  32-bit
double d = 3.14159265358979;// ~15 significant digits, 64-bit
long double ld = 3.14L;     // 80-bit extended on x86, or 128-bit

// Comparing floats — NEVER use ==
constexpr double eps = 1e-9;
bool nearly_equal = std::abs(a - b) < eps;

// Use std::numeric_limits for portable constants
#include <limits>
double max_d  = std::numeric_limits<double>::max();
double inf    = std::numeric_limits<double>::infinity();
double nan    = std::numeric_limits<double>::quiet_NaN();
bool is_finite = std::isfinite(d);
```

Precision pitfall:

```cpp
// BAD — float loses precision before assignment
float result = 1.1 + 2.2;  // 1.1 and 2.2 are double literals
// result != 3.3 exactly

// GOOD — consistent literal suffixes
float result2 = 1.1f + 2.2f;
```

---

## auto Type Deduction Rules

`auto` strips top-level cv-qualifiers and references. Know the rules to
avoid surprises.

```cpp
int        x  = 5;
const int  cx = 5;
int&       rx = x;

auto a = x;    // int          (copy)
auto b = cx;   // int          (const stripped)
auto c = rx;   // int          (ref stripped, copy made)

auto& d = x;   // int&         (reference preserved)
auto& e = cx;  // const int&   (const preserved via ref)

const auto  f = x;    // const int
const auto& g = x;    // const int&

// Initializer list — only {}-list to initializer_list
auto h = {1, 2, 3};   // std::initializer_list<int>
auto i = 42;           // int  (NOT initializer_list)

// C++14: auto in function return — deduced from return statement
auto square(int n) { return n * n; }  // int

// decltype(auto) — preserves references (useful in generic code)
decltype(auto) get_ref() { return rx; }  // int& not int
```

Auto in range-for loops:

```cpp
std::vector<std::string> names = {"Alice", "Bob"};

for (auto  name : names)  // COPY each string — expensive!
    process(name);

for (auto& name : names)  // reference — preferred for large types
    process(name);

for (const auto& name : names)  // const ref — read-only
    print(name);

for (auto&& name : names)  // universal ref — works for proxies/moves
    sink(std::move(name));
```

---

## constexpr vs const vs #define

| Feature | Type-safe | Scoped | Debuggable | When to use |
| --- | --- | --- | --- | --- |
| `#define` | No | No | No | Legacy; avoid |
| `const` | Yes | Yes | Yes | Runtime constants |
| `constexpr` | Yes | Yes | Yes | Compile-time vals |
| `consteval` | Yes | Yes | Yes | Must be CT (C++20) |
| `constinit` | Yes | Yes | Yes | Static init (C++20) |

```cpp
// #define — no type, no scope, no address
#define OLD_PI 3.14159       // avoid in new code

// const — runtime-allowed, may have storage
const double PI = 3.14159;  // could be runtime-initialized

// constexpr — must be computable at compile time
constexpr double TAU = 2.0 * 3.14159265358979;
constexpr int    BUFFER_SIZE = 1024;

constexpr int factorial(int n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}
constexpr int fact5 = factorial(5);  // 120, computed at compile time

// consteval (C++20) — ONLY valid in constant expressions
consteval int must_be_ct(int n) { return n * 2; }
// must_be_ct(runtime_var);  // ERROR — compile-time only

// constinit (C++20) — static storage, forced compile-time init
constinit int global_counter = 0;  // no static init order fiasco
```

constexpr objects:

```cpp
struct Point { int x, y; };

constexpr Point origin{0, 0};
constexpr Point p = {3, 4};

// constexpr function with if/loop (C++14+)
constexpr int sum_to(int n) {
    int s = 0;
    for (int i = 1; i <= n; ++i) s += i;
    return s;
}
static_assert(sum_to(10) == 55);  // verified at compile time
```

---

## Brace Initialization vs Parenthesis Initialization

Prefer `{}` (uniform initialization) in almost all cases.

```cpp
// Brace initialization — no narrowing, works everywhere
int  a{5};
int  b{};         // zero-initialized (NOT garbage)
double d{3.14};

// NARROWING CONVERSION — compile error with {}
int  bad{3.14};   // ERROR: narrowing double -> int
int  ok = 3.14;   // WARNING only (silent data loss)
int  ok2(3.14);   // WARNING only (silent data loss)

// Most vexing parse — function declaration, not object!
std::vector<int> v1();   // FUNCTION declaration (surprise!)
std::vector<int> v2{};   // DEFAULT-constructed vector (correct)

// Initializer-list constructor takes priority over others
std::vector<int> v3(3, 0);   // 3 elements, all zero
std::vector<int> v4{3, 0};   // 2 elements: 3 and 0  <- SURPRISE
```

Initialization taxonomy:

```cpp
int a;           // default-init: INDETERMINATE (UB if read)
int b{};         // value-init:   zero (always safe)
int c = 5;       // copy-init
int d(5);        // direct-init  (most vexing parse risk)
int e{5};        // direct-list-init (preferred)
int f = {5};     // copy-list-init
```

---

## Structured Bindings (C++17)

Decompose aggregates, tuples, and map elements cleanly.

```cpp
#include <tuple>
#include <map>

// Pair
auto [key, value] = std::make_pair("pi", 3.14);

// Tuple
auto [x, y, z] = std::make_tuple(1, 2.5, "hello");

// Map iteration
std::map<std::string, int> scores{{"Alice", 95}, {"Bob", 87}};
for (const auto& [name, score] : scores)
    std::cout << name << ": " << score << '\n';

// Struct / aggregate (no tuple_size needed)
struct RGB { uint8_t r, g, b; };
RGB color{255, 128, 0};
auto [red, green, blue] = color;

// With array
int arr[3] = {10, 20, 30};
auto& [a2, b2, c2] = arr;  // references into arr

// Returning multiple values idiom
auto parse_point(std::string_view s)
    -> std::pair<int, int>;

auto [px, py] = parse_point("3,4");
```

---

## Narrowing Conversions — Pitfalls and Fixes

Narrowing = value change during implicit conversion.

| Narrowing (BAD) | Safe alternative |
| --- | --- |
| `int i = 3.9` | `int i = static_cast<int>(3.9)` |
| `char c = 300` | `uint8_t c = 44` (clamp first) |
| `uint32_t u = -1` | explicit cast + document intent |
| `float f = large_double` | `float f{large_double}` = error |

```cpp
// Enable -Wconversion -Wsign-conversion in your build
// Use gsl::narrow or gsl::narrow_cast for checked casts
#include <gsl/narrow>

int safe = gsl::narrow<int>(some_long);  // throws if overflow
```

---

## Integer Overflow — Undefined Behavior

Signed integer overflow is **undefined behavior** in C++.

```cpp
// UNDEFINED BEHAVIOR — signed overflow
int max = std::numeric_limits<int>::max();
int overflow = max + 1;   // UB! compiler may assume it never happens

// SAFE — check before operation
bool would_overflow = (a > std::numeric_limits<int>::max() - b);

// SAFE — use unsigned (wraps defined)
uint32_t u = std::numeric_limits<uint32_t>::max();
uint32_t wrapped = u + 1;  // well-defined: 0

// C++20: std::add_overflow / __builtin_add_overflow
int result;
if (__builtin_add_overflow(a, b, &result))
    handle_overflow();

// Compile flags that help (but don't fix UB):
// -fsanitize=undefined,integer  (UBSan)
// -ftrapv  (trap on signed overflow)
```

---

## std::byte — Type-Safe Byte Manipulation

`std::byte` (C++17) is neither an integer nor a character — prevents
accidental arithmetic on raw bytes.

```cpp
#include <cstddef>

std::byte b{0xFF};

// Bitwise ops are allowed
std::byte mask{0x0F};
std::byte result = b & mask;       // OK
std::byte shifted = b >> 4;        // OK

// Arithmetic is NOT allowed — must cast explicitly
// int wrong = b + 1;              // ERROR
int val = std::to_integer<int>(b); // explicit conversion

// Typical use: raw memory buffers
std::vector<std::byte> buffer(1024);
std::memset(buffer.data(), 0, buffer.size());  // zero fill

// Casting between byte* and object representation
MyPod pod{};
auto* bytes = reinterpret_cast<std::byte*>(&pod);
```

---

## Review Checklist

* Are fixed-width types (`int32_t` etc.) used where exact width matters?
* Is every local variable initialized at the point of declaration?
* Does any `{}`:`()` mix create an unintended `initializer_list` constructor call?
* Are float literals suffixed with `f` to prevent implicit double conversion?
* Are all `const` variables that could be `constexpr` upgraded to `constexpr`?
* Is signed overflow possible in any arithmetic path?
* Are `auto` deductions verified to not silently strip `const` or references?
* Does structured binding use `const auto&` when reads are non-modifying?
* Is `std::byte` used instead of `unsigned char` for raw byte buffers?
* Do comparisons between signed and unsigned types trigger `-Wsign-compare`?

## Related Concepts

* `move-semantics-gotchas.rst` — lvalue/rvalue taxonomy
* `functions-lambdas.rst` — auto return type deduction
* `structured-bindings.rst` — extended binding examples
* `uniform-initialization.rst` — full initialization deep-dive
