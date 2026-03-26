Day 27 – Refactoring Legacy Code
=================================

Motivation
----------

Most professional C++ work involves changing existing code, not writing
from scratch. Legacy codebases are full of patterns that were written before
modern C++ existed, under time pressure, or by programmers who later grew.

Refactoring is the discipline of improving internal structure without
changing observable behaviour. Done well it is one of the highest-value
engineering activities. Done badly it introduces regressions.

This day teaches a disciplined, incremental approach: identify smells,
add tests *first*, apply one small transformation at a time, and measure
the improvement.

Recognising Code Smells
------------------------

A *code smell* is a symptom that suggests a deeper problem. Common C++ smells:

**Long Method**
  A function longer than ~30 lines that mixes multiple levels of abstraction.
  It is hard to name, test, or reuse any single part of it.

**God Class**
  A class with 20+ member functions, 10+ data members, and responsibilities
  from multiple domains. It is a magnet for bugs because every change risks
  side effects.

**Deep Inheritance**
  A hierarchy five or more levels deep. Changing a behaviour near the root
  breaks every leaf class. Tracing ``virtual`` dispatch requires understanding
  every level.

**Data Clumps**
  The same group of variables (``x``, ``y``, ``width``, ``height``) appears
  in 10 functions as separate parameters. They should be a struct.

**Magic Numbers**
  Literal numbers in logic (``if (code == 7)``). Nobody remembers what ``7``
  means six months later.

**Raw Owning Pointers**
  ``new``/``delete`` in application code without RAII wrappers. Any thrown
  exception creates a memory leak.

**Mutable Global State**
  Singletons and global variables that make functions impossible to test
  in isolation and introduce subtle ordering dependencies.

The Strangler Fig Pattern
--------------------------

The safest approach for large refactors is the *Strangler Fig*: grow the new
system alongside the old one, redirect traffic incrementally, then remove
the old code when it is no longer called.

.. code-block:: text

    Phase 1: Old code runs, new code exists but is not called yet
    ┌─────────────┐           ┌─────────────┐
    │  Old System │           │  New System │  (built but dormant)
    └─────────────┘           └─────────────┘

    Phase 2: New code handles some requests
    ┌─────────────┐    ───►   ┌─────────────┐
    │  Old System │ ◄─── some │  New System │
    └─────────────┘    ───►   └─────────────┘

    Phase 3: Old code is dead and can be deleted
                              ┌─────────────┐
                              │  New System │
                              └─────────────┘

The golden rule: **never refactor without tests.**

Step 1: Add Tests Before Touching Anything
-------------------------------------------

Before changing a single line, write tests that characterise the *current*
behaviour — even if that behaviour is wrong. These are called *characterisation
tests*. They pin the current behaviour so any refactor that breaks them is
caught immediately.

.. code-block:: cpp

    // Legacy function we want to refactor:
    double calculate_fee(int account_type, double balance, int days_overdue) {
        double fee = 0;
        if (account_type == 1) {
            fee = balance * 0.02;
            if (days_overdue > 30) fee += 15.0;
        } else if (account_type == 2) {
            fee = 5.0;
            if (balance > 1000) fee = balance * 0.01;
            if (days_overdue > 7) fee *= 1.5;
        }
        return fee;
    }

    // Characterisation tests — written BEFORE refactoring
    // These lock the current behaviour exactly
    void test_calculate_fee() {
        assert(calculate_fee(1, 500.0, 0)  == 10.0);   // 500 * 0.02
        assert(calculate_fee(1, 500.0, 31) == 25.0);   // 10 + 15
        assert(calculate_fee(2, 500.0, 0)  == 5.0);    // flat fee
        assert(calculate_fee(2, 1500.0, 0) == 15.0);   // 1500 * 0.01
        assert(calculate_fee(2, 1500.0, 8) == 22.5);   // 15 * 1.5
    }

Step 2: Extract Method
-----------------------

The first transformation: pull a cohesive block of logic into a named function.
The name documents *intent*, not implementation.

.. code-block:: cpp

    // BEFORE — everything in one function
    double calculate_fee(int account_type, double balance, int days_overdue) {
        double fee = 0;
        if (account_type == 1) {
            fee = balance * 0.02;
            if (days_overdue > 30) fee += 15.0;
        } else if (account_type == 2) {
            fee = 5.0;
            if (balance > 1000) fee = balance * 0.01;
            if (days_overdue > 7) fee *= 1.5;
        }
        return fee;
    }

    // AFTER step 1: extract helper functions
    static double savings_fee(double balance, int days_overdue) {
        double fee = balance * 0.02;
        if (days_overdue > 30) fee += 15.0;
        return fee;
    }

    static double checking_fee(double balance, int days_overdue) {
        double fee = (balance > 1000.0) ? balance * 0.01 : 5.0;
        if (days_overdue > 7) fee *= 1.5;
        return fee;
    }

    double calculate_fee(int account_type, double balance, int days_overdue) {
        if (account_type == 1) return savings_fee(balance, days_overdue);
        if (account_type == 2) return checking_fee(balance, days_overdue);
        return 0.0;
    }

Step 3: Replace Magic Numbers with Named Constants
---------------------------------------------------

.. code-block:: cpp

    // BEFORE
    if (days_overdue > 30) fee += 15.0;

    // AFTER
    static constexpr int    kSavingsGracePeriodDays = 30;
    static constexpr double kSavingsLatePenalty      = 15.0;
    static constexpr double kSavingsBaseFeeRate      = 0.02;

    static double savings_fee(double balance, int days_overdue) {
        double fee = balance * kSavingsBaseFeeRate;
        if (days_overdue > kSavingsGracePeriodDays)
            fee += kSavingsLatePenalty;
        return fee;
    }

Step 4: Replace Type Code with Polymorphism
-------------------------------------------

The ``account_type == 1`` / ``account_type == 2`` switch is a type code
smell. Replace it with a virtual function.

.. code-block:: cpp

    // AFTER: polymorphic fee calculation
    class Account {
    public:
        virtual ~Account() = default;
        [[nodiscard]] virtual double calculate_fee(int days_overdue) const = 0;
    };

    class SavingsAccount : public Account {
    public:
        explicit SavingsAccount(double balance) : balance_{balance} {}

        double calculate_fee(int days_overdue) const override {
            double fee = balance_ * kSavingsBaseFeeRate;
            if (days_overdue > kSavingsGracePeriodDays)
                fee += kSavingsLatePenalty;
            return fee;
        }

    private:
        double balance_;
        static constexpr double kSavingsBaseFeeRate      = 0.02;
        static constexpr int    kSavingsGracePeriodDays  = 30;
        static constexpr double kSavingsLatePenalty       = 15.0;
    };

Step 5: Replace Raw Pointers with Smart Pointers
-------------------------------------------------

.. code-block:: cpp

    // BEFORE (legacy C++ style)
    Account* create_account(int type, double balance) {
        if (type == 1) return new SavingsAccount(balance);
        if (type == 2) return new CheckingAccount(balance);
        return nullptr;
    }
    // Caller must remember to delete — leaks if exception thrown

    // AFTER (modern C++17)
    std::unique_ptr<Account> create_account(int type, double balance) {
        if (type == 1) return std::make_unique<SavingsAccount>(balance);
        if (type == 2) return std::make_unique<CheckingAccount>(balance);
        throw std::invalid_argument("Unknown account type: " +
                                    std::to_string(type));
    }

Using clang-tidy Automatically
--------------------------------

``clang-tidy`` is a linter that catches many of the above patterns
automatically. A useful starting configuration (``<project>/.clang-tidy``):

.. code-block:: yaml

    Checks: >
      clang-diagnostic-*,
      cppcoreguidelines-*,
      modernize-*,
      readability-*,
      performance-*,
      -modernize-use-trailing-return-type

    WarningsAsErrors: ''

    CheckOptions:
      - key: readability-identifier-length.MinimumVariableNameLength
        value: '3'

Run it on a single file::

    clang-tidy src/account.cpp -- -std=c++20

Or via CMake integration::

    cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ...
    run-clang-tidy -p build/ src/

Measuring Improvement
----------------------

Track three metrics before and after a refactor session:

* **Cyclomatic complexity** (``lizard`` tool) — number of linearly
  independent paths through each function. Target: below 10.
* **Lines per function** (``lizard`` or ``cloc``) — target: below 30.
* **Test coverage** (``gcov``/``llvm-cov``) — target: above 80% line
  coverage for touched files.

Run the same tests before and after to prove behaviour is preserved.

Design Tradeoffs
----------------

* **Incremental vs big-bang**: incremental refactoring keeps the system
  shippable at every step. Big-bang rewrites often take longer than estimated
  and introduce bugs because the full behaviour is not captured in tests.

* **Perfect vs good enough**: not every smell must be fixed. Prioritise
  smells in frequently changed code. Code that has been stable for years
  is lower priority.

* **Refactor vs rewrite**: rewrite only when the existing design is so
  tangled that incremental improvement is slower than starting fresh AND
  you have thorough characterisation tests to validate the replacement.

Self-Check Questions
--------------------

#. **What is a characterisation test and why write it before refactoring?**

   A characterisation test captures the *current* (possibly buggy) behaviour.
   It ensures that any change you make which alters existing behaviour is
   caught immediately, preventing silent regressions.

#. **What is the Strangler Fig pattern?**

   A technique for replacing a large legacy system by building the replacement
   incrementally alongside the old system. Traffic is gradually redirected to
   the new code until the old code is no longer reached and can be deleted.

#. **Why is replacing a type-code integer with polymorphism an improvement?**

   It removes every switch/if-chain scattered through the codebase. Adding a
   new account type requires only a new subclass, not finding and updating
   every switch statement. The compiler enforces the interface contract.

#. **Name three clang-tidy checks useful for legacy C++ modernisation.**

   ``modernize-use-smart-ptr`` (raw new/delete), ``modernize-use-override``
   (missing override keyword), ``cppcoreguidelines-avoid-magic-numbers``
   (literal constants in logic).

#. **When should you NOT refactor?**

   When you are under a production-critical deadline, when no tests exist
   and there is no time to add them, or when the code in question is not
   changing frequently (stable code carries low risk even if it is ugly).
