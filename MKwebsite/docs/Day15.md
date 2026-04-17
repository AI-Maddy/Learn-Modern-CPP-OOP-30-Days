# Day 15: Error Handling and std::expected (C++23)

## Why This Day Matters

Error handling is one of the most contentious design areas in C++. Three main
approaches exist, each with distinct tradeoffs:

- **Exceptions** — the standard mechanism; zero-overhead on the happy path; complex stack unwinding; can make it hard to reason about control flow.
- **Error codes** — explicit, cheap, forces callers to check; but easy to ignore, clutters call sites, and cannot carry rich context.
- **`std::expected<T, E>`** (C++23) — a return type that is either a value or an error; makes the error path visible in the type system; enables monadic chaining.

Modern C++ favours the third approach for functions where failure is expected and
common, and reserves exceptions for truly exceptional conditions.

## Learning Outcomes

After completing this day you will be able to:

- Explain when to use exceptions, `std::optional`, and `std::expected<T,E>` and select the right tool for a given situation.
- Implement a function returning `std::expected<T, E>` with a custom error enum and handle all outcomes at the call site.
- Build a monadic error-handling pipeline using `.and_then` and `.or_else` that eliminates nested `if` error checks.
- Apply `noexcept` correctly to destructors, move operations, and swap functions and explain the consequences of incorrect `noexcept` annotation.
- Distinguish logic errors (programming defects) from runtime errors (expected failures) and apply the appropriate reporting mechanism for each.

## Key Concepts

- **Exceptions** — non-local error propagation; zero-overhead happy path; forbidden in many embedded and real-time contexts; best for truly exceptional conditions.
- **Error codes** — explicit, cheap, always visible in the return type; easy to ignore; clutters intermediate call frames with forwarding boilerplate.
- **`std::optional<T>`** — a value-or-absent type; correct when absence has no error reason; `value_or` provides a convenient default.
- **`std::expected<T, E>`** (C++23) — a value-or-error type; the error type is part of the interface; cannot be accidentally discarded when `[[nodiscard]]`.
- **`std::unexpected`** — the wrapper used to construct the error case of `std::expected`.
- **`.and_then`** — monadic transform: calls the function only on success, short-circuits on error; requires same error type `E` in the chain.
- **`.or_else`** — monadic recovery: calls the function only on error, allows converting or swallowing errors.
- **`noexcept`** — a compile-time contract; enables move-based reallocation in containers; destructors are implicitly `noexcept`.
- **Exception safety levels** — nothrow, strong, basic; know which guarantee each of your functions provides.

## Theory

### Motivation

Error handling is one of the most contentious design areas in C++. Three main
approaches exist, each with distinct tradeoffs:

- **Exceptions** — the standard mechanism; zero-overhead on the happy path; complex stack unwinding.
- **Error codes** — explicit, cheap, forces callers to check; but easy to ignore.
- **`std::expected<T, E>`** (C++23) — a return type that is either a value or an error; makes the error path visible in the type system; enables monadic chaining.

### Exceptions — Strengths and Weaknesses

```cpp
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
```

**When to use exceptions**:

- Truly exceptional conditions (out-of-memory, logic programming errors).
- When error handling belongs far from the error site.
- When many intermediate call frames should not be burdened with error-forwarding.

**Costs**:

- Non-local control flow makes code harder to audit.
- `noexcept` annotations must be carefully maintained.
- Forbidden in many embedded and real-time contexts.
- Exception tables in the binary add size (though runtime cost is near zero on the happy path with Itanium ABI).

### `std::optional` — Absent Values

`std::optional<T>` represents a value that may or may not be present. Use it
when absence is normal (not an error).

```cpp
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
```

**Design rule**: `std::optional<T>` for "no value is a normal outcome."
Do NOT use it to represent errors with a reason — use `std::expected` for that.

### `std::expected<T, E>` (C++23)

`std::expected<T, E>` holds either a value of type `T` (success) or an error
of type `E` (failure). It makes the error path visible in the return type.

```cpp
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
```

### `std::variant` as a Result Type

Before C++23, `std::variant<T, E>` was the idiomatic result type. It is more
verbose but works in C++17.

```cpp
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
```

### Monadic Operations — `.and_then` and `.or_else`

C++23 adds monadic operations to `std::expected` and `std::optional`, enabling
pipeline-style error handling without nested `if` checks.

```cpp
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
```

Monadic chain diagram:

```
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
```

### `noexcept` Correctness

`noexcept` is a contract: the function will not propagate exceptions. It enables
optimisations and is required for move operations to be used by standard containers.

```cpp
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

// Query at compile time
static_assert(noexcept(swap(std::declval<Buffer&>(), std::declval<Buffer&>())));
```

**Guidelines**:

- Destructors are `noexcept` by default — do not throw from them.
- Move constructors and move assignment operators should be `noexcept`.
- `swap` should always be `noexcept`.
- Mark leaf functions `noexcept` only when you are certain they cannot throw.

## Pitfalls

### Pitfall 1: Ignoring the Return Value of `std::expected`

**Description**: Calling a function that returns `std::expected<T, E>` and
discarding the return value silently swallows the error — the same problem as
ignoring an error code.

**BAD**

```cpp
#include <expected>

std::expected<int, std::string> open_file(const std::string& path);

open_file("/nonexistent/path");   // return value discarded — error silently lost
// The program continues as if nothing happened
```

**GOOD**

```cpp
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
```

**Detection tip**: Add `[[nodiscard]]` to every function returning
`std::expected`. GCC and Clang emit a warning when the result is discarded.

### Pitfall 2: Accessing `std::optional` Value Without a Check

**Description**: Calling `*opt` or `opt.value()` on an empty `std::optional`
is either undefined behaviour (`operator*`) or an exception
(`value()` throws `std::bad_optional_access`).

**BAD**

```cpp
#include <optional>

std::optional<std::string> find_name(int id) {
    if (id == 1) return "Alice";
    return std::nullopt;
}

auto name = find_name(99);
std::cout << *name;       // BAD: UB — name is empty, dereferencing is UB
std::cout << name.value(); // throws std::bad_optional_access
```

**GOOD**

```cpp
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
```

**Detection tip**: Clang-tidy `bugprone-unchecked-optional-access` warns when an
optional is dereferenced without a prior check.

### Pitfall 3: Using `std::expected` for Logic Errors — Misuse of the Abstraction

**Description**: Using `std::expected` to report programming errors (null pointer
dereference, out-of-bounds, precondition violations) forces callers to handle errors
that should never occur in correct code.

**BAD**

```cpp
// index should never be negative — this is a programming error, not user error
std::expected<int, std::string> get_element(const std::vector<int>& v, int index) {
    if (index < 0)
        return std::unexpected{"negative index"};  // BAD: caller can't "handle" this
    return v.at(index);
}
```

**GOOD**

```cpp
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
```

**Detection tip**: Ask: "Can a correct program ever reach this error path?" If no,
it is a programming error — use assertions. If yes, use `std::expected`.

### Pitfall 4: Throwing from a Destructor

**Description**: Throwing an exception from a destructor while another exception is
already propagating calls `std::terminate`.

**BAD**

```cpp
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
```

**Why it fails**: During stack unwinding, destructors are called. If a destructor
throws while unwinding from another exception, `std::terminate` is called
(C++ standard §15.5.1).

**GOOD**

```cpp
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
```

**Detection tip**: `bugprone-exception-escape` clang-tidy check will warn about
exceptions escaping destructors.

### Pitfall 5: Monadic Chains — Forgetting Error Type Consistency

**Description**: `.and_then` requires that the transformation function returns an
`std::expected` with the **same error type**. Mixing error types breaks the chain.

**BAD**

```cpp
using ParseResult = std::expected<int, std::string>;
using ValidResult = std::expected<int, int>;   // different error type!

ParseResult parse(const std::string& s) { /* ... */ return 0; }
ValidResult validate(int n) { /* ... */ return n; }

// ERROR: and_then requires same E type in the chained expected
auto result = parse("42").and_then(validate);  // compile error!
```

**GOOD**

```cpp
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
```

**Detection tip**: Design the error type hierarchy upfront. A single `enum class
AppError` or `std::error_code` type used throughout a module keeps `and_then`
chains consistent.

## Code Example

```cpp
#include <iostream>
#include <string>
#include <variant>

struct ParseError {
    std::string message;
};

using ParseResult = std::variant<int, ParseError>;

ParseResult parse_positive(const std::string& text) {
    try {
        int value = std::stoi(text);
        if (value < 0) {
            return ParseError{"value must be non-negative"};
        }
        return value;
    } catch (...) {
        return ParseError{"invalid integer"};
    }
}

int main() {
    std::cout << "Day 15 - Error Handling\n";
    ParseResult result = parse_positive("42");
    if (auto p = std::get_if<int>(&result)) {
        std::cout << "Parsed: " << *p << "\n";
    } else {
        std::cout << "Error: " << std::get<ParseError>(result).message << "\n";
    }
    return 0;
}
```
