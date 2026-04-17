# Day 01: Variables, Types, and Constexpr

## Why This Day Matters
Choosing the right type and initializing it safely eliminates an entire category of runtime bugs before the program runs. The C++ type system is your most powerful tool for expressing invariants, and `constexpr` moves computation from runtime to compile time — free performance with no trade-off.

## Learning Outcomes
By the end of this day you will be able to:
- Explain the difference between `const` and `constexpr` and choose correctly between them.
- Use brace initialization `{}` for all variable declarations to prevent narrowing conversions.
- Write `constexpr` functions and verify they are evaluated at compile time.
- Unpack pairs, tuples, and aggregates with C++17 structured bindings.
- Identify lvalue, prvalue, and xvalue expressions in a code sample.
- Describe what happens when a signed integer overflows and how to detect it with UBSan.

## Key Concepts
- **Brace initialization** — the uniform `{}` syntax that makes narrowing conversions a compile-time error rather than a silent runtime truncation.
- **`constexpr`** — computes values at compile time; stronger guarantee than `const`; replaces `#define` for constants and macros for simple functions.
- **`auto`** — type deduction that eliminates verbosity for iterators and obvious initializers; requires `&` to avoid copying in range-for loops.
- **Structured bindings** — unpacks `std::pair`, `std::tuple`, and aggregates into named variables, replacing `.first` / `.second` / `get<N>` noise.
- **Value categories** — lvalue (named, addressable), prvalue (temporary), xvalue (movable): foundation for understanding move semantics on Day 13.
- **Fixed-width integers** — `std::int32_t`, `std::uint64_t` from `<cstdint>` guarantee exact bit widths across platforms.

## Theory
Types are the backbone of C++. The type system lets the compiler prove correctness, enable optimizations, and catch entire classes of bugs before the program ever runs. Choosing the right type, initializing it correctly, and understanding when a value is known at compile time versus runtime determines the quality of code you write for the rest of the course.

### Fundamental Types
C++ provides a set of built-in types with platform-defined but bounded sizes.

```cpp
#include <cstdint>   // fixed-width types
#include <climits>   // INT_MAX, UINT_MAX, ...

// Prefer fixed-width types whenever bit width matters
std::int32_t  sensor_id   = 42;       // exactly 32 bits, signed
std::uint64_t packet_count = 0;       // exactly 64 bits, unsigned
std::int8_t   flags        = 0x0F;    // exactly 8 bits

// Use native types when performance matters and width is not the concern
int           loop_counter = 0;       // fast integer on this platform
std::size_t   index        = 0;       // correct type for array indices
std::ptrdiff_t diff        = p2 - p1; // correct type for pointer differences

// Floating-point
float       single_precision = 3.14f;  // 32-bit, suffix 'f' avoids narrowing
double      result           = 0.0;    // 64-bit, default for most calculations
long double extended         = 0.0L;   // 80 or 128-bit platform-dependent
```

## Pitfalls
### Uninitialized Variables
Declaring a variable without an initializer and then reading from it before a guaranteed assignment. The value is indeterminate — reading it is undefined behavior.

**BAD code:**
```cpp
#include <iostream>

int main() {
	int result;             // uninitialized: value is garbage
	int x = 5;
	if (x > 10) {
		result = x * 2;
	}
	std::cout << result << '\n';   // UB when x <= 10: reads indeterminate value
}
```

**GOOD code:**
```cpp
#include <iostream>

int main() {
	int result{0};          // explicitly zero-initialized
	int x = 5;
	if (x > 10) {
		result = x * 2;
	}
	std::cout << result << '\n';
}
```
