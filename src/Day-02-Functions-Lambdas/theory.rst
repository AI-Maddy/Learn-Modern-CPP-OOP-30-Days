Day 02 — Functions and Lambdas
===============================

Why This Day Matters
--------------------

Functions are the primary unit of abstraction in C++. Getting their signatures right — parameter
passing conventions, return types, overloading rules — determines whether your code is safe,
efficient, and easy to reason about. Lambdas bring closures and local higher-order functions to
C++, enabling expressive algorithm use without the boilerplate of named function objects.

This day covers the full spectrum: classic function design, ``inline``, default arguments,
overloading, and then the modern lambda mechanism including capture modes, ``mutable``, generic
lambdas, ``std::function``, and function pointers.


Function Signatures and Parameter Passing
------------------------------------------

The single most impactful decision in a function signature is how to pass each parameter.

.. code-block:: cpp

    #include <string>
    #include <vector>

    // Pass by value: the function gets its own copy.
    // Use when: the function needs to modify the data independently,
    //           or when the type is cheap to copy (int, float, small structs).
    void greet(std::string name) {
        name += " Smith";   // modifies the local copy only
    }

    // Pass by const reference: no copy, read-only.
    // Use for: large objects you only read (strings, vectors, custom types).
    void print_report(const std::vector<int>& data) {
        for (int v : data) { /* read-only */ }
    }

    // Pass by non-const reference: caller's object is modified.
    // Use when: the function's purpose is to mutate the argument.
    void fill_with_zeros(std::vector<int>& data) {
        std::fill(data.begin(), data.end(), 0);
    }

    // Pass by rvalue reference: transfer ownership / enable move semantics.
    // Use when: the function will consume the argument (store it, move it on).
    void append_log(std::vector<std::string>& log, std::string&& entry) {
        log.push_back(std::move(entry));   // entry is moved, not copied
    }

    // Pass by pointer: the parameter is optional (can be nullptr).
    // Use sparingly; prefer references when the argument is always present.
    void configure(const Config* cfg) {
        if (cfg) { /* use cfg */ }
    }

The **golden rule**: pass by ``const T&`` unless you need a copy or a mutation. Use value
parameters when the function will always make a copy internally (the compiler can then use
move semantics at the call site).

Return Types
~~~~~~~~~~~~

.. code-block:: cpp

    // Return by value: the compiler applies NRVO/copy elision — no copy penalty.
    std::vector<int> generate_sequence(int n) {
        std::vector<int> result;
        result.reserve(n);
        for (int i{0}; i < n; ++i) result.push_back(i);
        return result;   // NRVO: likely zero copies
    }

    // Return by const reference: only safe for member variables with >= object lifetime.
    const std::string& get_name() const { return m_name; }

    // Return optional for operations that may fail
    #include <optional>
    std::optional<int> parse_int(const std::string& s) {
        try { return std::stoi(s); }
        catch (...) { return std::nullopt; }
    }

    // Trailing return type (required when return type references a parameter type)
    auto make_pair_copy(auto a, auto b) -> std::pair<decltype(a), decltype(b)> {
        return {a, b};
    }


Default Arguments
-----------------

Default arguments let callers omit trailing parameters, providing a natural API extension path.

.. code-block:: cpp

    // Default arguments must appear in the declaration (header), not definition
    void connect(const std::string& host,
                 int port = 443,
                 bool tls  = true);

    // Usage
    connect("api.example.com");           // port=443, tls=true
    connect("api.example.com", 8080);     // port=8080, tls=true
    connect("api.example.com", 80, false);

**Tradeoff:** Default arguments make callers concise but can hide the actual arguments being
passed, making code harder to read at the call site. Consider named parameter structs for
functions with many optional parameters.


Function Overloading
--------------------

Overloading lets you define multiple functions with the same name but different parameter types.
The compiler selects the best match through overload resolution.

.. code-block:: cpp

    #include <string>
    #include <string_view>

    // Overload on parameter type
    void log(int value)         { std::cout << "int: " << value << '\n'; }
    void log(double value)      { std::cout << "double: " << value << '\n'; }
    void log(std::string_view s){ std::cout << "str: " << s << '\n'; }

    log(42);      // calls log(int)
    log(3.14);    // calls log(double)
    log("hello"); // calls log(std::string_view)

    // Overloading on const-ness (member function overloading — covered Day 03)
    // Overloading on value category
    void process(const Widget& w);   // for lvalues
    void process(Widget&& w);        // for rvalues (move-enabled path)

**Pitfall:** Do not use overloading to give completely different behaviours to the same name.
Overloads should perform the same conceptual operation on different types.


``inline`` Functions
--------------------

.. code-block:: cpp

    // inline suggests the compiler embed the function body at the call site.
    // The primary modern use: allow the same function definition in multiple
    // translation units (required for function definitions in header files).

    // header.hpp
    inline int clamp(int val, int lo, int hi) {
        return val < lo ? lo : (val > hi ? hi : val);
    }

The compiler is free to ignore the ``inline`` hint for large functions. Modern compilers perform
inlining at their own discretion regardless of the keyword. The important rule: any function
defined (not just declared) in a header file must be marked ``inline`` or ``constexpr`` to avoid
multiple-definition linker errors.


Lambdas — Closures in C++
--------------------------

A lambda is an anonymous function object defined inline. It can capture variables from its
enclosing scope, making it a true closure.

.. code-block:: cpp

    // Syntax: [captures](parameters) -> return_type { body }

    // Simplest lambda: no capture, no parameters
    auto say_hello = []() { std::cout << "Hello\n"; };
    say_hello();

    // Lambda as a comparator for std::sort
    std::vector<int> nums{5, 2, 8, 1, 9};
    std::sort(nums.begin(), nums.end(),
              [](int a, int b) { return a > b; });  // descending order

    // Lambda that captures a local variable by value
    int threshold = 5;
    auto above_threshold = [threshold](int x) { return x > threshold; };
    // threshold captured by value: a copy is made at lambda creation

    // Lambda that captures by reference
    int count = 0;
    auto increment = [&count]() { ++count; };
    increment(); increment();
    // count == 2: lambda modifies the original variable

Capture Modes
~~~~~~~~~~~~~

.. code-block:: cpp

    int x = 10, y = 20;

    // Capture nothing — no access to local variables
    auto f1 = []() { return 42; };

    // Capture all by value — a snapshot is taken
    auto f2 = [=]() { return x + y; };     // x and y copied at lambda creation

    // Capture all by reference — lambda holds references
    auto f3 = [&]() { return x + y; };     // refers to x and y; beware lifetime

    // Mixed: capture x by value, y by reference
    auto f4 = [x, &y]() { y = x * 2; };

    // Capture this (in member functions)
    struct Counter {
        int value{0};
        auto make_incrementer() {
            return [this]() { ++value; };   // captures pointer to Counter object
        }
        // C++17: [*this] captures the object by value (safe for async)
        auto make_safe_incrementer() {
            return [*this]() mutable { ++value; };
        }
    };

**Dangling reference warning:** If a lambda captures by reference and the lambda outlives the
captured variables (e.g., stored in a callback or returned from a function), the references
become dangling. Always prefer capture by value for lambdas that outlive their enclosing scope.

``mutable`` Lambdas
~~~~~~~~~~~~~~~~~~~

A lambda that captures by value creates ``const`` copies by default. Use ``mutable`` to allow
the lambda to modify its captured copies.

.. code-block:: cpp

    int counter = 0;
    auto f = [counter]() mutable {
        ++counter;          // OK: modifies the lambda's own copy
        return counter;
    };

    f(); f(); f();
    // counter in the outer scope is still 0
    // the lambda's internal copy is 3

Generic Lambdas (C++14/20)
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    // C++14 generic lambda: auto parameters
    auto add = [](auto a, auto b) { return a + b; };
    add(1, 2);          // int + int = 3
    add(1.5, 2.5);      // double + double = 4.0

    // C++20 template lambda: full template syntax inside []
    auto typed_add = []<typename T>(T a, T b) -> T { return a + b; };

    // Generic lambda with forwarding (perfect forwarding in lambdas)
    auto forward_call = []<typename F, typename... Args>(F&& f, Args&&... args) {
        return std::forward<F>(f)(std::forward<Args>(args)...);
    };


``std::function`` — Type-Erased Callable
-----------------------------------------

``std::function<R(Args...)>`` is a general-purpose polymorphic callable wrapper. It stores any
callable that matches the given signature: function pointers, lambdas, functors.

.. code-block:: cpp

    #include <functional>
    #include <vector>

    using Callback = std::function<void(int)>;

    void register_handler(Callback cb) {
        cb(42);
    }

    // Works with a lambda
    register_handler([](int v) { std::cout << "Got: " << v << '\n'; });

    // Works with a function pointer
    void handle(int v) { std::cout << v << '\n'; }
    register_handler(handle);

    // Works with a bound member function
    struct Logger {
        void log(int v) { std::cout << "Log: " << v << '\n'; }
    };
    Logger logger;
    register_handler(std::bind(&Logger::log, &logger, std::placeholders::_1));
    // Prefer lambda over std::bind for clarity:
    register_handler([&logger](int v) { logger.log(v); });

**Performance tradeoff:** ``std::function`` uses type erasure, which involves a heap allocation
for large lambdas and a virtual dispatch on each call. For hot paths, prefer template parameters
(``template<typename F> void call(F&& f)``) which compile to direct calls.

Function Pointers
~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    // Function pointer syntax: return_type (*name)(params)
    int (*math_op)(int, int) = nullptr;

    int add(int a, int b) { return a + b; }
    int mul(int a, int b) { return a * b; }

    math_op = add;
    int result = math_op(3, 4);   // calls add: result == 7

    math_op = mul;
    result = math_op(3, 4);       // calls mul: result == 12

    // Typedef makes function pointer types readable
    using BinaryOp = int(*)(int, int);
    BinaryOp ops[] = {add, mul};

Function pointers cannot capture state. When you need a stateful callable, use a lambda or a
functor. Use function pointers only when interfacing with C APIs that require them.


Callbacks and Higher-Order Functions
-------------------------------------

.. code-block:: cpp

    #include <vector>
    #include <algorithm>
    #include <functional>

    // Higher-order function: accepts a callable as a parameter
    template<typename Container, typename Predicate>
    Container filter(const Container& input, Predicate pred) {
        Container result;
        std::copy_if(input.begin(), input.end(),
                     std::back_inserter(result), pred);
        return result;
    }

    int main() {
        std::vector<int> nums{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

        auto evens = filter(nums, [](int n) { return n % 2 == 0; });
        // evens: {2, 4, 6, 8, 10}

        int min_val = 4;
        auto large  = filter(nums, [min_val](int n) { return n > min_val; });
        // large: {5, 6, 7, 8, 9, 10} — min_val captured by value
    }


When to Use Each Callable Type
-------------------------------

+--------------------+---------------------------+------------------------------------+
| Callable type      | Use when                  | Avoid when                         |
+====================+===========================+====================================+
| Function pointer   | C API interop, no state   | State needed, type safety matters  |
+--------------------+---------------------------+------------------------------------+
| ``std::function``  | Runtime-polymorphic cb    | Hot path, small overhead matters   |
+--------------------+---------------------------+------------------------------------+
| Template parameter | Hot path, compile-time    | API boundary where type must vary  |
+--------------------+---------------------------+------------------------------------+
| Lambda             | Local, one-off callables  | Complex logic (name it instead)    |
+--------------------+---------------------------+------------------------------------+


Self-Check Questions
--------------------

**Q1: When should you pass a ``std::string`` by value instead of by ``const std::string&``?**

Pass by value when the function always needs its own copy — for example, a constructor that
stores the string in a member. The caller can then provide an lvalue (copy will occur) or an
rvalue (move will occur), letting the compiler choose the cheapest path. If you pass by
``const&``, the constructor must explicitly copy inside.

**Q2: What is the risk of capturing by reference ``[&]`` in a lambda stored as a callback?**

The lambda holds references to local variables in the enclosing scope. If those variables are
destroyed (e.g., the enclosing function returns) before the lambda is invoked, the references
are dangling — reading or writing them is undefined behaviour. The fix is to capture by value
``[=]`` or by move ``[val = std::move(val)]`` for lambdas that outlive their creation scope.

**Q3: Why is ``std::function`` slower than a template callable parameter?**

``std::function`` uses type erasure: it stores the callable in a type-erased internal buffer
(potentially heap-allocated) and dispatches through a virtual function table on each call. A
template callable parameter is resolved at compile time and the call is a direct (inlineable)
function call. The difference is noticeable only in hot loops but can be significant.

**Q4: What does ``mutable`` do on a lambda and when do you need it?**

By default, a lambda's call operator is ``const``, so value-captured copies cannot be modified.
``mutable`` removes the ``const``, allowing the lambda to modify its captured value copies. A
typical use: a stateful counter or accumulator lambda that tracks state across calls.
