# Day 22: Performance Tips for OOP

## Why This Day Matters

Most OOP performance advice is anecdotal without benchmarks. The principles in this day are real and measurable, but their *magnitude* depends entirely on your specific workload, data sizes, and CPU. The only reliable process is: profile first to identify the hot path, hypothesise the cause (cache miss? virtual call? allocation?), benchmark the change, and verify the improvement. This day introduces the conceptual models and C++ techniques that most commonly yield measurable improvements in OOP code — but always measure before and after any change.

## Learning Outcomes

By the end of this day you will be able to:

* Explain what a cache line is and why Struct-of-Arrays (SoA) can be 2–10× faster than Array-of-Structs (AoS) for bulk operations.
* Identify virtual call overhead and apply `final`, CRTP, or template parameters to enable devirtualisation or eliminate virtual dispatch.
* Restructure a class with hot and cold fields into separate contiguous arrays to improve cache utilisation.
* Implement a basic small-buffer-optimised callable wrapper and explain the SBO threshold concept.
* Apply `[[likely]]` and `[[unlikely]]` attributes based on profile data and explain why intuition-based hints can hurt performance.
* Set up and run a `google/benchmark` micro-benchmark and interpret the nanoseconds-per-iteration output.

## Key Concepts

* **Cache line (64 bytes)** — the unit of memory transfer between RAM and CPU cache; false sharing and wasted loads both stem from poor cache line usage.
* **SoA (Struct of Arrays)** — stores each field contiguously across all objects; enables auto-vectorisation and maximises cache utilisation for field-selective loops.
* **Devirtualisation** — compiler converts an indirect virtual call to a direct call or inline; enabled by `final`, local type deduction, or whole-program optimisation (LTO).
* **Hot/cold splitting** — places frequently-accessed fields in a compact contiguous struct, leaving rarely-accessed fields in a separate cold struct.
* **SBO (Small Buffer Optimisation)** — stores objects below a size threshold inline to avoid heap allocation; used in `std::string`, `std::function`.
* **`[[likely]]`/`[[unlikely]]`** — C++20 branch probability hints; guide code layout decisions by the compiler; use only when confirmed by profiling.
* **Benchmark-first discipline** — every performance change must be justified by a before/after benchmark; no intuition-only optimisations.

## Theory

### Motivation — Measure Before You Optimise

Most OOP performance advice is anecdotal without benchmarks. The principles below are real and measurable, but their *magnitude* depends entirely on your specific workload, data sizes, and CPU. The only reliable process is:

1. **Profile first** — identify the hot path with `perf`, VTune, or `gprof`.
2. **Hypothesise the cause** — cache miss? virtual call? allocation?
3. **Benchmark the change** — use `google/benchmark` or `nanobench`.
4. **Verify the improvement** — compare assembly if needed.

### Cache Lines and Data Locality

Modern CPUs read memory in **cache lines** (64 bytes on x86). If your data fits in cache, arithmetic is fast. If it doesn't, the CPU stalls waiting for RAM — this is the **cache miss** penalty (50–200 cycles on a modern CPU vs 1–4 cycles for L1 cache).

**Struct of Arrays (SoA) vs Array of Structs (AoS):**

```cpp
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
```

```
AoS memory layout (cache unfriendly for partial updates)
─────────────────────────────────────────────────────────
[px py pz vx vy vz mass alive tag] [px py pz ...] ...
^──────────── 32 bytes ───────────^

SoA memory layout (cache friendly — all px values are adjacent)
───────────────────────────────────────────────────────────────
px: [p0 p1 p2 p3 p4 p5 p6 p7 ...]   ← one cache line serves 16 floats
py: [p0 p1 p2 p3 p4 p5 p6 p7 ...]
pz: [p0 p1 p2 p3 p4 p5 p6 p7 ...]
```

### Virtual Call Cost and Devirtualisation

A virtual call through a pointer-to-base requires:

1. Load the `vptr` from the object.
2. Load the function pointer from the vtable at the correct offset.
3. Indirect call to that address.

On a warm cache this costs ~3–5 cycles. On a cold cache (many different derived types, large objects far apart in memory), the vtable itself may be a cache miss, and the indirect branch predictor may mispredict the target — total cost 40–100 cycles.

**Devirtualisation** is when the compiler proves the dynamic type at compile time and converts the virtual call to a direct (or inlined) call:

```cpp
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
```

Use `final` on leaf classes that are never further derived — it allows the compiler and linker to devirtualise aggressively, sometimes inlining the entire virtual method body.

### Hot/Cold Data Splitting

If an object has members that are accessed in the hot path and members that are rarely accessed, keeping them together wastes cache lines.

```cpp
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
```

### Small Buffer Optimisation (SBO)

SBO is an implementation technique where small objects are stored inline (on the stack or in the owning object) instead of being heap-allocated. The standard library uses it in `std::string` (SSO — typically strings ≤ 15 chars), `std::function` (typically ≤ 16–32 bytes), and `std::any`.

You can implement SBO for your own type-erasing wrappers:

```cpp
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
```

### `[[likely]]` and `[[unlikely]]` Attributes

C++20 adds `[[likely]]` and `[[unlikely]]` to hint to the compiler which branch is taken most often, enabling better code layout (hot path stays in the instruction cache):

```cpp
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
```

The compiler places the `[[likely]]` path in the fall-through (no branch taken) code stream, minimising branch mispredictions and keeping the hot path in the instruction cache.

### Benchmark-Driven Approach with `google/benchmark`

Never guess — measure. `google/benchmark` provides a micro-benchmark harness:

```cpp
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
```

Run:

```bash
./benchmark_demo --benchmark_filter=BM_Virtual
./benchmark_demo --benchmark_format=json --benchmark_out=results.json
```

### Performance Tip Summary

| Technique                    | When to apply    | Typical gain         |
|------------------------------|------------------|----------------------|
| SoA over AoS                 | Large homogeneous data, hot loops | 2–10× (SIMD-able) |
| Hot/cold splitting           | Objects with many rarely-used fields | 1.5–3× (cache hits) |
| `final` devirtualisation     | Leaf classes in hot paths | 5–20% per call site |
| `[[likely]]`/`[[unlikely]]`  | Loops with rare exit paths | 2–5% (branch pred.) |
| SBO (inline storage)         | Small callables, small strings | Eliminates malloc |
| Pool allocation              | Many same-size short-lived objs | 3–10× (allocation) |

## Pitfalls

### Pitfall 1 — Optimising Without Profiling

**Problem:** Spending time optimising code that is not the bottleneck, while the real hot path remains slow.

**BAD:**

```cpp
// Developer sees many virtual calls and "optimises" them all
// without measuring which ones are actually in the hot path
struct Config final { /* made final "for performance" */ };
struct Logger final { /* made final "for performance" */ };
// ... 30 classes refactored ...
// The actual bottleneck was a database query taking 200ms — unchanged.
```

**Why it fails:** Micro-optimising cold code wastes engineering time and introduces `final` constraints that limit future design changes. The database query dominates the profile; virtual dispatch was irrelevant.

**GOOD — profile first, then optimise the hot path:**

```cpp
// 1. Run with profiler:
//    perf record ./app && perf report
// 2. Identify that DatabaseQuery::execute() is 87% of runtime
// 3. Optimise ONLY that:
class DatabaseQuery {
    // Add connection pooling, result caching here
};
// No changes to Config, Logger, or any cold-path class.
```

**Detection tip:** Every performance change should be preceded by a profiler output showing the hotspot. If you don't have a profiler result, you don't have justification.

### Pitfall 2 — Storing Polymorphic Objects by Value in a `std::vector`

**Problem:** Inserting derived objects into a `std::vector<Base>` causes object slicing — the derived part is silently discarded.

**BAD:**

```cpp
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
```

**Why it fails:** `std::vector<Shape>` stores `Shape`-sized elements. When a `Circle` is pushed, only the `Shape` base sub-object is copied; the `r` member and the vtable pointer are lost (the stored vptr points to `Shape`'s vtable).

**GOOD — store by pointer or use `std::variant`:**

```cpp
// Pointer option (heap, heterogeneous):
std::vector<std::unique_ptr<Shape>> shapes;
shapes.push_back(std::make_unique<Circle>(2.0));

// Variant option (stack, closed set):
using ShapeV = std::variant<Circle, Square>;
std::vector<ShapeV> shapes;
shapes.push_back(Circle{2.0});
```

**Detection tip:** Anytime you see `std::vector<BaseClass>` where `BaseClass` has virtual methods, it is almost certainly a slicing bug. Enable `-Woverloaded-virtual` and check for missing overrides.

### Pitfall 3 — Cache Miss from Indirection in Tight Loops

**Problem:** A vector of pointers to heap-allocated objects causes a cache miss for each element because the objects are scattered in memory.

**BAD:**

```cpp
std::vector<std::unique_ptr<Particle>> particles(10000);
for (auto& p : particles) {
    p->update();   // each p->update() dereferences a different heap pointer
    // 10000 potential cache misses — objects scattered across heap
}
```

**Why it fails:** Each `unique_ptr` stores a pointer to a separately heap-allocated `Particle`. These allocations are spread across the heap with no locality guarantee. Iterating them causes up to 10000 L3 cache misses — possibly 10000 × 100 cycles = 1,000,000 stalled cycles.

**GOOD — store by value in a contiguous container:**

```cpp
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
```

**Detection tip:** Any `vector<unique_ptr<T>>` or `vector<T*>` that is iterated in a hot loop is a candidate for this pitfall. Measure cache misses with `perf stat -e cache-misses ./app`.

### Pitfall 4 — Calling Virtual Functions Inside a SIMD-Able Loop

**Problem:** A virtual call inside a tight numeric loop prevents auto-vectorisation, even if the derived method is trivially inlineable.

**BAD:**

```cpp
struct ITransform { virtual float apply(float x) const = 0; };
struct Scale : ITransform {
    float factor;
    float apply(float x) const override { return x * factor; }
};

void transform_all(std::vector<float>& data, const ITransform& t) {
    for (float& v : data) v = t.apply(v);   // virtual call — no vectorisation
}
```

**Why it fails:** The compiler sees an indirect call through a vtable on every iteration. It cannot vectorise the loop because it does not know (statically) that `apply()` is just `x * factor`. On 10,000 floats with AVX2, this is 8× slower than the vectorised equivalent.

**GOOD — use a template parameter or inline the operation:**

```cpp
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
```

**Detection tip:** Use `-O3 -fopt-info-vec` (GCC) or `-Rpass=loop-vectorize` (Clang) to see which loops are vectorised. A virtual call in the loop body typically prevents it.

### Pitfall 5 — Using `std::function` in a Performance-Critical Hot Path

**Problem:** `std::function` incurs heap allocation (for large callables) and an indirect call through a function pointer — both are expensive in tight loops.

**BAD:**

```cpp
void process_events(const std::vector<Event>& events,
                    std::function<void(const Event&)> handler) {
    for (const auto& e : events) handler(e);   // indirect call each iteration
}

// For 1,000,000 events: 1,000,000 indirect calls + possible heap allocation
process_events(events, [&state](const Event& e){ state.update(e); });
```

**Why it fails:** The `std::function` wraps the lambda in a type-erased indirect callable. The call goes through a function pointer stored in the `std::function`'s internal vtable equivalent. If the lambda exceeds SBO, it also allocates on the heap at the call site.

**GOOD — use a template parameter for hot-path callbacks:**

```cpp
template<typename Handler>
void process_events(const std::vector<Event>& events, Handler&& handler) {
    for (const auto& e : events) handler(e);   // direct call — inlineable
}

// No std::function allocation, no indirect call, handler is inlined:
process_events(events, [&state](const Event& e){ state.update(e); });
```

Use `std::function` for: storing callbacks in containers, passing across API boundaries, or cold paths where flexibility outweighs cost.

**Detection tip:** Profile callback invocations. If `std::function::operator()` appears in the top 5% of hotspots, replace it with a template parameter.

### Pitfall 6 — Misapplying `[[likely]]`/`[[unlikely]]`

**Problem:** Annotating the wrong branch as likely, or applying the hint based on intuition rather than profiling, can hurt performance.

**BAD:**

```cpp
int parse_token(char c) {
    if (c == '\0') [[unlikely]] {
        return END;
    }
    if (c == ' ') [[unlikely]] {    // BAD: spaces are very common in text!
        return SPACE;
    }
    return OTHER;
}
```

**Why it fails:** If the input is mostly whitespace-separated text, spaces appear in most positions. Marking them as `[[unlikely]]` causes the compiler to place the space handling in a cold-code branch, increasing branch mispredictions and cache misses for the most common case.

**GOOD — apply hints based on measured branch frequency:**

```cpp
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
```

**Detection tip:** Use PGO (Profile-Guided Optimisation) as an alternative to manual `[[likely]]` annotation. PGO collects actual branch frequencies from a representative workload and applies them globally without error-prone manual annotation.

## Code Example

```cpp
#include <iostream>
#include <string>
#include <vector>

struct Record {
    std::string name;
    int score;
};

int main() {
    std::vector<Record> records;
    records.reserve(3);
    records.emplace_back(Record{"alpha", 90});
    records.emplace_back(Record{"beta", 95});
    records.emplace_back(Record{"gamma", 88});

    std::cout << "Day 22 - Performance Tips OOP\n";
    for (const auto& record : records) {
        std::cout << record.name << ':' << record.score << "\n";
    }
    return 0;
}
```
