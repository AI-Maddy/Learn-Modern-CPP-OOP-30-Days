# Day 04: Constructors, Destructors, and RAII

## Why This Day Matters

C++ has no garbage collector. Resources — memory, file handles, sockets, mutexes — must be
released explicitly. RAII is the idiom that makes this automatic and exception-safe. After this
day you will never write a resource leak, because your objects will clean up after themselves.

## Learning Outcomes

By the end of this day you will be able to:

* Write all five constructor types (default, parameterised, delegating, copy, move) with correct
  member initialiser lists.
* Explain RAII and implement it for at least two resource types (file, timer).
* Describe the four levels of exception safety and write a function with the strong guarantee.
* Mark destructors `noexcept` and explain why throwing from a destructor is dangerous.
* Identify two-phase initialisation anti-patterns and refactor them to single-constructor designs.
* Use `= delete` to make a type non-copyable when copying makes no semantic sense.

## Key Concepts

* **Member initialiser list** — initialises members before the constructor body; required for
  `const` and reference members; follows declaration order, not list order.
* **RAII** — constructor acquires, destructor releases; guarantees cleanup on all exit paths
  including exceptions.
* **Delegating constructors** — forward to a canonical constructor; eliminate init logic
  duplication.
* **`noexcept` destructors** — destructors must not throw; wrap cleanup that might fail in
  `try`/`catch` and swallow or log.
* **Exception safety levels** — no-throw, strong, basic, none; aim for strong when possible.
* **`= delete`** — explicitly prohibits copy/move for types where duplication is meaningless
  (file handles, mutexes, scoped timers).

## Theory

### Why This Day Matters

Resource management is the hardest problem in systems programming. C++ solves it elegantly with
one principle: **Resource Acquisition Is Initialization (RAII)**. Tie a resource's lifetime to an
object's lifetime, and the language guarantees cleanup — even when exceptions are thrown, even
when early returns happen, even when the code path is convoluted.

This day covers every constructor type, the member initialiser list, RAII in depth with practical
examples, destructor semantics, and the guarantees you can make about exception safety.

### Constructor Types

C++ provides six special member functions. Today we cover the constructor family.

#### Default Constructor

A constructor that can be called with no arguments.

```cpp
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
```

#### Parameterised Constructor

```cpp
class Buffer {
public:
    explicit Buffer(std::size_t size)   // explicit: no silent int->Buffer conversion
        : data_(size), size_{size} {}

    std::size_t size() const { return size_; }

private:
    std::vector<std::byte> data_;
    std::size_t            size_;
};
```

#### Delegating Constructor (C++11)

A constructor that calls another constructor of the same class. Avoids duplicating
initialisation logic.

```cpp
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
```

#### Converting Constructor (and `explicit`)

A constructor callable with one argument acts as an implicit conversion unless marked
`explicit`. Always mark single-argument constructors `explicit` unless you explicitly want
the conversion.

```cpp
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
```

### Member Initialiser List

Members are initialised **in declaration order**, not in the order they appear in the initialiser
list. Initialise all members in the initialiser list rather than assigning in the constructor body.

```cpp
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
```

**Why prefer the initialiser list over the body?**

Assigning in the body first default-initialises each member, then assigns — two operations.
The initialiser list constructs directly into the member — one operation. For objects with
expensive copy constructors (like `std::string` or `std::vector`), this matters.

```cpp
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
```

The `const` members and reference members **must** be initialised in the member initialiser list
— they cannot be assigned in the constructor body.

```cpp
class Config {
public:
    Config(int id, const std::string& source)
        : id_{id}        // const member: must be in initialiser list
        , source_{source} {}
private:
    const int   id_;
    std::string& source_;   // reference member: must be in initialiser list
};
```

### RAII: The Core Pattern

RAII links resource lifetime to object lifetime. The object's constructor acquires the resource;
the destructor releases it. Because destructors run deterministically when the object goes out of
scope — even under exceptions — there is no path through which the resource can leak.

```
RAII object lifetime:

{ ← scope begins
    MyRAII obj{resource};   ← constructor: ACQUIRE resource
    use(obj);
    if (error) return;      ← early return: destructor still runs!
    throw Ex{};             ← exception: destructor still runs!
} ← destructor: RELEASE resource — always
```

#### ScopedTimer Example

```cpp
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
```

#### ScopedFile Example

```cpp
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
```

### The Destructor

The destructor runs when an object's lifetime ends:

* Local variable goes out of scope
* `delete` is called on a raw pointer
* A containing object is destroyed
* An exception unwinds the stack past the object's scope

```cpp
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
```

**Destructor rules:**

* Destructors must not throw. If a destructor throws during stack unwinding (already processing
  another exception), `std::terminate` is called.
* Mark destructors `noexcept` (the default for user-defined destructors in C++11+).
* Any class that manages a resource must have a destructor that releases it.

### Exception Safety

RAII provides the foundation for exception safety. There are four levels:

* **No-throw guarantee**: the function never throws (`noexcept`).
* **Strong guarantee**: if the function throws, the program state is unchanged (rollback).
* **Basic guarantee**: if the function throws, the program state is valid but unspecified.
* **No guarantee**: if the function throws, anything can happen (memory leak, corruption).

```cpp
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
```

### Copy and Move Constructors (Brief Preview)

The copy constructor and move constructor are covered in depth on Day 14. A brief introduction:

```cpp
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
```

## Pitfalls

### Pitfall 1: Resource Leak on Early Return or Exception

**Description:** Acquiring a resource with a raw handle and relying on a cleanup call at the end
of the function. Any early return or exception bypasses the cleanup.

**BAD code:**

```cpp
#include <cstdio>
#include <vector>
#include <stdexcept>

void process_file(const char* path) {
    FILE* f = std::fopen(path, "r");
    if (!f) return;   // early return: nothing to clean up yet — OK here

    std::vector<char> buffer(1024);
    if (std::fread(buffer.data(), 1, buffer.size(), f) == 0) {
        return;           // early return: f is NOT closed — LEAK
    }

    if (/* some parse condition */ false) {
        throw std::runtime_error{"parse error"};  // exception: f is NOT closed — LEAK
    }

    std::fclose(f);   // only reached on the happy path
}
```

**Why it fails:** `fclose` is only called at the bottom of the function. Every early return
and every exception bypasses it. The file descriptor leaks. On long-running servers this
exhausts the OS file descriptor table.

**GOOD code:**

```cpp
#include <cstdio>
#include <memory>
#include <vector>

// RAII wrapper using unique_ptr with a custom deleter
struct FileCloser { void operator()(FILE* f) const { if (f) std::fclose(f); } };
using ScopedFile = std::unique_ptr<FILE, FileCloser>;

void process_file(const char* path) {
    ScopedFile f{std::fopen(path, "r")};
    if (!f) return;   // no resource yet

    std::vector<char> buffer(1024);
    if (std::fread(buffer.data(), 1, buffer.size(), f.get()) == 0) {
        return;   // ScopedFile destructor closes f — always
    }

    if (/* parse error */ false) {
        throw std::runtime_error{"parse error"};   // ScopedFile still closes f
    }
}   // f.~ScopedFile() closes the file
```

**Detection tip:** Search for raw `FILE*`, `HANDLE`, socket file descriptors, or
`malloc`/`free` pairs in function bodies. Wrap each in an RAII type.
AddressSanitizer's leak detector (`-fsanitize=address` with `ASAN_OPTIONS=detect_leaks=1`)
reports file-descriptor leaks on Linux.

### Pitfall 2: Throwing from a Destructor

**Description:** Allowing an exception to propagate out of a destructor. If the destructor is
called during stack unwinding (handling another exception), this calls `std::terminate`.

**BAD code:**

```cpp
#include <stdexcept>
#include <fstream>

class LogFile {
public:
    explicit LogFile(const std::string& path) : file_{path} {}

    ~LogFile() {
        file_.flush();              // flush might throw on some implementations
        if (!file_) {
            throw std::runtime_error{"flush failed"};  // DANGER: may terminate
        }
    }

private:
    std::ofstream file_;
};

void risky() {
    LogFile log{"app.log"};
    throw std::runtime_error{"operation failed"};
    // Stack unwind: LogFile destructor runs while exception is active
    // If destructor also throws -> std::terminate -> crash
}
```

**Why it fails:** During stack unwinding, `std::uncaught_exceptions() > 0`. If the destructor
throws while another exception is active, C++ has no way to handle both. `std::terminate` is
called, producing an unrecoverable crash with no useful error message.

**GOOD code:**

```cpp
#include <fstream>
#include <iostream>

class LogFile {
public:
    explicit LogFile(const std::string& path) : file_{path} {}

    ~LogFile() noexcept {
        try {
            file_.flush();
        } catch (const std::exception& e) {
            // Log the error — do not propagate
            std::cerr << "LogFile flush error: " << e.what() << '\n';
        }
    }

private:
    std::ofstream file_;
};
```

**Detection tip:** Mark all destructors `noexcept` (the default in C++11+). Use
`clang-tidy` check `bugprone-exception-escape` to find destructors that may throw.

### Pitfall 3: Wrong Initialisation Order — Relying on Initialiser List Order

**Description:** Placing members in the initialiser list in a different order than they are
declared in the class. Members are always initialised in declaration order, not initialiser list
order, leading to use of uninitialised members.

**Real danger — member depends on another member:**

```cpp
class Window {
public:
    Window(int w, int h)
        : area_{width_ * height_}   // BUG: width_ and height_ not yet initialised!
        , width_{w}
        , height_{h}
    {}
    // Even though width_ and height_ appear before area_ in the list,
    // they are declared after area_ in the class body.
    // Initialisation order: area_ first (reads garbage), then width_, then height_.

private:
    int area_;     // declared first
    int width_;
    int height_;
};
```

**GOOD code:**

```cpp
class Window {
public:
    Window(int w, int h)
        : width_{w}
        , height_{h}
        , area_{width_ * height_}   // safe: width_ and height_ declared before area_
    {}

private:
    int width_;    // declared first
    int height_;   // declared second
    int area_;     // declared third — safely depends on the above
};
```

**Detection tip:** Compiler warning `-Wreorder` (included in `-Wall`) warns when the
initialiser list order does not match declaration order. Always fix these warnings.

### Pitfall 4: Constructing in Two Phases (Init Anti-Pattern)

**Description:** Providing a default constructor that creates an unusable object, then requiring
the caller to call a separate `init()` function before the object can be used. The object
has a "zombie" state between construction and initialisation.

**BAD code:**

```cpp
class DatabaseConnection {
public:
    DatabaseConnection() {}  // creates an unusable object

    bool init(const std::string& conn_string) {
        // actually connects here
        handle_ = connect_to_db(conn_string);
        return handle_ != nullptr;
    }

    void query(const std::string& sql) {
        if (!handle_) throw std::logic_error{"not initialised"};  // zombie check
        // ...
    }

private:
    DbHandle* handle_{nullptr};
};

// User code can forget to call init():
DatabaseConnection db;
db.query("SELECT 1");   // throws: forgot init()
```

**Why it fails:** The class has two states: uninitialised (zombie) and initialised (valid). Every
member function must check which state it is in. The caller can forget to call `init()`. The
invariant is violated from the moment of construction.

**GOOD code:**

```cpp
class DatabaseConnection {
public:
    // Constructor either succeeds (invariant holds) or throws (no zombie state)
    explicit DatabaseConnection(const std::string& conn_string)
        : handle_{connect_to_db(conn_string)} {
        if (!handle_) throw std::runtime_error{"connection failed: " + conn_string};
    }

    void query(const std::string& sql) {
        // No init check needed — invariant guarantees handle_ is valid
        execute(handle_, sql);
    }

private:
    DbHandle* handle_;
};
```

**Detection tip:** Any class with a no-argument constructor and a separate `init()` or
`open()` function is a two-phase initialisation candidate. Refactor: move the resource
acquisition into a single constructor. If failure must be signalled without exceptions, use
a named factory function that returns `std::optional<T>` or `std::expected<T, E>`.

## Code Example

```cpp
#include <chrono>
#include <iostream>
#include <string>

class ScopedTimer {
  public:
    explicit ScopedTimer(std::string label)
        : label_(std::move(label)), start_(std::chrono::steady_clock::now()) {}

    ~ScopedTimer() {
        const auto end = std::chrono::steady_clock::now();
        const auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start_).count();
        std::cout << label_ << " took " << ms << " ms\n";
    }

  private:
    std::string label_;
    std::chrono::steady_clock::time_point start_;
};

int main() {
    std::cout << "Day 04 - Constructors, Destructors, RAII\n";
    ScopedTimer timer{"Loop"};
    volatile long long sink = 0;
    for (int i = 0; i < 100000; ++i) {
        sink += i;
    }
    return static_cast<int>(sink % 2);
}
```
