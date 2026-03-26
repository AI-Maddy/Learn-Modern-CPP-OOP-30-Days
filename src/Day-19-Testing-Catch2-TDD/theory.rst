Testing C++ OOP with Catch2 and TDD
=====================================

Motivation — Why Tests Matter in OOP
--------------------------------------

A C++ class that compiles and links may still be broken. Tests prove that the
code does what its design intends — not just that it satisfies the type system.
In OOP specifically, tests are the best way to:

* Verify that each class respects its own invariants after every operation.
* Ensure that polymorphic dispatch routes to the correct override.
* Confirm that copy/move semantics and RAII work correctly.
* Guard against regressions when refactoring hierarchies.

Without tests, refactoring a class hierarchy is a leap of faith. With tests,
it is a structured procedure with a safety net.

Catch2 Fundamentals
--------------------

Catch2 is a header-only (single-file) or CMake-installable test framework.
It requires no separate ``main()`` and supports rich assertion macros.

**Setup with CMake (FetchContent):**

.. code-block:: cmake

  include(FetchContent)
  FetchContent_Declare(
    Catch2
    GIT_REPOSITORY https://github.com/catchorg/Catch2.git
    GIT_TAG        v3.5.2
  )
  FetchContent_MakeAvailable(Catch2)

  add_executable(tests test_bank.cpp)
  target_link_libraries(tests PRIVATE Catch2::Catch2WithMain)

**Basic test structure:**

.. code-block:: cpp

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

``REQUIRE`` fails the test and stops execution. ``CHECK`` records the failure
but continues — useful for checking multiple postconditions that may all fail.

Core Assertion Macros
----------------------

.. code-block:: cpp

  REQUIRE(expr);               // fails and stops if expr is false
  CHECK(expr);                 // records failure, continues
  REQUIRE_FALSE(expr);         // fails if expr is true
  REQUIRE_THROWS(expr);        // fails if no exception is thrown
  REQUIRE_THROWS_AS(expr, T);  // fails unless exception of type T is thrown
  REQUIRE_NOTHROW(expr);       // fails if any exception is thrown
  REQUIRE_THAT(val, matcher);  // Hamcrest-style matchers

**Approximate floating-point comparison:**

.. code-block:: cpp

  #include <catch2/catch_approx.hpp>

  REQUIRE(area(Circle{1.0}) == Catch::Approx(3.14159).epsilon(1e-4));

**String matchers:**

.. code-block:: cpp

  #include <catch2/matchers/catch_matchers_string.hpp>
  using namespace Catch::Matchers;

  REQUIRE_THAT(greeting, ContainsSubstring("Hello"));
  REQUIRE_THAT(filename, EndsWith(".cpp"));

SECTION Mechanics — Fixture Reuse Without a Test Fixture Class
---------------------------------------------------------------

Every ``SECTION`` executes from the beginning of the ``TEST_CASE``, so setup
code at the top of the test case acts as an implicit fixture:

.. code-block:: cpp

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

Each ``SECTION`` starts with ``s`` containing ``{1, 2}``, making tests
independent even though they share setup code.

Test-Driven Development (TDD) — Red-Green-Refactor
---------------------------------------------------

TDD is a discipline where tests are written **before** production code:

::

  ┌──────────┐     write a failing test
  │  RED     │ ──────────────────────────►
  └──────────┘                           ┌──────────┐
       ▲                                 │  GREEN   │ write minimum code to pass
       │ refactor safely                 └──────────┘
       │         ◄──────────────────────       │
  ┌──────────┐     all tests still pass  ◄─────┘
  │ REFACTOR │
  └──────────┘

**Concrete TDD cycle — building a ``Money`` class:**

Step 1 (RED) — write the test first:

.. code-block:: cpp

  TEST_CASE("Money addition", "[money]") {
      Money a{10, "USD"};
      Money b{20, "USD"};
      REQUIRE((a + b) == Money{30, "USD"});  // does not compile yet
  }

Step 2 (GREEN) — write the minimum code to compile and pass:

.. code-block:: cpp

  struct Money {
      int amount;
      std::string currency;

      bool operator==(const Money&) const = default;

      Money operator+(const Money& o) const {
          // minimal: ignore currency mismatch for now
          return {amount + o.amount, currency};
      }
  };

Step 3 (REFACTOR) — clean up with all tests passing:

.. code-block:: cpp

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

Test Doubles — Stub, Fake, Mock
---------------------------------

Test doubles substitute real dependencies in tests. Three important kinds:

**Stub** — returns hardcoded values, ignores input:

.. code-block:: cpp

  struct StubDatabase : IDatabase {
      std::vector<Row> query(const std::string&) override {
          return { {"Alice", 100}, {"Bob", 200} };   // fixed response
      }
  };

**Fake** — simplified but working implementation:

.. code-block:: cpp

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

**Mock** — records calls and verifies expectations:

.. code-block:: cpp

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

Testing OOP Hierarchies
------------------------

When testing polymorphic code, test through the **interface**, not the
concrete type. This ensures Liskov compliance:

.. code-block:: cpp

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

Test Naming Conventions
------------------------

Good test names act as living documentation. The convention used in this
course:

.. code-block:: text

  TEST_CASE("<Class>/<method> <condition>", "[tag]")

Examples:

.. code-block:: cpp

  TEST_CASE("BankAccount/deposit increases balance by amount", "[bank]")
  TEST_CASE("BankAccount/withdraw throws when insufficient funds", "[bank]")
  TEST_CASE("BankAccount/withdraw to zero leaves balance at zero", "[bank]")

Tags enable selective test execution:

.. code-block:: bash

  ./tests "[bank]"          # run only bank tests
  ./tests "[bank][fast]"    # run tests with both tags
  ./tests "~[slow]"         # exclude slow tests

Code Coverage
--------------

Coverage measures which lines were executed by the test suite. Low coverage
does not mean tests are good; 100% coverage does not mean tests are thorough.
But gaps in coverage reveal untested code paths.

With GCC/Clang:

.. code-block:: bash

  # Compile with coverage flags
  cmake -DCMAKE_CXX_FLAGS="--coverage" -DCMAKE_BUILD_TYPE=Debug .
  cmake --build .
  ./tests

  # Generate HTML report with lcov
  lcov --capture --directory . --output-file coverage.info
  genhtml coverage.info --output-directory coverage_html
  open coverage_html/index.html

Focus coverage analysis on:

* Branch coverage in methods with multiple return paths.
* Lines in exception-handling blocks (``catch`` clauses).
* Default cases in ``switch`` statements.

Self-Check Questions
---------------------

**Q1. What is the difference between ``REQUIRE`` and ``CHECK`` in Catch2?**

``REQUIRE`` asserts a condition and **stops** the test immediately if it fails.
``CHECK`` records the failure but **continues** executing the rest of the test
case. Use ``REQUIRE`` for preconditions without which subsequent assertions are
meaningless; use ``CHECK`` to gather all failures in a single test run.

**Q2. How do ``SECTION`` blocks provide test isolation without a separate fixture
class?**

Each ``SECTION`` re-executes all code from the top of the ``TEST_CASE`` before
entering the section body. This means any setup variables declared before the
sections are freshly constructed for each section, providing the same isolation
as a JUnit ``@Before`` method without requiring a separate class.

**Q3. What is the difference between a stub and a fake?**

A stub returns hardcoded values regardless of input — it doesn't implement real
logic. A fake is a simplified but functionally correct implementation (e.g., an
in-memory database). Stubs are faster to write; fakes are more realistic for
complex interactions.

**Q4. Why should tests target an interface rather than a concrete class when
testing polymorphic code?**

Testing through the interface verifies that the contract is satisfied for that
type, independently of how it is implemented. Using ``TEMPLATE_TEST_CASE`` over
all implementations simultaneously checks the Liskov Substitution Principle —
every subtype must pass the same interface contract tests.

**Q5. Why is 100% line coverage an insufficient quality metric?**

Coverage shows which lines were *executed*, not whether the assertions checked
the correct behaviour. A test that calls every line but never uses ``REQUIRE``
achieves 100% coverage while testing nothing. Meaningful tests pair coverage
with precise assertions about postconditions and exception behaviour.
