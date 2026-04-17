---
title: "Advanced Oop Patterns"
tags: ["cheatsheet", "reference"]
---

# :material-book: Advanced Oop Patterns


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Advanced OOP Patterns

Strategy, Observer, Decorator, Command, Factory Method, and CRTP mixin — each with a concise C++17 implementation and guidance on when to prefer `std::variant` alternatives.

<div class="contents" local="" depth="2">

Sections

</div>

------------------------------------------------------------------------

## Strategy Pattern — Inject Behavior via std::function

**Intent:** Separate an algorithm from the object that uses it. Swap algorithms at construction time or runtime.

**C++17 implementation:**

``` cpp
#include <functional>
#include <string>

class Sorter {
    using CompareFn = std::function<bool(int, int)>;
    CompareFn cmp_;
public:
    explicit Sorter(CompareFn cmp = std::less<int>{})
        : cmp_(std::move(cmp)) {}

    void sort(std::vector<int>& v) {
        std::sort(v.begin(), v.end(), cmp_);
    }
};

// Swap strategy without changing Sorter
Sorter asc{std::less<int>{}};
Sorter desc{std::greater<int>{}};
Sorter abs_sort{[](int a, int b){ return std::abs(a) < std::abs(b); }};

// Template strategy — zero overhead (inlined at instantiation)
template<typename Strategy>
class Compressor {
    Strategy strategy_;
public:
    explicit Compressor(Strategy s = {}) : strategy_(std::move(s)) {}
    std::vector<uint8_t> compress(std::span<const uint8_t> data) {
        return strategy_(data);
    }
};
```

**When to prefer std::variant:** When the set of strategies is closed and known at compile time, `std::variant` + `std::visit` gives zero virtual overhead and exhaustiveness checking.

``` cpp
struct Lz4Strategy  { std::vector<uint8_t> operator()(auto d); };
struct ZstdStrategy { std::vector<uint8_t> operator()(auto d); };
using CompressionStrategy = std::variant<Lz4Strategy, ZstdStrategy>;

auto compress(const CompressionStrategy& s, auto data) {
    return std::visit([&](const auto& strat){ return strat(data); }, s);
}
```

------------------------------------------------------------------------

## Observer Pattern — Subscriber List

**Intent:** Notify a set of dependent objects when state changes, without coupling them.

**C++17 implementation:**

``` cpp
#include <functional>
#include <unordered_map>

class EventEmitter {
    using Handler = std::function<void(const std::string&)>;
    std::unordered_map<std::string, std::vector<Handler>> handlers_;
    int next_id_ = 0;
public:
    // Subscribe — returns an id for later unsubscription
    int on(const std::string& event, Handler handler) {
        handlers_[event].push_back(std::move(handler));
        return next_id_++;
    }

    // Emit — call all handlers for this event
    void emit(const std::string& event, const std::string& data = {}) {
        if (auto it = handlers_.find(event); it != handlers_.end())
            for (auto& h : it->second) h(data);
    }
};

// Type-safe, zero-argument observer using inheritance
class IObserver {
public:
    virtual void update() = 0;
    virtual ~IObserver() = default;
};

class Subject {
    std::vector<IObserver*> observers_;  // non-owning
public:
    void subscribe(IObserver* obs)   { observers_.push_back(obs); }
    void unsubscribe(IObserver* obs) {
        observers_.erase(
            std::remove(observers_.begin(), observers_.end(), obs),
            observers_.end());
    }
    void notify() { for (auto* o : observers_) o->update(); }
};
```

**Pitfall:** Observers must outlive the Subject, or the Subject must hold `std::weak_ptr` and use `lock()` before calling. Use `weak_ptr` for long-lived subjects with short-lived observers.

``` cpp
class SafeSubject {
    std::vector<std::weak_ptr<IObserver>> observers_;
public:
    void subscribe(std::shared_ptr<IObserver> obs) {
        observers_.emplace_back(obs);
    }
    void notify() {
        observers_.erase(
            std::remove_if(observers_.begin(), observers_.end(),
                [](const auto& wp) { return wp.expired(); }),
            observers_.end());
        for (auto& wp : observers_)
            if (auto sp = wp.lock()) sp->update();
    }
};
```

------------------------------------------------------------------------

## Decorator Pattern — Wrapper Chain

**Intent:** Add responsibilities to objects dynamically by wrapping them.

**C++17 implementation:**

``` cpp
// Base interface
class ILogger {
public:
    virtual void log(std::string_view msg) = 0;
    virtual ~ILogger() = default;
};

// Concrete component
class ConsoleLogger : public ILogger {
public:
    void log(std::string_view msg) override {
        std::cout << msg << '\n';
    }
};

// Decorator base
class LoggerDecorator : public ILogger {
    std::unique_ptr<ILogger> inner_;
protected:
    ILogger& inner() { return *inner_; }
public:
    explicit LoggerDecorator(std::unique_ptr<ILogger> l)
        : inner_(std::move(l)) {}
};

// Concrete decorator — adds timestamps
class TimestampLogger : public LoggerDecorator {
public:
    using LoggerDecorator::LoggerDecorator;
    void log(std::string_view msg) override {
        inner().log(std::string{"[2026] "} + std::string{msg});
    }
};

// Concrete decorator — adds severity prefix
class SeverityLogger : public LoggerDecorator {
    std::string level_;
public:
    SeverityLogger(std::unique_ptr<ILogger> l, std::string lvl)
        : LoggerDecorator(std::move(l)), level_(std::move(lvl)) {}
    void log(std::string_view msg) override {
        inner().log("[" + level_ + "] " + std::string{msg});
    }
};

// Build a chain: Console <- Timestamp <- Severity
auto logger = std::make_unique<SeverityLogger>(
    std::make_unique<TimestampLogger>(
        std::make_unique<ConsoleLogger>()
    ), "INFO");
logger->log("Server started");   // [INFO] [2026] Server started
```

**std::variant alternative:** For a closed set of decorations with no runtime chaining, a single class with flag members (or a bitfield) is simpler. Use the virtual chain only when decorators are open-ended.

------------------------------------------------------------------------

## Command Pattern — Callable Queue

**Intent:** Encapsulate a request as an object, enabling undo, queuing, logging, or delayed execution.

**C++17 implementation with std::function:**

``` cpp
#include <functional>
#include <deque>

class CommandQueue {
    using Command = std::function<void()>;
    std::deque<Command> queue_;
public:
    void enqueue(Command cmd) { queue_.push_back(std::move(cmd)); }

    void execute_all() {
        while (!queue_.empty()) {
            queue_.front()();
            queue_.pop_front();
        }
    }
};

// Undoable command — stores do and undo
struct UndoableCommand {
    std::function<void()> exec;
    std::function<void()> undo;
};

class UndoStack {
    std::vector<UndoableCommand> history_;
public:
    void execute(UndoableCommand cmd) {
        cmd.exec();
        history_.push_back(std::move(cmd));
    }
    void undo() {
        if (!history_.empty()) {
            history_.back().undo();
            history_.pop_back();
        }
    }
};

// Usage — text editor
UndoStack editor;
std::string doc;
editor.execute({
    .exec = [&]{ doc += "Hello"; },
    .undo = [&]{ doc.resize(doc.size() - 5); }
});
editor.undo();  // doc is empty again
```

------------------------------------------------------------------------

## Factory Method Pattern

**Intent:** Delegate object creation to subclasses or factory functions, decoupling the creator from the product.

**C++17 implementation:**

``` cpp
// Product hierarchy
class Connection {
public:
    virtual void send(std::string_view data) = 0;
    virtual ~Connection() = default;
};
class TcpConnection  : public Connection { /* ... */ };
class UdsConnection  : public Connection { /* ... */ };

// Factory function — preferred in modern C++
std::unique_ptr<Connection> make_connection(std::string_view uri) {
    if (uri.starts_with("tcp://"))
        return std::make_unique<TcpConnection>(uri);
    if (uri.starts_with("unix://"))
        return std::make_unique<UdsConnection>(uri);
    throw std::invalid_argument{"Unknown scheme"};
}

// Class-based factory method (for polymorphic creation)
class ConnectionFactory {
public:
    virtual std::unique_ptr<Connection> create(std::string_view uri) = 0;
    virtual ~ConnectionFactory() = default;
};

// Registry-based factory (extensible without modifying factory class)
class ConnectionRegistry {
    using Creator = std::function<std::unique_ptr<Connection>(std::string_view)>;
    std::unordered_map<std::string, Creator> creators_;
public:
    void register_type(std::string scheme, Creator creator) {
        creators_[std::move(scheme)] = std::move(creator);
    }
    std::unique_ptr<Connection> create(std::string_view uri) {
        auto colon = uri.find("://");
        if (colon == std::string_view::npos) throw std::invalid_argument{"bad uri"};
        std::string scheme{uri.substr(0, colon)};
        return creators_.at(scheme)(uri);
    }
};
```

------------------------------------------------------------------------

## CRTP Mixin — Static Polymorphism

**Intent:** Add reusable behavior to a class at compile time without virtual dispatch overhead.

**C++17 implementation:**

``` cpp
// CRTP mixin — adds comparison operators from a single compare()
template<typename Derived>
class Comparable {
public:
    bool operator==(const Derived& o) const {
        return static_cast<const Derived*>(this)->compare(o) == 0;
    }
    bool operator!=(const Derived& o) const { return !(*this == o); }
    bool operator< (const Derived& o) const {
        return static_cast<const Derived*>(this)->compare(o) <  0;
    }
    bool operator<=(const Derived& o) const { return !(o < *this); }
    bool operator> (const Derived& o) const { return  (o < *this); }
    bool operator>=(const Derived& o) const { return !(*this < o); }
};

// CRTP mixin — adds to_string via a serialize_impl hook
template<typename Derived>
class Printable {
public:
    std::string str() const {
        std::ostringstream os;
        static_cast<const Derived*>(this)->print_to(os);
        return os.str();
    }
    friend std::ostream& operator<<(std::ostream& os, const Derived& d) {
        d.print_to(os); return os;
    }
};

// User class combines multiple mixins
class Version : public Comparable<Version>,
                public Printable<Version>
{
    int major_, minor_, patch_;
public:
    Version(int ma, int mi, int pa)
        : major_(ma), minor_(mi), patch_(pa) {}

    int compare(const Version& o) const {
        if (major_ != o.major_) return major_ - o.major_;
        if (minor_ != o.minor_) return minor_ - o.minor_;
        return patch_ - o.patch_;
    }
    void print_to(std::ostream& os) const {
        os << major_ << '.' << minor_ << '.' << patch_;
    }
};

Version v1{1, 2, 3}, v2{2, 0, 0};
bool older = (v1 < v2);    // Comparable<Version>::operator<
std::cout << v1;           // Printable<Version>::operator<<
```

**CRTP vs virtual:**

| Feature                   | CRTP mixin        | Virtual inheritance  |
|---------------------------|-------------------|----------------------|
| Dispatch overhead         | Zero (inline)     | One vptr indirection |
| Runtime polymorphism\| No |                   | Yes                  |
| Heterogeneous cont.       | No (need wrapper) | Yes (Base\*)         |
| Compile time              | Longer            | Faster               |
| Error messages            | Harder to read    | Clearer              |

------------------------------------------------------------------------

## Pattern Selection Guide

| Pattern        | Use when                            | std::variant alternative? |
|----------------|-------------------------------------|---------------------------|
| Strategy       | Algorithm varies at runtime         | Yes, if set is closed     |
| Observer       | 1-to-N notification, loose coupling | No — inherently open      |
| Decorator      | Stack responsibilities at runtime   | Use flags if closed set   |
| Command        | Undo, queue, macro recording        | No — callables natural    |
| Factory Method | Decouple creation from usage        | No — creation is unique   |
| CRTP Mixin     | Reusable compile-time behavior      | No — different purpose    |

------------------------------------------------------------------------

## Review Checklist

- Is each injected strategy stored as `std::function` (runtime flex) or template param (perf)?
- Do observers use `weak_ptr` when the subject may outlive them?
- Does every decorator forward to `inner_` and not skip any call?
- Do undoable commands have symmetric exec/undo operations that are truly invertible?
- Do factory functions return `unique_ptr` to express ownership clearly?
- In CRTP, is the `static_cast<Derived*>(this)` pattern used instead of virtual calls?
- Are `std::variant` + `std::visit` considered for closed-set polymorphism (no heap, no vptr)?
- Is the Command queue free of raw pointers to objects with uncertain lifetimes?

## Related Concepts

- `cheatsheets/oop-principles-solid.rst` — SOLID principles each pattern supports
- `cheatsheets/composition-vs-inheritance.rst` — when to prefer composition
- `cheatsheets/raii-smart-pointers.rst` — ownership in factory and observer
- `cheatsheets/crtp-static-polymorphism.rst` — CRTP in depth
- `cheatsheets/functions-lambdas.rst` — std::function and lambda callables
- `cheatsheets/optional-variant-any.rst` — std::variant as pattern alternative


---

[← All Cheatsheets](index.md)
