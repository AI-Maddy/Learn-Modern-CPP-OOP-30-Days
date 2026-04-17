# Day 11: Generic OOP Design

## Why This Day Matters

Runtime polymorphism — virtual functions and base-class pointers — is powerful but
carries costs: vtable indirection on every call, forced heap allocation, inability to
inline, and loss of type information that prevents certain optimisations.

Generic (compile-time) OOP offers the same flexibility without those costs. The idea:
express variation through **template parameters** rather than virtual dispatch.

- **Policy-based design** — parametrise a class on its "policy" objects so each combination is compiled independently and fully inlined.
- **Type-safe containers** — use template parameters to enforce element types at compile time.
- **Generic algorithms with concepts** — write algorithms once, constrain via concepts, and let the compiler select the best implementation.
- **Template method pattern** — implement the invariant structure in a base; let derived classes or template arguments supply the varying steps.

## Learning Outcomes

After completing this day you will be able to:

- Design a policy-based class with two independent policy axes and instantiate multiple combinations without any code duplication.
- Constrain policy template parameters with concepts so that incorrect policy types produce clear, actionable error messages.
- Implement the template method pattern without virtual functions and measure the difference in generated code versus a virtual-function version.
- Build a type-safe generic container (ring buffer or fixed-capacity stack) and explain why it is safer than a `void*` equivalent.
- Choose between compile-time and runtime polymorphism based on whether types are known at compile time and whether heterogeneous storage is needed.

## Key Concepts

- **Policy-based design** — parametrise a class on multiple small "policy" types, each providing one aspect of behaviour; the compiler inlines each combination.
- **Private policy inheritance** — inherit from a policy using `private` so the policy's interface is not exposed to callers of the host class.
- **Type-safe container** — a class template whose element type is enforced by the compiler; type errors are caught at the call site, not at runtime.
- **Generic algorithm with concepts** — a function template constrained by concepts so it works for any conforming type with clear errors for non-conforming ones.
- **Template method pattern** — fix an algorithm's skeleton in a base or host class; supply the varying steps through template parameters instead of virtual overrides.
- **Compile-time vs runtime polymorphism** — compile-time (templates) is zero-overhead but requires types known at compile time; runtime (virtual) supports heterogeneous collections and plugin loading.

## Theory

### Motivation

Runtime polymorphism carries costs: vtable indirection on every call, forced heap
allocation, inability to inline, and loss of type information. Generic (compile-time)
OOP offers the same flexibility without those costs.

### Policy-Based Design

Popularised by Andrei Alexandrescu's *Modern C++ Design*, policy-based design uses
template parameters as "policies" — small classes that implement one aspect of
behaviour. The host class assembles them.

```cpp
#include <iostream>
#include <mutex>
#include <cstddef>

// Policy 1: Thread-safety policies
struct SingleThreaded {
    struct Lock { Lock() {} };   // no-op lock — zero overhead
};

struct MultiThreaded {
    std::mutex mutex_;
    struct Lock {
        explicit Lock(std::mutex& m) : guard_(m) {}
        std::lock_guard<std::mutex> guard_;
    };
};

// Policy 2: Growth policies for a resizable array
struct DoubleGrowth {
    static std::size_t next_capacity(std::size_t current) {
        return current == 0 ? 1 : current * 2;
    }
};

struct FibonacciGrowth {
    static std::size_t next_capacity(std::size_t current) {
        return current < 2 ? current + 1 : current + (current / 2);
    }
};

// Host class assembles policies
template <typename T,
          typename ThreadingPolicy = SingleThreaded,
          typename GrowthPolicy    = DoubleGrowth>
class DynamicArray : private ThreadingPolicy {
    T*          data_{nullptr};
    std::size_t size_{0};
    std::size_t capacity_{0};
public:
    void push_back(const T& v) {
        typename ThreadingPolicy::Lock lock;
        (void)lock;
        if (size_ == capacity_) grow();
        data_[size_++] = v;
    }
    std::size_t size() const { return size_; }
private:
    void grow() {
        capacity_ = GrowthPolicy::next_capacity(capacity_);
        T* new_data = new T[capacity_];
        for (std::size_t i = 0; i < size_; ++i)
            new_data[i] = std::move(data_[i]);
        delete[] data_;
        data_ = new_data;
    }
};

// Instantiate different combinations with zero overhead — each is a distinct type
using FastArray   = DynamicArray<int, SingleThreaded, DoubleGrowth>;
using SafeArray   = DynamicArray<int, MultiThreaded,  DoubleGrowth>;
using EcoArray    = DynamicArray<int, SingleThreaded, FibonacciGrowth>;
```

**Why policies beat virtual dispatch here**: each combination produces a distinct
compiled type. The compiler inlines `DoubleGrowth::next_capacity` and eliminates
the lock entirely for `SingleThreaded`. No indirection.

### Type-Safe Containers

Raw `void*` containers (the C approach) are fast but unsafe — you can store an
`int*` where a `double*` is expected. Template containers enforce element types
at compile time with no runtime cost.

```cpp
#include <vector>
#include <string>
#include <stdexcept>

// A type-safe ring buffer
template <typename T, std::size_t N>
class RingBuffer {
    T           buf_[N];
    std::size_t head_{0}, tail_{0}, count_{0};
public:
    bool empty() const { return count_ == 0; }
    bool full()  const { return count_ == N; }

    void push(T v) {
        if (full()) throw std::overflow_error{"ring buffer full"};
        buf_[tail_] = std::move(v);
        tail_ = (tail_ + 1) % N;
        ++count_;
    }
    T pop() {
        if (empty()) throw std::underflow_error{"ring buffer empty"};
        T v = std::move(buf_[head_]);
        head_ = (head_ + 1) % N;
        --count_;
        return v;
    }
};

RingBuffer<int, 8>         sensor_queue;
RingBuffer<std::string, 4> message_queue;
// sensor_queue.push("oops"); // compile error — type mismatch
```

### Generic Algorithms with Concepts

Combine templates with C++20 concepts to write algorithms that are both generic and
well-constrained.

```cpp
#include <concepts>
#include <ranges>
#include <algorithm>
#include <numeric>

// Concept: T supports + and * and has a zero value
template <typename T>
concept Numeric = std::is_arithmetic_v<T>;

// Generic dot product — works for any two same-sized numeric ranges
template <std::ranges::input_range R1,
          std::ranges::input_range R2>
requires Numeric<std::ranges::range_value_t<R1>>
      && std::same_as<std::ranges::range_value_t<R1>,
                      std::ranges::range_value_t<R2>>
auto dot_product(const R1& a, const R2& b) {
    using T = std::ranges::range_value_t<R1>;
    T result{};
    auto it1 = std::ranges::begin(a);
    auto it2 = std::ranges::begin(b);
    while (it1 != std::ranges::end(a) && it2 != std::ranges::end(b))
        result += (*it1++) * (*it2++);
    return result;
}

std::vector<double> u{1.0, 2.0, 3.0};
std::vector<double> v{4.0, 5.0, 6.0};
auto dp = dot_product(u, v);   // 1*4 + 2*5 + 3*6 = 32
```

### Template Method Pattern via Templates

The GoF Template Method pattern defines an algorithm's skeleton in a base class and
lets subclasses override specific steps. With virtual dispatch the "steps" are
virtual methods. With templates, the "steps" are template parameters — zero overhead.

```cpp
#include <string>
#include <iostream>

// Generic report generator — structure is fixed, steps are policies
template <typename DataSource, typename Formatter, typename Exporter>
class ReportGenerator {
    DataSource  source_;
    Formatter   formatter_;
    Exporter    exporter_;
public:
    ReportGenerator(DataSource s, Formatter f, Exporter e)
        : source_(std::move(s))
        , formatter_(std::move(f))
        , exporter_(std::move(e)) {}

    void generate() {
        // Fixed skeleton — variation is in the policy types
        auto raw  = source_.fetch();
        auto body = formatter_.format(raw);
        exporter_.export_data(body);
    }
};

// Concrete policies
struct CsvSource   { std::string fetch()                { return "a,b,c"; } };
struct HtmlFormat  { std::string format(const std::string& d)
                         { return "<table>" + d + "</table>"; } };
struct FileExport  { void export_data(const std::string& s)
                         { std::cout << "FILE: " << s << '\n'; } };

ReportGenerator<CsvSource, HtmlFormat, FileExport>
    rg{CsvSource{}, HtmlFormat{}, FileExport{}};
rg.generate();
// Each step inlined; final binary has no virtual calls
```

### Compile-Time vs Runtime Polymorphism

Understanding when to use each approach is the key design decision.

| Property | Compile-time (templates) | Runtime (virtual) |
|----------|--------------------------|-------------------|
| Overhead | Zero — fully inlined | vtable + indirect call (~3-5 ns) |
| Heterogeneous containers | Not directly (use variant/any) | Yes — base pointers |
| Type determined | At compile time | At runtime |
| Binary size | More code per instantiation | One copy of virtual functions |
| Error messages | Long (concept errors are better) | Clear |
| Plugin loading at runtime | Impossible | Yes (dlopen etc.) |

```cpp
// Runtime polymorphism needed: heterogeneous list of shapes
std::vector<std::unique_ptr<IShape>> shapes;
shapes.push_back(std::make_unique<Circle>(5.0));
shapes.push_back(std::make_unique<Rectangle>(3.0, 4.0));
for (auto& s : shapes) s->draw();   // virtual call — necessary here

// Compile-time polymorphism preferred: known set of processing steps
auto pipeline = ReportGenerator<CsvSource, HtmlFormat, FileExport>{...};
pipeline.generate();   // all inlined — preferred when types known at compile time
```

## Pitfalls

### Pitfall 1: Policy Type Exposing Too Much — Breaking Encapsulation

**Description**: A policy class that provides methods with the same names as the host
class's public interface can be accessed directly, bypassing the host's invariants.

**BAD**

```cpp
struct LoggingPolicy {
    void push(int v) {   // same name as host's push
        std::cout << "pushing " << v << '\n';
    }
};

template <typename Policy>
class Stack : public Policy {    // public inheritance exposes push() !
    std::vector<int> data_;
public:
    void push(int v) {
        Policy::push(v);  // call policy
        data_.push_back(v);
    }
};

Stack<LoggingPolicy> s;
s.LoggingPolicy::push(42);  // bypasses Stack::push — invariant broken
```

**GOOD**

```cpp
template <typename LoggingPolicy>
class Stack : private LoggingPolicy {   // private: policy methods not exposed
    std::vector<int> data_;
public:
    void push(int v) {
        LoggingPolicy::push(v);   // still works internally
        data_.push_back(v);
    }
};
// s.LoggingPolicy::push(42);  -- compile error: private base
```

**Detection tip**: Policies that are implementation details should use private
inheritance or containment. Public inheritance is appropriate only for IS-A
relationships where the policy's public interface should be part of the host's.

### Pitfall 2: Unconstrained Policy Parameters — Opaque Errors

**Description**: A policy-based class with no concept constraints on its template
parameters produces incomprehensible errors when the wrong policy is supplied.

**BAD**

```cpp
template <typename Storage, typename Logger>
class DataStore {
    Storage storage_;
    Logger  logger_;
public:
    void save(const std::string& key, int value) {
        logger_.log("saving " + key);
        storage_.put(key, value);  // If Storage lacks put(), error is deep inside
    }
};

DataStore<int, std::string> ds;  // Both wrong — error messages mention Storage
                                 // internals, not the call site
```

**GOOD**

```cpp
template <typename T>
concept KeyValueStore = requires(T t, std::string k, int v) {
    { t.put(k, v) };
    { t.get(k) } -> std::convertible_to<int>;
};

template <typename T>
concept LogSink = requires(T t, std::string msg) {
    { t.log(msg) };
};

template <KeyValueStore Storage, LogSink Logger>
class DataStore {
    Storage storage_;
    Logger  logger_;
public:
    void save(const std::string& key, int value) {
        logger_.log("saving " + key);
        storage_.put(key, value);
    }
};
// DataStore<int, std::string> ds;
// Error: "int does not satisfy KeyValueStore" — clear and actionable
```

**Detection tip**: Every template policy parameter should have a concept. If you
find yourself reading a 40-line instantiation chain, add concepts.

### Pitfall 3: Template Method Pattern — Calling Non-Existent Hook

**Description**: In the template method pattern via CRTP or templates, calling a hook
that the policy/derived class has not implemented compiles in some cases and silently
does nothing, or calls a wrong overload.

**GOOD**

```cpp
template <typename Derived>
class Pipeline {
public:
    void run() {
        static_cast<Derived*>(this)->do_pre();
        static_cast<Derived*>(this)->do_work();
        static_cast<Derived*>(this)->do_post();
    }
};

// Enforce the contract with a concept
template <typename T>
concept PipelineStep = requires(T t) {
    { t.do_pre()  };
    { t.do_work() };
    { t.do_post() };
};

template <PipelineStep Derived>
class CheckedPipeline {
public:
    void run() {
        static_cast<Derived*>(this)->do_pre();
        static_cast<Derived*>(this)->do_work();
        static_cast<Derived*>(this)->do_post();
    }
};
```

**Detection tip**: Use concepts or `static_assert(requires(Derived d) { d.do_post(); })`
to enforce that all hooks are implemented.

### Pitfall 4: Mixing Compile-Time and Runtime Polymorphism Incorrectly

**Description**: Storing a policy-based type by pointer to a base class that has no
virtual functions causes object slicing or broken polymorphism.

**GOOD**

```cpp
// Option A: separate compile-time and runtime layers
class IWidget { public: virtual ~IWidget()=default; virtual void draw()=0; };

template <typename Policy>
class ConcreteWidget : public IWidget, private Policy {
public:
    void draw() override { Policy::render(); }
};

// Now IWidget* is the heterogeneous handle
std::vector<std::unique_ptr<IWidget>> widgets;
widgets.push_back(std::make_unique<ConcreteWidget<BluePolicy>>());
widgets.push_back(std::make_unique<ConcreteWidget<GreenPolicy>>());
for (auto& w : widgets) w->draw();
```

**Detection tip**: If you need a heterogeneous container of policy-based objects,
add a thin virtual interface layer on top.

### Pitfall 5: Ring Buffer — Off-By-One in Modular Indexing

**Description**: Type-safe generic containers like ring buffers are prone to off-by-one
errors in the modular index arithmetic, causing either data loss or buffer overflow.

**BAD**

```cpp
template <typename T, std::size_t N>
class RingBuffer {
    T           buf_[N];
    std::size_t head_{0}, tail_{0};
public:
    void push(T v) { buf_[tail_++] = v; }   // tail_ wraps at N?  No wrap!
    T    pop()     { return buf_[head_++]; } // head_ same problem
};
```

**GOOD**

```cpp
template <typename T, std::size_t N>
class RingBuffer {
    T           buf_[N]{};
    std::size_t head_{0}, tail_{0}, count_{0};
public:
    bool full()  const { return count_ == N; }
    bool empty() const { return count_ == 0; }

    void push(T v) {
        if (full()) throw std::overflow_error{"buffer full"};
        buf_[tail_] = std::move(v);
        tail_ = (tail_ + 1) % N;    // modular wrap
        ++count_;
    }
    T pop() {
        if (empty()) throw std::underflow_error{"buffer empty"};
        T v = std::move(buf_[head_]);
        head_ = (head_ + 1) % N;    // modular wrap
        --count_;
        return v;
    }
};
```

**Detection tip**: Always maintain a separate `count_` or `full` flag; do not rely
solely on `head_ == tail_` to distinguish full from empty. Use AddressSanitizer
(`-fsanitize=address`) during testing to catch out-of-bounds writes.

## Code Example

```cpp
#include <iostream>
#include <string>

template <typename T>
class Box {
  public:
    explicit Box(T value) : value_(std::move(value)) {}
    const T& get() const { return value_; }

  private:
    T value_;
};

int main() {
    Box<std::string> name{"Modern C++"};
    std::cout << "Day 11 - Generic OOP Design\n";
    std::cout << "Box holds: " << name.get() << "\n";
    return 0;
}
```
