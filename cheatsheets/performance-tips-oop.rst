Performance Tips for OOP
=========================

.. contents:: Sections
   :local:
   :depth: 2

Profile Before You Optimise
-----------------------------

Amdahl's Law: the speedup from optimising a part of the program is bounded
by the fraction of time that part occupies.

::

   Speedup = 1 / [(1 - P) + P/S]
   P = fraction of execution time in the optimised section
   S = speedup achieved in that section

   If P = 0.10 (10% of runtime) and S = ∞ → max speedup = 1.11× (11%)
   If P = 0.90 (90% of runtime) and S = 10 → speedup = 5.26×

**Workflow**: measure → identify hotspot → optimise hotspot → re-measure.
Optimising non-hotspots is wasted effort.

.. code-block:: bash

   # Profiling tools
   perf record -g ./myapp && perf report
   valgrind --tool=callgrind ./myapp && kcachegrind callgrind.out.*
   clang++ -pg -o myapp main.cpp && ./myapp && gprof myapp gmon.out

Virtual Call Overhead
----------------------

A virtual call involves:

1. Load the ``vptr`` from the object (1 memory read)
2. Index into the vtable (pointer arithmetic + 1 memory read)
3. Indirect call through the function pointer (1 indirect branch)
4. Branch predictor typically **fails** on first call; subsequent calls
   to the same concrete type are predicted correctly

.. code-block:: cpp

   // Benchmark: direct call vs virtual call
   // Direct:  ~1–2 ns per call (inlined away to zero by compiler)
   // Virtual: ~3–7 ns per call on a warm cache, worse on cold cache

   // HOT LOOP with virtual — may be a bottleneck:
   for (int i = 0; i < 1'000'000; ++i)
       shapes[i]->area();   // 1M vtable dispatches

   // BETTER: dispatch once outside loop if all same type
   // Or: use CRTP if type set is known at compile time
   // Or: sort by type for better branch prediction

Devirtualisation Conditions
-----------------------------

The compiler can eliminate the virtual dispatch when it can prove the
dynamic type at compile time:

.. code-block:: cpp

   // Devirtualised: local variable, type known
   Circle c{5.0};
   c.area();            // direct call, no vptr lookup

   // Devirtualised: final class — no derived class can override
   class Circle final : public Shape {
       double area() const override { return 3.14 * r * r; }
   };
   Shape* s = new Circle{};
   s->area();   // compiler may devirtualise because Circle is final

   // NOT devirtualised: pointer to base with unknown dynamic type
   void process(Shape* s) { s->area(); }   // always virtual

   // Inline hint to encourage devirtualisation:
   class Shape {
       virtual double area() const = 0;
   };

   // Use -O2 or -O3 and LTO to maximise devirtualisation

Data Locality: AoS vs SoA
--------------------------

.. code-block:: cpp

   // AoS (Array of Structs) — natural OOP style
   struct Particle { float x, y, z; float vx, vy, vz; float mass; };
   std::vector<Particle> particles;  // x,y,z,vx,vy,vz,mass,x,y,z,...

   // Updating all positions: must read entire struct to get x,y,z
   for (auto& p : particles) {
       p.x += p.vx * dt;
       p.y += p.vy * dt;
       p.z += p.vz * dt;
   }
   // Cache lines filled with vx,vy,vz,mass — UNUSED during position update

   // SoA (Struct of Arrays) — better for batch field updates
   struct Particles {
       std::vector<float> x, y, z;
       std::vector<float> vx, vy, vz;
       std::vector<float> mass;
   };

   for (std::size_t i = 0; i < n; ++i) {
       pts.x[i] += pts.vx[i] * dt;   // reading only x[] and vx[]: 100% cache use
       pts.y[i] += pts.vy[i] * dt;
       pts.z[i] += pts.vz[i] * dt;
   }
   // SIMD auto-vectorisation is also more likely with SoA

+-------------+---------------------------+-----------------------------+
| Layout      | Good for                  | Bad for                     |
+=============+===========================+=============================+
| AoS         | Working on one object     | Bulk operations on one      |
|             | (all fields together)     | field across many objects   |
+-------------+---------------------------+-----------------------------+
| SoA         | Batch processing, SIMD,   | Working on one full         |
|             | cache-friendly field scans| particle at a time          |
+-------------+---------------------------+-----------------------------+

Small Buffer Optimisation (SBO)
---------------------------------

Avoid heap allocation by storing small values inline:

.. code-block:: cpp

   // std::string typically uses SBO for strings <= 15–22 chars (implementation-defined)
   std::string short_str = "hello";   // stored inline, no heap alloc
   std::string long_str(100, 'x');    // heap allocated

   // std::function uses SBO for small callables (typically <= 16–24 bytes)
   std::function<void()> f = []{ };       // likely SBO (empty lambda)
   std::function<void()> g = big_lambda;  // may heap-allocate

   // Custom SBO for a value type:
   template <std::size_t InlineBytes = 64>
   class AnyValue {
       alignas(std::max_align_t) char buf_[InlineBytes];
       void* heap_ = nullptr;
       bool on_heap_ = false;
   public:
       template <typename T>
       void store(T val) {
           if constexpr (sizeof(T) <= InlineBytes)
               new (buf_) T(std::move(val));
           else {
               heap_ = ::operator new(sizeof(T));
               on_heap_ = true;
               new (heap_) T(std::move(val));
           }
       }
   };

RVO and NRVO
-------------

Return Value Optimisation (RVO) and Named RVO eliminate the copy/move
when returning a local object — the object is constructed directly
in the caller's stack frame.

.. code-block:: cpp

   // RVO: returning a temporary — guaranteed copy elision (C++17)
   std::vector<int> make_data() {
       return std::vector<int>{1, 2, 3, 4, 5};   // no copy, no move
   }

   // NRVO: returning a named local — applies when there is only one return path
   std::vector<int> build(int n) {
       std::vector<int> result;
       result.reserve(n);
       for (int i = 0; i < n; ++i) result.push_back(i);
       return result;   // NRVO: likely elided
   }

   // Pitfall: returning different variables defeats NRVO
   std::vector<int> bad(bool flag) {
       std::vector<int> a{1,2}, b{3,4};
       return flag ? a : b;   // compiler can't elide — causes move
   }

   // Don't std::move a return value — it disables NRVO!
   std::vector<int> worse() {
       std::vector<int> v{1,2,3};
       return std::move(v);   // BAD: prevents NRVO, forces move instead
   }

[[likely]] and [[unlikely]] (C++20)
-------------------------------------

Hint to the branch predictor and compiler's code layout:

.. code-block:: cpp

   void process(int* data, std::size_t n) {
       for (std::size_t i = 0; i < n; ++i) {
           if (data[i] == 0) [[unlikely]] {
               handle_zero();       // cold path
           } else [[likely]] {
               fast_path(data[i]);  // hot path
           }
       }
   }

   // Error handling is almost always [[unlikely]]:
   std::expected<int, Error> parse(std::string_view s) {
       if (s.empty()) [[unlikely]]
           return std::unexpected(Error::empty);
       // ... normal parsing
   }

   // Use sparingly: the compiler's profiling (PGO) is more accurate

std::span over vector for Read-Only APIs
------------------------------------------

Passing ``std::span<const T>`` accepts any contiguous range without copying:

.. code-block:: cpp

   // BAD: forces caller to have a std::vector
   double sum(const std::vector<double>& v);

   // BAD: raw pointer loses size info
   double sum(const double* data, std::size_t n);

   // GOOD: accepts vector, array, span, C-array — no copy, no ownership
   double sum(std::span<const double> data) {
       double total = 0;
       for (double v : data) total += v;
       return total;
   }

   std::vector<double>   v{1,2,3};
   std::array<double,3>  a{4,5,6};
   double                c[3]{7,8,9};

   sum(v);   // OK
   sum(a);   // OK
   sum(c);   // OK
   sum(std::span{c, 2});  // subspan: first 2 elements

reserve() for Growing Containers
----------------------------------

.. code-block:: cpp

   // BAD: reallocations on every push_back beyond capacity
   std::vector<Foo> items;
   for (int i = 0; i < 10000; ++i) items.push_back(make_foo(i));
   // Up to log2(10000) ≈ 14 reallocations + 9999 element moves

   // GOOD: one allocation
   std::vector<Foo> items;
   items.reserve(10000);
   for (int i = 0; i < 10000; ++i) items.emplace_back(make_foo(i));

   // emplace_back vs push_back:
   items.push_back(Foo{arg1, arg2});    // construct temp, then move
   items.emplace_back(arg1, arg2);      // construct in-place directly

Move Semantics for Cheap Transfers
-------------------------------------

.. code-block:: cpp

   // BAD: copy large string on return
   std::string get_name() { return name_; }   // copies if name_ is lvalue

   // GOOD: move when transferring ownership
   std::string get_name() && { return std::move(name_); }  // rvalue ref overload

   // BAD: pass by value and copy inside
   void set_name(const std::string& s) { name_ = s; }

   // GOOD: pass by value and move inside (works for lvalues AND rvalues)
   void set_name(std::string s) { name_ = std::move(s); }

Pitfalls
---------

**Pitfall 1: Premature micro-optimisation**

.. code-block:: cpp

   // BAD: spent a day optimising a function that runs 0.1% of the time
   // GOOD: profile first, then optimise the top 5% of runtime

**Pitfall 2: Invalidating iterators with push_back during iteration**

.. code-block:: cpp

   std::vector<int> v{1,2,3};
   for (auto it = v.begin(); it != v.end(); ++it) {
       v.push_back(*it);   // UB: push_back may reallocate, invalidating it
   }

**Pitfall 3: Measuring in Debug mode**

.. code-block:: cpp

   // Debug builds (-O0) disable inlining, iterator checking overhead, etc.
   // Always benchmark with -O2 or -O3, the same flags used in production

**Pitfall 4: False sharing in multithreaded code**

.. code-block:: cpp

   // Two threads each write to a field in the same cache line — 4× slowdown
   struct Shared { int counter_a; int counter_b; };   // same 64-byte line!
   // GOOD: pad to separate cache lines (see memory-layout-and-object-model.rst)

Cross-References
-----------------

* ``memory-layout-and-object-model.rst`` — cache lines, padding, vtable
* ``crtp-static-polymorphism.rst`` — compile-time dispatch as virtual alternative
* ``type-erasure-pimpl.rst`` — SBO in type-erased containers
* ``ranges-and-views.rst`` — lazy evaluation avoids intermediate allocations
