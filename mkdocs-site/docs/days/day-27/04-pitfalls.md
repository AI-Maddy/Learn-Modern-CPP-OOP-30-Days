---
title: "04 — Pitfalls · Day 27"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-alert: 04 — Pitfalls: Refactoring Legacy Code

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls – Day 27: Refactoring Legacy Code

??? pitfall-lobe "⚠️ Pitfall 1: Refactoring Without Tests"
    **Description**  
    Changing internal structure without a test suite leaves you no way to verify that observable behaviour is preserved. The refactor introduces a regression that slips into production.

    **BAD code**

    ``` cpp
    // Developer "cleans up" the fee function by changing logic
    // without any tests — accidentally inverts the late-payment condition
    static double savings_fee(double balance, int days_overdue) {
        double fee = balance * 0.02;
        if (days_overdue < 30) fee += 15.0;  // BUG: '<' instead of '>' — was correct before
        return fee;
    }
    ```

    **Why it fails**  
    The sign flip is syntactically valid. No compiler warning is emitted. Without a test asserting the expected values, the bug ships silently.

    **GOOD code**

    ``` cpp
    // Write characterisation tests FIRST, then refactor
    // If the refactored code breaks any assertion, you know immediately
    static_assert(true, "see runtime tests below");

    void test_savings_fee() {
        assert(savings_fee(500.0, 0)  == 10.0);  // no late penalty
        assert(savings_fee(500.0, 31) == 25.0);  // late penalty applied
        assert(savings_fee(500.0, 30) == 10.0);  // boundary: exactly 30 — no penalty
    }
    ```

    **Detection tip**  
    Make it a rule: zero refactoring PRs without accompanying tests. Use CI to block merges unless the test suite passes.

??? pitfall-lobe "⚠️ Pitfall 2: Big-Bang Rewrite"
    **Description**  
    Rewriting a large module all at once in a separate branch over weeks or months. The old codebase keeps evolving, making merging a nightmare and often leading to behaviour regressions.

    **BAD workflow**

    ``` text
    main:   A ── B ── C ── D ── E (5 weeks of new features)
                 \
    rewrite:      F ── G ── H ── I ── J  (5 weeks of rewriting)
                                         ENORMOUS merge conflict
    ```

    **Why it fails**  
    Both branches diverge for weeks. The merge introduces hundreds of conflicts. The rewrite misses edge-cases added to main during the rewrite period. Testing the merge is as expensive as the original work.

    **GOOD workflow (Strangler Fig)**

    ``` text
    main:  A ── B ── C ── D ── E   (continuous delivery)
                ↑   ↑   ↑
                Small PR per extracted function/class
                Tests pass at every step
    ```

    **Detection tip**  
    If a refactoring PR has more than ~400 lines changed, split it. Each PR should be reviewable in under 30 minutes.

??? pitfall-lobe "⚠️ Pitfall 3: Removing `const` During Refactoring"
    **Description**  
    When extracting a helper function, forgetting to mark it `const` (or removing `const` from a parameter type to make compilation easier) silently weakens the API contract and propagates mutability.

    **BAD code**

    ``` cpp
    // Original: balance_ was const-queried, then extracted to:
    double SavingsAccount::calculate_fee(int days_overdue) {
        // Forgot const — now non-const member function
        return balance_ * 0.02;
    }

    // Caller site suddenly cannot use a const SavingsAccount reference
    void report(const SavingsAccount& acc) {
        acc.calculate_fee(0);  // compile error: non-const method on const object
    }
    ```

    **Why it fails**  
    The omission propagates: either the caller must remove `const` too (spreading const-incorrectness), or they get a compile error and are confused about why.

    **GOOD code**

    ``` cpp
    double SavingsAccount::calculate_fee(int days_overdue) const {
        return balance_ * kBaseFeeRate;
    }
    ```

    **Detection tip**  
    Enable `-Wconversion` and `-Wshadow`; also run clang-tidy's `readability-const-return-type` and `cppcoreguidelines-avoid-const- or-ref-data-members` checks on refactored code.

??? pitfall-lobe "⚠️ Pitfall 4: Changing Behaviour While Renaming"
    **Description**  
    A common mistake during "rename + clean up" is accidentally changing a boundary condition (`<` vs `<=`, `>` vs `>=`) while editing the surrounding code.

    **BAD code**

    ``` cpp
    // BEFORE
    if (days_overdue > 30) fee += late_penalty;   // strictly greater than 30

    // AFTER (developer also "fixes" formatting — oops)
    if (days_overdue >= 30) fee += late_penalty;  // now 30 counts as overdue — different!
    ```

    **Why it fails**  
    A boundary change at day 30 affects thousands of accounts. The developer did not intend it; it was a mechanical error during a rename. Without a test for exactly `days_overdue == 30`, it is invisible.

    **GOOD code**

    ``` cpp
    // Characterisation test includes boundary cases
    assert(calculate_fee(account, 30) == 10.0);  // exactly 30: no penalty
    assert(calculate_fee(account, 31) == 25.0);  // 31: penalty applies

    // Only refactor after the boundary test exists and passes
    ```

    **Detection tip**  
    Include off-by-one tests for every boundary condition in the existing function before touching the code. Commit tests in a separate commit before the refactoring commit so history is clear.

??? pitfall-lobe "⚠️ Pitfall 5: Introducing a New Dependency During Refactoring"
    **Description**  
    Adding an `#include` or calling a new library function while refactoring a module changes compile-time dependencies. This can cause circular includes, increased compile times, or platform portability issues that were not in scope.

    **BAD code**

    ``` cpp
    // account.cpp — refactoring helper; developer adds logging "while they're in here"
    #include <spdlog/spdlog.h>   // NEW dependency added during a pure refactor

    double SavingsAccount::calculate_fee(int days_overdue) const {
        spdlog::info("Calculating fee for {} days overdue", days_overdue);
        return balance_ * kBaseFeeRate;
    }
    ```

    **Why it fails**  
    A refactoring PR should preserve behaviour AND dependencies. Adding a logging library is a new feature/concern that should be a separate PR. It complicates review, can break builds without spdlog installed, and makes rolling back harder.

    **GOOD code**

    ``` text
    PR 1: Refactor calculate_fee — no new dependencies (pure structural change)
    PR 2: Add logging to calculate_fee — separate feature PR
    ```

    **Detection tip**  
    Diff your includes: `git diff --stat` should show zero new `#include` lines in a pure structural refactoring PR. If any appear, move them to a follow-up PR.

??? warning "⚠️ Pitfall 6: Skipping clang-tidy Warnings After Refactoring"
    **Description**  
    Running `clang-tidy` only on new files and ignoring warnings on the refactored legacy code means most of the smells it can catch are never reported.

    **BAD workflow**

    ``` bash
    # Run clang-tidy only on new files
    clang-tidy src/new_feature.cpp -- -std=c++20
    # legacy files never checked — raw pointers, missing override, etc. remain
    ```

    **Why it fails**  
    Legacy smells accumulate indefinitely. New developers copy the old style, thinking it is the project convention.

    **GOOD workflow**

    ``` bash
    # Run clang-tidy on the entire changed set (CI enforces this)
    git diff --name-only HEAD~1 | grep '\.cpp$' | \
        xargs clang-tidy -p build/ -- -std=c++20

    # Or use run-clang-tidy for the whole project with a suppression list
    run-clang-tidy -p build/ -header-filter='.*' src/
    ```

    **Detection tip**  
    Add a CI step that runs `clang-tidy` on all files changed in a PR and fails the build on new warnings. Use `//NOLINT` sparingly and always with an explanatory comment.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 27:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
