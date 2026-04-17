# Day 07: Virtual, Override, Final, and Abstract Classes

## Why This Day Matters

Pure virtual functions, abstract classes, and the Non-Virtual Interface idiom are the tools you
use to design stable, extensible APIs. After this day you will be able to define interfaces that
force correct implementation by derived classes, enforce invariants that no override can bypass,
and make deliberate decisions about when to seal a class and when to leave it open.

## Learning Outcomes

By the end of this day you will be able to:

* Write an abstract base class with pure virtual functions and explain why it cannot be
  instantiated.
* Apply `override` to every overriding function and describe the compiler check it enables.
* Choose when `final` is appropriate on a class or method and explain the devirtualisation
  benefit.
* Implement the NVI idiom and explain how it enforces invariants that derived classes cannot
  bypass.
* Write covariant return types in clone/factory patterns to eliminate `dynamic_cast` at call
  sites.
* Explain the virtual destructor requirement and apply it to every abstract base class.
* Identify a situation where `std::variant` + `std::visit` is a better alternative to
  virtual dispatch.

## Key Concepts

* **Pure virtual function (`= 0`)** — mandates that derived classes provide an implementation;
  makes the class abstract (not instantiable directly).
* **Abstract base class** — a class with at least one pure virtual function; models a protocol
  or interface.
* **`override`** — compiler-checked annotation that the function signature matches a base
  virtual; prevents silent function hiding.
* **`final` (class)** — seals the class against further derivation; enables compiler
  devirtualisation.
* **`final` (method)** — prevents further override in derived classes; useful to lock down a
  specific override in the middle of a hierarchy.
* **NVI idiom** — public non-virtual wrapper calls protected/private virtual hooks; guarantees
  pre/post processing runs for every invocation.
* **Covariant return types** — override can return a more-derived pointer/reference; eliminates
  casts in clone and factory patterns.

## Theory

### Why This Day Matters

Day 06 introduced virtual functions for polymorphism. Day 07 goes deeper: pure virtual functions
to mandate derived class behaviour, abstract base classes as pure interface contracts,
`final` to seal classes and optimise virtual calls, covariant return types, and the
Non-Virtual Interface idiom that separates interface from implementation. This day also addresses
the question of when virtual dispatch is too expensive and what the alternatives are.

### Pure Virtual Functions and Abstract Classes

A **pure virtual function** has no implementation in the base class; any derived class must
provide one. A class with at least one pure virtual function is **abstract** — you cannot
instantiate it directly.

```cpp
class Renderer {
public:
    // Pure virtual: derived classes MUST implement these
    virtual void clear(int colour) = 0;
    virtual void draw_rect(int x, int y, int w, int h) = 0;
    virtual void present() = 0;

    // Virtual destructor: mandatory for polymorphic base classes
    virtual ~Renderer() = default;

    // Non-pure virtual: has a default; derived classes MAY override
    virtual std::string name() const { return "Renderer"; }
};

// Renderer r;  // ERROR: cannot instantiate abstract class

class OpenGLRenderer : public Renderer {
public:
    void clear(int colour) override { /* GL calls */ }
    void draw_rect(int x, int y, int w, int h) override { /* GL calls */ }
    void present() override { /* swap buffers */ }
    std::string name() const override { return "OpenGL"; }
};

class NullRenderer : public Renderer {
public:
    void clear(int)                     override {}
    void draw_rect(int,int,int,int)     override {}
    void present()                      override {}
    std::string name() const override { return "Null"; }
};
```

**When to use abstract classes:**

* To define a protocol that all implementations must follow (interfaces)
* To enforce that a class is never used as a concrete type — only as a base
* As "role" types in design patterns (Strategy, Observer, Command)

#### Providing a Default Implementation for Pure Virtual Functions

Pure virtual functions *can* have a body, but derived classes must still override them. This is
useful for providing a fallback callable by explicit scope.

```cpp
class Logger {
public:
    virtual void log(const std::string& msg) = 0;
    virtual ~Logger() = default;
};

// Provide a default body — callable explicitly, but still forces override
void Logger::log(const std::string& msg) {
    std::cerr << "[DEFAULT] " << msg << '\n';
}

class FileLogger : public Logger {
public:
    void log(const std::string& msg) override {
        Logger::log(msg);    // call base body explicitly if desired
        file_ << msg << '\n';
    }
private:
    std::ofstream file_;
};
```

### Interface Design Principles

An interface in C++ is an abstract class with only pure virtual functions and a virtual
destructor — no data members, no non-pure virtual functions.

```cpp
// Clean interface: all pure virtual, no data
class ISerializable {
public:
    virtual std::string serialize() const = 0;
    virtual void deserialize(const std::string& data) = 0;
    virtual ~ISerializable() = default;
};

class IDrawable {
public:
    virtual void draw(Canvas& canvas) const = 0;
    virtual ~IDrawable() = default;
};

// A concrete class can implement multiple interfaces
class Sprite : public IDrawable, public ISerializable {
public:
    void draw(Canvas& c)       const override { /* ... */ }
    std::string serialize()    const override { /* ... */ }
    void deserialize(const std::string& d)  override { /* ... */ }
};
```

**Guideline:** Keep interfaces narrow. An interface with 20 pure virtual functions is hard to
mock and hard to implement. Prefer several small interfaces (Interface Segregation Principle).

### `final` — Sealing Classes and Methods

`final` on a class prevents further inheritance. `final` on a virtual method prevents
further overriding in derived classes.

```cpp
// final on a class
class ConcreteLogger final : public Logger {
public:
    void log(const std::string& msg) override { /* ... */ }
};

// class VerboseLogger : public ConcreteLogger {};  // ERROR: ConcreteLogger is final

// final on a virtual method
class Base {
public:
    virtual void render() {}
};

class Intermediate : public Base {
public:
    void render() override final {}  // no further override allowed
};

class Leaf : public Intermediate {
public:
    // void render() override {}  // ERROR: render() is final in Intermediate
};
```

**Performance benefit of `final`:**

When the compiler can prove that a class is final (no subclasses can exist), it can devirtualise
virtual calls — turning them into direct calls and enabling inlining. This is one of the few
cases where `final` provides a measurable performance benefit.

```cpp
// Devirtualisation: the compiler knows no subclass of ConcreteLogger exists,
// so this call can be turned into a direct call to ConcreteLogger::log.
void use(ConcreteLogger& logger) {
    logger.log("hello");  // devirtualised — direct call, inlineable
}
```

### Virtual Destructor Requirement

A class used as a polymorphic base must have a virtual destructor. This ensures the correct
destructor chain is called when deleting through a base pointer.

```cpp
class Plugin {
public:
    virtual void execute() = 0;
    virtual ~Plugin() = default;   // REQUIRED: virtual destructor

    // If Plugin had no virtual destructor and you did:
    // Plugin* p = new ConcretePlugin{};
    // delete p;   // UB: only Plugin::~Plugin() would run
};

// For classes with = default destructor and only pure virtual functions,
// the virtual destructor can also be pure virtual — but must have a body:
class AbstractBase {
public:
    virtual ~AbstractBase() = 0;   // pure virtual destructor
};
AbstractBase::~AbstractBase() {}   // body required — called at the end of destruction chain
```

**Rule:** If a class has any virtual function, give it a `virtual ~ClassName() = default`
destructor. No exception.

### Covariant Return Types

A derived class override may return a pointer or reference to a class that is derived from the
return type of the base class function. This allows factory methods to return the most-derived
type without forcing the caller to use `dynamic_cast`.

```cpp
class Shape {
public:
    virtual Shape* clone() const = 0;   // base return type
    virtual ~Shape() = default;
};

class Circle : public Shape {
public:
    Circle* clone() const override {    // covariant: Circle* is-a Shape*
        return new Circle{*this};
    }
};

Circle c;
Circle* c2 = c.clone();   // no cast needed — return type is already Circle*
Shape*  s2 = c.clone();   // also valid (implicit upcast)
```

Covariant return types only work with pointers and references, not value types.

### The Non-Virtual Interface (NVI) Idiom

NVI separates the interface (public, non-virtual) from the implementation hooks (protected or
private, virtual). The public non-virtual function performs pre/post-processing and calls the
virtual hook.

```cpp
class DataProcessor {
public:
    // Non-virtual public interface — stable, cannot be bypassed
    void process(const std::vector<int>& data) {
        validate(data);          // pre-condition: always enforced
        do_process(data);        // virtual hook: derived class customisation
        log_completion();        // post-condition: always enforced
    }

    virtual ~DataProcessor() = default;

protected:
    virtual void do_process(const std::vector<int>& data) = 0;

private:
    void validate(const std::vector<int>& data) {
        if (data.empty()) throw std::invalid_argument{"empty data"};
    }
    void log_completion() {
        std::cout << "Processing complete\n";
    }
};

class SortProcessor : public DataProcessor {
protected:
    void do_process(const std::vector<int>& data) override {
        // Derived class only implements the custom part
        // validate() and log_completion() are guaranteed to run
        auto copy = data;
        std::sort(copy.begin(), copy.end());
    }
};
```

**Benefits of NVI:**

* The base class can enforce pre/post conditions that derived classes cannot bypass.
* The public interface is stable — you can add pre/post behaviour in the base without touching
  any derived class.
* Derived classes focus only on the customisation point, not boilerplate.

### Avoiding Virtual in Hot Paths

Virtual dispatch has two costs: an indirect call (one pointer dereference) and inhibited
inlining. For hot loops (millions of calls per second), this matters.

Alternatives:

* **`final` + devirtualisation** — if the object type is statically known and the class is
  final, the compiler devirtualises automatically.
* **CRTP (Day 20)** — Curiously Recurring Template Pattern: compile-time polymorphism with
  zero dispatch overhead.
* **`std::variant` + `std::visit`** — closed set of types; compile-time dispatch;
  cache-friendly value semantics.
* **Function pointers in a struct** — manual vtable for C-compatible APIs.

```cpp
// std::variant: closed set, cache-friendly, no virtual overhead
#include <variant>

using AnyShape = std::variant<Circle, Rectangle, Triangle>;

double total_area(const std::vector<AnyShape>& shapes) {
    double total{0.0};
    for (const auto& s : shapes) {
        total += std::visit([](const auto& shape) { return shape.area(); }, s);
    }
    return total;
}
// No vtable, no heap indirection — shapes stored inline in the variant
```

### Summary: virtual keywords at a glance

| Keyword | Effect |
|---|---|
| `virtual` | Enables runtime dispatch via vtable |
| `= 0` | Makes function pure virtual; class abstract |
| `override` | Verifies signature matches a base virtual |
| `final` (class) | Prevents further derivation |
| `final` (func) | Prevents further override in derived classes |

## Pitfalls

### Pitfall 1: Forgetting `override` and Silently Creating a New Function

**Description:** Intending to override a base class virtual function but having a slightly
different signature. Without `override`, the compiler silently treats it as a new function.
The base's virtual is not overridden — polymorphic dispatch calls the base version.

**BAD code:**

```cpp
#include <iostream>
#include <memory>

class Logger {
public:
    virtual void log(const std::string& msg) const {
        std::cout << "[BASE] " << msg << '\n';
    }
    virtual ~Logger() = default;
};

class FileLogger : public Logger {
public:
    // Accidental signature mismatch: missing const
    void log(const std::string& msg) {   // NOT an override — new function!
        std::cout << "[FILE] " << msg << '\n';
    }
};

int main() {
    std::unique_ptr<Logger> logger = std::make_unique<FileLogger>();
    logger->log("test");   // calls Logger::log — [BASE] test
                           // FileLogger::log is never called through the base pointer
}
```

**Why it fails:** `Logger::log` is `const`; `FileLogger::log` is non-`const`. They
have different signatures, so `FileLogger::log` is an entirely new (non-virtual) function
that hides the base's virtual. Through a `Logger*`, only `Logger::log` is visible.

**GOOD code:**

```cpp
class FileLogger : public Logger {
public:
    void log(const std::string& msg) const override {  // override checks the signature
        std::cout << "[FILE] " << msg << '\n';
    }
};

// If you had written:
// void log(const std::string& msg) override { ... }
// The compiler would error: "does not override any virtual function"
// — catching the mistake at compile time.
```

**Detection tip:** Enable `-Wsuggest-override` (GCC/Clang). The `modernize-use-override`
clang-tidy check adds `override` to all overriding functions automatically. Make it a policy:
every function in a derived class that overrides a virtual must have `override`.

### Pitfall 2: Marking a Class `final` Prematurely

**Description:** Marking a class `final` as a premature optimisation or "just in case", before
understanding whether future extension is needed. This closes off legitimate extensibility and
forces callers to duplicate code when they need to customise behaviour.

**BAD code:**

```cpp
// Library code shipped as final — no justification for sealing it
class HttpClient final {
public:
    virtual void send_request(const Request& r) { /* real HTTP */ }
    virtual ~HttpClient() = default;
};

// Test code: cannot create a mock/stub without modifying the library
// class MockHttpClient : public HttpClient {};  // ERROR: HttpClient is final

// This forces test code to use the real HTTP stack — untestable in isolation
```

**Why it fails:** `final` prevents test doubles (mocks, stubs, fakes) from being created by
inheriting. Libraries that are `final` by default are hostile to testing and to users who need
to adapt behaviour.

**GOOD code:**

```cpp
// Abstract interface: fully mockable
class IHttpClient {
public:
    virtual void send_request(const Request& r) = 0;
    virtual ~IHttpClient() = default;
};

// Concrete implementation — final only if there is a specific reason
class HttpClient : public IHttpClient {
public:
    void send_request(const Request& r) override { /* real HTTP */ }
};

// Test code: mock without touching the library
class MockHttpClient : public IHttpClient {
public:
    void send_request(const Request& r) override { /* record call */ }
};
```

**Correct use of `final`:** Apply it when you have profiled a performance bottleneck and
devirtualisation will help, or when the semantics of the class genuinely must not be extended
(e.g., a cryptographic key type where any override would break security guarantees).

### Pitfall 3: Abstract Base with Non-Virtual Destructor

**Description:** Defining an abstract base class (with pure virtual functions) but forgetting
to declare the destructor virtual. Deleting a derived object through a base pointer is
undefined behaviour.

**BAD code:**

```cpp
class IPlugin {
public:
    virtual void run() = 0;
    // ~IPlugin() not declared — compiler generates a non-virtual destructor
};

class AudioPlugin : public IPlugin {
public:
    AudioPlugin() : buffer_{new float[4096]} {}
    void run() override { /* process audio */ }
    ~AudioPlugin() { delete[] buffer_; }  // cleans up buffer
private:
    float* buffer_;
};

IPlugin* p = new AudioPlugin{};
p->run();
delete p;   // UB: non-virtual ~IPlugin() runs, ~AudioPlugin() does not
            // buffer_ is leaked (4096 * 4 bytes)
```

**Why it fails:** `delete p` resolves the destructor through the static type `IPlugin*`.
The compiler calls `IPlugin::~IPlugin()` (the non-virtual default). `AudioPlugin::~AudioPlugin`
never runs. The `buffer_` allocation is leaked. This is undefined behaviour, and the memory
leak is essentially guaranteed.

**GOOD code:**

```cpp
class IPlugin {
public:
    virtual void run() = 0;

    // Explicitly virtual: ensures the right destructor runs
    virtual ~IPlugin() = default;
};

// Or if you want to forbid deletion through the interface:
class IPluginNonOwning {
public:
    virtual void run() = 0;
protected:
    ~IPluginNonOwning() = default;   // non-virtual but protected: cannot delete through this ptr
};
```

**Detection tip:** `-Wnon-virtual-dtor` (included in `-Wall`) and `clang-tidy` check
`cppcoreguidelines-virtual-class-destructor` both catch this. Every abstract base class must
have `virtual ~ClassName() = default;`.

### Pitfall 4: Bypassing the NVI Contract by Making the Hook Public

**Description:** Using the NVI idiom but accidentally making the virtual hook `public` instead
of `protected`. Callers can then call the hook directly, bypassing the invariant-enforcing
wrapper.

**BAD code:**

```cpp
class Transaction {
public:
    void execute() {
        begin_transaction();
        do_execute();           // call virtual hook
        commit_transaction();
    }

    // Oops: hook is public — callers can bypass execute()
    virtual void do_execute() = 0;

    virtual ~Transaction() = default;

private:
    void begin_transaction()  { /* acquire DB lock */ }
    void commit_transaction() { /* release lock */   }
};

Transaction* t = new DebitTransaction{};
t->do_execute();   // bypasses begin/commit — no lock acquired, DB may be corrupted
```

**Why it fails:** `do_execute()` is the customisation point, not the contract. Making it
public allows callers to invoke it without the surrounding transaction machinery. The invariants
(lock acquisition, commit) are silently skipped.

**GOOD code:**

```cpp
class Transaction {
public:
    // Only this function is part of the public API
    void execute() {
        begin_transaction();
        do_execute();
        commit_transaction();
    }

    virtual ~Transaction() = default;

protected:
    // Customisation point: visible to derived classes, not to callers
    virtual void do_execute() = 0;

private:
    void begin_transaction()  { /* acquire DB lock */ }
    void commit_transaction() { /* release lock */   }
};

// External callers can only use transaction.execute() — invariants enforced
```

**Detection tip:** Review every `virtual` function in a base class. If it is `public` and
part of an NVI design, it should be `protected` (or `private`). The only public virtual
function in a well-designed NVI class is the destructor.

## Code Example

```cpp
#include <iostream>
#include <memory>

class Renderer {
  public:
    virtual ~Renderer() = default;
    virtual void draw() const = 0;
};

class TextRenderer final : public Renderer {
  public:
    void draw() const override { std::cout << "Rendering text\n"; }
};

int main() {
    std::unique_ptr<Renderer> renderer = std::make_unique<TextRenderer>();
    std::cout << "Day 07 - Virtual, Override, Final, Abstract\n";
    renderer->draw();
    return 0;
}
```
