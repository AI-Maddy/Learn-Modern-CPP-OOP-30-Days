# Day 27: Refactoring Legacy Code

## Why This Day Matters

Real C++ work is predominantly maintenance and evolution of existing code.
Knowing how to improve a codebase incrementally — without introducing
regressions and without stopping feature delivery — is one of the most
valuable skills a C++ engineer can have. This day turns that skill into
a repeatable practice.

## Learning Outcomes

After completing this day you will be able to:

* Identify at least six named code smells in a C++ codebase (long method,
  god class, magic numbers, data clumps, type code, raw pointers) and
  articulate why each is harmful.
* Apply the Strangler Fig pattern to migrate a legacy subsystem to a
  modern design without a big-bang rewrite.
* Write characterisation tests that capture current behaviour before
  making any structural change.
* Perform four incremental refactoring steps (extract method, named
  constants, replace type code, raw-to-smart-pointer) while keeping
  all tests green.
* Configure and run `clang-tidy` on a file and interpret its output.

## Key Concepts

* **Code smells** — symptoms of structural problems; do not indicate bugs
  directly but predict where bugs are likely to appear.
* **Characterisation tests** — tests written to document existing behaviour
  before refactoring; they make regressions visible immediately.
* **Strangler Fig** — the safest large-scale migration strategy: build new
  alongside old, redirect incrementally, delete the old when idle.
* **Extract Method** — the most common refactoring; pulls a cohesive block
  into a named function, making intent explicit.
* **clang-tidy** — a static analysis tool with 300+ checks covering safety,
  performance, readability, and C++ Core Guidelines compliance.

## Theory

### Motivation

Most professional C++ work involves changing existing code, not writing
from scratch. Legacy codebases are full of patterns that were written before
modern C++ existed, under time pressure, or by programmers who later grew.

Refactoring is the discipline of improving internal structure without
changing observable behaviour. Done well it is one of the highest-value
engineering activities. Done badly it introduces regressions.

This day teaches a disciplined, incremental approach: identify smells,
add tests *first*, apply one small transformation at a time, and measure
the improvement.

### Recognising Code Smells

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
breaks every leaf class.

**Data Clumps**
The same group of variables (`x`, `y`, `width`, `height`) appears
in 10 functions as separate parameters. They should be a struct.

**Magic Numbers**
Literal numbers in logic (`if (code == 7)`). Nobody remembers what `7`
means six months later.

**Raw Owning Pointers**
`new`/`delete` in application code without RAII wrappers. Any thrown
exception creates a memory leak.

**Mutable Global State**
Singletons and global variables that make functions impossible to test
in isolation and introduce subtle ordering dependencies.

### The Strangler Fig Pattern

The safest approach for large refactors is the *Strangler Fig*: grow the new
system alongside the old one, redirect traffic incrementally, then remove
the old code when it is no longer called.

```text
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
```

The golden rule: **never refactor without tests.**

### Step 1: Add Tests Before Touching Anything

Before changing a single line, write tests that characterise the *current*
behaviour — even if that behaviour is wrong. These are called *characterisation
tests*.

```cpp
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
void test_calculate_fee() {
    assert(calculate_fee(1, 500.0, 0)  == 10.0);   // 500 * 0.02
    assert(calculate_fee(1, 500.0, 31) == 25.0);   // 10 + 15
    assert(calculate_fee(2, 500.0, 0)  == 5.0);    // flat fee
    assert(calculate_fee(2, 1500.0, 0) == 15.0);   // 1500 * 0.01
    assert(calculate_fee(2, 1500.0, 8) == 22.5);   // 15 * 1.5
}
```

### Step 2: Extract Method

The first transformation: pull a cohesive block of logic into a named function.
The name documents *intent*, not implementation.

```cpp
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
```

### Step 3: Replace Magic Numbers with Named Constants

```cpp
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
```

### Step 4: Replace Type Code with Polymorphism

The `account_type == 1` / `account_type == 2` switch is a type code
smell. Replace it with a virtual function.

```cpp
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
```

### Step 5: Replace Raw Pointers with Smart Pointers

```cpp
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
```

### Using clang-tidy Automatically

`clang-tidy` is a linter that catches many of the above patterns
automatically. A useful starting configuration (`<project>/.clang-tidy`):

```yaml
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
```

### Measuring Improvement

Track three metrics before and after a refactor session:

* **Cyclomatic complexity** (`lizard` tool) — number of linearly
  independent paths through each function. Target: below 10.
* **Lines per function** (`lizard` or `cloc`) — target: below 30.
* **Test coverage** (`gcov`/`llvm-cov`) — target: above 80% line
  coverage for touched files.

## Pitfalls

### Pitfall 1: Refactoring Without Tests

**Description**
Changing internal structure without a test suite leaves you no way to
verify that observable behaviour is preserved.

**BAD code**

```cpp
// Developer "cleans up" the fee function — accidentally inverts the condition
static double savings_fee(double balance, int days_overdue) {
    double fee = balance * 0.02;
    if (days_overdue < 30) fee += 15.0;  // BUG: '<' instead of '>' — was correct before
    return fee;
}
```

**GOOD code**

```cpp
// Write characterisation tests FIRST, then refactor
void test_savings_fee() {
    assert(savings_fee(500.0, 0)  == 10.0);  // no late penalty
    assert(savings_fee(500.0, 31) == 25.0);  // late penalty applied
    assert(savings_fee(500.0, 30) == 10.0);  // boundary: exactly 30 — no penalty
}
```

**Detection tip:** Make it a rule: zero refactoring PRs without accompanying tests.

---

### Pitfall 2: Big-Bang Rewrite

**Description**
Rewriting a large module all at once in a separate branch over weeks or
months leads to enormous merge conflicts and behaviour regressions.

**BAD workflow**

```text
main:   A ── B ── C ── D ── E (5 weeks of new features)
             \
rewrite:      F ── G ── H ── I ── J  (5 weeks of rewriting)
                                     ENORMOUS merge conflict
```

**GOOD workflow (Strangler Fig)**

```text
main:  A ── B ── C ── D ── E   (continuous delivery)
            ↑   ↑   ↑
            Small PR per extracted function/class
            Tests pass at every step
```

**Detection tip:** If a refactoring PR has more than ~400 lines changed, split it.

---

### Pitfall 3: Removing `const` During Refactoring

**Description**
When extracting a helper function, forgetting to mark it `const` silently
weakens the API contract and propagates mutability.

**BAD code**

```cpp
// Forgot const — now non-const member function
double SavingsAccount::calculate_fee(int days_overdue) {
    return balance_ * 0.02;
}

// Caller site suddenly cannot use a const SavingsAccount reference
void report(const SavingsAccount& acc) {
    acc.calculate_fee(0);  // compile error: non-const method on const object
}
```

**GOOD code**

```cpp
double SavingsAccount::calculate_fee(int days_overdue) const {
    return balance_ * kBaseFeeRate;
}
```

---

### Pitfall 4: Changing Behaviour While Renaming

**Description**
A common mistake during "rename + clean up" is accidentally changing a
boundary condition (`<` vs `<=`, `>` vs `>=`) while editing the surrounding code.

**BAD code**

```cpp
// BEFORE
if (days_overdue > 30) fee += late_penalty;   // strictly greater than 30

// AFTER (developer also "fixes" formatting — oops)
if (days_overdue >= 30) fee += late_penalty;  // now 30 counts as overdue — different!
```

**GOOD code**

```cpp
// Characterisation test includes boundary cases
assert(calculate_fee(account, 30) == 10.0);  // exactly 30: no penalty
assert(calculate_fee(account, 31) == 25.0);  // 31: penalty applies
```

---

### Pitfall 5: Introducing a New Dependency During Refactoring

**Description**
Adding an `#include` or calling a new library function while
refactoring changes compile-time dependencies — in scope creep.

**BAD code**

```cpp
// account.cpp — refactoring helper; developer adds logging "while they're in here"
#include <spdlog/spdlog.h>   // NEW dependency added during a pure refactor

double SavingsAccount::calculate_fee(int days_overdue) const {
    spdlog::info("Calculating fee for {} days overdue", days_overdue);
    return balance_ * kBaseFeeRate;
}
```

**GOOD approach**

```text
PR 1: Refactor calculate_fee — no new dependencies (pure structural change)
PR 2: Add logging to calculate_fee — separate feature PR
```

**Detection tip:** Diff your includes: `git diff --stat` should show zero new `#include`
lines in a pure structural refactoring PR.

---

### Pitfall 6: Skipping clang-tidy Warnings After Refactoring

**Description**
Running `clang-tidy` only on new files and ignoring warnings on the
refactored legacy code means most of the smells it can catch are never reported.

**GOOD workflow**

```bash
# Run clang-tidy on the entire changed set (CI enforces this)
git diff --name-only HEAD~1 | grep '\.cpp$' | \
    xargs clang-tidy -p build/ -- -std=c++20

# Or use run-clang-tidy for the whole project with a suppression list
run-clang-tidy -p build/ -header-filter='.*' src/
```

**Detection tip:** Add a CI step that runs `clang-tidy` on all files changed in a PR and
fails the build on new warnings.

## Code Example

```cpp
#include <iostream>
#include <numeric>
#include <vector>

double average(const std::vector<int>& values) {
    if (values.empty()) {
        return 0.0;
    }
    int total = std::accumulate(values.begin(), values.end(), 0);
    return static_cast<double>(total) / values.size();
}

int main() {
    std::vector<int> scores{70, 80, 90};
    std::cout << "Day 27 - Refactoring Legacy Code\n";
    std::cout << "Average=" << average(scores) << "\n";
    return 0;
}
```
