---
title: "Catch2 Testing"
tags: ["cheatsheet", "reference"]
---

# :material-book: Catch2 Testing


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Catch2 Testing

<div class="contents" local="" depth="2">

Sections

</div>

## Project Setup

``` cmake
# CMakeLists.txt (FetchContent approach)
include(FetchContent)
FetchContent_Declare(Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG        v3.5.2)
FetchContent_MakeAvailable(Catch2)

add_executable(tests test_main.cpp test_widget.cpp)
target_link_libraries(tests PRIVATE Catch2::Catch2WithMain)

# Registration (v3 auto-registers; v2 needs CATCH_CONFIG_MAIN in one file)
```

## TEST_CASE / SECTION Nesting

`SECTION` blocks share setup code from the enclosing `TEST_CASE`. Each `SECTION` runs independently from a fresh state.

``` cpp
#include <catch2/catch_test_macros.hpp>

TEST_CASE("BankAccount basic operations", "[bank][unit]") {
    BankAccount account{"Alice", 100.0};   // shared setup

    SECTION("initial balance is correct") {
        REQUIRE(account.balance() == 100.0);
    }

    SECTION("deposit increases balance") {
        account.deposit(50.0);
        REQUIRE(account.balance() == 150.0);
    }

    SECTION("withdrawal decreases balance") {
        account.withdraw(30.0);
        REQUIRE(account.balance() == 70.0);

        SECTION("further withdrawal from reduced balance") {
            account.withdraw(20.0);
            REQUIRE(account.balance() == 50.0);
        }
    }

    SECTION("overdraft is rejected") {
        REQUIRE_FALSE(account.withdraw(200.0));
        REQUIRE(account.balance() == 100.0);   // unchanged
    }
}
```

Tags filter tests: `./tests [bank]` runs only bank tests. `./tests ~[slow]` excludes slow tests.

## REQUIRE vs CHECK vs REQUIRE_FALSE

| Macro              | Behaviour on failure                            |
|--------------------|-------------------------------------------------|
| `REQUIRE(expr)`    | Stops current test immediately (like assert) \| |
| `CHECK(expr)`      | Records failure but continues test execution \| |
| `REQUIRE_FALSE(e)` | Fails if expression is true; stops test \|      |
| `CHECK_FALSE(e)`   | Fails if expression is true; continues test \|  |
| `REQUIRE_THAT`     | Fail + stop, with a Matcher \|                  |
| `CHECK_THAT`       | Fail + continue, with a Matcher \|              |

``` cpp
// Use CHECK when you want to see ALL failures in one run:
CHECK(a.x == 1);
CHECK(a.y == 2);
CHECK(a.z == 3);

// Use REQUIRE when subsequent assertions make no sense after failure:
REQUIRE(ptr != nullptr);
REQUIRE(ptr->valid());   // only makes sense if ptr is not null
```

## Exception Testing

``` cpp
TEST_CASE("exception handling", "[exceptions]") {
    SECTION("throws correct type") {
        REQUIRE_THROWS_AS(divide(5, 0), std::invalid_argument);
    }

    SECTION("throws with correct message") {
        REQUIRE_THROWS_WITH(divide(5, 0), "division by zero");
    }

    SECTION("throws any exception") {
        REQUIRE_THROWS(risky_operation());
    }

    SECTION("does not throw") {
        REQUIRE_NOTHROW(safe_operation());
    }

    SECTION("exception message contains substring") {
        using Catch::Matchers::ContainsSubstring;
        REQUIRE_THROWS_WITH(divide(5, 0), ContainsSubstring("zero"));
    }
}
```

## Matchers

``` cpp
#include <catch2/matchers/catch_matchers_string.hpp>
#include <catch2/matchers/catch_matchers_floating_point.hpp>
#include <catch2/matchers/catch_matchers_range_equals.hpp>

using namespace Catch::Matchers;

TEST_CASE("string matchers") {
    std::string s = "Hello, World!";
    REQUIRE_THAT(s, StartsWith("Hello"));
    REQUIRE_THAT(s, EndsWith("!"));
    REQUIRE_THAT(s, ContainsSubstring("World"));
    REQUIRE_THAT(s, Matches("Hello.*!"));   // regex
}

TEST_CASE("floating point") {
    REQUIRE_THAT(3.14159, WithinAbs(3.14, 0.01));     // |a-b| <= 0.01
    REQUIRE_THAT(3.14159, WithinRel(3.14, 0.01));     // relative 1%
    REQUIRE_THAT(3.14159, WithinULP(3.14159, 1));     // 1 ULP tolerance
}

TEST_CASE("container matchers") {
    std::vector<int> v{1, 2, 3, 4, 5};
    REQUIRE_THAT(v, RangeEquals(std::vector<int>{1,2,3,4,5}));
    REQUIRE_THAT(v, UnorderedRangeEquals(std::vector<int>{5,3,1,4,2}));
    REQUIRE_THAT(v, SizeIs(5));
    REQUIRE_THAT(v, Contains(3));
    REQUIRE_THAT(v, AllMatch(Predicate<int>([](int x){ return x > 0; })));
}

// Custom matcher:
struct IsSorted : Catch::Matchers::MatcherBase<std::vector<int>> {
    bool match(const std::vector<int>& v) const override {
        return std::is_sorted(v.begin(), v.end());
    }
    std::string describe() const override { return "is sorted"; }
};
REQUIRE_THAT(v, IsSorted{});
```

## Data-Driven Tests with GENERATE

``` cpp
#include <catch2/generators/catch_generators.hpp>
#include <catch2/generators/catch_generators_adapters.hpp>

TEST_CASE("parse_int handles valid inputs", "[parse]") {
    auto [input, expected] = GENERATE(table<std::string_view, int>({
        {"0",     0},
        {"42",    42},
        {"-1",    -1},
        {"32767", 32767},
    }));

    auto result = parse_int(input);
    REQUIRE(result.has_value());
    REQUIRE(*result == expected);
}

TEST_CASE("boundary values", "[math]") {
    int n = GENERATE(0, 1, -1, 100, -100, INT_MAX, INT_MIN);
    CAPTURE(n);   // shows n value in failure output
    REQUIRE(negate(negate(n)) == n);
}

// Range generator:
TEST_CASE("all even numbers 0..10") {
    int n = GENERATE(filter([](int x){ return x % 2 == 0; }, range(0, 11)));
    REQUIRE(n % 2 == 0);
}
```

## BDD-Style with SCENARIO / GIVEN / WHEN / THEN

``` cpp
SCENARIO("user withdraws money", "[bank][bdd]") {
    GIVEN("an account with 100 balance") {
        BankAccount acc{"Bob", 100.0};

        WHEN("withdrawing 30") {
            bool ok = acc.withdraw(30.0);

            THEN("it succeeds") { REQUIRE(ok); }
            THEN("balance is 70") { REQUIRE(acc.balance() == 70.0); }
        }

        WHEN("withdrawing 200") {
            THEN("it is rejected") {
                REQUIRE_FALSE(acc.withdraw(200.0));
            }
        }
    }
}
```

## Mocking Strategy without a Framework

Use hand-rolled test doubles when a mock framework is overkill:

``` cpp
// Production interface
struct ILogger {
    virtual void log(std::string_view msg) = 0;
    virtual ~ILogger() = default;
};

// Test double: records calls for verification
struct SpyLogger : ILogger {
    std::vector<std::string> messages;
    void log(std::string_view msg) override { messages.emplace_back(msg); }
};

TEST_CASE("service logs errors", "[service]") {
    SpyLogger spy;
    Service svc{spy};

    svc.process(invalid_input);

    REQUIRE(spy.messages.size() == 1);
    REQUIRE_THAT(spy.messages[0], Catch::Matchers::ContainsSubstring("error"));
}

// Configurable stub:
struct StubFileReader : IFileReader {
    std::string content_to_return;
    bool should_fail = false;

    std::expected<std::string, IoError> read(std::string_view) override {
        if (should_fail) return std::unexpected(IoError::not_found);
        return content_to_return;
    }
};
```

## TDD Cycle

    RED    Write a failing test that describes the desired behaviour
      |
    GREEN  Write the minimum code to make the test pass
      |
    REFACTOR Clean up code (rename, extract, simplify) without changing behaviour
      |
    COMMIT  Commit with the test and production code together
      |
    (repeat)

Key discipline: **never write production code without a failing test first**.

## Test Naming Conventions

``` cpp
// Format: <Unit>_<Scenario>_<ExpectedOutcome>
TEST_CASE("BankAccount_withdraw_reducesBalance")        // method-centric
TEST_CASE("withdraw: given sufficient funds, succeeds") // BDD description
TEST_CASE("parse_int returns error on empty string")    // intent-centric

// Tag strategy:
TEST_CASE("...", "[unit]")         // fast, isolated
TEST_CASE("...", "[integration]")  // involves external systems
TEST_CASE("...", "[slow]")         // > 100ms
TEST_CASE("...", "[widget][unit]") // multiple tags allowed

// Run subsets:
// ./tests [unit]           — all unit tests
// ./tests [widget]         — all widget tests
// ./tests ~[slow]          — exclude slow
// ./tests "[widget][unit]" — intersection
```

## Useful Command-Line Flags

``` bash
./tests                           # run all
./tests -r console                # verbose output
./tests -r xml -o results.xml     # CI-friendly XML
./tests --list-tests              # show all test names
./tests --list-tags               # show all tags
./tests "BankAccount*"            # wildcard filter by name
./tests -s                        # show successful assertions too
./tests --order rand              # randomize test order (find ordering bugs)
./tests --durations yes           # show per-test timings
```

## Pitfalls

- Shared mutable state between SECTIONs: each SECTION re-runs the TEST_CASE body — do not share mutable objects between sections without resetting.
- REQUIRE inside a SECTION after a failing REQUIRE: the test stops; use CHECK for independent assertions.
- Floating point equality with `==`: always use `WithinAbs` or `WithinULP` for floats.
- GENERATE inside nested SECTION: all combinations are generated — ensure test count stays manageable.
- Ignoring flaky failures: a test that sometimes fails is a broken test; fix or delete it, never `#ifdef` around it.

## Cross-References

- `error-handling-expected.rst` — testing std::expected error paths
- `common-pitfalls.rst` — pitfall patterns worth testing explicitly
- `refactoring-checklist.rst` — tests must be green before/after refactoring
- `debugging-tools-2026.rst` — sanitizers to run alongside tests


---

[← All Cheatsheets](index.md)
