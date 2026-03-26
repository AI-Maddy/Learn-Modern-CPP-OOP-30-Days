Performance Tips for OOP C++
==============================

Motivation — Measure Before You Optimise
-----------------------------------------

Most OOP performance advice is anecdotal without benchmarks. The principles
below are real and measurable, but their *magnitude* depends entirely on your
specific workload, data sizes, and CPU. The only reliable process is:

#. **Profile first** — identify the hot path with ``perf``, VTune, or
   ``gprof``.
#. **Hypothesise the cause** — cache miss? virtual call? allocation?
#. **Benchmark the change** — use ``google/benchmark`` or ``nanobench``.
#. **Verify the improvement** — compare assembly if needed.

This day introduces the conceptual models and C++ techniques that most
commonly yield measurable improvements in OOP code.

Cache Lines and Data Locality
-------------------------------

Modern CPUs read memory in **cache lines** (64 bytes on x86). If your data
fits in cache, arithmetic is fast. If it doesn't, the CPU stalls waiting for
RAM — this is the **cache miss** penalty (50–200 cycles on a modern CPU vs
1–4 cycles for L1 cache).

**Struct of Arrays (SoA) vs Array of Structs (AoS):**

.. code-block:: cpp

  // AoS layout — common OOP default
  struct Particle {
      float px, py, pz;    // position
      float vx, vy, vz;    // velocity
      float mass;
      int   alive;
      char  tag[8];        // 32 bytes total
  };

  std::vector<Particle> particles(10000);

  // To update only positions: iterate all particles,
  // but each particle loads 32 bytes though only 12 (px,py,pz) are used.
  // → 10000 × 32 bytes = 312 KB loaded, but only 120 KB needed.
  // Cache efficiency: ~38%

  // SoA layout — data-oriented design
  struct ParticleSystem {
      std::vector<float> px, py, pz;      // positions
      std::vector<float> vx, vy, vz;      // velocities
      std::vector<float> mass;
      std::vector<int>   alive;
  };

  // Position update: accesses only px, py, pz → 120 KB, 100% cache utilised
  // SIMD auto-vectorisation: contiguous floats → compiler uses AVX2/SSE

::

  AoS memory layout (cache unfriendly for partial updates)
  ─────────────────────────────────────────────────────────
  [px py pz vx vy vz mass alive tag] [px py pz ...] ...
  ^──────────── 32 bytes ───────────^

  SoA memory layout (cache friendly — all px values are adjacent)
  ───────────────────────────────────────────────────────────────
  px: [p0 p1 p2 p3 p4 p5 p6 p7 ...]   ← one cache line serves 16 floats
  py: [p0 p1 p2 p3 p4 p5 p6 p7 ...]
  pz: [p0 p1 p2 p3 p4 p5 p6 p7 ...]

Virtual Call Cost and Devirtualisation
----------------------------------------

A virtual call through a pointer-to-base requires:

1. Load the ``vptr`` from the object.
2. Load the function pointer from the vtable at the correct offset.
3. Indirect call to that address.

On a warm cache this costs ~3–5 cycles. On a cold cache (many different
derived types, large objects far apart in memory), the vtable itself may be a
cache miss, and the indirect branch predictor may mispredict the target —
total cost 40–100 cycles.

**Devirtualisation** is when the compiler proves the dynamic type at compile
time and converts the virtual call to a direct (or inlined) call:

.. code-block:: cpp

  struct Animal { virtual void speak() const = 0; };
  struct Dog : Animal { void speak() const override { std::puts("Woof"); } };

  void call_speak(const Animal& a) {
      a.speak();   // virtual call — type unknown here
  }

  void call_devirt() {
      Dog d;
      d.speak();   // non-virtual call — compiler knows Dog; may inline
  }

  // Also devirtualised via final:
  struct Cat final : Animal { void speak() const override { std::puts("Meow"); } };

  void call_cat(const Cat& c) {
      c.speak();   // devirtualised because Cat is final
  }

Use ``final`` on leaf classes that are never further derived — it allows the
compiler and linker to devirtualise aggressively, sometimes inlining the entire
virtual method body.

Hot/Cold Data Splitting
------------------------

If an object has members that are accessed in the hot path and members that
are rarely accessed, keeping them together wastes cache lines.

.. code-block:: cpp

  // BAD: hot and cold data mixed
  struct Enemy {
      // Hot: accessed every frame
      float x, y;
      float health;
      int   state;         // 16 bytes

      // Cold: accessed only on death/spawn
      std::string name;          // 24 bytes
      std::vector<Item> loot;    // 24 bytes
      SoundEffect* death_sound;  // 8 bytes
      Texture*     portrait;     // 8 bytes
  };
  // sizeof(Enemy) ≈ 80+ bytes — even a simple position check loads 80+ bytes

  // GOOD: split into hot and cold structs
  struct EnemyHot {
      float x, y, health;
      int   state;
  };  // 16 bytes — fits 4 enemies per cache line

  struct EnemyCold {
      std::string name;
      std::vector<Item> loot;
      SoundEffect* death_sound;
      Texture*     portrait;
  };

  struct EnemySystem {
      std::vector<EnemyHot>  hot;    // contiguous hot data — cache-friendly
      std::vector<EnemyCold> cold;   // indexed by same index — loaded rarely
  };

Small Buffer Optimisation (SBO)
---------------------------------

SBO is an implementation technique where small objects are stored inline (on
the stack or in the owning object) instead of being heap-allocated. The
standard library uses it in ``std::string`` (SSO — typically strings ≤ 15
chars), ``std::function`` (typically ≤ 16–32 bytes), and ``std::any``.

You can implement SBO for your own type-erasing wrappers:

.. code-block:: cpp

  template<std::size_t BufSize = 32>
  class SmallFunction {
      static constexpr std::size_t Align = alignof(std::max_align_t);
      alignas(Align) std::byte buf_[BufSize];
      bool on_heap_{false};

      struct Vtable { void (*call)(void*, int); void (*dtor)(void*); };
      const Vtable* vt_{nullptr};
      void* ptr_{nullptr};

  public:
      template<typename F>
      SmallFunction(F fn) {
          if constexpr (sizeof(F) <= BufSize && alignof(F) <= Align) {
              new(buf_) F(std::move(fn));
              ptr_ = buf_;
              on_heap_ = false;
          } else {
              ptr_ = new F(std::move(fn));
              on_heap_ = true;
          }
          static Vtable vt{
              [](void* p, int x){ (*static_cast<F*>(p))(x); },
              [](void* p){ static_cast<F*>(p)->~F(); }
          };
          vt_ = &vt;
      }
      void operator()(int x) { vt_->call(ptr_, x); }
      ~SmallFunction() {
          if (vt_) vt_->dtor(ptr_);
          if (on_heap_) operator delete(ptr_);
      }
  };

``[[likely]]`` and ``[[unlikely]]`` Attributes
------------------------------------------------

C++20 adds ``[[likely]]`` and ``[[unlikely]]`` to hint to the compiler which
branch is taken most often, enabling better code layout (hot path stays in the
instruction cache):

.. code-block:: cpp

  bool validate(int x) {
      if (x < 0) [[unlikely]] {    // rarely happens
          log_error("negative value");
          return false;
      }
      // Hot path — likely case
      return process(x);
  }

  for (int v : large_dataset) {
      if (v == SENTINEL) [[unlikely]] break;
      [[likely]] process(v);
  }

The compiler places the ``[[likely]]`` path in the fall-through (no branch
taken) code stream, minimising branch mispredictions and keeping the hot path
in the instruction cache.

Benchmark-Driven Approach with ``google/benchmark``
----------------------------------------------------

Never guess — measure. ``google/benchmark`` provides a micro-benchmark harness:

.. code-block:: cpp

  #include <benchmark/benchmark.h>

  // Virtual dispatch baseline
  static void BM_Virtual(benchmark::State& state) {
      std::vector<std::unique_ptr<Animal>> animals;
      animals.push_back(std::make_unique<Dog>());
      for (auto _ : state) {
          for (auto& a : animals) a->speak();
      }
  }
  BENCHMARK(BM_Virtual);

  // CRTP static dispatch
  static void BM_CRTP(benchmark::State& state) {
      Dog d;
      for (auto _ : state) {
          d.Dog::speak();   // static dispatch
      }
  }
  BENCHMARK(BM_CRTP);

  BENCHMARK_MAIN();

Run:

.. code-block:: bash

  ./benchmark_demo --benchmark_filter=BM_Virtual
  ./benchmark_demo --benchmark_format=json --benchmark_out=results.json

Performance Tip Summary
------------------------

+------------------------------+------------------+----------------------+
| Technique                    | When to apply    | Typical gain         |
+==============================+==================+======================+
| SoA over AoS                 | Large homogeneous| 2–10×  (SIMD-able)   |
|                              | data, hot loops  |                      |
+------------------------------+------------------+----------------------+
| Hot/cold splitting           | Objects with many| 1.5–3× (cache hits)  |
|                              | rarely-used fields|                     |
+------------------------------+------------------+----------------------+
| ``final`` devirtualisation   | Leaf classes in  | 5–20% per call site  |
|                              | hot paths        |                      |
+------------------------------+------------------+----------------------+
| ``[[likely]]``/``[[unlikely]]``| Loops with      | 2–5% (branch pred.)  |
|                              | rare exit paths  |                      |
+------------------------------+------------------+----------------------+
| SBO (inline storage)         | Small callables, | Eliminates malloc    |
|                              | small strings    |                      |
+------------------------------+------------------+----------------------+
| Pool allocation              | Many same-size   | 3–10× (allocation)   |
|                              | short-lived objs |                      |
+------------------------------+------------------+----------------------+

Self-Check Questions
---------------------

**Q1. Why is SoA often faster than AoS for simulation loops?**

SoA places all values of the same field contiguously, so iterating over one
field (e.g., position) loads only position data into cache lines. AoS
interleaves all fields, so iterating over position still loads velocity and
mass into cache lines even though they are not needed. Additionally, contiguous
same-type data enables auto-vectorisation (SIMD), multiplying throughput.

**Q2. What is devirtualisation and how does ``final`` enable it?**

Devirtualisation is a compiler optimisation that converts a virtual call to a
direct (possibly inlined) call when the dynamic type is statically known. By
marking a class ``final``, you assert it has no further subclasses. The
compiler can then prove that any pointer-to-derived always has exactly that
type and substitute the direct call, often inlining the body.

**Q3. When should you split a class into hot/cold structs?**

When profiling shows the class is accessed in a tight loop where only a subset
of fields (the hot fields) are needed most of the time. Mixing hot and cold
fields wastes cache lines by loading cold data alongside hot data every loop
iteration. The split is worth doing when the ratio of used-to-total bytes per
iteration is low (below ~50%).

**Q4. What is the Small Buffer Optimisation and what happens when the SBO
limit is exceeded?**

SBO stores small objects (below a compile-time size threshold) in an inline
buffer within the owning type, avoiding a heap allocation. When the object
exceeds the threshold, it falls back to heap allocation. The threshold is a
design parameter — larger thresholds save more allocations at the cost of a
larger owning type.

**Q5. Why is ``[[likely]]``/``[[unlikely]]`` a hint rather than a guarantee?**

The attributes communicate programmer intent to the compiler about branch
probability. The compiler may choose not to reorder code if the profiling
information it already has (via PGO — Profile-Guided Optimisation) contradicts
the hint, or if the reordering would violate other constraints. They are not
directives that force specific assembly output.
