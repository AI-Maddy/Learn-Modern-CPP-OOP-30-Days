Pitfalls – Day 29: Advanced Topics Deep Dive
=============================================

Pitfall 1: Destroying a Coroutine Handle Twice
-----------------------------------------------

**Description**
  Calling ``handle_.destroy()`` on an already-destroyed coroutine handle,
  or allowing two owner objects to both call ``destroy()``, is undefined
  behaviour (double-free on the coroutine frame).

**BAD code**

.. code-block:: cpp

    Generator<int> gen1 = fibonacci();
    Generator<int> gen2 = gen1;  // copy — both gen1 and gen2 own handle_

    // When gen1 and gen2 are destroyed, handle_.destroy() is called TWICE — UB

**Why it fails**
  The coroutine frame is heap-allocated. Destroying it twice is a double-
  free, identical in severity to calling ``delete`` twice on a raw pointer.

**GOOD code**

.. code-block:: cpp

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

**Detection tip**
  AddressSanitizer (``-fsanitize=address``) catches the double-free
  immediately at runtime. Always run coroutine code under ASan during
  development.

Pitfall 2: Resuming a Finished Coroutine
-----------------------------------------

**Description**
  Calling ``handle_.resume()`` after the coroutine has reached its final
  suspension point (``done() == true``) is undefined behaviour.

**BAD code**

.. code-block:: cpp

    Generator<int> gen = count_to_three();
    while (true) {
        gen.next();                  // eventually reaches done()
        std::cout << gen.value();    // still calling resume() after done — UB
    }

**Why it fails**
  After the coroutine reaches ``final_suspend``, the frame is in a
  terminated state. Resuming it reads garbage or triggers an assertion
  failure in the coroutine machinery.

**GOOD code**

.. code-block:: cpp

    Generator<int> gen = count_to_three();
    while (gen.next()) {           // next() returns false when done
        std::cout << gen.value();
    }
    // After the loop, gen.next() returned false — we never resume again

**Detection tip**
  Design your generator's ``next()`` method to return ``bool`` and check
  ``handle_.done()`` before resuming. Never resume unconditionally.

Pitfall 3: Using consteval With Runtime-Only Arguments
------------------------------------------------------

**Description**
  Calling a ``consteval`` function with a variable whose value is not known
  at compile time produces a compile error. This is *intentional*, but it
  surprises developers who expect ``consteval`` to behave like ``constexpr``.

**BAD code**

.. code-block:: cpp

    consteval int square(int n) { return n * n; }

    int runtime_value = 5;         // not constexpr — value known only at runtime
    int result = square(runtime_value);  // COMPILE ERROR: not a constant expression

**Why it fails**
  ``consteval`` mandates compile-time evaluation. A runtime variable is not
  a constant expression — the compiler cannot satisfy the constraint.

**GOOD code**

.. code-block:: cpp

    // Option A: make the input constexpr
    constexpr int compile_time_n = 5;
    constexpr int result = square(compile_time_n);  // OK

    // Option B: use constexpr (not consteval) if runtime usage is needed
    constexpr int flexible_square(int n) { return n * n; }
    int runtime_value = 5;
    int result2 = flexible_square(runtime_value);  // OK at runtime too

**Detection tip**
  The compiler error message mentions "not a constant expression" —
  recognise this as a ``consteval`` constraint violation. Decide whether
  the call site should be ``constexpr`` or whether the function should
  be relaxed to ``constexpr``.

Pitfall 4: bit_cast on Non-Trivially-Copyable Types
----------------------------------------------------

**Description**
  ``std::bit_cast<T>(src)`` requires both types to be the same size and
  trivially copyable. Using it with non-trivial types (e.g., ``std::string``)
  is a compile error.

**BAD code**

.. code-block:: cpp

    std::string s = "hello";
    auto bits = std::bit_cast<std::array<char, 24>>(s);
    // COMPILE ERROR: std::string is not trivially copyable
    // Even if it compiled, the bit representation includes pointer internals
    // — completely meaningless and dangerous

**Why it fails**
  A ``std::string`` contains a pointer to heap-allocated data. Bit-casting
  it would copy the pointer value — not the string contents. The resulting
  value would be a dangling pointer in disguise.

**GOOD code**

.. code-block:: cpp

    // bit_cast is for numeric/POD types only
    float f = 3.14f;
    auto bits = std::bit_cast<std::uint32_t>(f);  // OK: both 4 bytes, trivial

    // For string byte access, use string_view or span:
    std::string s = "hello";
    std::span<const std::byte> bytes{
        reinterpret_cast<const std::byte*>(s.data()), s.size()};

**Detection tip**
  The compile error from ``std::bit_cast`` on a non-trivially-copyable type
  is clear: look for "is not trivially copyable". This is a hard constraint,
  not a warning — fix it by choosing the right tool for byte access.

Pitfall 5: Allocating in a Coroutine When the Allocator Is a Pool
-----------------------------------------------------------------

**Description**
  Coroutine frames are allocated on the heap by default using
  ``::operator new``. On embedded systems or in pool-only environments,
  this bypasses the pool and falls back to the global allocator.

**BAD code**

.. code-block:: cpp

    // Embedded system: global heap is disabled
    // Coroutine frame uses ::operator new by default — link error or abort
    Generator<int> fibonacci() {
        co_yield 0;
        co_yield 1;
    }
    // On a no-heap embedded target, instantiating fibonacci() fails at runtime

**Why it fails**
  Without a custom allocator in the promise type, the coroutine frame
  allocation falls through to the global ``new``, which may not be
  available or safe.

**GOOD code**

.. code-block:: cpp

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

**Detection tip**
  On embedded targets, link with ``--wrap=malloc`` or ``-nostdlib`` to
  make all heap allocations fail at link time, forcing custom allocators
  for every coroutine and container.

Pitfall 6: Ignoring pmr Allocator Lifetime
-------------------------------------------

**Description**
  A ``std::pmr::vector`` holds a non-owning pointer to its memory resource.
  If the resource is destroyed before the vector, any subsequent access
  to the vector's memory is undefined behaviour.

**BAD code**

.. code-block:: cpp

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

**Why it fails**
  ``std::pmr::vector`` stores a pointer to the memory resource. When the
  resource goes out of scope, the stored pointer dangles. Any later
  reallocation through the dangling pointer is UB.

**GOOD code**

.. code-block:: cpp

    // Keep the memory resource alive at least as long as the vector
    void demo() {
        std::array<std::byte, 1024> buf;
        std::pmr::monotonic_buffer_resource pool{buf.data(), buf.size()};
        std::pmr::vector<int> v{&pool};   // pool outlives v in this scope
        for (int i = 0; i < 10; ++i) v.push_back(i);
        v.push_back(11);  // OK: pool is still alive
    }   // v destroyed first, then pool — correct order

**Detection tip**
  AddressSanitizer catches use-after-return and use-after-scope for
  stack-allocated memory resources. Run with ``-fsanitize=address,undefined``
  during development.
