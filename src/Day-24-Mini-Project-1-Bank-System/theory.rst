Day 24 – Mini Project 1: Bank Account System
============================================

Motivation
----------

The best way to consolidate object-oriented knowledge is to build something
real. A bank account system is an ideal first mini-project because every OOP
pillar — encapsulation, inheritance, polymorphism, RAII, smart pointers,
operator overloading, and exception handling — appears naturally in the domain.

By the end of this day you will have a working multi-account banking library
that you could extend into a real application. More importantly, you will see
how the separate concepts from Days 1–23 *compose* into a coherent design.

Domain Overview
---------------

Our bank system manages::

    BankAccount (base)
    ├── SavingsAccount   — earns interest, minimum balance rule
    └── CheckingAccount  — overdraft protection, per-transaction fee

Supporting infrastructure::

    Transaction          — value type representing one deposit/withdrawal
    TransactionLog       — RAII wrapper around a log file
    InsufficientFunds    — custom exception type
    make_account()       — factory returning unique_ptr<BankAccount>

Design Before Code
------------------

Before writing a single line of C++, sketch responsibilities:

.. code-block:: text

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

The ``TransactionLog`` lives *inside* ``BankAccount`` as a member. This is
RAII: the log file opens when the account is created and closes automatically
when the account is destroyed, even if an exception is thrown.

The Transaction Value Type
--------------------------

A ``Transaction`` is an immutable record of one financial event. Making
members ``const`` documents that transactions are historical facts.

.. code-block:: cpp

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

Why ``const`` members? Transactions are historical facts — immutability
prevents accidental mutation and communicates intent to every reader.

RAII Transaction Log
--------------------

The log opens a file on construction and closes it in the destructor. The
destructor runs *even when exceptions unwind the stack*, guaranteeing no
file handle is leaked.

.. code-block:: cpp

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

The Rule of Five is deliberately satisfied: copy deleted, move defaulted,
destructor user-defined.

The Exception Hierarchy
-----------------------

Custom exceptions carry structured data beyond a plain message string.

.. code-block:: cpp

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

Callers can catch ``BankError`` to handle any domain error, or catch the
specific ``InsufficientFunds`` to inspect the amounts.

The Base Class: BankAccount
---------------------------

.. code-block:: cpp

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

Key design decisions:

* ``deposit`` is **non-virtual** — the logic is universal across all accounts.
* ``withdraw`` is **virtual** — savings has a minimum balance rule, checking
  allows overdraft and charges a fee, so each subtype needs its own version.
* ``operator+=`` and ``operator-=`` delegate to the virtual functions, meaning
  polymorphism applies even through the operator syntax.
* Members are ``protected`` (not private) so derived classes can record
  custom transaction types without fully duplicating logic.

Derived Classes
---------------

.. code-block:: cpp

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

Smart Pointer Factory
---------------------

The factory returns ``unique_ptr<BankAccount>``. Callers never need to know
the concrete type — polymorphism handles everything at runtime.

.. code-block:: cpp

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

Putting It All Together
-----------------------

.. code-block:: cpp

    #include <iostream>
    #include <vector>

    int main() {
        // Polymorphic collection — all accounts behind base pointer
        std::vector<std::unique_ptr<BankAccount>> accounts;

        accounts.push_back(
            make_account(AccountType::Savings, "SAV001", "Alice", 1000.0));
        accounts.push_back(
            make_account(AccountType::Checking, "CHK001", "Bob", 500.0));

        // Operator overloading through polymorphic pointer
        *accounts[0] += 200.0;   // deposits 200 into Alice's savings
        *accounts[1] -= 100.0;   // withdraws 100 from Bob (fee deducted too)

        // Exception handling — insufficient funds scenario
        try {
            *accounts[0] -= 5000.0;  // attempt to drain Alice's savings
        } catch (const InsufficientFunds& ex) {
            std::cout << "Blocked: " << ex.what() << '\n';
            // ex.needed() and ex.available() carry structured data
        }

        // Print statements (polymorphic call)
        for (const auto& acc : accounts)
            acc->print_statement();

        return 0;
        // RAII: all unique_ptrs destroyed here, each calls ~BankAccount,
        // which destroys TransactionLog, which closes the file handle
    }

Design Tradeoffs
----------------

**Protected vs private members**
  ``balance_`` is ``protected`` so derived classes can record custom
  transactions directly. A stricter design makes it private and exposes a
  protected helper ``record_transaction()``. Choose strictness based on how
  stable the base class API needs to be.

**Virtual destructor obligation**
  Always declare the destructor ``virtual`` in a base class that you intend
  to delete through a base pointer. Without it, ``delete ptr`` where ``ptr``
  is a ``BankAccount*`` pointing at a ``SavingsAccount`` is undefined
  behaviour — the derived destructor never runs.

**double for money**
  Real financial code uses integer cents or a ``Decimal`` type to avoid
  floating-point rounding. ``double`` is used here for pedagogical clarity.
  The rounding issues are themselves an important teaching point.

**unique_ptr vs shared_ptr**
  Use ``unique_ptr`` when one entity owns the account (the accounts vector).
  Use ``shared_ptr`` only when multiple owners genuinely share an object,
  e.g., a joint account referenced by two customer records.

Self-Check Questions
--------------------

#. **Why is ``withdraw`` virtual but ``deposit`` is not?**

   ``deposit`` is identical in all account types: validate, add money, log.
   There is nothing to override. ``withdraw`` has different rules per
   subtype (minimum balance, overdraft, fees), so it must be virtual.

#. **What happens if TransactionLog's constructor throws?**

   ``BankAccount``'s initialiser list throws, so the ``BankAccount`` object
   is never fully constructed. Its destructor is never called, but all
   previously constructed members are properly destroyed in reverse order.
   No resource leak occurs.

#. **Why delete TransactionLog's copy constructor?**

   ``std::ofstream`` cannot be meaningfully copied — two objects cannot own
   the same file handle safely. Deleting the copy prevents silent bugs
   where two logs write to the same file concurrently.

#. **What is the advantage of operator+= over a free function add_funds?**

   ``account += 500`` is natural, consistent with built-in numeric types,
   and — because it delegates to virtual ``deposit``/``withdraw`` — full
   polymorphism still applies through the operator syntax.

#. **When should you choose shared_ptr over unique_ptr for accounts?**

   When an account can legitimately appear in multiple collections at once,
   e.g., a joint account held in both Alice's and Bob's customer records.
   For single-owner scenarios, ``unique_ptr`` is cheaper and more expressive.
