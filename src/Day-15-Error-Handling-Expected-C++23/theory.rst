Error Handling and std::expected (C++23)
=========================================

Motivation
----------

Error handling is one of the most contentious design areas in C++.  Three main
approaches exist, each with distinct tradeoffs:

* **Exceptions** — the standard mechanism; zero-overhead on the happy path; complex
  stack unwinding; can make it hard to reason about control flow.
* **Error codes** — explicit, cheap, forces callers to check; but easy to ignore,
  clutters call sites, and cannot carry rich context.
* **``std::expected<T, E>``** (C++23) — a return type that is either a value or an
  error; makes the error path visible in the type system; enables monadic chaining.

Modern C++ favours the third approach for functions where failure is expected and
common, and reserves exceptions for truly exceptional conditions.

Exceptions — Strengths and Weaknesses
---------------------------------------

.. code-block:: cpp

    #include <stdexcept>
    #include <fstream>
    #include <string>

    std::string read_file(const std::string& path) {
        std::ifstream f(path);
        if (!f) throw std::runtime_error{"cannot open: " + path};
        return std::string{std::istreambuf_iterator<char>(f), {}};
    }

    // Caller either handles or propagates
    try {
        auto text = read_file("config.txt");
        process(text);
    } catch (const std::runtime_error& e) {
        std::cerr << "Error: " << e.what() << '\n';
    }

**When to use exceptions**:

* Truly exceptional conditions (out-of-memory, logic programming errors).
* When error handling belongs far from the error site.
* When many intermediate call frames should not be burdened with error-forwarding.

**Costs**:

* Non-local control flow makes code harder to audit.
* ``noexcept`` annotations must be carefully maintained.
* Forbidden in many embedded and real-time contexts.
* Exception tables in the binary add size (though runtime cost is near zero on
  the happy path with Itanium ABI).

``std::optional`` — Absent Values
-----------------------------------

``std::optional<T>`` represents a value that may or may not be present.  Use it
when absence is normal (not an error).

.. code-block:: cpp

    #include <optional>
    #include <string>
    #include <unordered_map>

    std::optional<std::string> find_user(int id,
            const std::unordered_map<int, std::string>& db) {
        auto it = db.find(id);
        if (it == db.end()) return std::nullopt;
        return it->second;
    }

    auto name = find_user(42, users);
    if (name) {
        std::cout << "Found: " << *name << '\n';
    } else {
        std::cout << "Not found\n";
    }

    // value_or — provide a default
    std::string display = find_user(99, users).value_or("Anonymous");

    // value() — throws std::bad_optional_access if empty
    // *opt   — UB if empty; no check

**Design rule**: ``std::optional<T>`` for "no value is a normal outcome."
Do NOT use it to represent errors with a reason — use ``std::expected`` for that.

``std::expected<T, E>`` (C++23)
---------------------------------

``std::expected<T, E>`` holds either a value of type ``T`` (success) or an error
of type ``E`` (failure).  It makes the error path visible in the return type.

.. code-block:: cpp

    #include <expected>
    #include <string>
    #include <charconv>
    #include <system_error>

    // Error type — can be anything; std::string, enum, or a custom struct
    enum class ParseError { empty_input, invalid_format, overflow };

    std::expected<int, ParseError> parse_int(std::string_view sv) {
        if (sv.empty()) return std::unexpected(ParseError::empty_input);
        int result{};
        auto [ptr, ec] = std::from_chars(sv.data(), sv.data() + sv.size(), result);
        if (ec == std::errc::invalid_argument)
            return std::unexpected(ParseError::invalid_format);
        if (ec == std::errc::result_out_of_range)
            return std::unexpected(ParseError::overflow);
        return result;  // success — wraps int
    }

    // Calling code
    auto r = parse_int("123");
    if (r) {
        std::cout << "Value: " << *r << '\n';     // or r.value()
    } else {
        switch (r.error()) {
            case ParseError::empty_input:    std::cerr << "empty\n";   break;
            case ParseError::invalid_format: std::cerr << "format\n";  break;
            case ParseError::overflow:       std::cerr << "overflow\n";break;
        }
    }

    // has_value() / error() accessors
    if (!r.has_value()) std::cerr << "failed\n";
    int val = r.value_or(-1);   // default if error

``std::variant`` as a Result Type
------------------------------------

Before C++23, ``std::variant<T, E>`` was the idiomatic result type.  It is more
verbose but works in C++17.

.. code-block:: cpp

    #include <variant>
    #include <string>

    using Result = std::variant<int, std::string>;  // int on success, string on error

    Result divide(int a, int b) {
        if (b == 0) return std::string{"division by zero"};
        return a / b;
    }

    auto r = divide(10, 2);
    std::visit([]<typename T>(const T& v) {
        if constexpr (std::is_same_v<T, int>)
            std::cout << "Result: " << v << '\n';
        else
            std::cout << "Error: " << v << '\n';
    }, r);

Monadic Operations — ``.and_then`` and ``.or_else``
------------------------------------------------------

C++23 adds monadic operations to ``std::expected`` and ``std::optional``, enabling
pipeline-style error handling without nested ``if`` checks.

.. code-block:: cpp

    #include <expected>
    #include <string>
    #include <fstream>

    enum class Err { not_found, parse_error, range_error };

    std::expected<std::string, Err> read_config(const std::string& path);
    std::expected<int, Err>         parse_port(const std::string& text);
    std::expected<int, Err>         validate_port(int port);

    // Monadic chain — errors short-circuit automatically
    auto port = read_config("app.conf")
        .and_then(parse_port)      // called only if read_config succeeded
        .and_then(validate_port);  // called only if parse_port succeeded

    if (!port) {
        // Handle the first error that occurred
        std::cerr << "Configuration failed\n";
    } else {
        std::cout << "Listening on port " << *port << '\n';
    }

    // or_else — recover from an error
    auto recovered = read_config("app.conf")
        .or_else([](Err) {
            return std::expected<std::string, Err>{"8080"};  // default value
        })
        .and_then(parse_port);

ASCII diagram — monadic chain::

    read_config("app.conf")
         │
         ▼ (success: "port=8080")
    and_then(parse_port)
         │
         ▼ (success: 8080)
    and_then(validate_port)
         │
         ▼ (success: 8080)
    *port = 8080

    If any step returns unexpected(Err::X):
    ─────────────────────────────────────
    read_config  →  unexpected(not_found)
         │
    and_then skipped ──────────────────────┐
    and_then skipped ──────────────────────┤
                                           ▼
                               port.error() == Err::not_found

``noexcept`` Correctness
-------------------------

``noexcept`` is a contract: the function will not propagate exceptions.  It enables
optimisations and is required for move operations to be used by standard containers.

.. code-block:: cpp

    // noexcept: the promise "I will not throw"
    void swap(Buffer& a, Buffer& b) noexcept {
        std::swap(a.data_, b.data_);
        std::swap(a.size_, b.size_);
    }

    // Conditional noexcept: depends on member operations
    template <typename T>
    class Container {
        T* data_;
    public:
        Container(Container&& other)
            noexcept(std::is_nothrow_move_constructible_v<T>)
            : data_(std::exchange(other.data_, nullptr)) {}
    };

    // noexcept(false) — explicitly allows throwing (rarely needed)
    // Leave it off: functions without noexcept may throw by default

    // Query at compile time
    static_assert(noexcept(swap(std::declval<Buffer&>(), std::declval<Buffer&>())));

**Guidelines**:

* Destructors are ``noexcept`` by default — do not throw from them.
* Move constructors and move assignment operators should be ``noexcept``.
* ``swap`` should always be ``noexcept``.
* Mark leaf functions ``noexcept`` only when you are certain they cannot throw.

Self-Check Questions
---------------------

#. **When should you use** ``std::optional`` **vs** ``std::expected``?

   Use ``std::optional<T>`` when "no value" is a normal outcome with no need to
   communicate *why*.  Use ``std::expected<T, E>`` when failure is possible and the
   caller needs to know the error reason to act on it.

#. **What is the monadic** ``.and_then`` **method and why is it useful?**

   ``.and_then(f)`` calls ``f`` with the value only if the ``expected`` holds a
   value; if it holds an error, it passes the error through unchanged.  This chains
   fallible operations without nested ``if`` checks, making the happy path the
   straight-line path.

#. **Why is it safer to use** ``std::expected`` **than an error code return?**

   With ``std::expected``, the compiler enforces that the caller *either* accesses
   the value *or* inspects the error.  With a raw error code, the caller can silently
   ignore it and read an uninitialized output parameter.

#. **What does marking a function** ``noexcept`` **do for standard containers?**

   Standard containers (``std::vector``, ``std::deque``) use the move constructor
   during reallocation only if it is ``noexcept``.  Without it, they fall back to
   the copy constructor to maintain the strong exception guarantee.

#. **Describe the difference between the basic and strong exception guarantees.**

   Basic: after an exception, the object is in a valid (but unspecified) state;
   no resources are leaked.  Strong: after an exception, the object's state is
   exactly what it was before the operation — as if nothing happened.
