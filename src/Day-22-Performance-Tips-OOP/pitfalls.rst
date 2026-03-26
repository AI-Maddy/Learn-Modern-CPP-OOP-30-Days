Pitfalls — Day 22: Performance Tips for OOP
============================================

Pitfall 1 — Optimising Without Profiling
-----------------------------------------

**Problem:** Spending time optimising code that is not the bottleneck, while
the real hot path remains slow.

**BAD:**

.. code-block:: cpp

  // Developer sees many virtual calls and "optimises" them all
  // without measuring which ones are actually in the hot path
  struct Config final { /* made final "for performance" */ };
  struct Logger final { /* made final "for performance" */ };
  // ... 30 classes refactored ...
  // The actual bottleneck was a database query taking 200ms — unchanged.

**Why it fails:** Micro-optimising cold code wastes engineering time and
introduces ``final`` constraints that limit future design changes. The database
query dominates the profile; virtual dispatch was irrelevant.

**GOOD — profile first, then optimise the hot path:**

.. code-block:: cpp

  // 1. Run with profiler:
  //    perf record ./app && perf report
  // 2. Identify that DatabaseQuery::execute() is 87% of runtime
  // 3. Optimise ONLY that:
  class DatabaseQuery {
      // Add connection pooling, result caching here
  };
  // No changes to Config, Logger, or any cold-path class.

**Detection tip:** Every performance change should be preceded by a profiler
output showing the hotspot. If you don't have a profiler result, you don't
have justification.

Pitfall 2 — Storing Polymorphic Objects by Value in a ``std::vector``
----------------------------------------------------------------------

**Problem:** Inserting derived objects into a ``std::vector<Base>`` causes
object slicing — the derived part is silently discarded.

**BAD:**

.. code-block:: cpp

  struct Shape { virtual double area() const { return 0; } };
  struct Circle : Shape {
      double r;
      double area() const override { return 3.14 * r * r; }
  };

  std::vector<Shape> shapes;
  shapes.push_back(Circle{2.0});   // SLICED — only Shape base part stored

  for (auto& s : shapes) {
      std::cout << s.area() << '\n';   // prints 0, not 12.57
  }

**Why it fails:** ``std::vector<Shape>`` stores ``Shape``-sized elements. When
a ``Circle`` is pushed, only the ``Shape`` base sub-object is copied; the
``r`` member and the vtable pointer are lost (the stored vptr points to
``Shape``'s vtable).

**GOOD — store by pointer or use ``std::variant``:**

.. code-block:: cpp

  // Pointer option (heap, heterogeneous):
  std::vector<std::unique_ptr<Shape>> shapes;
  shapes.push_back(std::make_unique<Circle>(2.0));

  // Variant option (stack, closed set):
  using ShapeV = std::variant<Circle, Square>;
  std::vector<ShapeV> shapes;
  shapes.push_back(Circle{2.0});

**Detection tip:** Anytime you see ``std::vector<BaseClass>`` where
``BaseClass`` has virtual methods, it is almost certainly a slicing bug.
Enable ``-Woverloaded-virtual`` and check for missing overrides.

Pitfall 3 — Cache Miss from Indirection in Tight Loops
------------------------------------------------------

**Problem:** A vector of pointers to heap-allocated objects causes a cache
miss for each element because the objects are scattered in memory.

**BAD:**

.. code-block:: cpp

  std::vector<std::unique_ptr<Particle>> particles(10000);
  for (auto& p : particles) {
      p->update();   // each p->update() dereferences a different heap pointer
      // 10000 potential cache misses — objects scattered across heap
  }

**Why it fails:** Each ``unique_ptr`` stores a pointer to a separately
heap-allocated ``Particle``. These allocations are spread across the heap
with no locality guarantee. Iterating them causes up to 10000 L3 cache misses
— possibly 10000 × 100 cycles = 1,000,000 stalled cycles.

**GOOD — store by value in a contiguous container:**

.. code-block:: cpp

  // All particles contiguous in memory — one cache miss per cache line (≈4 particles)
  std::vector<Particle> particles(10000);
  for (auto& p : particles) {
      p.update();   // sequential memory access — prefetcher works efficiently
  }

  // If polymorphism is needed, use index-based component separation:
  struct ParticleSystem {
      std::vector<float> x, y, z;   // SoA — maximally contiguous
      void update_all() {
          for (std::size_t i = 0; i < x.size(); ++i) {
              x[i] += vx[i];
              y[i] += vy[i];
          }
      }
      std::vector<float> vx, vy, vz;
  };

**Detection tip:** Any ``vector<unique_ptr<T>>`` or ``vector<T*>`` that is
iterated in a hot loop is a candidate for this pitfall. Measure cache misses
with ``perf stat -e cache-misses ./app``.

Pitfall 4 — Calling Virtual Functions Inside a SIMD-Able Loop
-------------------------------------------------------------

**Problem:** A virtual call inside a tight numeric loop prevents
auto-vectorisation, even if the derived method is trivially inlineable.

**BAD:**

.. code-block:: cpp

  struct ITransform { virtual float apply(float x) const = 0; };
  struct Scale : ITransform {
      float factor;
      float apply(float x) const override { return x * factor; }
  };

  void transform_all(std::vector<float>& data, const ITransform& t) {
      for (float& v : data) v = t.apply(v);   // virtual call — no vectorisation
  }

**Why it fails:** The compiler sees an indirect call through a vtable on every
iteration. It cannot vectorise the loop because it does not know (statically)
that ``apply()`` is just ``x * factor``. On 10,000 floats with AVX2, this is
8× slower than the vectorised equivalent.

**GOOD — use a template parameter or inline the operation:**

.. code-block:: cpp

  // Template: compiler knows the concrete type — can inline and vectorise
  template<typename Transform>
  void transform_all(std::vector<float>& data, const Transform& t) {
      for (float& v : data) v = t(v);   // direct call — vectorised
  }

  struct Scale {
      float factor;
      float operator()(float x) const { return x * factor; }
  };

  Scale s{2.0f};
  transform_all(data, s);   // compiler vectorises the loop body

**Detection tip:** Use ``-O3 -fopt-info-vec`` (GCC) or ``-Rpass=loop-vectorize``
(Clang) to see which loops are vectorised. A virtual call in the loop body
typically prevents it.

Pitfall 5 — Using ``std::function`` in a Performance-Critical Hot Path
----------------------------------------------------------------------

**Problem:** ``std::function`` incurs heap allocation (for large callables) and
an indirect call through a function pointer — both are expensive in tight loops.

**BAD:**

.. code-block:: cpp

  void process_events(const std::vector<Event>& events,
                      std::function<void(const Event&)> handler) {
      for (const auto& e : events) handler(e);   // indirect call each iteration
  }

  // For 1,000,000 events: 1,000,000 indirect calls + possible heap allocation
  process_events(events, [&state](const Event& e){ state.update(e); });

**Why it fails:** The ``std::function`` wraps the lambda in a type-erased
indirect callable. The call goes through a function pointer stored in the
``std::function``'s internal vtable equivalent. If the lambda exceeds SBO, it
also allocates on the heap at the call site.

**GOOD — use a template parameter for hot-path callbacks:**

.. code-block:: cpp

  template<typename Handler>
  void process_events(const std::vector<Event>& events, Handler&& handler) {
      for (const auto& e : events) handler(e);   // direct call — inlineable
  }

  // No std::function allocation, no indirect call, handler is inlined:
  process_events(events, [&state](const Event& e){ state.update(e); });

Use ``std::function`` for: storing callbacks in containers, passing across
API boundaries, or cold paths where flexibility outweighs cost.

**Detection tip:** Profile callback invocations. If ``std::function::operator()``
appears in the top 5% of hotspots, replace it with a template parameter.

Pitfall 6 — Misapplying ``[[likely]]``/``[[unlikely]]``
---------------------------------------------------------

**Problem:** Annotating the wrong branch as likely, or applying the hint based
on intuition rather than profiling, can hurt performance.

**BAD:**

.. code-block:: cpp

  int parse_token(char c) {
      if (c == '\0') [[unlikely]] {
          return END;
      }
      if (c == ' ') [[unlikely]] {    // BAD: spaces are very common in text!
          return SPACE;
      }
      return OTHER;
  }

**Why it fails:** If the input is mostly whitespace-separated text, spaces
appear in most positions. Marking them as ``[[unlikely]]`` causes the compiler
to place the space handling in a cold-code branch, increasing branch
mispredictions and cache misses for the most common case.

**GOOD — apply hints based on measured branch frequency:**

.. code-block:: cpp

  // After profiling: 90% of tokens are identifiers, 8% spaces, 2% special
  int parse_token(char c) {
      if (c >= 'a' && c <= 'z') [[likely]] {
          return IDENTIFIER;        // 90% path — fall through
      }
      if (c == ' ') {               // 8% — no hint needed
          return SPACE;
      }
      [[unlikely]] return OTHER;    // 2% — cold path
  }

**Detection tip:** Use PGO (Profile-Guided Optimisation) as an alternative
to manual ``[[likely]]`` annotation. PGO collects actual branch frequencies
from a representative workload and applies them globally without error-prone
manual annotation.
