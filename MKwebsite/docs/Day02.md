# Day 02: Functions and Lambdas

## Why This Day Matters
Functions define your program's interface to itself. Getting parameter passing right eliminates unnecessary copies; understanding lambdas unlocks the full power of the standard algorithms. After this day you will write functions that are safe, efficient, and composable.

## Learning Outcomes
By the end of this day you will be able to:
- Choose the correct parameter passing convention (value, `const&`, `&&`, pointer) for any given argument type and usage pattern.
- Write lambdas with explicit capture lists and explain the lifetime implications of each mode.
- Explain when `std::function` is appropriate and when a template callable is preferable.
- Use `[[nodiscard]]` to enforce that callers handle return values.
- Compose higher-order functions (filter, transform, accumulate) using lambdas and standard algorithms.
- Write a `mutable` lambda and explain what it changes about the generated closure type.

## Key Concepts
- **Parameter passing conventions** — value, `const&`, `&`, `&&`, and pointer: each communicates ownership and mutability intent to the reader.
- **Lambda capture modes** — `[=]` copies, `[&]` references, mixed, and `[*this]` for safe capture of `*this` in asynchronous contexts.
- **`mutable` lambda** — removes the implicit `const` from the call operator, allowing modification of value-captured copies.
- **Generic lambda** — `auto` or template parameters that make the lambda work across types, equivalent to a templated `operator()`.
- **`std::function`** — type-erased callable storage; pay the virtual dispatch cost only at runtime-polymorphic API boundaries.
- **`[[nodiscard]]`** — attribute that forces callers to use return values, preventing silent error discard.

## Theory
Functions are the primary unit of abstraction in C++. Getting their signatures right — parameter passing conventions, return types, overloading rules — determines whether your code is safe, efficient, and easy to reason about. Lambdas bring closures and local higher-order functions to C++, enabling expressive algorithm use without the boilerplate of named function objects.

### Function Signatures and Parameter Passing
The single most impactful decision in a function signature is how to pass each parameter.

```cpp
#include <string>
#include <vector>

// Pass by value: the function gets its own copy.
// Use when: the function needs to modify the data independently,
//           or when the type is cheap to copy (int, float, small structs).
void greet(std::string name) {
	name += " Smith";   // modifies the local copy only
}

// Pass by const reference: no copy, read-only.
// Use for: large objects you only read (strings, vectors, custom types).
void print_report(const std::vector<int>& data) {
	for (int v : data) { /* read-only */ }
}

// Pass by non-const reference: caller's object is modified.
```

## Pitfalls
### Capturing a Dangling Reference in a Lambda
Capturing a local variable by reference in a lambda that outlives the scope where that variable was defined. When the lambda is later invoked, the reference is dangling.

**BAD code:**
```cpp
#include <functional>
#include <iostream>

std::function<int()> make_counter() {
	int count = 0;                      // local variable on the stack
	return [&count]() { return ++count; };  // captures by reference
}   // count is destroyed here

int main() {
	auto counter = make_counter();
	std::cout << counter() << '\n';     // UB: reads destroyed local variable
}
```

**GOOD code:**
```cpp
#include <functional>
#include <iostream>

std::function<int()> make_counter() {
	int count = 0;
	return [count]() mutable { return ++count; }; // captures by value
}

int main() {
	auto counter = make_counter();
	std::cout << counter() << '\n'; // OK: count is a copy in the lambda
}
```
