# Day 10: Concepts and Constraints (C++20)

## Why This Day Matters

Before C++20, template error messages were infamous. Pass the wrong type to
`std::sort` and the compiler might emit forty lines of nested template errors
pointing deep into library internals — far from the actual mistake.

C++20 **concepts** fix this. A concept is a named compile-time predicate that
constrains template parameters. When a constraint is violated:

- The compiler reports a clear, one-line error at the call site.
- Overload resolution picks the *most constrained* matching overload automatically.
- Code communicates intent — `Sortable T` is self-documenting.

Concepts are not a runtime mechanism. They have zero overhead; they exist only
during compilation.

## Learning Outcomes

After completing this day you will be able to:

- Define a named concept using `requires` expressions with return-type constraints.
- Attach constraints to function and class templates using the `requires` clause and the abbreviated `ConceptName auto` syntax.
- Compose concepts with `&&`, `||`, and negation to express precise requirements.
- Choose the right standard-library concept (`std::integral`, `std::regular`, `std::ranges::range`) for common template constraints.
- Explain why concepts produce better error messages than SFINAE and how subsumption controls overload resolution.

## Key Concepts

- **Concept** — a named compile-time Boolean predicate that constrains a template parameter and enables clear error messages.
- **requires clause** — attaches a concept or Boolean expression to a template or function to gate its participation in overload resolution.
- **requires expression** — the body of a concept; tests whether operations, type members, and return types compile for a given type.
- **Abbreviated function template** — uses `ConceptName auto` as a parameter type instead of an explicit template parameter list.
- **Concept composition** — `&&` and `||` combine concepts; subsumption rules determine which overload wins when multiple constraints match.
- **Subsumption** — if concept A is defined in terms of concept B, A subsumes B; the more constrained overload is preferred without ambiguity.
- **SFINAE** — the pre-C++20 technique using `enable_if` to conditionally exclude template candidates; replaced by concepts for new code.
- **std::regular** — the baseline concept for types usable in generic algorithms: default-constructible, copyable, movable, equality-comparable.

## Theory

### Motivation

Before C++20, template error messages were infamous. Pass the wrong type to
`std::sort` and the compiler might emit forty lines of nested template errors
pointing deep into library internals — far from the actual mistake.

C++20 **concepts** fix this by providing named, composable, self-documenting
compile-time predicates with zero runtime overhead.

### The `requires` Clause

A `requires` clause attaches a constraint to a template or function. The
constraint is a compile-time Boolean expression.

```cpp
#include <concepts>
#include <string>
#include <iostream>

// Constrain with a standard library concept
template <typename T>
requires std::integral<T>
T factorial(T n) {
    return (n <= 1) ? T{1} : n * factorial(n - 1);
}

// factorial(5)   -- OK, int satisfies std::integral
// factorial(5.0) -- ERROR: double does not satisfy std::integral
//                   Compiler says: "constraints not satisfied" at the call site

// requires clause with a compound predicate
template <typename T>
requires std::integral<T> || std::floating_point<T>
T square(T v) { return v * v; }

// Inline requires — after the template parameter list
template <typename T>
T cube(T v) requires std::is_arithmetic_v<T> {
    return v * v * v;
}
```

### Defining Your Own Concepts

A concept is defined with the `concept` keyword. The body is a `requires`
expression that tests whether the type satisfies certain syntactic and semantic
requirements.

```cpp
#include <concepts>
#include <string>
#include <sstream>

// Concept: T must support operator<< to std::ostream
template <typename T>
concept Printable = requires(T v, std::ostream& os) {
    { os << v } -> std::same_as<std::ostream&>;
};

// Concept: T must have .size() returning something convertible to size_t
template <typename T>
concept Sizeable = requires(T t) {
    { t.size() } -> std::convertible_to<std::size_t>;
};

// Concept: T is a container — has begin(), end(), and size()
template <typename T>
concept Container = requires(T t) {
    { t.begin()  } -> std::input_or_output_iterator;
    { t.end()    } -> std::sentinel_for<decltype(t.begin())>;
    { t.size()   } -> std::convertible_to<std::size_t>;
    requires std::copy_constructible<T>;
};

// Use the concept
template <Printable T>
void print(const T& v) {
    std::cout << v << '\n';
}

template <Container C>
void print_all(const C& c) {
    for (const auto& elem : c)
        std::cout << elem << ' ';
    std::cout << '\n';
}

// print("hello");           // OK: string literals support <<
// print(std::vector<int>{}); // ERROR: vector<int> does not satisfy Printable
```

### Abbreviated Function Templates

C++20 adds abbreviated syntax: using `auto` as a parameter type creates a
function template, and a concept name before `auto` constrains it.

```cpp
#include <concepts>

// Abbreviated: equivalent to template <typename T> T add(T a, T b)
auto add(auto a, auto b) { return a + b; }

// Constrained abbreviated syntax
std::integral auto add_ints(std::integral auto a, std::integral auto b) {
    return a + b;
}

// Return type constraint: the result must satisfy std::integral
std::integral auto double_it(std::integral auto n) {
    return n * 2;
}

add_ints(1, 2);       // OK
// add_ints(1.0, 2.0); // ERROR: double does not satisfy std::integral
```

### Concept Composition: `&&` and `||`

Concepts compose naturally using `&&` (conjunction) and `||` (disjunction).

```cpp
#include <concepts>
#include <iterator>

// Conjunction: T must be both integral and signed
template <typename T>
concept SignedIntegral = std::integral<T> && std::is_signed_v<T>;

// Disjunction: T is either integral or floating-point
template <typename T>
concept Arithmetic = std::integral<T> || std::floating_point<T>;

// Negation: T is not a pointer
template <typename T>
concept NotPointer = !std::is_pointer_v<T>;

// Complex composition
template <typename T>
concept SortableRange = std::ranges::random_access_range<T>
                     && std::sortable<std::ranges::iterator_t<T>>;

template <SortableRange R>
void my_sort(R& r) {
    std::ranges::sort(r);
}

// std::vector<int> v{3,1,2}; my_sort(v);  -- OK
// std::list<int>   l{3,1,2}; my_sort(l);  -- ERROR: list is not random-access
```

### Standard Library Concepts

The `<concepts>` and `<iterator>` headers provide a rich vocabulary.

| Concept | Meaning |
|---------|---------|
| `std::same_as<T, U>` | T and U are the same type |
| `std::derived_from<D, B>` | D is publicly derived from B |
| `std::convertible_to<From, To>` | From converts implicitly to To |
| `std::integral<T>` | T is an integral type |
| `std::floating_point<T>` | T is a floating-point type |
| `std::copy_constructible<T>` | T can be copy-constructed |
| `std::move_constructible<T>` | T can be move-constructed |
| `std::invocable<F, Args...>` | F is callable with Args |
| `std::regular<T>` | T is copyable, movable, default-constructible, and equality-comparable |
| `std::ranges::range<T>` | T has begin() and end() |
| `std::ranges::sized_range<T>` | range with O(1) size() |

```cpp
#include <concepts>
#include <ranges>
#include <vector>

// Accept any range whose elements are printable
template <std::ranges::range R>
requires Printable<std::ranges::range_value_t<R>>
void dump(const R& r) {
    for (const auto& elem : r) std::cout << elem << ' ';
    std::cout << '\n';
}

std::vector<int> v{1, 2, 3};
dump(v);  // OK
```

### SFINAE vs Concepts — Why Concepts Win

**SFINAE** (Substitution Failure Is Not An Error) was the pre-C++20 technique for
constraining templates. It works by exploiting the fact that template substitution
failure is not an error — it just removes the candidate.

```cpp
#include <type_traits>

// SFINAE approach — cryptic and error-prone
template <typename T,
          typename = std::enable_if_t<std::is_integral_v<T>>>
T old_factorial(T n) {
    return (n <= 1) ? T{1} : n * old_factorial(n - 1);
}

// Concepts approach — clear, readable, better errors
template <std::integral T>
T factorial(T n) {
    return (n <= 1) ? T{1} : n * factorial(n - 1);
}
```

| SFINAE | Concepts |
|--------|----------|
| `enable_if_t<..., void*> = nullptr` | `requires std::integral<T>` |
| 50+ line error messages | "constraints not satisfied" — 1 line |
| No overload ordering | Most-constrained wins automatically |
| Cannot be named / reused easily | Named, composable, self-documenting |
| Works in C++11 | Requires C++20 |

**Subsumption**: when two overloads satisfy a call, the compiler picks the one whose
constraints *subsume* (are a stricter version of) the other's.

```cpp
template <std::integral T>
void process(T v) { std::cout << "integral\n"; }

template <std::signed_integral T>  // signed_integral subsumes integral
void process(T v) { std::cout << "signed integral\n"; }

process(42);   // "signed integral" — more constrained wins
process(42u);  // "integral"        — unsigned not signed, less constrained wins
```

## Pitfalls

### Pitfall 1: Writing a requires Expression That Always Succeeds

**Description**: A requires expression that only tests whether an expression is
well-formed, without checking the *result type*, may pass for types you did not
intend to accept.

**BAD**

```cpp
template <typename T>
concept Addable = requires(T a, T b) {
    a + b;   // Only checks that + compiles — does NOT check the return type!
};

struct Weird {
    void operator+(const Weird&) {}  // returns void
};

template <Addable T>
T sum(T a, T b) { return a + b; }  // Will try to return void for Weird!
// sum(Weird{}, Weird{});  -- compiles despite being nonsense
```

**GOOD**

```cpp
template <typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::same_as<T>;    // result must be T
};

// Or more flexible:
template <typename T>
concept Addable2 = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

// Now Weird fails the concept check because void is not convertible to Weird.
```

**Detection tip**: Always use the `{ expr } -> ReturnConcept` form when the return
type matters. Bare expressions only test compilability.

### Pitfall 2: Concept Overload Ambiguity — Not All Constraints Subsume

**Description**: Two overloads with different but unrelated concepts cause ambiguity
because neither subsumes the other.

**BAD**

```cpp
// process(42);  // AMBIGUOUS: int satisfies both, but neither subsumes the other
// because (std::is_signed_v<T>) is a raw bool expression, not a named concept.
```

**Why it fails**: Subsumption only works between atomic concept-id constraints.
A raw `requires (bool_expression)` is opaque to the subsumption rules.

**GOOD**

```cpp
template <typename T>
concept MySignedIntegral = std::integral<T> && std::is_signed_v<T>;
// MySignedIntegral subsumes std::integral — named concepts compose properly

template <std::integral T>
void process(T v) { std::cout << "integral\n"; }

template <MySignedIntegral T>
void process(T v) { std::cout << "signed integral\n"; }

process(42);    // "signed integral" — MySignedIntegral subsumes std::integral
process(42u);   // "integral"
```

**Detection tip**: Ambiguity errors about multiple candidates matching a template
call often mean the constraints are not in a subsumption relationship. Wrap raw
`is_*` predicates in named concepts.

### Pitfall 3: Confusing Semantic and Syntactic Requirements

**Description**: A concept that only checks syntax (operations compile) can be
satisfied by types that meet the syntax but violate the semantic intent.

**BAD**

```cpp
template <typename T>
concept Comparable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
};

struct BrokenLess {
    bool operator<(const BrokenLess&) const { return true; }
    // Always returns true — violates strict weak ordering
};
```

**GOOD**

```cpp
// Document the semantic contract clearly in the concept definition
// (C++ concepts can only check syntax; semantics must be documented)
template <typename T>
concept StrictlyComparable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
    { a == b } -> std::convertible_to<bool>;
    // SEMANTIC CONTRACT (cannot be enforced syntactically):
    // < must be a strict weak ordering
    // == must be an equivalence relation
};
// Use std::totally_ordered from <concepts> for the strongest standard concept

template <std::totally_ordered T>
void sort_range(std::vector<T>& v) {
    std::sort(v.begin(), v.end());
}
```

**Detection tip**: Prefer standard concepts (`std::totally_ordered`, `std::regular`)
that carry documented semantic requirements over hand-rolled syntax-only checks.

### Pitfall 4: Using `requires requires` Unnecessarily

**Description**: Writing `requires requires(T t) { ... }` (double requires) in a
template declaration is verbose and hard to read. It usually means the constraint
should be a named concept.

**BAD**

```cpp
template <typename T>
requires requires(T t) {
    { t.size()   } -> std::convertible_to<std::size_t>;
    { t.begin()  };
    { t.end()    };
}
void print_container(const T& c) { /* ... */ }
```

**GOOD**

```cpp
template <typename T>
concept BasicContainer = requires(T t) {
    { t.size()  } -> std::convertible_to<std::size_t>;
    { t.begin() };
    { t.end()   };
};

template <BasicContainer T>
void print_container(const T& c) { /* ... */ }
// Error messages now say "T does not satisfy BasicContainer"
```

**Detection tip**: Every time you write `requires requires`, ask whether the inner
expression should be extracted into a named concept.

### Pitfall 5: Concept Applied to Wrong Template Parameter

**Description**: Applying a concept constraint to the wrong parameter (e.g., the
return type parameter) causes confusing errors or silently accepts wrong types.

**BAD**

```cpp
// Intention: constrain the VALUE type of the range
template <std::ranges::range R>
void print_ints(const R& range) {
    for (auto v : range)
        std::cout << v;  // Compiles even if v is std::string — no constraint
}
```

**GOOD**

```cpp
template <std::ranges::range R>
requires std::integral<std::ranges::range_value_t<R>>
void print_ints(const R& range) {
    for (auto v : range)
        std::cout << v << ' ';
}

// Or using a composed concept:
template <typename R>
concept IntRange = std::ranges::range<R>
                && std::integral<std::ranges::range_value_t<R>>;

template <IntRange R>
void print_ints_v2(const R& range) {
    for (auto v : range) std::cout << v << ' ';
}
```

**Detection tip**: When a constrained template still compiles for unexpected types,
check whether the constraint is applied to the parameter you think it is, and whether
you need to constrain the associated types (iterator, value type) as well.

## Code Example

```cpp
#include <concepts>
#include <iostream>

template <typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

template <Addable T>
T combine(T a, T b) {
    return a + b;
}

int main() {
    std::cout << "Day 10 - Concepts and Constraints\n";
    std::cout << combine(10, 20) << "\n";
    return 0;
}
```
