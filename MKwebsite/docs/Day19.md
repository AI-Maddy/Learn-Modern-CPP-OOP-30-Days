# Day 19: Testing with Catch2 and TDD

## Why This Day Matters

A C++ class that compiles and links may still be broken. Tests prove that the code does what its design intends — not just that it satisfies the type system. In OOP specifically, tests are the best way to verify that each class respects its own invariants after every operation, ensure that polymorphic dispatch routes to the correct override, confirm that copy/move semantics and RAII work correctly, and guard against regressions when refactoring hierarchies. Without tests, refactoring a class hierarchy is a leap of faith. With tests, it is a structured procedure with a safety net.

## Learning Outcomes

By the end of this day you will be able to:

* Write Catch2 `TEST_CASE` / `SECTION` / `REQUIRE` tests that document and verify class behaviour through the public interface.
* Apply the TDD red-green-refactor cycle to build a new class incrementally, letting failing tests drive the implementation.
* Create test doubles (stub, fake, mock) that substitute injected dependencies without a mocking framework.
* Use `REQUIRE_THROWS_AS` and `REQUIRE_NOTHROW` to verify exception safety and the strong guarantee.
* Generate an LCOV code-coverage report and interpret which paths are untested.
* Apply the naming convention `Class/method condition` for self-documenting test names.

## Key Concepts

* **TEST_CASE** — top-level test container; its string name appears in the test runner and serves as documentation.
* **SECTION** — independent branch within a test case; each runs from the start of the test case, providing implicit fixture reuse.
* **REQUIRE vs CHECK** — `REQUIRE` stops on first failure; `CHECK` records failures and continues, useful for validating multiple postconditions.
* **TDD red-green-refactor** — write a failing test, write minimum code to pass, then clean up; tests always drive the design.
* **Test double taxonomy** — stub (hardcoded return), fake (simplified working implementation), mock (records calls for verification).
* **`TEMPLATE_TEST_CASE`** — parameterises a test over multiple types, verifying LSP compliance across an entire class hierarchy.

## Theory

### Motivation — Why Tests Matter in OOP

A C++ class that compiles and links may still be broken. Tests prove that the code does what its design intends — not just that it satisfies the type system. In OOP specifically, tests are the best way to:

* Verify that each class respects its own invariants after every operation.
* Ensure that polymorphic dispatch routes to the correct override.
* Confirm that copy/move semantics and RAII work correctly.
* Guard against regressions when refactoring hierarchies.

Without tests, refactoring a class hierarchy is a leap of faith. With tests, it is a structured procedure with a safety net.

### Catch2 Fundamentals

Catch2 is a header-only (single-file) or CMake-installable test framework. It requires no separate `main()` and supports rich assertion macros.

**Setup with CMake (FetchContent):**

```cmake
include(FetchContent)
FetchContent_Declare(
  Catch2
  GIT_REPOSITORY https://github.com/catchorg/Catch2.git
  GIT_TAG        v3.5.2
)
FetchContent_MakeAvailable(Catch2)

add_executable(tests test_bank.cpp)
target_link_libraries(tests PRIVATE Catch2::Catch2WithMain)
```

**Basic test structure:**

```cpp
#include <catch2/catch_test_macros.hpp>

// TEST_CASE is the outer container — visible in test runner output
TEST_CASE("BankAccount initial state", "[bank]") {
    BankAccount acc{"Alice", 100.0};

    // SECTION creates a branch — each runs independently from the top
    SECTION("balance equals constructor argument") {
        REQUIRE(acc.balance() == 100.0);
    }

    SECTION("owner name is set correctly") {
        REQUIRE(acc.owner() == "Alice");
    }
}
```

`REQUIRE` fails the test and stops execution. `CHECK` records the failure but continues — useful for checking multiple postconditions that may all fail.

### Core Assertion Macros

```cpp
REQUIRE(expr);               // fails and stops if expr is false
CHECK(expr);                 // records failure, continues
REQUIRE_FALSE(expr);         // fails if expr is true
REQUIRE_THROWS(expr);        // fails if no exception is thrown
REQUIRE_THROWS_AS(expr, T);  // fails unless exception of type T is thrown
REQUIRE_NOTHROW(expr);       // fails if any exception is thrown
REQUIRE_THAT(val, matcher);  // Hamcrest-style matchers
```

**Approximate floating-point comparison:**

```cpp
#include <catch2/catch_approx.hpp>

REQUIRE(area(Circle{1.0}) == Catch::Approx(3.14159).epsilon(1e-4));
```

**String matchers:**

```cpp
#include <catch2/matchers/catch_matchers_string.hpp>
using namespace Catch::Matchers;

REQUIRE_THAT(greeting, ContainsSubstring("Hello"));
REQUIRE_THAT(filename, EndsWith(".cpp"));
```

### SECTION Mechanics — Fixture Reuse Without a Test Fixture Class

Every `SECTION` executes from the beginning of the `TEST_CASE`, so setup code at the top of the test case acts as an implicit fixture:

```cpp
TEST_CASE("Stack operations", "[stack]") {
    Stack<int> s;       // fresh stack for every SECTION
    s.push(1);
    s.push(2);

    SECTION("top returns most recently pushed value") {
        REQUIRE(s.top() == 2);
    }

    SECTION("pop removes the top element") {
        s.pop();
        REQUIRE(s.top() == 1);
    }

    SECTION("pop on a one-element stack leaves it empty") {
        s.pop(); s.pop();
        REQUIRE(s.empty());
    }
}
```

Each `SECTION` starts with `s` containing `{1, 2}`, making tests independent even though they share setup code.

### Test-Driven Development (TDD) — Red-Green-Refactor

TDD is a discipline where tests are written **before** production code:

```
┌──────────┐     write a failing test
│  RED     │ ──────────────────────────►
└──────────┘                           ┌──────────┐
     ▲                                 │  GREEN   │ write minimum code to pass
     │ refactor safely                 └──────────┘
     │         ◄──────────────────────       │
┌──────────┐     all tests still pass  ◄─────┘
│ REFACTOR │
└──────────┘
```

**Concrete TDD cycle — building a `Money` class:**

Step 1 (RED) — write the test first:

```cpp
TEST_CASE("Money addition", "[money]") {
    Money a{10, "USD"};
    Money b{20, "USD"};
    REQUIRE((a + b) == Money{30, "USD"});  // does not compile yet
}
```

Step 2 (GREEN) — write the minimum code to compile and pass:

```cpp
struct Money {
    int amount;
    std::string currency;

    bool operator==(const Money&) const = default;

    Money operator+(const Money& o) const {
        // minimal: ignore currency mismatch for now
        return {amount + o.amount, currency};
    }
};
```

Step 3 (REFACTOR) — clean up with all tests passing:

```cpp
Money operator+(const Money& o) const {
    if (currency != o.currency)
        throw std::invalid_argument("Currency mismatch");
    return {amount + o.amount, currency};
}

// Add a test for the exception:
TEST_CASE("Money currency mismatch throws", "[money]") {
    REQUIRE_THROWS_AS(Money{10,"USD"} + Money{5,"EUR"},
                      std::invalid_argument);
}
```

### Test Doubles — Stub, Fake, Mock

Test doubles substitute real dependencies in tests. Three important kinds:

**Stub** — returns hardcoded values, ignores input:

```cpp
struct StubDatabase : IDatabase {
    std::vector<Row> query(const std::string&) override {
        return { {"Alice", 100}, {"Bob", 200} };   // fixed response
    }
};
```

**Fake** — simplified but working implementation:

```cpp
struct FakeDatabase : IDatabase {
    std::unordered_map<std::string, int> data;

    void insert(const std::string& key, int val) override {
        data[key] = val;
    }
    std::optional<int> find(const std::string& key) const override {
        auto it = data.find(key);
        return it == data.end() ? std::nullopt : std::optional{it->second};
    }
};
```

**Mock** — records calls and verifies expectations:

```cpp
struct MockLogger : ILogger {
    mutable std::vector<std::string> messages;
    void log(std::string_view msg) override {
        messages.emplace_back(msg);
    }
};

TEST_CASE("OrderService logs placement", "[order]") {
    MockLogger logger;
    FakeDatabase db;
    OrderService service{db, logger};

    service.place_order({"item-1", 2});

    REQUIRE(logger.messages.size() == 1);
    REQUIRE_THAT(logger.messages[0], Catch::Matchers::ContainsSubstring("item-1"));
}
```

### Testing OOP Hierarchies

When testing polymorphic code, test through the **interface**, not the concrete type. This ensures Liskov compliance:

```cpp
// Parameterised test over all IShape implementations
TEMPLATE_TEST_CASE("Shape area is non-negative", "[shape]",
                   Circle, Square, Triangle) {
    TestType shape = make_test_shape<TestType>();
    REQUIRE(shape.area() >= 0.0);
}

// Test that a factory returns the correct dynamic type
TEST_CASE("ShapeFactory creates correct types", "[factory]") {
    auto c = ShapeFactory::create("circle");
    REQUIRE(dynamic_cast<Circle*>(c.get()) != nullptr);
}
```

### Test Naming Conventions

Good test names act as living documentation. The convention used in this course:

```
TEST_CASE("<Class>/<method> <condition>", "[tag]")
```

Examples:

```cpp
TEST_CASE("BankAccount/deposit increases balance by amount", "[bank]")
TEST_CASE("BankAccount/withdraw throws when insufficient funds", "[bank]")
TEST_CASE("BankAccount/withdraw to zero leaves balance at zero", "[bank]")
```

Tags enable selective test execution:

```bash
./tests "[bank]"          # run only bank tests
./tests "[bank][fast]"    # run tests with both tags
./tests "~[slow]"         # exclude slow tests
```

### Code Coverage

Coverage measures which lines were executed by the test suite. Low coverage does not mean tests are good; 100% coverage does not mean tests are thorough. But gaps in coverage reveal untested code paths.

With GCC/Clang:

```bash
# Compile with coverage flags
cmake -DCMAKE_CXX_FLAGS="--coverage" -DCMAKE_BUILD_TYPE=Debug .
cmake --build .
./tests

# Generate HTML report with lcov
lcov --capture --directory . --output-file coverage.info
genhtml coverage.info --output-directory coverage_html
open coverage_html/index.html
```

Focus coverage analysis on:

* Branch coverage in methods with multiple return paths.
* Lines in exception-handling blocks (`catch` clauses).
* Default cases in `switch` statements.

## Pitfalls

### Pitfall 1 — Testing Implementation Details Instead of Behaviour

**Problem:** Tests that reach into private members or rely on internal state break every time the implementation changes, even when behaviour is preserved.

**BAD:**

```cpp
TEST_CASE("BankAccount uses vector internally", "[bank]") {
    BankAccount acc{100.0};
    // BAD: testing internal storage, not the contract
    REQUIRE(acc.transactions_.size() == 0);   // accesses private member
    acc.deposit(50);
    REQUIRE(acc.transactions_.size() == 1);   // brittle: vector may become deque
}
```

**Why it fails:** If the implementation switches from `std::vector` to `std::deque` for transaction history, every test that checks `transactions_` breaks — even though the publicly visible behaviour is identical.

**GOOD — test observable behaviour through the public interface:**

```cpp
TEST_CASE("BankAccount/deposit increases balance", "[bank]") {
    BankAccount acc{100.0};
    acc.deposit(50.0);
    REQUIRE(acc.balance() == 150.0);   // public interface only
}
```

**Detection tip:** If a test uses `friend class Test` declarations or accesses `_private` or `private_` members, it is testing implementation, not behaviour.

### Pitfall 2 — Shared Mutable State Between Tests

**Problem:** A global or `static` variable holds state that one test modifies, contaminating subsequent tests.

**BAD:**

```cpp
static LoggerFactory& factory = LoggerFactory::instance();  // global singleton

TEST_CASE("Factory creates console logger", "[factory]") {
    factory.register_type("console", []{ return make_unique<ConsoleLogger>(); });
    auto l = factory.create("console");
    REQUIRE(l != nullptr);
}

TEST_CASE("Factory throws for unknown type", "[factory]") {
    // This may pass or fail depending on test execution order!
    REQUIRE_THROWS(factory.create("unknown_type"));
    // But what if a previous test registered "unknown_type"?
}
```

**Why it fails:** Test ordering in Catch2 is not guaranteed between files. Registrations from one test persist into others because they share the singleton's state.

**GOOD — create a fresh instance per test, or reset state explicitly:**

```cpp
TEST_CASE("Factory creates console logger", "[factory]") {
    LoggerFactory fresh_factory;   // local instance, no shared state
    fresh_factory.register_type("console",
        []{ return std::make_unique<ConsoleLogger>(); });
    REQUIRE(fresh_factory.create("console") != nullptr);
}
```

**Detection tip:** Look for `static` local variables or singletons used directly in tests. Test code should never depend on singleton state that persists between tests.

### Pitfall 3 — Not Using REQUIRE for Pointer/Optional Validity Before Dereferencing

**Problem:** Dereferencing a potentially null pointer or empty `optional` without first asserting its validity, leading to a crash instead of a useful failure message.

**BAD:**

```cpp
TEST_CASE("Factory returns valid logger", "[factory]") {
    auto logger = create_logger("file");
    logger->log("test");   // CRASH if logger is nullptr — no diagnosis
}
```

**Why it fails:** If `create_logger` returns `nullptr`, the test crashes with a segfault or access violation instead of a clear assertion failure.

**GOOD — assert validity before use:**

```cpp
TEST_CASE("Factory returns valid logger", "[factory]") {
    auto logger = create_logger("file");
    REQUIRE(logger != nullptr);           // stops with a clear message if null
    REQUIRE_NOTHROW(logger->log("test")); // then test behaviour
}
```

**Detection tip:** After every factory call, `dynamic_cast`, or `optional::value()` call in tests, add a `REQUIRE` that checks the result is valid before using it.

### Pitfall 4 — Writing Tests After the Code Without TDD Discipline

**Problem:** Writing tests after the code is finished, then only writing tests that pass, not tests that explore edge cases and failure modes.

**BAD approach:**

```cpp
// Production code written first — then tests written to match it
TEST_CASE("Password validator accepts any non-empty string", "[auth]") {
    REQUIRE(validate_password("a") == true);   // trivially passes
    // Never tests: empty string, null, too-short, too-long, unicode
}
```

**Why it fails:** Tests written after the fact tend to confirm what the code does, not what it should do. Hard-to-hit paths are never tested because they weren't considered when writing the tests.

**GOOD — TDD forces consideration of cases before writing code:**

```cpp
// Tests written FIRST — these drive the implementation
TEST_CASE("PasswordValidator", "[auth]") {
    SECTION("rejects empty password") {
        REQUIRE_FALSE(validate_password(""));
    }
    SECTION("rejects passwords shorter than 8 characters") {
        REQUIRE_FALSE(validate_password("abc123"));
    }
    SECTION("accepts password with letters, digits, and symbol") {
        REQUIRE(validate_password("Secure!99"));
    }
    SECTION("rejects password without a digit") {
        REQUIRE_FALSE(validate_password("NoDigitHere!"));
    }
}
```

**Detection tip:** If all your tests pass on the first run without any red-green cycle, you are likely writing confirmation tests, not specification tests.

### Pitfall 5 — Mock that Verifies Calls But Not Arguments

**Problem:** A mock asserts that a method was called but doesn't verify the arguments, allowing incorrect behaviour to pass the test.

**BAD:**

```cpp
struct MockMailer : IMailer {
    bool send_called = false;
    void send(std::string_view to, std::string_view body) override {
        send_called = true;   // records the call but not the arguments
    }
};

TEST_CASE("NotificationService sends alert email", "[notify]") {
    MockMailer mailer;
    NotificationService svc{mailer};
    svc.alert("disk full");
    REQUIRE(mailer.send_called);   // passes even if wrong address or body
}
```

**Why it fails:** If `svc.alert` sends the email to the wrong address (`"nobody@example.com"` instead of `"ops@example.com"`), the test still passes because it only checks that `send` was called.

**GOOD — capture and verify arguments:**

```cpp
struct MockMailer : IMailer {
    std::string last_to, last_body;
    void send(std::string_view to, std::string_view body) override {
        last_to   = to;
        last_body = body;
    }
};

TEST_CASE("NotificationService sends alert to ops", "[notify]") {
    MockMailer mailer;
    NotificationService svc{mailer};
    svc.alert("disk full");

    REQUIRE(mailer.last_to == "ops@example.com");
    REQUIRE_THAT(mailer.last_body,
                 Catch::Matchers::ContainsSubstring("disk full"));
}
```

**Detection tip:** After adding a mock, ask: "Could the code pass this test while sending the wrong data?" If yes, add argument assertions.

### Pitfall 6 — Ignoring Exception Safety in Tests

**Problem:** Tests only cover the happy path and never verify that objects remain in a consistent state after an exception.

**BAD:**

```cpp
TEST_CASE("BankAccount withdraw", "[bank]") {
    BankAccount acc{100.0};
    acc.withdraw(50.0);
    REQUIRE(acc.balance() == 50.0);   // only happy path
    // Never tests: withdraw more than balance — is account corrupted?
}
```

**Why it fails:** If `withdraw` partially modifies internal state before throwing, the account may be left with a negative balance or corrupted transaction log.

**GOOD — verify the strong exception guarantee:**

```cpp
TEST_CASE("BankAccount/withdraw preserves state on error", "[bank]") {
    BankAccount acc{100.0};

    SECTION("throws when overdrawing") {
        REQUIRE_THROWS_AS(acc.withdraw(200.0), InsufficientFundsError);
    }

    SECTION("balance unchanged after failed withdraw") {
        try { acc.withdraw(200.0); } catch (...) {}
        REQUIRE(acc.balance() == 100.0);   // strong guarantee: no partial update
    }
}
```

**Detection tip:** For every method that can throw, add a test section that verifies the object's invariants hold after the exception is caught.

## Code Example

```cpp
#include <cassert>
#include <iostream>

int add(int a, int b) { return a + b; }

int main() {
    std::cout << "Day 19 - Testing mindset\n";
    assert(add(2, 3) == 5);
    assert(add(-1, 1) == 0);
    std::cout << "Local assertions passed\n";
    return 0;
}
```
