Pitfalls — Day 02: Functions and Lambdas
=========================================

Pitfall 1: Capturing a Dangling Reference in a Lambda
------------------------------------------------------

**Description:** Capturing a local variable by reference in a lambda that outlives the scope
where that variable was defined. When the lambda is later invoked, the reference is dangling.

**BAD code:**

.. code-block:: cpp

    #include <functional>
    #include <iostream>

    std::function<int()> make_counter() {
        int count = 0;                      // local variable on the stack
        return [&count]() { return ++count; };  // captures by reference
    }   // count is destroyed here

    int main() {
        auto counter = make_counter();
        std::cout << counter() << '\n';     // UB: reads destroyed local variable
    }

**Why it fails:** ``count`` lives on ``make_counter``'s stack frame. When ``make_counter``
returns, that frame is gone. The lambda still holds a reference to where ``count`` used to be.
Invoking the lambda reads from or writes to deallocated stack memory — undefined behaviour.
AddressSanitizer reports "stack-use-after-return".

**GOOD code:**

.. code-block:: cpp

    #include <functional>
    #include <iostream>

    std::function<int()> make_counter() {
        int count = 0;
        return [count]() mutable { return ++count; };  // capture by value
    }   // count copy is stored inside the lambda object — safe

    int main() {
        auto counter = make_counter();
        std::cout << counter() << '\n';  // 1 — well-defined
        std::cout << counter() << '\n';  // 2
    }

**Detection tip:** Enable AddressSanitizer (``-fsanitize=address``) in Debug builds. Also review
every ``[&]`` capture on lambdas stored in ``std::function``, callbacks, or returned from
functions — these are high-risk capture sites.


Pitfall 2: Passing a Large Object by Value When ``const&`` Suffices
--------------------------------------------------------------------

**Description:** Writing a function that only reads a large object but takes it by value,
causing an unnecessary deep copy on every call.

**BAD code:**

.. code-block:: cpp

    #include <vector>
    #include <numeric>
    #include <iostream>

    // Takes std::vector<double> by value — copies all elements on every call
    double average(std::vector<double> data) {
        if (data.empty()) return 0.0;
        return std::accumulate(data.begin(), data.end(), 0.0) / data.size();
    }

    int main() {
        std::vector<double> readings(1'000'000, 1.5);
        std::cout << average(readings) << '\n';  // copies 1,000,000 doubles
    }

**Why it fails:** The copy constructor for ``std::vector<double>`` allocates a new heap buffer
and copies every element. For 1,000,000 doubles that is 8 MB copied for a function that only
reads the data. The cost is entirely unnecessary.

**GOOD code:**

.. code-block:: cpp

    #include <vector>
    #include <numeric>

    // const& avoids the copy — no heap allocation, no data movement
    double average(const std::vector<double>& data) {
        if (data.empty()) return 0.0;
        return std::accumulate(data.begin(), data.end(), 0.0)
               / static_cast<double>(data.size());
    }

**Detection tip:** ``clang-tidy`` check ``performance-unnecessary-value-param`` flags functions
that take expensive types by value but only read them. Also: if you see a function parameter
that is a ``std::vector``, ``std::string``, or any non-trivial type, ask "does this function
need its own copy?" If no, use ``const&``.


Pitfall 3: Accidental Overload Shadowing
-----------------------------------------

**Description:** Adding a new overload with a default argument that shadows a previously selected
overload, silently changing the behaviour of existing callers.

**BAD code:**

.. code-block:: cpp

    #include <iostream>

    void process(int x) {
        std::cout << "process(int): " << x << '\n';
    }

    // Added later: a "more convenient" overload
    void process(int x, bool verbose = false) {
        std::cout << "process(int, bool): " << x
                  << (verbose ? " [verbose]" : "") << '\n';
    }

    int main() {
        process(42);   // ERROR: call is ambiguous — both are viable
    }

**Why it fails:** ``process(42)`` can match both ``process(int)`` (exact) and
``process(int, bool)`` (second argument defaulted). The compiler reports an ambiguity error, or
worse, silently picks one based on conversion ranking, changing existing behaviour without a
diagnostic.

**GOOD code:**

.. code-block:: cpp

    #include <iostream>

    // Option 1: remove the original if the new one is a strict superset
    void process(int x, bool verbose = false) {
        std::cout << "process: " << x
                  << (verbose ? " [verbose]" : "") << '\n';
    }

    // Option 2: use a struct with named options to avoid overload proliferation
    struct ProcessOptions { bool verbose = false; };
    void process(int x, ProcessOptions opts = {}) {
        std::cout << "process: " << x
                  << (opts.verbose ? " [verbose]" : "") << '\n';
    }

    int main() {
        process(42);                          // uses defaults
        process(42, {.verbose = true});       // C++20 designated initialiser
    }

**Detection tip:** When you add a new overload, compile and run all existing callers to verify
they still resolve to the intended overload. ``-Wall`` will report some ambiguities but not all.


Pitfall 4: Storing a ``std::function`` Over a Template Parameter in Hot Code
-----------------------------------------------------------------------------

**Description:** Using ``std::function`` to store callbacks inside a frequently-called class or
function, paying type-erasure overhead on every invocation.

**BAD code:**

.. code-block:: cpp

    #include <functional>
    #include <vector>

    class EventProcessor {
    public:
        void set_handler(std::function<void(int)> h) { handler_ = h; }

        void process_all(const std::vector<int>& events) {
            for (int e : events) {
                handler_(e);   // virtual dispatch + possible heap dereference per call
            }
        }
    private:
        std::function<void(int)> handler_;
    };

**Why it fails:** ``std::function`` type-erases the callable, storing it behind a virtual
dispatch table. For large event volumes, the overhead of the virtual call and potential cache
miss is measurable — often 3–5x slower than a direct call.

**GOOD code:**

.. code-block:: cpp

    #include <vector>

    // Template: compiler generates specialised code per callable type
    template<typename Handler>
    class EventProcessor {
    public:
        explicit EventProcessor(Handler h) : handler_{std::move(h)} {}

        void process_all(const std::vector<int>& events) {
            for (int e : events) {
                handler_(e);   // direct (inlineable) call
            }
        }
    private:
        Handler handler_;
    };

    // Usage
    auto proc = EventProcessor{[](int e) { /* handle */ }};

    // If you need runtime polymorphism at an API boundary, std::function is fine:
    void register_global_handler(std::function<void(int)> h);

**Detection tip:** Profile before optimising. Use ``std::function`` freely at API boundaries
and in non-hot paths. Replace with templates only when profiling identifies the call overhead
as a bottleneck.


Pitfall 5: Ignoring ``[[nodiscard]]`` on Return Values
-------------------------------------------------------

**Description:** Calling a function that returns an error code or important value and ignoring
the return, silently discarding failure information.

**BAD code:**

.. code-block:: cpp

    #include <system_error>
    #include <fstream>

    // Returns an error code that callers frequently ignore
    std::error_code write_file(const std::string& path, const std::string& data) {
        std::ofstream f(path);
        if (!f) return std::make_error_code(std::errc::permission_denied);
        f << data;
        return {};
    }

    int main() {
        write_file("/read_only_dir/log.txt", "important data");
        // Return value ignored — failure is silent
    }

**Why it fails:** The file write may fail silently. The caller has no indication that the data
was not written. In a logging or configuration system, this means data loss with no error report.

**GOOD code:**

.. code-block:: cpp

    #include <system_error>

    // [[nodiscard]] forces callers to handle the return value
    [[nodiscard]] std::error_code write_file(const std::string& path,
                                              const std::string& data) {
        std::ofstream f(path);
        if (!f) return std::make_error_code(std::errc::permission_denied);
        f << data;
        return {};
    }

    int main() {
        // write_file(...);    // compiler warning: ignoring nodiscard value
        if (auto ec = write_file("/tmp/log.txt", "important data"); ec) {
            std::cerr << "Write failed: " << ec.message() << '\n';
        }
    }

**Detection tip:** Mark all functions whose return value carries ownership or error information
with ``[[nodiscard]]``. ``clang-tidy`` check ``modernize-use-nodiscard`` suggests adding
``[[nodiscard]]`` to appropriate functions automatically.
