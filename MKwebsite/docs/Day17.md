# Day 17: Design Patterns for OOP

## Why This Day Matters

The Gang of Four (GoF) book catalogued 23 recurring solutions to common OOP design problems in 1994. Many of those solutions were written around the limitations of C++98: no lambdas, no `std::function`, no type deduction. Modern C++ lets you express the same *intent* with far less boilerplate — but the underlying *design insight* is just as valuable. A pattern is a **name** for a recurring design decision, not a prescription for how many classes to create. Knowing the names lets teams communicate: "this is an Observer", "this violates Strategy", without writing paragraphs.

## Learning Outcomes

By the end of this day you will be able to:

* Name and describe the intent of the five core GoF patterns covered: Factory Method, Observer, Strategy, Decorator, and Command.
* Implement each pattern in idiomatic C++17/20 using lambdas, `std::function`, `unique_ptr`, and templates instead of heavyweight virtual hierarchies.
* Identify when a pattern adds value versus when it adds unnecessary complexity.
* Apply the Factory registry pattern to achieve open-for-extension, closed-for-modification (OCP) designs.
* Write an Observer system with safe lifetime management using `weak_ptr` or RAII unsubscription tokens.

## Key Concepts

* **Factory Method** — decouples object creation from usage; implemented as a registry map from string keys to creator lambdas.
* **Observer** — one-to-many event notification; `std::function` handlers replace virtual `IObserver` base classes.
* **Strategy** — swappable algorithm; use a template parameter for compile-time zero-cost selection, `std::function` for runtime selection.
* **Decorator** — dynamic behaviour composition; `unique_ptr` chain wraps components without subclass explosion.
* **Command** — encapsulates a request as a callable pair (do/undo); enables history, queuing, and transactional operations.
* **Over-engineering signal** — applying a pattern when there is only one implementation and no real changeability requirement.

## Theory

### Motivation — Why Patterns Matter (and When They Don't)

The Gang of Four (GoF) book catalogued 23 recurring solutions to common OOP design problems in 1994. Many of those solutions were written around the limitations of C++98: no lambdas, no `std::function`, no type deduction. Modern C++ lets you express the same *intent* with far less boilerplate — but the underlying *design insight* is just as valuable.

A pattern is a **name** for a recurring design decision, not a prescription for how many classes to create. Knowing the names lets teams communicate: "this is an Observer", "this violates Strategy", without writing paragraphs.

When patterns become over-engineering:

* You have one implementation today and no concrete reason to expect another.
* The extra abstraction layer doubles the call depth without adding testability.
* The pattern was chosen because it sounds impressive, not because it solves a real changeability problem.

Rule of thumb: **introduce a pattern when the pain it solves already exists**, not in anticipation of hypothetical future pain.

### GoF Pattern Overview

```
Creational       Structural        Behavioural
─────────────    ──────────────    ────────────────────
Factory Method   Adapter           Observer
Abstract Factory Bridge            Strategy
Builder          Composite         Command
Prototype        Decorator         Template Method
Singleton        Facade            Iterator
                 Flyweight         State
                 Proxy             Chain of Responsibility
                                   Visitor / Interpreter
```

This day covers five patterns most relevant to C++ OOP: Factory Method, Observer, Strategy, Decorator, and Command.

### Factory Method

**Intent:** Define an interface for creating an object, but let subclasses (or a factory function) decide which class to instantiate. Decouples creation from usage.

**Classic OOP problem:** A `Logger` factory that must choose between `FileLogger`, `ConsoleLogger`, and `SyslogLogger` based on configuration.

**Modern C++ implementation using `std::unique_ptr` and a registry map:**

```cpp
// logger.hpp
#include <memory>
#include <string>
#include <unordered_map>
#include <functional>
#include <stdexcept>

struct Logger {
    virtual ~Logger() = default;
    virtual void log(std::string_view msg) = 0;
};

struct ConsoleLogger : Logger {
    void log(std::string_view msg) override {
        std::puts(msg.data());
    }
};

struct FileLogger : Logger {
    explicit FileLogger(std::string path) : path_{std::move(path)} {}
    void log(std::string_view msg) override { /* write to file */ }
private:
    std::string path_;
};

// Factory registry — maps string keys to creator lambdas
class LoggerFactory {
public:
    using Creator = std::function<std::unique_ptr<Logger>()>;

    static LoggerFactory& instance() {
        static LoggerFactory f;
        return f;
    }

    void register_type(std::string name, Creator fn) {
        registry_[std::move(name)] = std::move(fn);
    }

    std::unique_ptr<Logger> create(const std::string& name) const {
        auto it = registry_.find(name);
        if (it == registry_.end())
            throw std::invalid_argument("Unknown logger: " + name);
        return it->second();
    }

private:
    std::unordered_map<std::string, Creator> registry_;
};

// Registration (typically in a .cpp file or module implementation unit)
inline void register_default_loggers() {
    auto& f = LoggerFactory::instance();
    f.register_type("console", []{ return std::make_unique<ConsoleLogger>(); });
    f.register_type("file",    []{ return std::make_unique<FileLogger>("/tmp/app.log"); });
}
```

Usage:

```cpp
register_default_loggers();
auto logger = LoggerFactory::instance().create("console");
logger->log("Hello, factory!");
```

**Tradeoff:** The registry approach is open for extension (new types can register without touching existing code — OCP), but it uses runtime `std::string` lookup. If performance matters and the set of types is fixed, prefer a `switch` on an enum or a template factory.

### Observer

**Intent:** Define a one-to-many dependency so that when one object changes state, all dependents are notified automatically.

**Modern C++ implementation without virtual inheritance — using `std::function`:**

```cpp
#include <vector>
#include <functional>
#include <algorithm>

template<typename EventT>
class Subject {
public:
    using Handler = std::function<void(const EventT&)>;

    void subscribe(Handler h) {
        handlers_.push_back(std::move(h));
    }

    void notify(const EventT& ev) const {
        for (auto& h : handlers_) h(ev);
    }

private:
    std::vector<Handler> handlers_;
};

// Domain event
struct TemperatureChanged { double celsius; };

// Usage
Subject<TemperatureChanged> sensor;

sensor.subscribe([](const TemperatureChanged& e) {
    std::printf("Display: %.1f°C\n", e.celsius);
});
sensor.subscribe([](const TemperatureChanged& e) {
    if (e.celsius > 80.0) std::puts("ALERT: overheating!");
});

sensor.notify({72.5});
sensor.notify({85.0});
```

**Compared to GoF virtual Observer:** The `std::function` version requires no `IObserver` base class, no raw pointer management, and supports lambdas, member functions (via `std::bind` or a capturing lambda), and free functions.

**Tradeoff:** `std::function` incurs a small heap allocation per handler (unless SBO fits). For hot paths, use a `std::vector` of function pointers or a compile-time observer list via CRTP (see Day 20).

### Strategy

**Intent:** Define a family of algorithms, encapsulate each one, and make them interchangeable. The context delegates work to the strategy.

**Modern C++ — strategy as a template parameter (zero-overhead) or as `std::function` (runtime-switchable):**

```cpp
// Compile-time strategy — zero virtual dispatch overhead
template<typename SortStrategy>
class DataProcessor {
public:
    explicit DataProcessor(SortStrategy s = {}) : sort_{std::move(s)} {}

    void process(std::vector<int>& data) {
        sort_(data);
        // ... further processing
    }
private:
    SortStrategy sort_;
};

struct QuickSort {
    void operator()(std::vector<int>& v) const {
        std::sort(v.begin(), v.end());
    }
};

struct StableSort {
    void operator()(std::vector<int>& v) const {
        std::stable_sort(v.begin(), v.end());
    }
};

DataProcessor<QuickSort>  dp1;
DataProcessor<StableSort> dp2;

// Runtime-switchable strategy using std::function
class Formatter {
public:
    using Strategy = std::function<std::string(int)>;
    explicit Formatter(Strategy s) : format_{std::move(s)} {}

    std::string apply(int v) const { return format_(v); }

private:
    Strategy format_;
};

Formatter hex_fmt([](int v){ return std::format("0x{:X}", v); });
Formatter dec_fmt([](int v){ return std::format("{}", v); });
```

### Decorator

**Intent:** Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.

**Modern C++ — decorator chain with `unique_ptr` composition:**

```cpp
struct TextTransform {
    virtual ~TextTransform() = default;
    virtual std::string apply(std::string s) const = 0;
};

// Concrete component
struct IdentityTransform : TextTransform {
    std::string apply(std::string s) const override { return s; }
};

// Base decorator — owns and delegates to the wrapped component
struct TransformDecorator : TextTransform {
    explicit TransformDecorator(std::unique_ptr<TextTransform> inner)
        : inner_{std::move(inner)} {}
protected:
    std::unique_ptr<TextTransform> inner_;
};

struct UpperCaseDecorator : TransformDecorator {
    using TransformDecorator::TransformDecorator;
    std::string apply(std::string s) const override {
        auto base = inner_->apply(s);
        std::ranges::transform(base, base.begin(), ::toupper);
        return base;
    }
};

struct TrimDecorator : TransformDecorator {
    using TransformDecorator::TransformDecorator;
    std::string apply(std::string s) const override {
        auto base = inner_->apply(std::move(s));
        // trim leading/trailing whitespace
        auto start = base.find_first_not_of(' ');
        auto end   = base.find_last_not_of(' ');
        return (start == std::string::npos) ? "" : base.substr(start, end - start + 1);
    }
};

// Build a chain: Trim(UpperCase(Identity))
auto pipeline =
    std::make_unique<TrimDecorator>(
        std::make_unique<UpperCaseDecorator>(
            std::make_unique<IdentityTransform>()));

std::puts(pipeline->apply("  hello world  ").c_str());  // "HELLO WORLD"
```

**Functional alternative:** For stateless decorators, `std::function` chaining is simpler and avoids heap allocation:

```cpp
using Transform = std::function<std::string(std::string)>;

auto upper  = [](std::string s){ std::ranges::transform(s, s.begin(), ::toupper); return s; };
auto trim   = [](std::string s){ /* trim */ return s; };

// Compose transforms
Transform pipeline = [=](std::string s){ return trim(upper(std::move(s))); };
std::puts(pipeline("  hello  ").c_str());
```

### Command

**Intent:** Encapsulate a request as an object, allowing parameterisation of clients with different requests, queuing, logging, and undo.

**Modern C++ — command as a callable (`std::function`) with undo support:**

```cpp
#include <stack>

class CommandHistory {
public:
    using Cmd = std::pair<
        std::function<void()>,   // do
        std::function<void()>>;  // undo

    void execute(Cmd cmd) {
        cmd.first();
        history_.push(std::move(cmd));
    }

    void undo() {
        if (!history_.empty()) {
            history_.top().second();
            history_.pop();
        }
    }

private:
    std::stack<Cmd> history_;
};

// Domain model
int counter = 0;

CommandHistory hist;
hist.execute({ [&]{ counter += 5; },  [&]{ counter -= 5; } });
hist.execute({ [&]{ counter *= 2; },  [&]{ counter /= 2; } });
// counter == 10
hist.undo();  // counter == 5
hist.undo();  // counter == 0
```

**Tradeoff vs classic GoF:** No `ICommand` hierarchy, no virtual methods, no concrete command subclasses. The lambda pair is concise but the undo lambda captures state by reference — ensure the referenced objects outlive the command.

### Pattern Comparison and When to Use Each

| Pattern            | Use when                       | Avoid when                |
|--------------------|--------------------------------|---------------------------|
| Factory Method     | Creation logic must vary or be decoupled from usage | Only one type ever, or `new T()` is fine |
| Observer           | Multiple parties react to events in a decoupled way | One listener and no plans to add more |
| Strategy           | Algorithm must be swappable at runtime or per-instance | Only one algorithm; a simple `if` suffices |
| Decorator          | Combine behaviours dynamically without class explosion | Inheritance is simpler and the combination set is fixed and small |
| Command            | Need undo, queuing, or transactional operations | Simple one-shot call; no undo/replay required |

## Pitfalls

### Pitfall 1 — Singleton as a Global Variable Disguise

**Problem:** Implementing Singleton to share global state rather than to control unique instantiation. The result is a hidden dependency that makes classes untestable.

**BAD:**

```cpp
class Config {
public:
    static Config& instance() {
        static Config c;
        return c;
      }
    std::string get(const std::string& key) { return data_[key]; }
    void set(const std::string& key, std::string val) { data_[key] = val; }
private:
    std::unordered_map<std::string, std::string> data_;
};

// Used everywhere — impossible to substitute in tests
class OrderProcessor {
public:
    void process() {
        auto mode = Config::instance().get("mode");  // hidden dependency
    }
};
```

**Why it fails:** `OrderProcessor` cannot be tested without the global `Config` being in a specific state. Tests interfere with each other because they share the same singleton. It is impossible to swap a test stub.

**GOOD — inject the dependency:**

```cpp
struct IConfig {
    virtual ~IConfig() = default;
    virtual std::string get(const std::string& key) const = 0;
};

class OrderProcessor {
public:
    explicit OrderProcessor(IConfig& cfg) : cfg_{cfg} {}
    void process() {
        auto mode = cfg_.get("mode");   // explicit, injectable dependency
    }
private:
    IConfig& cfg_;
};
```

**Detection tip:** Any class calling `::instance()` that is not itself a factory or registry is probably abusing Singleton as global state.

### Pitfall 2 — Observer with Dangling Pointer

**Problem:** Registering a raw observer pointer and not unregistering before the observer is destroyed.

**BAD:**

```cpp
struct IObserver { virtual void on_event() = 0; };

class EventSource {
public:
    void subscribe(IObserver* obs) { observers_.push_back(obs); }
    void fire() { for (auto* o : observers_) o->on_event(); }  // UB if dangling
private:
    std::vector<IObserver*> observers_;
};

void example() {
    EventSource src;
    struct TempObserver : IObserver { void on_event() override {} };
    {
        TempObserver obs;
        src.subscribe(&obs);
    }  // obs destroyed here — pointer dangling
    src.fire();  // CRASH
}
```

**Why it fails:** The pointer outlives the pointed-to object. `fire()` invokes a method through an invalid pointer — undefined behaviour.

**GOOD — use `std::weak_ptr` or explicit unsubscription:**

```cpp
class EventSource {
public:
    using Token = std::shared_ptr<std::function<void()>>;

    Token subscribe(std::function<void()> fn) {
        auto sp = std::make_shared<std::function<void()>>(std::move(fn));
        handlers_.push_back(sp);
        return sp;  // caller holds the token; drop token to unsubscribe
    }

    void fire() {
        handlers_.erase(
            std::remove_if(handlers_.begin(), handlers_.end(),
                [](auto& wp){ return wp.expired(); }),
            handlers_.end());
        for (auto& wp : handlers_)
            if (auto sp = wp.lock()) (*sp)();
    }

private:
    std::vector<std::weak_ptr<std::function<void()>>> handlers_;
};
```

**Detection tip:** Any `std::vector<SomeBase*>` used as a subscriber list is a red flag. Use `weak_ptr` or a RAII unsubscription token.

### Pitfall 3 — Strategy Stored by Raw Pointer

**Problem:** A context class stores its strategy as a raw `IStrategy*`, creating unclear ownership semantics.

**BAD:**

```cpp
struct ISortStrategy { virtual void sort(std::vector<int>&) = 0; };

class DataPipeline {
public:
    void set_strategy(ISortStrategy* s) { strategy_ = s; }  // who owns s?
    void run(std::vector<int>& v) { strategy_->sort(v); }
private:
    ISortStrategy* strategy_ = nullptr;  // raw pointer — UB if strategy destroyed first
};
```

**Why it fails:** There is no clear owner. If the strategy is stack-allocated and the pipeline outlives the scope, calling `run()` is undefined behaviour.

**GOOD — use `std::unique_ptr` for owned strategies or reference for borrowed:**

```cpp
class DataPipeline {
public:
    // Takes ownership
    void set_strategy(std::unique_ptr<ISortStrategy> s) {
        strategy_ = std::move(s);
    }
    void run(std::vector<int>& v) {
        if (strategy_) strategy_->sort(v);
    }
private:
    std::unique_ptr<ISortStrategy> strategy_;
};
```

**Detection tip:** Review every raw pointer member that is assigned from outside the class. The ownership policy should be encoded in the type (`unique_ptr`, `shared_ptr`, or a reference with documented lifetime).

### Pitfall 4 — Decorator Breaking the Substitution Principle

**Problem:** A decorator that adds preconditions (e.g., throws when the inner component wouldn't) violates the Liskov Substitution Principle and surprises callers who expect the base behaviour.

**BAD:**

```cpp
struct Encoder {
    virtual std::string encode(std::string_view input) const {
        return std::string(input);  // base: identity
    }
    virtual ~Encoder() = default;
};

struct StrictEncoder : Encoder {
    std::string encode(std::string_view input) const override {
        if (input.empty())
            throw std::invalid_argument("empty input not allowed");  // new precondition!
        return std::string(input);
    }
};
```

**Why it fails:** Callers that hold an `Encoder&` and never check for exceptions (because the base never throws) will be surprised. LSP says a subtype must be usable wherever the base is usable.

**GOOD — the decorator must honour the base contract:**

```cpp
struct StrictEncoder : Encoder {
    std::string encode(std::string_view input) const override {
        // Weaker precondition or same — handle empty gracefully
        if (input.empty()) return {};
        return std::string(input);
    }
};
```

**Detection tip:** Review every `override` method for added preconditions (new `throw`s, new asserts, new range checks not present in the base).

### Pitfall 5 — Command Lambdas Capturing by Reference Incorrectly

**Problem:** A command lambda captures a local variable by reference; the command outlives the variable.

**BAD:**

```cpp
std::function<void()> make_command() {
    int value = 42;
    return [&value]{ std::printf("value = %d\n", value); };  // dangling reference!
}

auto cmd = make_command();
cmd();  // undefined behaviour — value is gone
```

**Why it fails:** `value` lives on the stack of `make_command`. When the function returns, that stack frame is gone. The lambda's `&value` reference is dangling.

**GOOD — capture by value for command payloads:**

```cpp
std::function<void()> make_command() {
    int value = 42;
    return [value]{ std::printf("value = %d\n", value); };  // captured by value
}

auto cmd = make_command();
cmd();   // 42 — correct
```

**Detection tip:** Review command lambdas (those stored in containers or returned from functions) for `[&]` captures. Replace with `[=]` or explicit by-value captures for all state that must persist beyond the current scope.

### Pitfall 6 — Pattern Applied Where a Simple Function Suffices

**Problem:** Creating a full Strategy class hierarchy for a single algorithm that never changes, adding classes with no benefit.

**BAD:**

```cpp
struct IValidator {
    virtual bool validate(int v) const = 0;
    virtual ~IValidator() = default;
};

struct PositiveValidator : IValidator {
    bool validate(int v) const override { return v > 0; }
};

class Form {
    std::unique_ptr<IValidator> validator_ = std::make_unique<PositiveValidator>();
public:
    bool submit(int v) { return validator_->validate(v); }
};
```

**Why it fails:** `PositiveValidator` is the only validator and there is no requirement to swap it. The pattern adds two extra types, a virtual call, and heap allocation for zero design benefit.

**GOOD — use a plain function or `std::function` only when variance is real:**

```cpp
class Form {
    std::function<bool(int)> validator_;
public:
    explicit Form(std::function<bool(int)> v = [](int x){ return x > 0; })
        : validator_{std::move(v)} {}

    bool submit(int v) { return validator_(v); }
};

// Use the default or inject a test-specific validator:
Form f([](int x){ return x >= 0; });  // non-negative for tests
```

**Detection tip:** Before creating a new interface + concrete class, ask: "Is this algorithm ever going to be different?" If the answer is "maybe someday", prefer a `std::function` member. If "no", use a free function.

## Code Example

```cpp
#include <iostream>
#include <memory>
#include <string>

class Logger {
  public:
    virtual ~Logger() = default;
    virtual void log(const std::string& message) const = 0;
};

class ConsoleLogger : public Logger {
  public:
    void log(const std::string& message) const override { std::cout << "[console] " << message << "\n"; }
};

std::unique_ptr<Logger> make_logger() {
    return std::make_unique<ConsoleLogger>();
}

int main() {
    auto logger = make_logger();
    std::cout << "Day 17 - Design Patterns OOP\n";
    logger->log("factory-created logger");
    return 0;
}
```
