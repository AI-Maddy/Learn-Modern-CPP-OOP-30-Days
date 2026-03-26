Generic OOP Design
==================

Motivation
----------

Runtime polymorphism — virtual functions and base-class pointers — is powerful but
carries costs: vtable indirection on every call, forced heap allocation, inability to
inline, and loss of type information that prevents certain optimisations.

Generic (compile-time) OOP offers the same flexibility without those costs.  The idea:
express variation through **template parameters** rather than virtual dispatch.

* **Policy-based design** — parametrise a class on its "policy" objects so each
  combination is compiled independently and fully inlined.
* **Type-safe containers** — use template parameters to enforce element types at
  compile time.
* **Generic algorithms with concepts** — write algorithms once, constrain via concepts,
  and let the compiler select the best implementation.
* **Template method pattern** — implement the invariant structure in a base; let
  derived classes or template arguments supply the varying steps.

Policy-Based Design
-------------------

Popularised by Andrei Alexandrescu's *Modern C++ Design*, policy-based design uses
template parameters as "policies" — small classes that implement one aspect of
behaviour.  The host class assembles them.

.. code-block:: cpp

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

**Why policies beat virtual dispatch here**: each combination produces a distinct
compiled type.  The compiler inlines ``DoubleGrowth::next_capacity`` and eliminates
the lock entirely for ``SingleThreaded``.  No indirection.

ASCII diagram — policy-based assembly::

    DynamicArray<T, Threading, Growth>
    ┌──────────────────────────────────┐
    │  data_ : T*                      │
    │  size_, capacity_                │
    │                                  │
    │  push_back() ──► Threading::Lock │ (inlined by compiler)
    │  grow()      ──► Growth::next_capacity │
    └──────────────────────────────────┘
             ▲                  ▲
    SingleThreaded          DoubleGrowth
    (no-op lock)            (× 2 strategy)

Type-Safe Containers
--------------------

Raw ``void*`` containers (the C approach) are fast but unsafe — you can store an
``int*`` where a ``double*`` is expected.  Template containers enforce element types
at compile time with no runtime cost.

.. code-block:: cpp

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

Generic Algorithms with Concepts
---------------------------------

Combine templates with C++20 concepts to write algorithms that are both generic and
well-constrained.

.. code-block:: cpp

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

Template Method Pattern via Templates
---------------------------------------

The GoF Template Method pattern defines an algorithm's skeleton in a base class and
lets subclasses override specific steps.  With virtual dispatch the "steps" are
virtual methods.  With templates, the "steps" are template parameters — zero overhead.

.. code-block:: cpp

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

Compile-Time vs Runtime Polymorphism
--------------------------------------

Understanding when to use each approach is the key design decision.

.. list-table::
   :header-rows: 1
   :widths: 30 35 35

   * - Property
     - Compile-time (templates)
     - Runtime (virtual)
   * - Overhead
     - Zero — fully inlined
     - vtable + indirect call (~3-5 ns)
   * - Heterogeneous containers
     - Not directly (use variant/any)
     - Yes — base pointers
   * - Type determined
     - At compile time
     - At runtime
   * - Binary size
     - More code per instantiation
     - One copy of virtual functions
   * - Error messages
     - Long (concept errors are better)
     - Clear
   * - Plugin loading at runtime
     - Impossible
     - Yes (dlopen etc.)

.. code-block:: cpp

    // Runtime polymorphism needed: heterogeneous list of shapes
    std::vector<std::unique_ptr<IShape>> shapes;
    shapes.push_back(std::make_unique<Circle>(5.0));
    shapes.push_back(std::make_unique<Rectangle>(3.0, 4.0));
    for (auto& s : shapes) s->draw();   // virtual call — necessary here

    // Compile-time polymorphism preferred: known set of processing steps
    auto pipeline = ReportGenerator<CsvSource, HtmlFormat, FileExport>{...};
    pipeline.generate();   // all inlined — preferred when types known at compile time

Self-Check Questions
---------------------

#. **What is a policy in policy-based design, and how does it differ from a virtual
   function-based strategy?**

   A policy is a template parameter that provides a specific behaviour.  Unlike
   a virtual strategy, a policy is selected at compile time; the compiler inlines
   it and generates zero-overhead code.  Different policy combinations produce
   distinct types.

#. **When is runtime polymorphism (virtual dispatch) genuinely necessary?**

   When the set of concrete types is not known at compile time, when objects of
   different types must be stored in the same container, or when behaviour must be
   chosen by configuration loaded at runtime (e.g., plugins).

#. **What is the "template method pattern via templates" and how does it differ from
   the GoF version?**

   Both fix an algorithm's skeleton and let subclasses/policies supply steps.  The
   GoF version uses virtual methods; the template version uses template parameters.
   The template version has zero overhead; the GoF version supports runtime variation.

#. **Why do type-safe containers eliminate a class of bugs that** ``void*``
   **containers cannot?**

   The compiler enforces the element type at every call site.  Mixing
   incompatible pointers is a compile error, not a runtime crash.

#. **How do concepts improve policy-based design?**

   Concepts constrain the policy type parameter so that the error message names the
   unsatisfied requirement.  Without concepts, passing the wrong policy type causes
   a long chain of substitution errors deep inside the host class template.
