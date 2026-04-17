# Day 29: Advanced Topics Deep Dive

## Why This Day Matters

C++20 introduced features that professionals in game development, embedded
systems, high-frequency trading, and network programming use daily. This
day gives you working knowledge of coroutines, custom memory management,
compile-time programming, and safe type-punning. These are the features
that separate mid-level from senior C++ engineers.

## Learning Outcomes

After completing this day you will be able to:

* Implement a minimal `Generator<T>` coroutine type using `co_yield`
  and explain the roles of the promise type and coroutine handle.
* Explain the difference between `co_yield`, `co_await`, and
  `co_return` and give a use case for each.
* Use `std::pmr::monotonic_buffer_resource` to replace heap allocations
  with stack-backed pool allocations in a container.
* Write a `consteval` function that generates a lookup table baked into
  the binary at compile time, and explain why this beats `constexpr`
  for pure compile-time tables.
* Use `std::bit_cast` for IEEE 754 float bit manipulation without
  invoking undefined behaviour, and articulate why `reinterpret_cast`
  is wrong for the same purpose.
* Apply `constexpr std::sort` and `std::binary_search` to build a
  sorted lookup table verified with `static_assert`.

## Key Concepts

* **co_yield / co_await / co_return** — the three coroutine keywords;
  yield suspends and produces a value; await suspends until a future is
  ready; return terminates and produces the final value.
* **Promise type** — the customisation point that controls coroutine
  lifecycle, suspension behaviour, and return value propagation.
* **std::pmr** — the polymorphic memory resource library; swap allocators
  without recompiling container code.
* **consteval** — stronger than constexpr; guarantees compile-time-only
  evaluation; ideal for lookup tables and static safety checks.
* **std::bit_cast** — standards-conforming type-punning; same-size,
  trivially-copyable types only; fully constexpr.

## Theory

### Motivation

C++20 introduced several features that change the way high-performance and
systems-level code is written. This day covers five topics:

1. **Coroutines** — `co_await`, `co_yield`, `co_return` for asynchronous and lazy computation without callbacks.
2. **Custom allocators** — controlling where and how memory is acquired.
3. **`consteval`** — functions that *must* run at compile time.
4. **`std::bit_cast`** — type-punning without undefined behaviour.
5. **Compile-time algorithms with `constexpr`** — sorting, searching, and computing lookup tables at compile time.

### Coroutines: Concepts

A *coroutine* is a function that can suspend and resume execution.
Unlike threads, suspension is cooperative and happens at explicit
`co_await` / `co_yield` points — no context switch, no mutex.

Three keywords:

* `co_return` — produces the final value and terminates the coroutine.
* `co_yield` — produces an intermediate value and suspends.
* `co_await` — suspends until an awaitable completes.

#### Generator (co_yield)

A generator produces a lazy sequence without storing all values upfront.

```cpp
#include <coroutine>
#include <optional>
#include <stdexcept>

// Minimal generator type
template<typename T>
class Generator {
public:
    struct promise_type {
        std::optional<T> value_;

        Generator get_return_object() {
            return Generator{
                std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_always  initial_suspend() noexcept { return {}; }
        std::suspend_always  final_suspend()   noexcept { return {}; }
        std::suspend_always  yield_value(T v) noexcept {
            value_ = std::move(v);
            return {};
        }
        void return_void()  {}
        void unhandled_exception() { std::rethrow_exception(
                                         std::current_exception()); }
    };

    using handle_type = std::coroutine_handle<promise_type>;

    explicit Generator(handle_type h) : handle_{h} {}
    ~Generator() { if (handle_) handle_.destroy(); }

    // Non-copyable — owns the coroutine handle
    Generator(const Generator&)            = delete;
    Generator& operator=(const Generator&) = delete;
    Generator(Generator&& o) noexcept : handle_{o.handle_} {
        o.handle_ = nullptr;
    }

    bool next() {
        handle_.resume();
        return !handle_.done();
    }

    T value() const {
        return *handle_.promise().value_;
    }

private:
    handle_type handle_;
};

// A coroutine function using co_yield
Generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto next = a + b;
        a = b;
        b = next;
    }
}

// Usage: lazily consume first 10 Fibonacci numbers
void print_fibonacci() {
    auto gen = fibonacci();
    for (int i = 0; i < 10; ++i) {
        gen.next();
        std::cout << gen.value() << ' ';
    }
    // Output: 0 1 1 2 3 5 8 13 21 34
}
```

#### Task (co_await)

`co_await` is used for asynchronous work — the coroutine suspends
until the awaited operation is complete.

```cpp
// Simplified task type — wraps a coroutine that returns one value
template<typename T>
struct Task {
    struct promise_type {
        T result_;
        std::exception_ptr exception_;

        Task get_return_object() {
            return Task{
                std::coroutine_handle<promise_type>::from_promise(*this)};
        }
        std::suspend_never  initial_suspend() noexcept { return {}; }
        std::suspend_always final_suspend()   noexcept { return {}; }

        void return_value(T v) { result_ = std::move(v); }
        void unhandled_exception() {
            exception_ = std::current_exception();
        }
    };

    using handle_type = std::coroutine_handle<promise_type>;
    handle_type handle_;

    explicit Task(handle_type h) : handle_{h} {}
    ~Task() { if (handle_) handle_.destroy(); }

    T get() {
        if (handle_.promise().exception_)
            std::rethrow_exception(handle_.promise().exception_);
        return handle_.promise().result_;
    }
};
```

### Custom Allocators

The default allocator calls `::operator new` for every allocation. In
performance-critical code, custom allocators can use a pre-allocated pool,
stack memory for small allocations, or track all allocations for debugging.

```cpp
#include <memory_resource>
#include <vector>
#include <array>

void demo_pmr_allocator() {
    // Stack buffer — no heap allocation at all
    std::array<std::byte, 4096> buffer;
    std::pmr::monotonic_buffer_resource pool{buffer.data(), buffer.size()};

    // vector uses our pool, not the global heap
    std::pmr::vector<int> v{&pool};
    for (int i = 0; i < 100; ++i)
        v.push_back(i);

    // All memory freed when pool goes out of scope — O(1) deallocation
}

// A pool allocator for a fixed-size object type
template<typename T, std::size_t N>
class PoolAllocator {
public:
    using value_type = T;

    PoolAllocator() : next_{pool_} {}

    T* allocate(std::size_t n) {
        if (n != 1) throw std::bad_alloc{};
        if (next_ >= pool_ + N) throw std::bad_alloc{};
        return next_++;
    }

    void deallocate(T*, std::size_t) noexcept {
        // Monotonic: individual deallocation is a no-op
    }

private:
    T pool_[N];
    T* next_;
};
```

### `consteval`: Compile-Time-Only Functions

`consteval` (C++20) declares a function that *must* be evaluated at
compile time. This is stronger than `constexpr`, which *may* run at either time.

```cpp
#include <stdexcept>

// consteval: MUST execute at compile time
consteval int square(int n) {
    return n * n;
}

constexpr int a = square(5);   // OK: compile-time context
// int x = 5;
// int b = square(x);          // ERROR: x is not constexpr — caught at compile time

// Useful for building lookup tables
consteval auto make_squares_table() {
    std::array<int, 16> t{};
    for (int i = 0; i < 16; ++i)
        t[i] = i * i;
    return t;
}

// The entire table is computed and baked into the binary — zero runtime cost
constexpr auto kSquares = make_squares_table();

void lookup_square(int n) {
    if (n < 16)
        std::cout << kSquares[n] << '\n';  // array access, not multiplication
}
```

### `std::bit_cast`: Safe Type Punning

Before C++20, the only standard-conforming way to reinterpret bytes of one
type as another was `memcpy`. `std::bit_cast` does the same thing but is
evaluated at compile time, statically checked, and undefined-behaviour-free.

```cpp
#include <bit>
#include <cstdint>

// Inspect the bit representation of a float (common in graphics/physics)
constexpr float f = -3.14f;
constexpr std::uint32_t bits = std::bit_cast<std::uint32_t>(f);
// bits holds the IEEE 754 representation of -3.14

// Fast inverse square root (classic game engine trick)
// Traditional version used UB memcpy trick:
//   long i = *(long*)&x;  // undefined behaviour!
// Modern C++20 version:
float fast_inv_sqrt(float x) {
    std::uint32_t i = std::bit_cast<std::uint32_t>(x);
    i = 0x5f3759df - (i >> 1);
    float y = std::bit_cast<float>(i);
    return y * (1.5f - 0.5f * x * y * y);
}
```

### Compile-Time Algorithms with `constexpr`

C++17/20 mark most standard algorithms `constexpr`. You can sort,
search, and compute on arrays entirely at compile time.

```cpp
#include <algorithm>
#include <array>

// Binary search on a sorted compile-time table — O(log n) at runtime
consteval auto make_sorted_primes() {
    std::array<int, 10> primes{2, 3, 5, 7, 11, 13, 17, 19, 23, 29};
    // std::sort is constexpr in C++20
    std::sort(primes.begin(), primes.end());
    return primes;
}

constexpr auto kPrimes = make_sorted_primes();

constexpr bool is_known_prime(int n) {
    // std::binary_search is constexpr
    return std::binary_search(kPrimes.begin(), kPrimes.end(), n);
}

static_assert(is_known_prime(13));   // verified at compile time
static_assert(!is_known_prime(15));  // verified at compile time
```

### Design Tradeoffs

* **Coroutines vs threads**: coroutines are lighter (no kernel context switch,
  no stack per coroutine), but they require cooperative yielding. Threads are
  pre-emptive. Use coroutines for I/O-bound tasks; threads for CPU-bound parallel work.

* **consteval vs constexpr**: `consteval` guarantees compile-time evaluation
  but makes the function unusable at runtime. `constexpr` is more flexible
  but the compiler may choose runtime evaluation in some contexts.

* **Custom allocators**: they add complexity. Profile first. Only adopt a
  custom allocator when you have measured allocation overhead in a hot path.

## Pitfalls

### Pitfall 1: Destroying a Coroutine Handle Twice

**Description**
Calling `handle_.destroy()` on an already-destroyed coroutine handle,
or allowing two owner objects to both call `destroy()`, is undefined behaviour.

**BAD code**

```cpp
Generator<int> gen1 = fibonacci();
Generator<int> gen2 = gen1;  // copy — both gen1 and gen2 own handle_

// When gen1 and gen2 are destroyed, handle_.destroy() is called TWICE — UB
```

**GOOD code**

```cpp
// Delete copy constructor and copy assignment
Generator(const Generator&)            = delete;
Generator& operator=(const Generator&) = delete;

// Move constructor transfers ownership and nulls the source
Generator(Generator&& other) noexcept : handle_{other.handle_} {
    other.handle_ = nullptr;
}

// Destructor checks before destroying
~Generator() {
    if (handle_) handle_.destroy();
}
```

**Detection tip:** AddressSanitizer (`-fsanitize=address`) catches the double-free immediately.

---

### Pitfall 2: Resuming a Finished Coroutine

**Description**
Calling `handle_.resume()` after the coroutine has reached its final
suspension point (`done() == true`) is undefined behaviour.

**BAD code**

```cpp
Generator<int> gen = count_to_three();
while (true) {
    gen.next();                  // eventually reaches done()
    std::cout << gen.value();    // still calling resume() after done — UB
}
```

**GOOD code**

```cpp
Generator<int> gen = count_to_three();
while (gen.next()) {           // next() returns false when done
    std::cout << gen.value();
}
// After the loop, gen.next() returned false — we never resume again
```

---

### Pitfall 3: Using consteval With Runtime-Only Arguments

**Description**
Calling a `consteval` function with a variable whose value is not known
at compile time produces a compile error.

**BAD code**

```cpp
consteval int square(int n) { return n * n; }

int runtime_value = 5;         // not constexpr — value known only at runtime
int result = square(runtime_value);  // COMPILE ERROR: not a constant expression
```

**GOOD code**

```cpp
// Option A: make the input constexpr
constexpr int compile_time_n = 5;
constexpr int result = square(compile_time_n);  // OK

// Option B: use constexpr (not consteval) if runtime usage is needed
constexpr int flexible_square(int n) { return n * n; }
int runtime_value = 5;
int result2 = flexible_square(runtime_value);  // OK at runtime too
```

---

### Pitfall 4: bit_cast on Non-Trivially-Copyable Types

**Description**
`std::bit_cast<T>(src)` requires both types to be the same size and
trivially copyable. Using it with non-trivial types is a compile error.

**BAD code**

```cpp
std::string s = "hello";
auto bits = std::bit_cast<std::array<char, 24>>(s);
// COMPILE ERROR: std::string is not trivially copyable
```

**GOOD code**

```cpp
// bit_cast is for numeric/POD types only
float f = 3.14f;
auto bits = std::bit_cast<std::uint32_t>(f);  // OK: both 4 bytes, trivial

// For string byte access, use string_view or span:
std::string s = "hello";
std::span<const std::byte> bytes{
    reinterpret_cast<const std::byte*>(s.data()), s.size()};
```

---

### Pitfall 5: Allocating in a Coroutine When the Allocator Is a Pool

**Description**
Coroutine frames are allocated on the heap by default using `::operator new`.
On embedded systems or in pool-only environments, this bypasses the pool.

**GOOD code**

```cpp
// Provide operator new/delete in the promise_type to use a pool
struct promise_type {
    static void* operator new(std::size_t n) {
        return my_pool.allocate(n);
    }
    static void operator delete(void* p, std::size_t n) noexcept {
        my_pool.deallocate(p, n);
    }
    // ... rest of promise_type
};
```

---

### Pitfall 6: Ignoring pmr Allocator Lifetime

**Description**
A `std::pmr::vector` holds a non-owning pointer to its memory resource.
If the resource is destroyed before the vector, any subsequent access is undefined behaviour.

**BAD code**

```cpp
std::pmr::vector<int> create_vec() {
    std::array<std::byte, 1024> buf;
    std::pmr::monotonic_buffer_resource pool{buf.data(), buf.size()};
    std::pmr::vector<int> v{&pool};
    for (int i = 0; i < 10; ++i) v.push_back(i);
    return v;  // pool DESTROYED here (local variable end)
               // returned vector's allocator pointer now dangles
}

auto v = create_vec();
v.push_back(11);  // UB: allocator points to destroyed stack memory
```

**GOOD code**

```cpp
// Keep the memory resource alive at least as long as the vector
void demo() {
    std::array<std::byte, 1024> buf;
    std::pmr::monotonic_buffer_resource pool{buf.data(), buf.size()};
    std::pmr::vector<int> v{&pool};   // pool outlives v in this scope
    for (int i = 0; i < 10; ++i) v.push_back(i);
    v.push_back(11);  // OK: pool is still alive
}   // v destroyed first, then pool — correct order
```

**Detection tip:** AddressSanitizer catches use-after-return and use-after-scope for
stack-allocated memory resources.

## Code Example

```cpp
#include <iostream>
#include <string>
#include <variant>

using Value = std::variant<int, double, std::string>;

int main() {
    Value v = std::string{"deep-dive"};
    std::cout << "Day 29 - Advanced Topics Deep Dive\n";
    std::visit([](const auto& item) { std::cout << item << "\n"; }, v);
    return 0;
}
```
