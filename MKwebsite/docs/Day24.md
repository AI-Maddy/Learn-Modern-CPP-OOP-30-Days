# Day 24: Mini Project 1 – Bank Account System

## Why This Day Matters

This is the first integration day of the course. Every OOP concept taught
in Days 1–23 — encapsulation, inheritance, polymorphism, RAII, smart
pointers, operator overloading, exceptions — converges into one coherent
design. Working through a real domain makes the relationships concrete and
memorable.

## Learning Outcomes

After completing this day you will be able to:

* Design a class hierarchy using inheritance with a non-trivial virtual
  function (`withdraw`) that behaves differently in each subtype.
* Apply RAII by embedding a file-backed `TransactionLog` as a class member
  so resource lifetime is tied to object lifetime.
* Return polymorphic objects from a factory using `std::unique_ptr` and
  store them in a `std::vector` without object slicing.
* Overload `operator+=` and `operator-=` on a polymorphic base class so
  the operators dispatch through the vtable correctly.
* Throw and catch a custom exception hierarchy (`InsufficientFunds`) that
  carries structured data beyond a plain message string.

## Key Concepts

* **Encapsulation** — balance and log are hidden behind a public interface
  that validates all mutations before they occur.
* **Virtual withdraw** — each account subtype supplies its own withdrawal
  rules (minimum balance, overdraft, fees) without duplicating shared logic.
* **RAII log** — `TransactionLog` owns a file handle; the handle is
  released automatically when the enclosing `BankAccount` is destroyed.
* **Factory function** — `make_account()` centralises construction and
  returns `unique_ptr<BankAccount>` so callers never touch raw `new`.
* **Custom exceptions** — `InsufficientFunds` inherits from
  `std::runtime_error` and exposes `needed()` / `available()` for
  structured error handling.

## Theory

### Motivation

The best way to consolidate object-oriented knowledge is to build something
real. A bank account system is an ideal first mini-project because every OOP
pillar — encapsulation, inheritance, polymorphism, RAII, smart pointers,
operator overloading, and exception handling — appears naturally in the domain.

By the end of this day you will have a working multi-account banking library
that you could extend into a real application. More importantly, you will see
how the separate concepts from Days 1–23 *compose* into a coherent design.

### Domain Overview

Our bank system manages:

```text
BankAccount (base)
├── SavingsAccount   — earns interest, minimum balance rule
└── CheckingAccount  — overdraft protection, per-transaction fee
```

Supporting infrastructure:

```text
Transaction          — value type representing one deposit/withdrawal
TransactionLog       — RAII wrapper around a log file
InsufficientFunds    — custom exception type
make_account()       — factory returning unique_ptr<BankAccount>
```

### Design Before Code

Before writing a single line of C++, sketch responsibilities:

```text
┌─────────────────────────────────┐
│         BankAccount             │
│  # id_      : string            │
│  # owner_   : string            │
│  # balance_ : double            │
│  # log_     : TransactionLog    │
├─────────────────────────────────┤
│  + deposit(amount)              │
│  + withdraw(amount) [virtual]   │
│  + balance() const              │
│  + operator+=(double)           │
│  + operator-=(double)           │
│  + print_statement() const      │
└──────────────┬──────────────────┘
               │
     ┌─────────┴──────────┐
     │                    │
┌────┴────────┐   ┌────────┴────────┐
│SavingsAccount│  │CheckingAccount  │
│rate_: double │  │overdraft_:double│
│min_bal_:dbl  │  │fee_: double     │
│apply_interest│  │withdraw()override│
└─────────────┘  └─────────────────┘
```

The `TransactionLog` lives *inside* `BankAccount` as a member. This is
RAII: the log file opens when the account is created and closes automatically
when the account is destroyed, even if an exception is thrown.

### The Transaction Value Type

A `Transaction` is an immutable record of one financial event. Making
members `const` documents that transactions are historical facts.

```cpp
#include <chrono>
#include <string>

enum class TransactionKind {
    Deposit,
    Withdrawal,
    Interest,
    Fee
};

struct Transaction {
    const TransactionKind kind;
    const double          amount;
    const double          balance_after;
    const std::chrono::system_clock::time_point timestamp;

    Transaction(TransactionKind k, double amt, double bal)
        : kind{k}
        , amount{amt}
        , balance_after{bal}
        , timestamp{std::chrono::system_clock::now()}
    {}
};
```

Why `const` members? Transactions are historical facts — immutability
prevents accidental mutation and communicates intent to every reader.

### RAII Transaction Log

The log opens a file on construction and closes it in the destructor. The
destructor runs *even when exceptions unwind the stack*, guaranteeing no
file handle is leaked.

```cpp
#include <fstream>
#include <stdexcept>
#include <string>
#include <vector>

class TransactionLog {
public:
    explicit TransactionLog(const std::string& account_id) {
        file_.open(account_id + "_log.txt",
                   std::ios::out | std::ios::app);
        if (!file_.is_open())
            throw std::runtime_error(
                "Cannot open transaction log for " + account_id);
    }

    // RAII: destructor closes the file automatically
    ~TransactionLog() {
        if (file_.is_open()) file_.close();
    }

    // Non-copyable: one log owns one file handle
    TransactionLog(const TransactionLog&)            = delete;
    TransactionLog& operator=(const TransactionLog&) = delete;

    // Movable so BankAccount itself can be moved
    TransactionLog(TransactionLog&&)            = default;
    TransactionLog& operator=(TransactionLog&&) = default;

    void record(const Transaction& t) {
        file_ << kind_to_str(t.kind)
              << " amount=" << t.amount
              << " balance=" << t.balance_after << '\n';
        file_.flush();           // flush: no partial writes on crash
        history_.push_back(t);
    }

    const std::vector<Transaction>& history() const { return history_; }

private:
    std::ofstream            file_;
    std::vector<Transaction> history_;

    static const char* kind_to_str(TransactionKind k) {
        switch (k) {
            case TransactionKind::Deposit:    return "DEPOSIT";
            case TransactionKind::Withdrawal: return "WITHDRAWAL";
            case TransactionKind::Interest:   return "INTEREST";
            case TransactionKind::Fee:        return "FEE";
        }
        return "UNKNOWN";
    }
};
```

The Rule of Five is deliberately satisfied: copy deleted, move defaulted,
destructor user-defined.

### The Exception Hierarchy

Custom exceptions carry structured data beyond a plain message string.

```cpp
#include <stdexcept>
#include <string>

// Base for all bank domain errors
class BankError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

class InsufficientFunds : public BankError {
public:
    InsufficientFunds(double needed, double available)
        : BankError("Need " + std::to_string(needed) +
                    " but only " + std::to_string(available) +
                    " is available")
        , needed_{needed}
        , available_{available}
    {}

    double needed()    const noexcept { return needed_;    }
    double available() const noexcept { return available_; }

private:
    double needed_;
    double available_;
};
```

Callers can catch `BankError` to handle any domain error, or catch the
specific `InsufficientFunds` to inspect the amounts.

### The Base Class: BankAccount

```cpp
#include <iostream>
#include <memory>
#include <string>

class BankAccount {
public:
    BankAccount(std::string id, std::string owner, double initial)
        : id_{std::move(id)}
        , owner_{std::move(owner)}
        , balance_{initial}
        , log_{id_}         // RAII log starts here
    {
        if (initial < 0.0)
            throw std::invalid_argument("Initial balance cannot be negative");
        log_.record({TransactionKind::Deposit, initial, balance_});
    }

    virtual ~BankAccount() = default;

    // Non-virtual: deposit logic is identical for all account types
    void deposit(double amount) {
        if (amount <= 0.0)
            throw std::invalid_argument("Deposit must be positive");
        balance_ += amount;
        log_.record({TransactionKind::Deposit, amount, balance_});
    }

    // Virtual: each subtype has its own withdrawal rules
    virtual void withdraw(double amount) {
        validate_positive(amount);
        if (amount > balance_)
            throw InsufficientFunds{amount, balance_};
        balance_ -= amount;
        log_.record({TransactionKind::Withdrawal, amount, balance_});
    }

    // Operator overloading delegates to virtual functions
    // Polymorphism therefore applies through operators too
    BankAccount& operator+=(double amount) {
        deposit(amount);
        return *this;
    }
    BankAccount& operator-=(double amount) {
        withdraw(amount);
        return *this;
    }

    double      balance() const noexcept { return balance_; }
    std::string id()      const          { return id_;      }
    std::string owner()   const          { return owner_;   }

    void print_statement() const {
        std::cout << "=== Statement for " << owner_
                  << " (" << id_ << ") ===\n";
        for (const auto& t : log_.history()) {
            std::cout << "  bal=" << t.balance_after
                      << "  amt=" << t.amount << '\n';
        }
        std::cout << "Current balance: " << balance_ << '\n';
    }

protected:
    std::string    id_;
    std::string    owner_;
    double         balance_;
    TransactionLog log_;

    static void validate_positive(double amount) {
        if (amount <= 0.0)
            throw std::invalid_argument("Amount must be positive");
    }
};
```

Key design decisions:

* `deposit` is **non-virtual** — the logic is universal across all accounts.
* `withdraw` is **virtual** — savings has a minimum balance rule, checking
  allows overdraft and charges a fee, so each subtype needs its own version.
* `operator+=` and `operator-=` delegate to the virtual functions, meaning
  polymorphism applies even through the operator syntax.
* Members are `protected` (not private) so derived classes can record
  custom transaction types without fully duplicating logic.

### Derived Classes

```cpp
class SavingsAccount : public BankAccount {
public:
    SavingsAccount(std::string id, std::string owner,
                   double initial,
                   double annual_rate,
                   double min_balance = 100.0)
        : BankAccount{std::move(id), std::move(owner), initial}
        , rate_{annual_rate}
        , min_balance_{min_balance}
    {}

    // Called at end of each month by a scheduler
    void apply_monthly_interest() {
        double interest = balance_ * rate_ / 12.0;
        balance_ += interest;
        log_.record({TransactionKind::Interest, interest, balance_});
    }

    void withdraw(double amount) override {
        validate_positive(amount);
        // Cannot go below minimum balance
        if (balance_ - amount < min_balance_)
            throw InsufficientFunds{amount, balance_ - min_balance_};
        BankAccount::withdraw(amount);  // reuse base validation/logging
    }

private:
    double rate_;
    double min_balance_;
};

class CheckingAccount : public BankAccount {
public:
    CheckingAccount(std::string id, std::string owner,
                    double initial,
                    double overdraft_limit,
                    double fee_per_transaction = 0.25)
        : BankAccount{std::move(id), std::move(owner), initial}
        , overdraft_limit_{overdraft_limit}
        , fee_{fee_per_transaction}
    {}

    void withdraw(double amount) override {
        validate_positive(amount);
        // Checking allows going into negative up to overdraft_limit_
        if (amount > balance_ + overdraft_limit_)
            throw InsufficientFunds{amount, balance_ + overdraft_limit_};
        balance_ -= amount;
        log_.record({TransactionKind::Withdrawal, amount, balance_});
        // Flat per-transaction fee charged after every withdrawal
        balance_ -= fee_;
        log_.record({TransactionKind::Fee, fee_, balance_});
    }

private:
    double overdraft_limit_;
    double fee_;
};
```

### Smart Pointer Factory

The factory returns `unique_ptr<BankAccount>`. Callers never need to know
the concrete type — polymorphism handles everything at runtime.

```cpp
#include <memory>
#include <stdexcept>

enum class AccountType { Savings, Checking };

std::unique_ptr<BankAccount>
make_account(AccountType type,
             const std::string& id,
             const std::string& owner,
             double initial_balance) {
    switch (type) {
        case AccountType::Savings:
            return std::make_unique<SavingsAccount>(
                id, owner, initial_balance, 0.04);
        case AccountType::Checking:
            return std::make_unique<CheckingAccount>(
                id, owner, initial_balance, 500.0);
    }
    throw std::invalid_argument("Unknown account type");
}
```

### Design Tradeoffs

**Protected vs private members**
  `balance_` is `protected` so derived classes can record custom
  transactions directly. A stricter design makes it private and exposes a
  protected helper `record_transaction()`.

**Virtual destructor obligation**
  Always declare the destructor `virtual` in a base class that you intend
  to delete through a base pointer. Without it, `delete ptr` where `ptr`
  is a `BankAccount*` pointing at a `SavingsAccount` is undefined behaviour.

**double for money**
  Real financial code uses integer cents or a `Decimal` type to avoid
  floating-point rounding. `double` is used here for pedagogical clarity.

**unique_ptr vs shared_ptr**
  Use `unique_ptr` when one entity owns the account. Use `shared_ptr` only
  when multiple owners genuinely share an object, e.g., a joint account
  referenced by two customer records.

## Pitfalls

### Pitfall 1: Non-Virtual Destructor in a Polymorphic Base

**Description**
Deleting a derived object through a base-class pointer when the base has no
virtual destructor is undefined behaviour. The derived destructor never runs,
so resources owned by the derived class leak silently.

**BAD code**

```cpp
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

**GOOD code**

```cpp
class BankAccount {
public:
    virtual ~BankAccount() = default;  // virtual: correct subtype dtor runs
    virtual void withdraw(double) = 0;
};
```

**Detection tip:** `-Wnon-virtual-dtor` (GCC/Clang) warns when a class with virtual
functions has a non-virtual destructor. Enable it via `-Wall`.

---

### Pitfall 2: Raw `new` / `delete` for Account Ownership

**Description**
Managing account lifetime with raw pointers causes leaks when exceptions
are thrown between `new` and `delete`.

**BAD code**

```cpp
void process_accounts() {
    BankAccount* acc = new SavingsAccount{"SAV1","Alice",1000.0,0.04};
    acc->withdraw(200.0);   // throws InsufficientFunds
    delete acc;             // NEVER REACHED — memory leaked
}
```

**GOOD code**

```cpp
void process_accounts() {
    // unique_ptr destructor runs during stack unwinding — no leak
    auto acc = std::make_unique<SavingsAccount>("SAV1","Alice",1000.0,0.04);
    acc->withdraw(200.0);   // exception thrown here
}                           // ~unique_ptr() guaranteed to run
```

**Detection tip:** `clang-tidy` check `cppcoreguidelines-owning-memory` flags raw
`new`/`delete` in application code.

---

### Pitfall 3: Negative or Zero Amount Deposits

**Description**
Without input validation, a deposit of zero or a negative amount silently
corrupts the account balance and logs an invalid transaction.

**BAD code**

```cpp
void BankAccount::deposit(double amount) {
    balance_ += amount;   // -100 silently becomes a withdrawal
    log_.record({TransactionKind::Deposit, amount, balance_});
}

account.deposit(-500.0);  // balance decreases — completely wrong
```

**GOOD code**

```cpp
void BankAccount::deposit(double amount) {
    if (amount <= 0.0)
        throw std::invalid_argument(
            "Deposit amount must be positive, got: " +
            std::to_string(amount));
    balance_ += amount;
    log_.record({TransactionKind::Deposit, amount, balance_});
}
```

**Detection tip:** Write a unit test that calls `deposit(-1)` and asserts it throws.

---

### Pitfall 4: Slicing Through Value Semantics

**Description**
Storing polymorphic objects by value in a container discards the derived
part of the object — the "object slicing" problem.

**BAD code**

```cpp
std::vector<BankAccount> accounts;  // stores by VALUE
SavingsAccount sa{"SAV1", "Alice", 1000.0, 0.04};
accounts.push_back(sa);             // SLICED: only BankAccount portion copied
accounts[0].withdraw(200.0);        // calls BankAccount::withdraw — wrong rules!
```

**GOOD code**

```cpp
// Store via smart pointer to preserve polymorphism
std::vector<std::unique_ptr<BankAccount>> accounts;
accounts.push_back(
    std::make_unique<SavingsAccount>("SAV1", "Alice", 1000.0, 0.04));
accounts[0]->withdraw(200.0);  // calls SavingsAccount::withdraw correctly
```

---

### Pitfall 5: Throwing std::string Instead of a Real Exception

**Description**
Throwing a raw `std::string` (or any non-exception type) loses type
information and prevents callers from catching it with `catch(const std::exception&)`.

**BAD code**

```cpp
void BankAccount::withdraw(double amount) {
    if (amount > balance_)
        throw std::string("Not enough funds");  // NOT a std::exception
}
```

**GOOD code**

```cpp
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
```

**Detection tip:** Clang-tidy check `hicpp-exception-baseclass` flags throw expressions
whose type does not inherit from `std::exception`.

---

### Pitfall 6: Forgetting to Flush the Log on Crash

**Description**
`std::ofstream` buffers writes. If the process crashes before the buffer
is flushed, recent transactions are silently lost.

**BAD code**

```cpp
void TransactionLog::record(const Transaction& t) {
    file_ << format(t) << '\n';
    // No flush — buffered data lost on crash
}
```

**GOOD code**

```cpp
void TransactionLog::record(const Transaction& t) {
    file_ << format(t) << '\n';
    file_.flush();  // ensure each transaction is durable immediately
}
```

## Code Example

```cpp
#include <iostream>
#include <string>

class Account {
  public:
    Account(std::string id, double balance) : id_(std::move(id)), balance_(balance) {}
    bool transfer_to(Account& other, double amount) {
        if (amount <= 0 || amount > balance_) {
            return false;
        }
        balance_ -= amount;
        other.balance_ += amount;
        return true;
    }
    double balance() const { return balance_; }
    const std::string& id() const { return id_; }

  private:
    std::string id_;
    double balance_{};
};

int main() {
    Account a{"A001", 500.0};
    Account b{"B002", 200.0};
    a.transfer_to(b, 150.0);
    std::cout << "Day 24 - Mini Project Bank System\n";
    std::cout << a.id() << ':' << a.balance() << " | " << b.id() << ':' << b.balance() << "\n";
    return 0;
}
```
