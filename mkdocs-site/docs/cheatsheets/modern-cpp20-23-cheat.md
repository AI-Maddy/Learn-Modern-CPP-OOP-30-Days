---
title: "Modern Cpp20 23 Cheat"
tags: ["cheatsheet", "reference"]
---

# :material-book: Modern Cpp20 23 Cheat


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Modern C++20/23 Quick Reference

<div class="contents" local="" depth="2">

Sections

</div>

## C++20 Feature Overview

| Feature                                                       | Purpose                                    |
|---------------------------------------------------------------|--------------------------------------------|
| Concepts                                                      | Named constraints on template parameters   |
| Ranges / Views                                                | Composable lazy pipelines over sequences   |
| Coroutines                                                    | Suspendable functions (generators, async)  |
| Modules                                                       | Faster compilation, no include order bugs  |
| Spaceship operator                                            | Three-way comparison, auto-derives all ops |
| std::span                                                     | Non-owning view over contiguous data       |
| std::jthread                                                  | RAII-safe thread with stop token           |
| std::atomic_ref                                               | Atomic operations on non-atomic variables  |
| \[\[no_unique_address\]\]\| Zero-cost empty member storage \| |                                            |
| Designated init                                               | Named member initializers in aggregates    |
| consteval / constinit\| Stronger compile-time guarantees \|   |                                            |
| std::format                                                   | Type-safe, Python-style string formatting  |
| Calendar / timezone                                           | std::chrono calendar types \|              |

## Concepts (C++20)

``` cpp
// Define a concept
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

// Apply at function parameter level
auto square(Numeric auto x) { return x * x; }

// Apply in template parameter list
template <std::ranges::range R>
auto sum(R&& r) { return std::ranges::fold_left(r, 0, std::plus{}); }
```

## Ranges and Views (C++20)

``` cpp
namespace views = std::views;

std::vector<int> v{1,2,3,4,5,6,7,8,9,10};

// Compose lazy pipeline
auto result = v
    | views::filter([](int x){ return x % 2 == 0; })
    | views::transform([](int x){ return x * x; })
    | views::take(3);
// result is 4, 16, 36

// Range algorithms with projection
std::ranges::sort(v, std::greater{});   // descending
std::ranges::sort(people, {}, &Person::age);  // by field
```

## Coroutines: co_await and co_yield (C++20)

Coroutines need a promise_type in the return type. Use a library (cppcoro, Asio, or your own) for the boilerplate in practice.

``` cpp
// Generator pattern (simplified; real code needs promise_type)
#include <generator>   // P2502 — available in libc++ experimental

std::generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto c = a + b;
        a = b;
        b = c;
    }
}

for (int n : fibonacci() | std::views::take(10))
    std::cout << n << ' ';   // 0 1 1 2 3 5 8 13 21 34

// Async coroutine skeleton (requires an executor framework):
Task<int> fetch_data(std::string url) {
    auto response = co_await http_get(url);  // suspend; resume when done
    co_return parse_int(response.body);
}

// co_await: suspend and resume when awaitable is ready
// co_yield: produce a value and suspend
// co_return: return final value and destroy coroutine frame
```

## Modules (C++20)

``` cpp
// --- math.cppm (module interface unit) ---
export module math;

export int add(int a, int b) { return a + b; }
export template <typename T> T square(T x) { return x * x; }

// Not exported — private to the module
int helper(int x) { return x * 2; }

// --- main.cpp ---
import math;          // no header needed; faster than #include
import <iostream>;    // import standard library header units (C++23)

int main() {
    std::cout << add(3, 4) << '\n';
    std::cout << square(5) << '\n';
}
```

| Aspect        | Headers (#include)         | Modules (import)         |
|---------------|----------------------------|--------------------------|
| Compilation   | Re-parsed every TU         | Compiled once to BMI     |
| Macro leakage | Yes (macros bleed through) | No (macros don't export) |
| Include order | Can cause ODR issues       | Order-independent        |
| Build speed   | Slow (large headers)       | Fast (BMI cache)         |

## Spaceship Operator \<=\> (C++20)

``` cpp
struct Version {
    int major, minor, patch;

    // Define <=> and == — compiler derives <, <=, >, >= automatically
    auto operator<=>(const Version&) const = default;
    bool operator==(const Version&)  const = default;
};

Version v1{1, 2, 3}, v2{1, 3, 0};
assert(v1 < v2);    // uses generated <
assert(v1 != v2);   // uses generated !=

// Return type categories:
// std::strong_ordering  — int-like (equality implies substitutability)
// std::weak_ordering    — float-like (NaN != NaN)
// std::partial_ordering — partial (some pairs incomparable)

// Custom ordering:
struct CaseInsensitive {
    std::string s;
    std::strong_ordering operator<=>(const CaseInsensitive& o) const {
        return std::lexicographical_compare_three_way(
            s.begin(), s.end(), o.s.begin(), o.s.end(),
            [](char a, char b){ return std::tolower(a) <=> std::tolower(b); });
    }
    bool operator==(const CaseInsensitive& o) const {
        return (*this <=> o) == std::strong_ordering::equal;
    }
};
```

## std::span (C++20)

``` cpp
void print_all(std::span<const int> data) {
    for (int v : data) std::cout << v << ' ';
}

int arr[5]{1,2,3,4,5};
std::vector<int> vec{6,7,8};
print_all(arr);              // OK
print_all(vec);              // OK
print_all({arr+1, arr+4});   // subspan: {2,3,4}

// Fixed-size span (N known at compile time):
std::span<int, 5> fixed_span{arr};
static_assert(fixed_span.size() == 5);
```

## std::jthread (C++20)

``` cpp
#include <thread>

// jthread joins automatically on destruction (unlike std::thread)
{
    std::jthread worker([](std::stop_token stoken) {
        while (!stoken.stop_requested()) {
            do_work();
        }
    });
    // thread runs here
}   // destructor: requests stop, then joins — no manual join needed

// Request stop from outside:
std::jthread t{worker_fn};
t.request_stop();   // sets stop_token; thread sees stop_requested() == true
// destructor joins automatically
```

## std::atomic_ref (C++20)

``` cpp
// Perform atomic operations on an existing (non-atomic) variable
int shared_counter = 0;   // plain int in shared memory or struct

std::atomic_ref<int> ref{shared_counter};
ref.fetch_add(1, std::memory_order_relaxed);
ref.store(0);
int v = ref.load();

// Use case: legacy API returns int*, you need atomic access
// without changing the struct layout
```

## C++23 Feature Overview

| Feature               | Purpose                                        |
|-----------------------|------------------------------------------------|
| `std::expected<T,E>`  | Value-or-error; functional error handling      |
| `std::print`          | `println("Hello, {}!", name);` — no endl       |
| `std::flat_map`       | Cache-friendly sorted-array-based map          |
| `std::flat_set`       | Cache-friendly sorted-array-based set          |
| Deducing `this`       | Explicit `this` parameter; CRTP simplification |
| `std::mdspan`         | Multidimensional span (views into N-D arrays)  |
| `std::stacktrace`     | Runtime stack trace capture                    |
| `std::generator`      | Standard coroutine generator type \|           |
| `std::ranges::to`     | Materialise any range into a container         |
| Explicit object param | `this` deduction for lambdas and CRTP          |

## std::expected (C++23)

``` cpp
#include <expected>

std::expected<int, std::string> parse(std::string_view s) {
    if (s.empty()) return std::unexpected("empty input");
    return std::stoi(std::string(s));
}

auto r = parse("42").transform([](int n){ return n * 2; })
                     .value_or(0);
```

## std::print / std::println (C++23)

``` cpp
#include <print>

std::print("Hello, {}!\n", "World");     // no newline unless explicit
std::println("x = {}, y = {:.2f}", 3, 3.14159);   // with newline

// Print to stream:
std::println(std::cerr, "error: {}", msg);
```

## std::flat_map (C++23)

``` cpp
#include <flat_map>

std::flat_map<std::string, int> counts;
counts["alpha"]++;
counts["beta"] = 5;

// Internally two sorted vectors: keys[] and values[]
// Better cache locality than std::map (no pointer-per-node)
// O(log n) lookup, O(n) insert/erase (vs O(log n) for map)
// Use when read-heavy; std::map when insert/erase-heavy
```

## Deducing this (C++23)

``` cpp
struct Wrapper {
    int value;

    // Explicit object parameter replaces implicit *this
    // Deduces const-ness and value category automatically
    template <typename Self>
    auto& get(this Self& self) { return self.value; }

    // CRTP-like pattern without CRTP:
    template <typename Self>
    Self& fluent_set(this Self& self, int v) {
        self.value = v;
        return self;   // returns derived type correctly
    }
};

struct DerivedWrapper : Wrapper {};
DerivedWrapper dw;
dw.fluent_set(42).get();   // returns DerivedWrapper& correctly
```

## Feature-Test Macros

Check feature availability without knowing the exact version:

``` cpp
#if __has_include(<expected>)
#  include <expected>
#  define HAS_EXPECTED 1
#endif

#ifdef __cpp_concepts            // >= 201907L for C++20 concepts
#ifdef __cpp_lib_ranges          // >= 201911L for std::ranges
#ifdef __cpp_lib_expected        // >= 202211L for std::expected
#ifdef __cpp_lib_flat_map        // >= 202207L for std::flat_map
#ifdef __cpp_lib_print           // >= 202207L for std::print
#ifdef __cpp_coroutines          // >= 201902L for coroutines
#ifdef __cpp_modules             // >= 201907L for modules

// Usage pattern:
template <typename T>
auto safe_parse(std::string_view s) {
#ifdef __cpp_lib_expected
    return std::expected<T, std::string>{/* ... */};
#else
    return std::optional<T>{/* ... */};  // fallback
#endif
}
```

## Cross-References

- `templates-concepts.rst` — concepts in detail
- `ranges-and-views.rst` — ranges pipeline, view adaptors
- `error-handling-expected.rst` — std::expected monadic ops
- `optional-variant-any.rst` — C++23 optional monadic ops
- `memory-layout-and-object-model.rst` — \[\[no_unique_address\]\], std::byte


---

[← All Cheatsheets](index.md)
