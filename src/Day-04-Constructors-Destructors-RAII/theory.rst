Day 04 — Constructors, Destructors, and RAII
=============================================

Why This Day Matters
--------------------

Resource management is the hardest problem in systems programming. C++ solves it elegantly with
one principle: **Resource Acquisition Is Initialization (RAII)**. Tie a resource's lifetime to an
object's lifetime, and the language guarantees cleanup — even when exceptions are thrown, even
when early returns happen, even when the code path is convoluted.

This day covers every constructor type, the member initialiser list, RAII in depth with practical
examples, destructor semantics, and the guarantees you can make about exception safety.


Constructor Types
-----------------

C++ provides six special member functions. Today we cover the constructor family.

Default Constructor
~~~~~~~~~~~~~~~~~~~

A constructor that can be called with no arguments.

.. code-block:: cpp

    class Timer {
    public:
        Timer() : start_{std::chrono::steady_clock::now()} {}  // (1)

        // Compiler-generated default constructor (when all members have defaults)
        // Nothing to write.

    private:
        std::chrono::steady_clock::time_point start_;
    };

    // (1): The member initialiser list sets start_ before the body runs.
    //      This is the preferred way to initialise members.

Parameterised Constructor
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    class Buffer {
    public:
        explicit Buffer(std::size_t size)   // explicit: no silent int->Buffer conversion
            : data_(size), size_{size} {}

        std::size_t size() const { return size_; }

    private:
        std::vector<std::byte> data_;
        std::size_t            size_;
    };

Delegating Constructor (C++11)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A constructor that calls another constructor of the same class. Avoids duplicating
initialisation logic.

.. code-block:: cpp

    class Connection {
    public:
        Connection(std::string host, int port, bool tls)
            : host_{std::move(host)}, port_{port}, tls_{tls} {}

        // Delegating: uses the three-argument constructor with a default for TLS
        Connection(std::string host, int port)
            : Connection{std::move(host), port, true} {}

        // Delegating: uses canonical defaults
        explicit Connection(std::string host)
            : Connection{std::move(host), 443} {}

    private:
        std::string host_;
        int         port_;
        bool        tls_;
    };

Converting Constructor (and ``explicit``)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A constructor callable with one argument acts as an implicit conversion unless marked
``explicit``. Always mark single-argument constructors ``explicit`` unless you explicitly want
the conversion.

.. code-block:: cpp

    class Seconds {
    public:
        explicit Seconds(double s) : value_{s} {}
        double value() const { return value_; }
    private:
        double value_;
    };

    void wait(Seconds duration);

    wait(Seconds{5.0});   // explicit: clear and safe
    // wait(5.0);         // ERROR: implicit conversion blocked by explicit


Member Initialiser List
------------------------

Members are initialised **in declaration order**, not in the order they appear in the initialiser
list. Initialise all members in the initialiser list rather than assigning in the constructor body.

.. code-block:: cpp

    class Rectangle {
    public:
        Rectangle(double w, double h)
            : width_{w}      // (1) initialised first — in declaration order
            , height_{h}     // (2) initialised second
            , area_{w * h}   // (3) both available since w and h are already in scope
        {}
        // Body is empty — all work done in initialiser list

    private:
        double width_;
        double height_;
        double area_;   // declared after width_ and height_
    };

**Why prefer the initialiser list over the body?**

Assigning in the body first default-initialises each member, then assigns — two operations.
The initialiser list constructs directly into the member — one operation. For objects with
expensive copy constructors (like ``std::string`` or ``std::vector``), this matters.

.. code-block:: cpp

    class Log {
    public:
        // BAD: default-initialise then assign
        Log(std::string path) {
            path_ = std::move(path);   // string is default-init'd (empty), then move-assigned
        }

        // GOOD: direct construction in initialiser list
        Log(std::string path)
            : path_{std::move(path)} {}   // one move construction

    private:
        std::string path_;
    };

The ``const`` members and reference members **must** be initialised in the member initialiser list
— they cannot be assigned in the constructor body.

.. code-block:: cpp

    class Config {
    public:
        Config(int id, const std::string& source)
            : id_{id}        // const member: must be in initialiser list
            , source_{source} {}
    private:
        const int   id_;
        std::string& source_;   // reference member: must be in initialiser list
    };


RAII: The Core Pattern
-----------------------

RAII links resource lifetime to object lifetime. The object's constructor acquires the resource;
the destructor releases it. Because destructors run deterministically when the object goes out of
scope — even under exceptions — there is no path through which the resource can leak.

::

    RAII object lifetime:

    { ← scope begins
        MyRAII obj{resource};   ← constructor: ACQUIRE resource
        use(obj);
        if (error) return;      ← early return: destructor still runs!
        throw Ex{};             ← exception: destructor still runs!
    } ← destructor: RELEASE resource — always

ScopedTimer Example
~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    #include <chrono>
    #include <iostream>
    #include <string>

    class ScopedTimer {
    public:
        explicit ScopedTimer(std::string label)
            : label_{std::move(label)}
            , start_{std::chrono::steady_clock::now()} {}

        ~ScopedTimer() {
            auto end = std::chrono::steady_clock::now();
            auto ms  = std::chrono::duration_cast<std::chrono::milliseconds>(end - start_);
            std::cout << label_ << ": " << ms.count() << " ms\n";
        }

        // Non-copyable: timers should not be duplicated
        ScopedTimer(const ScopedTimer&) = delete;
        ScopedTimer& operator=(const ScopedTimer&) = delete;

    private:
        std::string label_;
        std::chrono::steady_clock::time_point start_;
    };

    void expensive_operation() {
        ScopedTimer t{"expensive_operation"};
        // ... do work ...
    }   // destructor prints elapsed time — always, even if exception thrown

ScopedFile Example
~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    #include <cstdio>
    #include <stdexcept>
    #include <string>

    class ScopedFile {
    public:
        explicit ScopedFile(const std::string& path, const char* mode)
            : file_{std::fopen(path.c_str(), mode)} {
            if (!file_) {
                throw std::runtime_error{"Failed to open: " + path};
            }
        }

        ~ScopedFile() {
            if (file_) std::fclose(file_);   // guaranteed cleanup
        }

        // Non-copyable: file handle cannot be shared
        ScopedFile(const ScopedFile&) = delete;
        ScopedFile& operator=(const ScopedFile&) = delete;

        // Movable: transfer ownership
        ScopedFile(ScopedFile&& other) noexcept
            : file_{other.file_} {
            other.file_ = nullptr;   // moved-from object owns nothing
        }

        std::FILE* get() const { return file_; }

    private:
        std::FILE* file_;
    };

    void write_data(const std::string& path) {
        ScopedFile f{path, "w"};
        std::fputs("hello\n", f.get());
    }   // f.~ScopedFile() closes the file — even if fputs throws


The Destructor
--------------

The destructor runs when an object's lifetime ends:
* Local variable goes out of scope
* ``delete`` is called on a raw pointer
* A containing object is destroyed
* An exception unwinds the stack past the object's scope

.. code-block:: cpp

    class MutexGuard {
    public:
        explicit MutexGuard(std::mutex& m) : mutex_{m} { mutex_.lock(); }
        ~MutexGuard() { mutex_.unlock(); }   // unlock always happens

        // Non-copyable: ownership of the lock is singular
        MutexGuard(const MutexGuard&) = delete;
        MutexGuard& operator=(const MutexGuard&) = delete;

    private:
        std::mutex& mutex_;
    };

**Destructor rules:**

* Destructors must not throw. If a destructor throws during stack unwinding (already processing
  another exception), ``std::terminate`` is called.
* Mark destructors ``noexcept`` (the default for user-defined destructors in C++11+).
* Any class that manages a resource must have a destructor that releases it.


Exception Safety
----------------

RAII provides the foundation for exception safety. There are four levels:

* **No-throw guarantee**: the function never throws (``noexcept``).
* **Strong guarantee**: if the function throws, the program state is unchanged (rollback).
* **Basic guarantee**: if the function throws, the program state is valid but unspecified.
* **No guarantee**: if the function throws, anything can happen (memory leak, corruption).

.. code-block:: cpp

    class BankAccount {
    public:
        // Strong guarantee: if withdrawal fails, balance is unchanged
        void transfer(BankAccount& to, double amount) {
            // Validate first, modify atomically
            if (balance_ < amount) throw std::runtime_error{"insufficient funds"};
            // If this next line throws, we have already validated, so it's recoverable
            balance_ -= amount;    // (1)
            to.balance_ += amount; // (2)
            // Note: for true atomicity between (1) and (2) use a transaction object
        }

        double balance() const { return balance_; }

    private:
        double balance_{0.0};
    };


Copy and Move Constructors (Brief Preview)
------------------------------------------

The copy constructor and move constructor are covered in depth on Day 14. A brief introduction:

.. code-block:: cpp

    class Buffer {
    public:
        // Copy constructor: makes an independent copy of the resource
        Buffer(const Buffer& other)
            : data_(other.data_) {}   // vector copy constructor handles deep copy

        // Move constructor: transfers ownership without copying
        Buffer(Buffer&& other) noexcept
            : data_{std::move(other.data_)} {}   // O(1): no data copied

    private:
        std::vector<std::byte> data_;
    };


Self-Check Questions
--------------------

**Q1: Why should ``const`` data members always be initialised in the member initialiser list?**

``const`` members cannot be assigned after construction — they can only be set at the moment
they come into existence. The constructor body runs after all members are initialised, so
assignment in the body would be a second modification. The initialiser list sets them at the
correct time. The compiler enforces this: attempting to assign a ``const`` member in the body
is a compile error.

**Q2: What is the RAII principle and how does it solve the "resource leak on early return" problem?**

RAII ties a resource's lifetime to an object's lifetime. The constructor acquires the resource;
the destructor releases it. Because C++ guarantees that destructors run when a scope is exited
for any reason — normal return, early return, or exception — there is no code path where the
resource is not released. A ``ScopedFile`` closes the file whether the function returns normally
or throws.

**Q3: Why must destructors not throw?**

During exception propagation, the runtime unwinds the stack and runs destructors for all
objects in scope. If a destructor throws a second exception while the first is being handled,
C++ cannot process both simultaneously, so it calls ``std::terminate``, crashing the program.
The fix is to wrap potentially-throwing cleanup in a try-catch inside the destructor and handle
or log the error without propagating it.

**Q4: What is a delegating constructor and when is it useful?**

A delegating constructor forwards to another constructor of the same class. It is useful when
multiple constructors share common initialisation logic. Without delegation, the shared logic
would be duplicated or factored into a private ``init()`` member function. With delegation,
the canonical constructor performs all validation and initialisation, and the delegating
constructors simply forward with appropriate defaults.
