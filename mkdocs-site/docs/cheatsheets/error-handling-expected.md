---
title: "Error Handling Expected"
tags: ["cheatsheet", "reference"]
---

# :material-book: Error Handling Expected


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Error Handling and std::expected

<div class="contents" local="" depth="2">

Sections

</div>

## Exception Hierarchy Best Practices

Derive from the standard hierarchy so callers can catch at the right level:

``` cpp
// GOOD: derive from std::runtime_error (or logic_error, domain_error, etc.)
class NetworkError : public std::runtime_error {
public:
    explicit NetworkError(const std::string& msg, int code)
        : std::runtime_error(msg), code_(code) {}
    int code() const noexcept { return code_; }
private:
    int code_;
};

class TimeoutError : public NetworkError {
public:
    explicit TimeoutError(std::chrono::milliseconds dur)
        : NetworkError("connection timed out", 408), dur_(dur) {}
    auto duration() const noexcept { return dur_; }
private:
    std::chrono::milliseconds dur_;
};

// Catch at multiple granularities:
try {
    connect(host);
} catch (const TimeoutError& e) {
    retry_after(e.duration());
} catch (const NetworkError& e) {
    log_error(e.code(), e.what());
} catch (const std::exception& e) {
    log_fatal(e.what());
}
```

## noexcept Correctness

Mark functions `noexcept` when they **guarantee** not to throw. Incorrect noexcept causes `std::terminate` if an exception escapes.

``` cpp
// Rule: destructors, move operations, and swap should be noexcept
class Buffer {
public:
    Buffer(Buffer&& other) noexcept : data_(other.data_), sz_(other.sz_) {
        other.data_ = nullptr;
        other.sz_ = 0;
    }
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            sz_ = other.sz_;
            other.data_ = nullptr;
        }
        return *this;
    }
    ~Buffer() noexcept { delete[] data_; }  // always noexcept by default

private:
    int* data_ = nullptr;
    std::size_t sz_ = 0;
};

// Conditional noexcept: propagate noexcept from sub-operations
template <typename T>
void swap_vals(T& a, T& b) noexcept(noexcept(std::swap(a, b))) {
    std::swap(a, b);
}

// noexcept enables compiler optimisations:
// std::vector's reallocation uses move iff move ctor is noexcept
```

## std::optional for "No Value" Results

Use when absence is normal and no error reason is needed:

``` cpp
std::optional<User> find_user(int id) {
    if (auto it = db.find(id); it != db.end())
        return it->second;
    return std::nullopt;
}

if (auto user = find_user(42)) {
    greet(*user);
} else {
    std::cout << "User not found\n";
}
```

## std::expected\<T, E\> (C++23)

Models a computation that either succeeds with `T` or fails with error `E`. Header: `<expected>`

``` cpp
#include <expected>

enum class ParseError { empty_input, invalid_char, overflow };

std::expected<int, ParseError> parse_int(std::string_view s) {
    if (s.empty()) return std::unexpected(ParseError::empty_input);
    for (char c : s)
        if (!std::isdigit(c)) return std::unexpected(ParseError::invalid_char);
    try {
        return std::stoi(std::string(s));
    } catch (const std::out_of_range&) {
        return std::unexpected(ParseError::overflow);
    }
}

// Access:
auto result = parse_int("42");
if (result) {
    std::cout << "Value: " << *result;         // or result.value()
} else {
    std::cout << "Error: " << (int)result.error();
}

// value_or (like optional):
int n = parse_int("bad").value_or(0);
```

## Monadic Operations on std::expected (C++23)

Chain fallible operations without nested if-checks:

``` cpp
std::expected<std::string, ParseError> to_hex(int n) {
    if (n < 0) return std::unexpected(ParseError::invalid_char);
    std::ostringstream ss;
    ss << std::hex << n;
    return ss.str();
}

// and_then: next step only if previous succeeded; must return expected<U,E>
auto r = parse_int("255")
    .and_then(to_hex)
    .and_then([](const std::string& s) -> std::expected<std::string, ParseError> {
        return "0x" + s;
    });

// transform: map value; wraps result in expected automatically
auto doubled = parse_int("21").transform([](int n){ return n * 2; });

// or_else: handle the error; must return expected<T,F>
auto recovered = parse_int("bad")
    .or_else([](ParseError e) -> std::expected<int, ParseError> {
        if (e == ParseError::empty_input) return 0;
        return std::unexpected(e);   // re-propagate other errors
    });

// transform_error: map the error type
auto str_err = parse_int("bad")
    .transform_error([](ParseError e) -> std::string {
        switch (e) {
            case ParseError::empty_input:  return "empty input";
            case ParseError::invalid_char: return "invalid character";
            case ParseError::overflow:     return "overflow";
        }
    });
```

## Chaining Multiple Fallible Operations

``` cpp
struct Config { std::string host; int port; int timeout_ms; };

std::expected<Config, std::string> load_config(const std::string& path) {
    return read_file(path)             // expected<string, string>
        .and_then(parse_json)          // expected<Json, string>
        .and_then(validate_schema)     // expected<Json, string>
        .transform([](const Json& j) -> Config {
            return { j["host"], j["port"], j["timeout"] };
        });
}

// Caller sees just one result: either a Config or an error string
auto cfg = load_config("app.json");
if (!cfg) { std::cerr << cfg.error(); return 1; }
start_server(*cfg);
```

## Comparison: Exceptions vs expected vs error_code

| Criterion                    | Exceptions                                                    | std::expected                                           | std::error_code                                      |
|------------------------------|---------------------------------------------------------------|---------------------------------------------------------|------------------------------------------------------|
| Error type                   | Any throwable                                                 | User-defined E                                          | std::error_code                                      |
| Caller must handle           | No (silent skip possible)                                     | Yes (warning if not checked)                            | No (can ignore)                                      |
| Performance                  | Zero cost on happy path; expensive on throw                   | Zero overhead always                                    | Zero overhead always                                 |
| Composability                | try/catch blocks                                              | .and_then chain                                         | Manual if/return                                     |
| Binary/embedded environments | Often disabled                                                | Always available                                        | Always available                                     |
| Stack unwinding              | Yes                                                           | No                                                      | No                                                   |
| Use for                      | Truly exceptional conditions, third party library integration | Expected failure paths, parsing, validation, IO results | C API integration, POSIX errno-style error reporting |

## Before/After: Exception to expected

``` cpp
// BEFORE: exceptions propagate silently
int divide(int a, int b) {
    if (b == 0) throw std::invalid_argument("division by zero");
    return a / b;
}
// callers forget try/catch; crash at runtime

// AFTER: expected forces caller to acknowledge error
std::expected<int, std::string> divide(int a, int b) {
    if (b == 0) return std::unexpected("division by zero");
    return a / b;
}
// compiler warns if return value is ignored (nodiscard pattern)
```

## Pitfalls

**Pitfall 1: Accessing value() on an error result**

``` cpp
auto r = parse_int("bad");
int n = r.value();   // throws std::bad_expected_access<ParseError>
// GOOD: always check with if(r) or use value_or
```

**Pitfall 2: Exception in noexcept function**

``` cpp
void process() noexcept {
    auto r = something_that_throws();   // calls std::terminate!
}
// GOOD: wrap in try/catch inside noexcept functions
```

**Pitfall 3: Mixing error strategies inconsistently**

``` cpp
// BAD: this API returns three different error mechanisms
int a = parse_a(s);          // throws on error
auto b = parse_b(s);         // returns optional
auto [val, ec] = parse_c(s); // returns error_code
// Callers can't reason about the error model

// GOOD: pick one strategy per module boundary and document it
```

## Cross-References

- `optional-variant-any.rst` — std::optional for simple absence
- `modern-cpp20-23-cheat.rst` — std::expected as a C++23 feature
- `common-pitfalls.rst` — exception-unsafe resource handling
- `catch2-testing.rst` — testing expected/optional error paths


---

[← All Cheatsheets](index.md)
