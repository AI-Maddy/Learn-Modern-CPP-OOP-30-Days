# Day 12: Ranges and Views (C++20)

## Why This Day Matters

The classic STL algorithm model is powerful but verbose. Composing three steps —
filter, transform, take — requires three separate passes, three temporary containers,
and three pairs of begin/end iterators.

C++20 **ranges** and **views** turn this into a single lazy pipeline with no
intermediate allocations. Elements are produced on demand, enabling infinite ranges,
zero-copy pipelines, and declarative data transformations.

## Learning Outcomes

After completing this day you will be able to:

- Build a multi-step `std::ranges::views` pipeline using `|` and explain why no intermediate containers are created.
- Use `filter`, `transform`, `take`, `drop`, `reverse`, and `iota` adaptors in isolation and in combination.
- Explain the difference between an owning range and a non-owning view, and identify when a view will dangle.
- Write a custom range adaptor with its own iterator type that integrates with the `|` pipe syntax.
- Describe how lazy evaluation works at the iterator level and why infinite ranges are safe with `take`.

## Key Concepts

- **Range** — any type with `begin()` and `end()`; may own its elements.
- **View** — a lightweight, lazily-evaluated, non-owning window over a range; cheap to compose but must not outlive its source.
- **Range adaptor** — an object that, when piped a range, returns a view; examples: `filter`, `transform`, `take`, `drop`, `reverse`.
- **Lazy evaluation** — each adaptor records what to do; elements are produced only when the iterator is advanced, enabling infinite and zero-copy pipelines.
- **Pipe operator** `|` — chains adaptors: `range | adaptor1 | adaptor2` creates a composed view without any copying.
- **Owning vs non-owning** — a container owns its elements; a view borrows them; a dangling view (source destroyed) is undefined behaviour.
- **`iota`** — a view that generates an arithmetic sequence, optionally infinite.
- **Custom adaptor** — a view class + closure object that plugs into the pipeline via `operator|`.

## Theory

### Motivation

The classic STL algorithm model requires multiple passes and temporary containers.

```cpp
// Pre-ranges: three allocations, three loops
std::vector<int> evens, doubled, first5;
std::copy_if(data.begin(), data.end(), std::back_inserter(evens),
             [](int x){ return x % 2 == 0; });
std::transform(evens.begin(), evens.end(), std::back_inserter(doubled),
               [](int x){ return x * 2; });
first5.assign(doubled.begin(),
              doubled.begin() + std::min<int>(5, doubled.size()));
```

C++20 **ranges** and **views** turn this into a single lazy pipeline:

```cpp
namespace rv = std::ranges::views;
auto result = data
    | rv::filter([](int x){ return x % 2 == 0; })
    | rv::transform([](int x){ return x * 2; })
    | rv::take(5);
// No temporary containers.  Elements are produced on demand.
```

### The `std::ranges::views` Pipeline

The pipe operator `|` chains range adaptors. Each adaptor returns a **view** — a
lightweight object that describes *how* to iterate, without storing any elements.

```cpp
#include <ranges>
#include <vector>
#include <iostream>
#include <algorithm>

namespace rv = std::ranges::views;
namespace rg = std::ranges;

std::vector<int> nums{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

// Pipeline: keep even numbers, double them, take first 3
auto pipeline = nums
    | rv::filter([](int n){ return n % 2 == 0; })
    | rv::transform([](int n){ return n * 2; })
    | rv::take(3);

for (int v : pipeline)
    std::cout << v << ' ';   // 4 8 12
// nums was never modified; no temporaries were created

// Materialise into a vector when you need ownership
std::vector<int> results;
rg::copy(pipeline, std::back_inserter(results));
```

### Lazy Evaluation

A view does no work when it is created. Work happens only when the view is iterated.
This means:

- Unused elements cost nothing.
- You can build arbitrarily long pipelines with zero intermediate memory.
- Pipelines can operate on infinite ranges.

```cpp
// Infinite range of natural numbers
auto naturals = rv::iota(1);  // 1, 2, 3, 4, ...

// Take first 5 primes — computed lazily
auto is_prime = [](int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; ++i)
        if (n % i == 0) return false;
    return true;
};

auto first_5_primes = naturals
    | rv::filter(is_prime)
    | rv::take(5);

for (int p : first_5_primes)
    std::cout << p << ' ';  // 2 3 5 7 11
// rv::iota(1) is infinite; rv::take(5) stops after 5 elements
```

Lazy pipeline execution diagram:

```
nums:  1  2  3  4  5  6  7  8  9 10
       │
  filter(even)
       │  2     4     6     8    10
       │
  transform(×2)
       │  4     8    12    16    20
       │
  take(3)
       │  4     8    12
       │
  for loop pulls → iterator advances only 3 elements
```

### Core Range Adaptors

**filter** — yield only elements matching a predicate

```cpp
auto positives = data | rv::filter([](int x){ return x > 0; });
```

**transform** — apply a function to each element

```cpp
auto squares = data | rv::transform([](int x){ return x * x; });
```

**take** / **drop** — first/after-first N elements

```cpp
auto first10 = data | rv::take(10);
auto after10 = data | rv::drop(10);
```

**take_while** / **drop_while** — conditional take/drop

```cpp
auto head = data | rv::take_while([](int x){ return x < 100; });
```

**reverse** — iterate backwards

```cpp
auto rev = data | rv::reverse;   // requires bidirectional range
```

**keys** / **values** — extract first/second from pair ranges

```cpp
std::map<std::string, int> scores{{"Alice", 90}, {"Bob", 75}};
for (const auto& name : scores | rv::keys)
    std::cout << name << '\n';
```

**zip** (C++23) — iterate two ranges in lockstep

```cpp
// C++23
std::vector<int>         ids{1, 2, 3};
std::vector<std::string> names{"a", "b", "c"};
for (auto [id, name] : rv::zip(ids, names))
    std::cout << id << ':' << name << '\n';
```

**iota** — integer sequence (possibly infinite)

```cpp
auto squares_to_10 = rv::iota(1, 11)
    | rv::transform([](int x){ return x * x; });
```

### Owning vs Non-Owning Ranges

A **view** does not own its elements — it borrows them from a range. This is
critical for lifetime management.

```cpp
// SAFE: view borrows from a named vector whose lifetime exceeds the view's
std::vector<int> v{1, 2, 3, 4, 5};
auto view = v | rv::filter([](int x){ return x > 2; });
for (int x : view) std::cout << x;  // OK

// DANGER: view borrows from a temporary — the temporary is destroyed
auto bad_view = std::vector<int>{1,2,3} | rv::filter([](int x){ return x>0; });
// bad_view's underlying data is already destroyed at the semicolon!
// Using bad_view is undefined behaviour.

// SAFE: use rv::all on a temporary via std::ranges::owning_view (C++23)
// or materialise immediately
auto safe = std::vector<int>{1,2,3}
    | rv::filter([](int x){ return x > 0; })
    | rg::to<std::vector>();   // C++23 materialise
```

### Writing a Custom Range Adaptor

A range adaptor is an object that, when piped a range, returns a view. The minimal
approach for C++20 is to write a view class and a range closure object.

```cpp
#include <ranges>

// Custom view: stride — yield every Nth element
template <std::ranges::input_range R>
class stride_view : public std::ranges::view_interface<stride_view<R>> {
    R           base_;
    std::size_t stride_;

    struct iterator {
        std::ranges::iterator_t<R> current_;
        std::ranges::sentinel_t<R> end_;
        std::size_t                stride_;

        using value_type      = std::ranges::range_value_t<R>;
        using difference_type = std::ptrdiff_t;
        using iterator_concept = std::input_iterator_tag;

        iterator& operator++() {
            for (std::size_t i = 0; i < stride_ && current_ != end_; ++i)
                ++current_;
            return *this;
        }
        value_type operator*() const { return *current_; }
        bool operator==(std::default_sentinel_t) const {
            return current_ == end_;
        }
    };

public:
    stride_view(R r, std::size_t s) : base_(std::move(r)), stride_(s) {}
    auto begin() {
        return iterator{std::ranges::begin(base_),
                        std::ranges::end(base_), stride_};
    }
    auto end() { return std::default_sentinel; }
};

// Helper closure for pipe syntax
struct stride_fn {
    std::size_t n_;
    template <std::ranges::input_range R>
    auto operator()(R&& r) const {
        return stride_view<std::views::all_t<R>>{
            std::views::all(std::forward<R>(r)), n_};
    }
};

auto stride(std::size_t n) { return stride_fn{n}; }

template <std::ranges::input_range R>
auto operator|(R&& r, stride_fn fn) {
    return fn(std::forward<R>(r));
}

// Usage:
// std::vector<int> v{0,1,2,3,4,5,6};
// for (int x : v | stride(2)) ...  // 0, 2, 4, 6
```

## Pitfalls

### Pitfall 1: View Over a Temporary — Dangling Iterator

**Description**: Piping a temporary container into a view and then using the view
after the temporary has been destroyed causes undefined behaviour.

**BAD**

```cpp
#include <ranges>
#include <vector>

namespace rv = std::ranges::views;

// get_data() returns a temporary vector
std::vector<int> get_data() { return {1, 2, 3, 4, 5}; }

// BAD: the temporary vector is destroyed after the semicolon
auto view = get_data() | rv::filter([](int x){ return x > 2; });

// At this point, the temporary vector no longer exists.
for (int x : view)  // UB: iterating through dangling iterators
    std::cout << x;
```

**GOOD**

```cpp
// Option A: give the container a name (extend its lifetime)
auto data = get_data();
auto view = data | rv::filter([](int x){ return x > 2; });
for (int x : view) std::cout << x;  // safe: data outlives view

// Option B: materialise immediately using a range algorithm
namespace rg = std::ranges;
std::vector<int> result;
rg::copy(get_data() | rv::filter([](int x){ return x > 2; }),
         std::back_inserter(result));  // safe: copy happens before temp dies
```

**Detection tip**: Clang's `-Wdangling` and AddressSanitizer will often catch
dangling view bugs at runtime. The rule: if a view is used after the statement that
creates it, its source must be a named variable.

### Pitfall 2: Modifying a Container While Iterating a View

**Description**: Adding or removing elements from a container that an active view
refers to invalidates the view's iterators.

**BAD**

```cpp
std::vector<int> v{1, 2, 3, 4, 5};
auto even_view = v | rv::filter([](int x){ return x % 2 == 0; });

for (int x : even_view) {
    v.push_back(x * 2);   // BAD: push_back may reallocate v
                           // even_view's iterators are now dangling
}
```

**GOOD**

```cpp
std::vector<int> v{1, 2, 3, 4, 5};

// Materialise the view results before modifying the container
std::vector<int> evens;
std::ranges::copy(v | rv::filter([](int x){ return x % 2 == 0; }),
                  std::back_inserter(evens));

// Now safe to append to v
for (int x : evens)
    v.push_back(x * 2);
```

**Detection tip**: Any time you write to a container inside a loop that reads from a
view of that container, pause and check whether the write can trigger reallocation.
`reserve` before the loop if the container size is known.

### Pitfall 3: Infinite Range Without `take` — Hanging Program

**Description**: Materialising or iterating an infinite range without a stopping
condition causes the program to loop forever.

**BAD**

```cpp
namespace rv = std::ranges::views;

// iota(0) generates 0, 1, 2, 3, ... forever
std::vector<int> all_naturals;
std::ranges::copy(rv::iota(0),
                  std::back_inserter(all_naturals));  // INFINITE LOOP
```

**GOOD**

```cpp
// Always bound infinite ranges before materialising
std::vector<int> first_100;
std::ranges::copy(rv::iota(0) | rv::take(100),
                  std::back_inserter(first_100));

// Or iterate lazily with an explicit stop condition
for (int n : rv::iota(0) | rv::take_while([](int n){ return n < 100; }))
    std::cout << n << ' ';
```

**Detection tip**: Treat `rv::iota` with a single argument like an unbounded
generator. Any use of it must be combined with `take`, `take_while`, or another
finite bounding adaptor before materialisation or full iteration.

### Pitfall 4: Assuming a View Is Free to Copy

**Description**: Some views (notably `filter_view`) cache the iterator to `begin`
internally and are not cheap to copy. Passing them by value can cause subtle issues.

**GOOD**

```cpp
// Pass views by const reference when sharing across multiple consumers
auto filtered = some_vector | rv::filter(expensive_predicate);

auto consume = [](const auto& view) {
    for (auto x : view) { /* ... */ }
};

consume(filtered);   // no copy — uses the same cached begin()
```

**Detection tip**: Prefer passing views as template parameters (`auto&&`) or
`const auto&` to avoid unnecessary copies. Materialise to a container if you
need truly independent iteration.

### Pitfall 5: `rv::transform` with Mutating Lambdas — Unexpected State

**Description**: A transform lambda that captures a mutable counter can be called
multiple times per element if the view is iterated more than once, because views
are lazy and re-evaluate on each traversal.

**BAD**

```cpp
namespace rv = std::ranges::views;

int count = 0;
std::vector<int> v{1, 2, 3};

auto indexed = v | rv::transform([&count](int x) {
    return std::make_pair(count++, x);  // count incremented each time!
});

for (auto [i, x] : indexed) std::cout << i << ':' << x << '\n';
// count is now 3
for (auto [i, x] : indexed) std::cout << i << ':' << x << '\n';
// count is now 6 — indices are 3,4,5 not 0,1,2!
```

**GOOD**

```cpp
// Option A: materialise to a vector on the first pass
std::vector<std::pair<int, int>> indexed_data;
int count = 0;
for (int x : v)
    indexed_data.emplace_back(count++, x);

// Option B: use rv::enumerate (C++23) for index + value
for (auto [i, x] : v | rv::enumerate)
    std::cout << i << ':' << x << '\n';
```

**Detection tip**: Lambdas captured by reference inside views should be stateless or
idempotent. Mutable captured state in a view transform is almost always a bug.

## Code Example

```cpp
#include <iostream>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> nums{1, 2, 3, 4, 5, 6};
    auto pipeline = nums
        | std::views::filter([](int x) { return x % 2 == 0; })
        | std::views::transform([](int x) { return x * x; });

    std::cout << "Day 12 - Ranges and Views\n";
    for (int value : pipeline) {
        std::cout << value << ' ';
    }
    std::cout << "\n";
    return 0;
}
```
