# Templates + Concepts

## Why Concepts?

Before C++20, constraining templates meant SFINAE — cryptic 50-line error
messages for a simple "T must be comparable" requirement.  Concepts give
a first-class way to express semantic requirements and produce readable
diagnostics.

```cpp
// SFINAE era (C++14) — hard to read and maintain
template <typename T,
          typename = std::enable_if_t<std::is_integral_v<T>>>
T double_it(T v) { return v * 2; }

// Concepts era (C++20) — intent is obvious
template <std::integral T>
T double_it(T v) { return v * 2; }
```

## Concept Syntax

```cpp
// concept Foo = <bool constant expression>
template <typename T>
concept Printable = requires(T v) {
    { std::cout << v } -> std::same_as<std::ostream&>;
};

template <typename T>
concept Arithmetic = std::is_arithmetic_v<T>;   // wrapping type trait

template <typename T>
concept Signed = Arithmetic<T> && std::is_signed_v<T>;  // composition
```

## Four Ways to Constrain a Template

```cpp
// 1. requires clause after template parameters
template <typename T>
requires std::integral<T>
T gcd(T a, T b) { return b == 0 ? a : gcd(b, a % b); }

// 2. Concept as type-parameter constraint
template <std::integral T>
T gcd(T a, T b) { return b == 0 ? a : gcd(b, a % b); }

// 3. Abbreviated function template (C++20 — auto param)
auto gcd(std::integral auto a, std::integral auto b) {
    return b == 0 ? a : gcd(b, a % b);
}

// 4. requires clause after the function signature (trailing)
template <typename T>
T gcd(T a, T b) requires std::integral<T> {
    return b == 0 ? a : gcd(b, a % b);
}
```

## Requires Expressions — Four Kinds

A `requires { ... }` expression evaluates to a bool at compile time.

```cpp
template <typename T>
concept Hashable = requires(T v) {
    // 1. Simple requirement: expression must be well-formed
    v.hash();

    // 2. Type requirement: nested type must exist
    typename T::hash_type;

    // 3. Compound requirement: expression + return-type constraint
    { v.hash() } noexcept -> std::convertible_to<std::size_t>;

    // 4. Nested requirement: additional constraint on T
    requires sizeof(T) <= 64;
};

// Compound requires — most common form:
template <typename T>
concept Comparable = requires(T a, T b) {
    { a == b } -> std::same_as<bool>;
    { a <  b } -> std::same_as<bool>;
    { a != b } -> std::convertible_to<bool>;
};

// Nested requires inside a concept:
template <typename Range>
concept SizedRange = std::ranges::range<Range> &&
    requires(Range& r) {
        { std::ranges::size(r) } -> std::convertible_to<std::size_t>;
        requires !std::is_unbounded_array_v<Range>;
    };
```

## Abbreviated Function Templates

The `auto` keyword in a parameter list creates an implicit template,
and a constrained auto applies a concept:

```cpp
// Unconstrained: equivalent to template<typename T, typename U>
auto add(auto a, auto b) { return a + b; }

// Constrained: each auto independently deduced but must satisfy concept
auto add(std::integral auto a, std::integral auto b) { return a + b; }
// Note: a and b may be different integral types (int + long is OK)

// If you need a and b to be the SAME type, use explicit template param:
template <std::integral T>
T add_same(T a, T b) { return a + b; }
```

## Concept Subsumption

When two overloads are both satisfied, the **more constrained** one wins.
Subsumption rules: concept A subsumes concept B if A's definition contains
B's atomic constraints.

```cpp
template <typename T>
concept Integral = std::is_integral_v<T>;

template <typename T>
concept SignedIntegral = Integral<T> && std::is_signed_v<T>;
// SignedIntegral subsumes Integral (Integral appears in its definition)

template <Integral T>
void process(T v) { std::cout << "integral\n"; }

template <SignedIntegral T>
void process(T v) { std::cout << "signed integral\n"; }

process(42);     // calls SignedIntegral overload (more constrained)
process(42u);    // calls Integral overload

// Subsumption only works through named concepts,
// NOT through equivalent but separately written requires expressions.
// BAD: these two are NOT in subsumption relation:
template <typename T> requires (std::is_integral_v<T>)
void f(T);
template <typename T> requires (std::is_integral_v<T> && std::is_signed_v<T>)
void f(T);   // ambiguous! requires exprs aren't atomic-concept chains
```

## std:: Standard Concepts

| Concept | Satisfied when T is... |
| --- | --- |
| `std::integral<T>` | int, char, long, bool, ... |
| `std::signed_integral<T>` | signed int, long, ... |
| `std::unsigned_integral<T>` | unsigned int, size_t, ... |
| `std::floating_point<T>` | float, double, long double |
| `std::arithmetic<T>` | integral or floating_point |
| `std::same_as<T,U>` | T and U are identical |
| `std::convertible_to<T,U>` | T implicitly converts to U |
| `std::derived_from<D,B>` | D publicly inherits from B |
| `std::invocable<F,Args...>` | F callable with Args |
| `std::regular_invocable<F,Args...>` | invocable + equality preserving |
| `std::predicate<F,Args...>` | invocable returning bool-ish |
| `std::ranges::range<R>` | has begin()/end() |
| `std::ranges::sized_range<R>` | range + size() in O(1) |
| `std::ranges::forward_range<R>` | multipass iteration |
| `std::copyable<T>` | copy-constructible + assignable |
| `std::movable<T>` | move-constructible + assignable |
| `std::regular<T>` | semiregular + equality |

```cpp
// Using std concepts in a custom algorithm:
template <std::ranges::forward_range R,
          std::invocable<std::ranges::range_value_t<R>> Proj>
void transform_inplace(R& range, Proj proj) {
    for (auto& elem : range)
        elem = proj(elem);
}
```

## SFINAE vs Concepts Comparison

| Aspect | SFINAE | Concepts (C++20) |
| --- | --- | --- |
| Syntax | enable_if / void_t | `requires` / concept keyword |
| Error messages | Walls of substitution failures | "T does not satisfy Hashable" |
| Overload resolution | SFINAE removes from set; no ordering | Subsumption picks most specific |
| Constraint visibility | Hidden in template parameter list | Named, documentable, reusable |
| Short-circuit evaluation | No | Yes (requires short-circuits) |
| Nested constraints | Verbose / impossible | requires requires nested expr |
| Backward compatibility | C++11/14/17 codebases | Requires C++20 minimum |

## Writing Reusable Concepts

Design concepts around **semantic roles**, not around which operations
happen to be available:

```cpp
// BAD: syntactic concept — requires "+", says nothing about meaning
template <typename T>
concept HasPlus = requires(T a, T b) { a + b; };

// GOOD: semantic concept — describes a mathematical group element
template <typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::same_as<T>;
    { a - b } -> std::same_as<T>;
    { T{} };      // identity element exists (zero-constructible)
};

// Build composable concept libraries:
template <typename T>
concept EqualityComparable = requires(T a, T b) {
    { a == b } -> std::convertible_to<bool>;
    { a != b } -> std::convertible_to<bool>;
};

template <typename T>
concept LessThanComparable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
};

template <typename T>
concept TotallyOrdered = EqualityComparable<T> && LessThanComparable<T>;
```

## Concept-Based Overload Dispatch

```cpp
template <typename Iter>
concept RandomAccess = std::random_access_iterator<Iter>;

template <typename Iter>
concept ForwardOnly = std::forward_iterator<Iter> && !RandomAccess<Iter>;

template <RandomAccess Iter>
void advance_n(Iter& it, int n) {
    it += n;   // O(1)
}

template <ForwardOnly Iter>
void advance_n(Iter& it, int n) {
    while (n-- > 0) ++it;   // O(n)
}
```

## Pitfalls

**Pitfall 1: requires on separate expressions vs single expression**

```cpp
// BAD: two separate requires clauses — syntax error
template <typename T>
requires std::integral<T>
requires std::signed_integral<T>   // ERROR
void f(T);

// GOOD: combine with &&
template <typename T>
requires std::integral<T> && std::signed_integral<T>
void f(T);
```

**Pitfall 2: Concept satisfaction vs subsumption**

```cpp
// Both overloads satisfiable for int — ambiguous without subsumption
template <typename T> requires std::integral<T>
void g(T);
template <typename T> requires std::integral<T> && std::signed_integral<T>
void g(T);   // NOT more constrained via subsumption (raw requires exprs)!

// Fix: use named concepts that build on each other
template <std::integral T>        void g(T);
template <std::signed_integral T> void g(T);   // subsumes std::integral
```

**Pitfall 3: Over-constraining blocks valid types**

```cpp
// BAD: requires exact same_as<std::string> — rejects std::string_view
template <typename T>
requires std::same_as<T, std::string>
void print(T);

// GOOD: accept anything convertible to string_view
template <std::convertible_to<std::string_view> T>
void print(T);
```

## Cross-References

* `templates-basics.rst` — function/class templates, SFINAE groundwork
* `crtp-static-polymorphism.rst` — constrained CRTP bases
* `ranges-and-views.rst` — std::ranges concepts in pipeline design
* `modern-cpp20-23-cheat.rst` — feature overview including concepts
