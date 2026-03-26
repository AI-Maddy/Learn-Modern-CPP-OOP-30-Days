Pitfalls — Day 15: Error Handling and std::expected (C++23)
=============================================================

Pitfall 1: Ignoring the Return Value of ``std::expected``
----------------------------------------------------------

**Description**: Calling a function that returns ``std::expected<T, E>`` and
discarding the return value silently swallows the error — the same problem as
ignoring an error code.

**BAD**

.. code-block:: cpp

    #include <expected>

    std::expected<int, std::string> open_file(const std::string& path);

    open_file("/nonexistent/path");   // return value discarded — error silently lost
    // The program continues as if nothing happened

**Why it fails**: Unlike exceptions, ``std::expected`` does not automatically
propagate.  If you do not inspect the return value, the error is gone.

**GOOD**

.. code-block:: cpp

    // Option A: explicit check
    auto result = open_file("/nonexistent/path");
    if (!result) {
        std::cerr << "Failed to open file: " << result.error() << '\n';
        return;
    }
    int fd = *result;

    // Option B: use .value() which throws std::bad_expected_access if error
    int fd = open_file("/some/path").value();

    // Option C: mark functions [[nodiscard]] to get a compiler warning
    [[nodiscard]] std::expected<int, std::string> safe_open(const std::string& p);

**Detection tip**: Add ``[[nodiscard]]`` to every function returning
``std::expected``.  GCC and Clang emit a warning when the result is discarded.

Pitfall 2: Accessing ``std::optional`` Value Without a Check
-------------------------------------------------------------

**Description**: Calling ``*opt`` or ``opt.value()`` on an empty ``std::optional``
is either undefined behaviour (``operator*``) or an exception
(``value()`` throws ``std::bad_optional_access``).

**BAD**

.. code-block:: cpp

    #include <optional>

    std::optional<std::string> find_name(int id) {
        if (id == 1) return "Alice";
        return std::nullopt;
    }

    auto name = find_name(99);
    std::cout << *name;       // BAD: UB — name is empty, dereferencing is UB
    std::cout << name.value(); // throws std::bad_optional_access — at least it's
                               // a defined failure, but still an unhandled exception

**Why it fails**: The standard says dereferencing an empty optional is UB.  The
``value()`` overload throws, but an uncaught throw terminates the program.

**GOOD**

.. code-block:: cpp

    auto name = find_name(99);

    // Pattern 1: explicit bool check
    if (name) {
        std::cout << *name;   // safe: only entered if name has a value
    }

    // Pattern 2: value_or — provide a default
    std::cout << name.value_or("Unknown");

    // Pattern 3: if-initialiser (C++17)
    if (auto n = find_name(99); n) {
        std::cout << *n;
    }

**Detection tip**: Clang-tidy ``bugprone-unchecked-optional-access`` warns when an
optional is dereferenced without a prior check.

Pitfall 3: Using ``std::expected`` for Logic Errors — Misuse of the Abstraction
--------------------------------------------------------------------------------

**Description**: Using ``std::expected`` to report programming errors (null pointer
dereference, out-of-bounds, precondition violations) forces callers to handle errors
that should never occur in correct code.

**BAD**

.. code-block:: cpp

    // index should never be negative — this is a programming error, not user error
    std::expected<int, std::string> get_element(const std::vector<int>& v, int index) {
        if (index < 0)
            return std::unexpected{"negative index"};  // BAD: caller can't "handle" this
        return v.at(index);
    }

    // Every call site now clutters with error handling for something that is
    // a programmer bug, not an expected runtime condition.

**Why it fails**: Logic errors cannot be "handled" by callers — they indicate a
defect in the program.  Surfacing them as ``expected`` errors suggests callers should
do something when they see them, which is misleading.

**GOOD**

.. code-block:: cpp

    // Use assert / contract for programming errors
    int get_element(const std::vector<int>& v, int index) {
        assert(index >= 0 && "index must be non-negative");
        assert(static_cast<std::size_t>(index) < v.size() && "index out of range");
        return v[index];
    }

    // Use std::expected only for expected, recoverable failures
    std::expected<int, std::string> parse_element(const std::string& s) {
        // User-provided string might be invalid — this is an expected failure
        try {
            return std::stoi(s);
        } catch (...) {
            return std::unexpected{"not a number: " + s};
        }
    }

**Detection tip**: Ask: "Can a correct program ever reach this error path?"  If no,
it is a programming error — use assertions.  If yes, use ``std::expected``.

Pitfall 4: Throwing from a Destructor
---------------------------------------

**Description**: Throwing an exception from a destructor while another exception is
already propagating calls ``std::terminate``.

**BAD**

.. code-block:: cpp

    class FileHandle {
        FILE* f_;
    public:
        explicit FileHandle(const char* name) : f_(fopen(name, "r")) {
            if (!f_) throw std::runtime_error{"cannot open file"};
        }
        ~FileHandle() {
            if (fclose(f_) != 0)
                throw std::runtime_error{"close failed"};  // DANGEROUS!
        }
    };

    // If an exception is thrown elsewhere and FileHandle's destructor runs
    // during stack unwinding, throwing again calls std::terminate.

**Why it fails**: During stack unwinding, destructors are called.  If a destructor
throws while unwinding from another exception, ``std::terminate`` is called
(C++ standard §15.5.1).

**GOOD**

.. code-block:: cpp

    class FileHandle {
        FILE* f_;
    public:
        explicit FileHandle(const char* name) : f_(fopen(name, "r")) {
            if (!f_) throw std::runtime_error{"cannot open file"};
        }
        ~FileHandle() noexcept {   // noexcept — absorb the error
            if (fclose(f_) != 0)
                std::cerr << "Warning: file close failed\n";
            // Do NOT throw here
        }
        // Provide a separate close() that can throw, for callers who care
        void close() {
            if (fclose(f_) != 0) throw std::runtime_error{"close failed"};
            f_ = nullptr;
        }
    };

**Detection tip**: ``-Wno-exceptions`` and GCC's ``-fno-exceptions`` combined with
clang-tidy ``bugprone-exception-escape`` will warn about exceptions escaping
destructors.

Pitfall 5: Monadic Chains — Forgetting Error Type Consistency
--------------------------------------------------------------

**Description**: ``.and_then`` requires that the transformation function returns an
``std::expected`` with the **same error type**.  Mixing error types breaks the chain.

**BAD**

.. code-block:: cpp

    using ParseResult = std::expected<int, std::string>;
    using ValidResult = std::expected<int, int>;   // different error type!

    ParseResult parse(const std::string& s) { /* ... */ return 0; }
    ValidResult validate(int n) { /* ... */ return n; }

    // ERROR: and_then requires same E type in the chained expected
    auto result = parse("42").and_then(validate);  // compile error!

**Why it fails**: ``and_then`` on ``std::expected<T, E>`` requires the callable to
return ``std::expected<U, E>`` — the same ``E``.  Returning a different error type
breaks the type chain.

**GOOD**

.. code-block:: cpp

    // Option A: use the same error type throughout the pipeline
    enum class AppError { parse_error, range_error, not_found };

    std::expected<int, AppError> parse(const std::string& s);
    std::expected<int, AppError> validate(int n);

    auto result = parse("42").and_then(validate);  // OK: same AppError everywhere

    // Option B: convert error types explicitly in or_else
    auto result2 = parse("42")
        .or_else([](const std::string& e) -> std::expected<int, AppError> {
            return std::unexpected{AppError::parse_error};
        })
        .and_then(validate);

**Detection tip**: Design the error type hierarchy upfront.  A single ``enum class
AppError`` or ``std::error_code`` type used throughout a module keeps ``and_then``
chains consistent.
