Day 29 – Advanced Topics Deep Dive
====================================

Motivation
----------

C++20 introduced several features that change the way high-performance and
systems-level code is written. This day covers five topics that reward the
effort to understand them deeply:

#. **Coroutines** — ``co_await``, ``co_yield``, ``co_return`` for
   asynchronous and lazy computation without callbacks.
#. **Custom allocators** — controlling where and how memory is acquired.
#. **``consteval``** — functions that *must* run at compile time.
#. **``std::bit_cast``** — type-punning without undefined behaviour.
#. **Compile-time algorithms with ``constexpr``** — sorting, searching,
   and computing lookup tables at compile time.

These features are used in game engines, embedded firmware, network
servers, and anywhere performance or determinism is critical.

Coroutines: Concepts
---------------------

A *coroutine* is a function that can suspend and resume execution.
Unlike threads, suspension is cooperative and happens at explicit
``co_await`` / ``co_yield`` points — no context switch, no mutex.

Three keywords:

* ``co_return`` — produces the final value and terminates the coroutine.
* ``co_yield`` — produces an intermediate value and suspends.
* ``co_await`` — suspends until an awaitable completes.

The coroutine machinery requires a *promise type* and a *coroutine handle*.
C++20 provides the plumbing; you define the semantics.

Generator (co_yield)
~~~~~~~~~~~~~~~~~~~~~

A generator produces a lazy sequence without storing all values upfront.

.. code-block:: cpp

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

Task (co_await)
~~~~~~~~~~~~~~~~

``co_await`` is used for asynchronous work — the coroutine suspends
until the awaited operation is complete (I/O, a timer, another coroutine).

.. code-block:: cpp

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

Custom Allocators
------------------

The default allocator calls ``::operator new`` for every allocation. In
performance-critical code, custom allocators can:

* Use a pre-allocated pool (no system calls during use).
* Use stack memory for small allocations.
* Track all allocations for debugging.

A minimal polymorphic allocator using ``std::pmr``:

.. code-block:: cpp

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
            // All memory reclaimed when PoolAllocator is destroyed
        }

    private:
        T pool_[N];
        T* next_;
    };

``consteval``: Compile-Time-Only Functions
------------------------------------------

``consteval`` (C++20) declares a function that *must* be evaluated at
compile time. If called in a runtime context, the compiler rejects it.
This is stronger than ``constexpr``, which *may* run at either time.

.. code-block:: cpp

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

``std::bit_cast``: Safe Type Punning
-------------------------------------

Before C++20, the only standard-conforming way to reinterpret bytes of one
type as another was ``memcpy``. ``std::bit_cast`` does the same thing but is:

* Evaluated at compile time (``constexpr``).
* Statically checked (source and destination must be the same size and
  trivially copyable).
* Undefined-behaviour-free (unlike ``reinterpret_cast`` for type punning).

.. code-block:: cpp

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

Compile-Time Algorithms with ``constexpr``
-------------------------------------------

C++17/20 mark most standard algorithms ``constexpr``. You can sort,
search, and compute on arrays entirely at compile time.

.. code-block:: cpp

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

Embedded C++ Considerations
-----------------------------

On embedded systems the same techniques apply with additional constraints:

* **No dynamic memory**: heap allocation is often prohibited in safety-critical
  systems. Use ``constexpr`` arrays, ``std::array``, or pool allocators.
* **No exceptions**: many embedded toolchains disable exception handling
  (``-fno-exceptions``). Return ``std::expected<T,E>`` or error codes instead.
* **Stack size limits**: coroutines allocate their frame on the heap by default
  — use a custom allocator or avoid coroutines in severely constrained targets.
* **``consteval`` lookup tables**: pre-computing tables at compile time moves
  work from the MCU to the build machine. The binary contains constants; the
  MCU reads from flash with zero CPU cycles.

Design Tradeoffs
----------------

* **Coroutines vs threads**: coroutines are lighter (no kernel context switch,
  no stack per coroutine), but they require cooperative yielding. Threads are
  pre-emptive — a blocked thread does not block the scheduler. Use coroutines
  for I/O-bound tasks; threads for CPU-bound parallel work.

* **consteval vs constexpr**: ``consteval`` guarantees compile-time evaluation
  but makes the function unusable at runtime. ``constexpr`` is more flexible
  but the compiler may choose runtime evaluation in some contexts. Prefer
  ``consteval`` for lookup tables and safety checks.

* **Custom allocators**: they add complexity. Profile first. Only adopt a
  custom allocator when you have measured allocation overhead in a hot path
  and confirmed it is significant.

Self-Check Questions
--------------------

#. **What is the difference between co_yield and co_return?**

   ``co_yield`` suspends the coroutine and produces an intermediate value —
   the coroutine can be resumed later. ``co_return`` terminates the coroutine
   and produces its final value; it cannot be resumed after.

#. **Why is std::bit_cast preferable to reinterpret_cast for type punning?**

   ``reinterpret_cast`` for type punning is undefined behaviour in C++ — the
   standard does not permit accessing an object's bytes through a pointer of
   a different type. ``std::bit_cast`` is explicitly defined, trivially-
   copyable-checked, size-checked, and ``constexpr``.

#. **When would you use a monotonic buffer allocator?**

   When a subsystem allocates many objects, uses them all briefly, then
   discards them all together — e.g., a parser that builds an AST. The
   monotonic allocator bumps a pointer for each allocation and frees
   everything in O(1) by resetting the buffer, avoiding fragmentation.

#. **What does consteval guarantee that constexpr does not?**

   ``consteval`` guarantees the function is *only ever* called in a constant-
   expression context and *always* evaluated at compile time. A ``constexpr``
   function may be evaluated at runtime if the arguments are not compile-time
   constants.

#. **How do coroutines help with callback-based asynchronous code?**

   Callbacks fragment logic across multiple functions, making control flow
   hard to follow. With coroutines, sequential-looking code can suspend at
   ``co_await`` points and resume when an async operation completes, keeping
   the logic in one function body and eliminating callback nesting.
