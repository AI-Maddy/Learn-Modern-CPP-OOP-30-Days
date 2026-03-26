Pitfalls — Day 19: Testing with Catch2 and TDD
================================================

Pitfall 1 — Testing Implementation Details Instead of Behaviour
----------------------------------------------------------------

**Problem:** Tests that reach into private members or rely on internal state
break every time the implementation changes, even when behaviour is preserved.

**BAD:**

.. code-block:: cpp

  TEST_CASE("BankAccount uses vector internally", "[bank]") {
      BankAccount acc{100.0};
      // BAD: testing internal storage, not the contract
      REQUIRE(acc.transactions_.size() == 0);   // accesses private member
      acc.deposit(50);
      REQUIRE(acc.transactions_.size() == 1);   // brittle: vector may become deque
  }

**Why it fails:** If the implementation switches from ``std::vector`` to
``std::deque`` for transaction history, every test that checks ``transactions_``
breaks — even though the publicly visible behaviour is identical.

**GOOD — test observable behaviour through the public interface:**

.. code-block:: cpp

  TEST_CASE("BankAccount/deposit increases balance", "[bank]") {
      BankAccount acc{100.0};
      acc.deposit(50.0);
      REQUIRE(acc.balance() == 150.0);   // public interface only
  }

**Detection tip:** If a test uses ``friend class Test`` declarations or accesses
``_private`` or ``private_`` members, it is testing implementation, not
behaviour.

Pitfall 2 — Shared Mutable State Between Tests
-----------------------------------------------

**Problem:** A global or ``static`` variable holds state that one test modifies,
contaminating subsequent tests.

**BAD:**

.. code-block:: cpp

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

**Why it fails:** Test ordering in Catch2 is not guaranteed between files.
Registrations from one test persist into others because they share the
singleton's state.

**GOOD — create a fresh instance per test, or reset state explicitly:**

.. code-block:: cpp

  TEST_CASE("Factory creates console logger", "[factory]") {
      LoggerFactory fresh_factory;   // local instance, no shared state
      fresh_factory.register_type("console",
          []{ return std::make_unique<ConsoleLogger>(); });
      REQUIRE(fresh_factory.create("console") != nullptr);
  }

**Detection tip:** Look for ``static`` local variables or singletons used
directly in tests. Test code should never depend on singleton state that
persists between tests.

Pitfall 3 — Not Using REQUIRE for Pointer/Optional Validity Before Dereferencing
---------------------------------------------------------------------------------

**Problem:** Dereferencing a potentially null pointer or empty ``optional``
without first asserting its validity, leading to a crash instead of a useful
failure message.

**BAD:**

.. code-block:: cpp

  TEST_CASE("Factory returns valid logger", "[factory]") {
      auto logger = create_logger("file");
      logger->log("test");   // CRASH if logger is nullptr — no diagnosis
  }

**Why it fails:** If ``create_logger`` returns ``nullptr``, the test crashes
with a segfault or access violation instead of a clear assertion failure.

**GOOD — assert validity before use:**

.. code-block:: cpp

  TEST_CASE("Factory returns valid logger", "[factory]") {
      auto logger = create_logger("file");
      REQUIRE(logger != nullptr);           // stops with a clear message if null
      REQUIRE_NOTHROW(logger->log("test")); // then test behaviour
  }

**Detection tip:** After every factory call, ``dynamic_cast``, or
``optional::value()`` call in tests, add a ``REQUIRE`` that checks the result
is valid before using it.

Pitfall 4 — Writing Tests After the Code Without TDD Discipline
---------------------------------------------------------------

**Problem:** Writing tests after the code is finished, then only writing tests
that pass, not tests that explore edge cases and failure modes.

**BAD approach:**

.. code-block:: cpp

  // Production code written first — then tests written to match it
  TEST_CASE("Password validator accepts any non-empty string", "[auth]") {
      REQUIRE(validate_password("a") == true);   // trivially passes
      // Never tests: empty string, null, too-short, too-long, unicode
  }

**Why it fails:** Tests written after the fact tend to confirm what the code
does, not what it should do. Hard-to-hit paths are never tested because they
weren't considered when writing the tests.

**GOOD — TDD forces consideration of cases before writing code:**

.. code-block:: cpp

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

**Detection tip:** If all your tests pass on the first run without any
red-green cycle, you are likely writing confirmation tests, not specification
tests.

Pitfall 5 — Mock that Verifies Calls But Not Arguments
------------------------------------------------------

**Problem:** A mock asserts that a method was called but doesn't verify the
arguments, allowing incorrect behaviour to pass the test.

**BAD:**

.. code-block:: cpp

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

**Why it fails:** If ``svc.alert`` sends the email to the wrong address
(``"nobody@example.com"`` instead of ``"ops@example.com"``), the test still
passes because it only checks that ``send`` was called.

**GOOD — capture and verify arguments:**

.. code-block:: cpp

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

**Detection tip:** After adding a mock, ask: "Could the code pass this test
while sending the wrong data?" If yes, add argument assertions.

Pitfall 6 — Ignoring Exception Safety in Tests
----------------------------------------------

**Problem:** Tests only cover the happy path and never verify that objects
remain in a consistent state after an exception.

**BAD:**

.. code-block:: cpp

  TEST_CASE("BankAccount withdraw", "[bank]") {
      BankAccount acc{100.0};
      acc.withdraw(50.0);
      REQUIRE(acc.balance() == 50.0);   // only happy path
      // Never tests: withdraw more than balance — is account corrupted?
  }

**Why it fails:** If ``withdraw`` partially modifies internal state before
throwing, the account may be left with a negative balance or corrupted
transaction log.

**GOOD — verify the strong exception guarantee:**

.. code-block:: cpp

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

**Detection tip:** For every method that can throw, add a test section that
verifies the object's invariants hold after the exception is caught.
