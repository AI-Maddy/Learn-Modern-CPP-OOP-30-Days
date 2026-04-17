---
title: "04 — Pitfalls · Day 24"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-alert: 04 — Pitfalls: Mini Project 1 Bank System

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls – Day 24: Mini Project 1: Bank Account System

??? pitfall-lobe "⚠️ Pitfall 1: Non-Virtual Destructor in a Polymorphic Base"
    **Description**  
    Deleting a derived object through a base-class pointer when the base has no virtual destructor is undefined behaviour. The derived destructor never runs, so resources owned by the derived class leak silently.

    **BAD code**

    ``` cpp
    class BankAccount {
    public:
        ~BankAccount() {}    // NOT virtual — disaster waiting to happen
        virtual void withdraw(double) = 0;
    };

    class SavingsAccount : public BankAccount {
    public:
        ~SavingsAccount() { /* closes extra file handle */ }
        void withdraw(double) override {}
    };

    BankAccount* p = new SavingsAccount{};
    delete p;   // undefined behaviour: SavingsAccount destructor never called
    ```

    **Why it fails**  
    The compiler emits a call to `BankAccount::~BankAccount` directly because the destructor is not in the vtable. The `SavingsAccount` part of the object is never properly destroyed.

    **GOOD code**

    ``` cpp
    class BankAccount {
    public:
        virtual ~BankAccount() = default;  // virtual: correct subtype dtor runs
        virtual void withdraw(double) = 0;
    };
    ```

    **Detection tip**  
    `-Wnon-virtual-dtor` (GCC/Clang) warns when a class with virtual functions has a non-virtual destructor. Enable it via `-Wall`.

??? pitfall-lobe "⚠️ Pitfall 2: Raw `new` / `delete` for Account Ownership"
    **Description**  
    Managing account lifetime with raw pointers causes leaks when exceptions are thrown between `new` and `delete`.

    **BAD code**

    ``` cpp
    void process_accounts() {
        BankAccount* acc = new SavingsAccount{"SAV1","Alice",1000.0,0.04};
        acc->withdraw(200.0);   // throws InsufficientFunds
        delete acc;             // NEVER REACHED — memory leaked
    }
    ```

    **Why it fails**  
    The exception unwinds the stack frame before `delete` executes. The `SavingsAccount` object sits on the heap forever (until the process exits).

    **GOOD code**

    ``` cpp
    void process_accounts() {
        // unique_ptr destructor runs during stack unwinding — no leak
        auto acc = std::make_unique<SavingsAccount>("SAV1","Alice",1000.0,0.04);
        acc->withdraw(200.0);   // exception thrown here
    }                           // ~unique_ptr() guaranteed to run
    ```

    **Detection tip**  
    `clang-tidy` check `cppcoreguidelines-owning-memory` flags raw `new`/`delete` in application code.

??? pitfall-lobe "⚠️ Pitfall 3: Negative or Zero Amount Deposits"
    **Description**  
    Without input validation, a deposit of zero or a negative amount silently corrupts the account balance and logs an invalid transaction.

    **BAD code**

    ``` cpp
    void BankAccount::deposit(double amount) {
        balance_ += amount;   // -100 silently becomes a withdrawal
        log_.record({TransactionKind::Deposit, amount, balance_});
    }

    account.deposit(-500.0);  // balance decreases — completely wrong
    ```

    **Why it fails**  
    There is no guard. The negative amount is treated as a valid deposit. The log entry says "DEPOSIT -500", which is contradictory and likely to corrupt downstream reporting.

    **GOOD code**

    ``` cpp
    void BankAccount::deposit(double amount) {
        if (amount <= 0.0)
            throw std::invalid_argument(
                "Deposit amount must be positive, got: " +
                std::to_string(amount));
        balance_ += amount;
        log_.record({TransactionKind::Deposit, amount, balance_});
    }
    ```

    **Detection tip**  
    Write a unit test that calls `deposit(-1)` and asserts it throws. Run the test suite before every commit.

??? pitfall-lobe "⚠️ Pitfall 4: Slicing Through Value Semantics"
    **Description**  
    Storing polymorphic objects by value in a container discards the derived part of the object — the "object slicing" problem.

    **BAD code**

    ``` cpp
    std::vector<BankAccount> accounts;  // stores by VALUE
    SavingsAccount sa{"SAV1", "Alice", 1000.0, 0.04};
    accounts.push_back(sa);             // SLICED: only BankAccount portion copied
    accounts[0].withdraw(200.0);        // calls BankAccount::withdraw, not
                                        // SavingsAccount::withdraw — wrong rules!
    ```

    **Why it fails**  
    `std::vector<BankAccount>` holds `BankAccount` objects — all derived-class data is lost during the copy into the vector.

    **GOOD code**

    ``` cpp
    // Store via smart pointer to preserve polymorphism
    std::vector<std::unique_ptr<BankAccount>> accounts;
    accounts.push_back(
        std::make_unique<SavingsAccount>("SAV1", "Alice", 1000.0, 0.04));
    accounts[0]->withdraw(200.0);  // calls SavingsAccount::withdraw correctly
    ```

    **Detection tip**  
    Compilers cannot always warn about slicing. Enforce the rule with a code-review checklist: no abstract/polymorphic base class stored by value in a container.

??? pitfall-lobe "⚠️ Pitfall 5: Throwing std::string Instead of a Real Exception"
    **Description**  
    Throwing a raw `std::string` (or any non-exception type) loses type information and prevents callers from catching it with `catch(const std::exception&)`.

    **BAD code**

    ``` cpp
    void BankAccount::withdraw(double amount) {
        if (amount > balance_)
            throw std::string("Not enough funds");  // NOT a std::exception
    }

    try {
        account.withdraw(9999.0);
    } catch (const std::exception& e) {
        // NEVER CAUGHT — std::string is not std::exception
        std::cerr << e.what();
    }
    ```

    **Why it fails**  
    `std::string` does not inherit from `std::exception`. The catch block is bypassed entirely; the program calls `std::terminate`.

    **GOOD code**

    ``` cpp
    class InsufficientFunds : public std::runtime_error {
    public:
        InsufficientFunds(double needed, double available)
            : std::runtime_error(
                "Need " + std::to_string(needed) +
                " but have " + std::to_string(available))
        {}
    };

    // In withdraw:
    throw InsufficientFunds{amount, balance_};

    // Catch site works correctly:
    try {
        account.withdraw(9999.0);
    } catch (const std::exception& e) {
        std::cerr << e.what() << '\n';  // caught and handled properly
    }
    ```

    **Detection tip**  
    Clang-tidy check `hicpp-exception-baseclass` flags throw expressions whose type does not inherit from `std::exception`.

??? danger "⚠️ Pitfall 6: Forgetting to Flush the Log on Crash"
    **Description**  
    `std::ofstream` buffers writes. If the process crashes before the buffer is flushed, recent transactions are silently lost.

    **BAD code**

    ``` cpp
    void TransactionLog::record(const Transaction& t) {
        file_ << format(t) << '\n';
        // No flush — buffered data lost on crash
    }
    ```

    **Why it fails**  
    The OS may not commit the buffer to disk before the process terminates abnormally, leaving the log file in an inconsistent state.

    **GOOD code**

    ``` cpp
    void TransactionLog::record(const Transaction& t) {
        file_ << format(t) << '\n';
        file_.flush();  // ensure each transaction is durable immediately
    }
    ```

    **Detection tip**  
    For critical data, consider opening the file with `std::ios::sync_with_stdio` or use a dedicated logging library (spdlog, Boost.Log) that guarantees flush-on-write. In tests, assert the file contains expected lines after each operation.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 24:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
