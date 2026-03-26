Pitfalls — Day 11: Generic OOP Design
======================================

Pitfall 1: Policy Type Exposing Too Much — Breaking Encapsulation
-----------------------------------------------------------------

**Description**: A policy class that provides methods with the same names as the host
class's public interface can be accessed directly, bypassing the host's invariants.

**BAD**

.. code-block:: cpp

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

**Why it fails**: Public inheritance from a policy exposes its entire interface.
Callers can call policy methods directly, bypassing the host's logic.

**GOOD**

.. code-block:: cpp

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

**Detection tip**: Policies that are implementation details should use private
inheritance or containment.  Public inheritance is appropriate only for IS-A
relationships where the policy's public interface should be part of the host's.

Pitfall 2: Unconstrained Policy Parameters — Opaque Errors
-----------------------------------------------------------

**Description**: A policy-based class with no concept constraints on its template
parameters produces incomprehensible errors when the wrong policy is supplied.

**BAD**

.. code-block:: cpp

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

**Why it fails**: Without constraints, the compiler substitutes the types and only
reports errors when it reaches the point of use inside the template — far from the
mistake.

**GOOD**

.. code-block:: cpp

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

**Detection tip**: Every template policy parameter should have a concept.  If you
find yourself reading a 40-line instantiation chain, add concepts.

Pitfall 3: Template Method Pattern — Calling Non-Existent Hook
--------------------------------------------------------------

**Description**: In the template method pattern via CRTP or templates, calling a hook
that the policy/derived class has not implemented compiles in some cases and silently
does nothing, or calls a wrong overload.

**BAD**

.. code-block:: cpp

    template <typename Derived>
    class Pipeline {
    public:
        void run() {
            pre_process();
            process();
            post_process();  // Derived might not provide this!
        }
    private:
        void pre_process()  { static_cast<Derived*>(this)->do_pre();  }
        void process()      { static_cast<Derived*>(this)->do_work(); }
        void post_process() { /* should call Derived::do_post() but forgets */ }
    };

    struct MyPipeline : Pipeline<MyPipeline> {
        void do_pre()  {}
        void do_work() {}
        // do_post() not defined — silent omission
    };

**Why it fails**: ``post_process()`` does nothing because it doesn't forward to the
derived class.  The omission is silent; the algorithm's contract is broken.

**GOOD**

.. code-block:: cpp

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

**Detection tip**: Use concepts or ``static_assert(requires(Derived d) { d.do_post(); })``
to enforce that all hooks are implemented.

Pitfall 4: Mixing Compile-Time and Runtime Polymorphism Incorrectly
-------------------------------------------------------------------

**Description**: Storing a policy-based type by pointer to a base class that has no
virtual functions causes object slicing or broken polymorphism.

**BAD**

.. code-block:: cpp

    template <typename Policy>
    class Widget : public Policy {
    public:
        void draw() { Policy::render(); }
    };

    struct BluePolicy  { void render() { std::cout << "blue\n"; } };
    struct GreenPolicy { void render() { std::cout << "green\n"; } };

    // Trying to store heterogeneously — Widget<Blue> and Widget<Green>
    // are completely unrelated types; no common base
    std::vector<Widget<BluePolicy>*> widgets;
    // Widget<GreenPolicy> cannot be stored here — different type!

**Why it fails**: ``Widget<BluePolicy>`` and ``Widget<GreenPolicy>`` share no common
base class and are entirely separate types.  You cannot store them together.

**GOOD**

.. code-block:: cpp

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

    // Option B: std::variant (Day 15) for a small fixed set of types

**Detection tip**: If you need a heterogeneous container of policy-based objects,
add a thin virtual interface layer on top.

Pitfall 5: Ring Buffer — Off-By-One in Modular Indexing
-------------------------------------------------------

**Description**: Type-safe generic containers like ring buffers are prone to off-by-one
errors in the modular index arithmetic, causing either data loss or buffer overflow.

**BAD**

.. code-block:: cpp

    template <typename T, std::size_t N>
    class RingBuffer {
        T           buf_[N];
        std::size_t head_{0}, tail_{0};
    public:
        void push(T v) { buf_[tail_++] = v; }   // tail_ wraps at N?  No wrap!
        T    pop()     { return buf_[head_++]; } // head_ same problem
    };

    RingBuffer<int, 4> rb;
    rb.push(1); rb.push(2); rb.push(3); rb.push(4);
    rb.push(5);  // tail_ = 5 — out of bounds write! UB

**Why it fails**: ``tail_++`` is never taken modulo ``N``, so it walks off the end of
the array after ``N`` pushes.

**GOOD**

.. code-block:: cpp

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

**Detection tip**: Always maintain a separate ``count_`` or ``full`` flag; do not rely
solely on ``head_ == tail_`` to distinguish full from empty.  Use AddressSanitizer
(``-fsanitize=address``) during testing to catch out-of-bounds writes.
