Design Patterns for Modern C++ OOP
===================================

Motivation — Why Patterns Matter (and When They Don't)
-------------------------------------------------------

The Gang of Four (GoF) book catalogued 23 recurring solutions to common OOP
design problems in 1994. Many of those solutions were written around the
limitations of C++98: no lambdas, no ``std::function``, no type deduction.
Modern C++ lets you express the same *intent* with far less boilerplate — but
the underlying *design insight* is just as valuable.

A pattern is a **name** for a recurring design decision, not a prescription
for how many classes to create. Knowing the names lets teams communicate:
"this is an Observer", "this violates Strategy", without writing paragraphs.

When patterns become over-engineering:

* You have one implementation today and no concrete reason to expect another.
* The extra abstraction layer doubles the call depth without adding testability.
* The pattern was chosen because it sounds impressive, not because it solves a
  real changeability problem.

Rule of thumb: **introduce a pattern when the pain it solves already exists**,
not in anticipation of hypothetical future pain.

GoF Pattern Overview
---------------------

::

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

This day covers five patterns most relevant to C++ OOP: Factory Method,
Observer, Strategy, Decorator, and Command.

Factory Method
---------------

**Intent:** Define an interface for creating an object, but let subclasses (or
a factory function) decide which class to instantiate. Decouples creation from
usage.

**Classic OOP problem:** A ``Logger`` factory that must choose between
``FileLogger``, ``ConsoleLogger``, and ``SyslogLogger`` based on configuration.

**Modern C++ implementation using ``std::unique_ptr`` and a registry map:**

.. code-block:: cpp

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

Usage:

.. code-block:: cpp

  register_default_loggers();
  auto logger = LoggerFactory::instance().create("console");
  logger->log("Hello, factory!");

**Tradeoff:** The registry approach is open for extension (new types can
register without touching existing code — OCP), but it uses runtime
``std::string`` lookup. If performance matters and the set of types is fixed,
prefer a ``switch`` on an enum or a template factory.

Observer
---------

**Intent:** Define a one-to-many dependency so that when one object changes
state, all dependents are notified automatically.

**Modern C++ implementation without virtual inheritance — using ``std::function``:**

.. code-block:: cpp

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

**Compared to GoF virtual Observer:** The ``std::function`` version requires no
``IObserver`` base class, no raw pointer management, and supports lambdas,
member functions (via ``std::bind`` or a capturing lambda), and free functions.

**Tradeoff:** ``std::function`` incurs a small heap allocation per handler
(unless SBO fits). For hot paths, use a ``std::vector`` of function pointers or
a compile-time observer list via CRTP (see Day 20).

Strategy
---------

**Intent:** Define a family of algorithms, encapsulate each one, and make them
interchangeable. The context delegates work to the strategy.

**Modern C++ — strategy as a template parameter (zero-overhead) or as
``std::function`` (runtime-switchable):**

.. code-block:: cpp

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

Decorator
----------

**Intent:** Attach additional responsibilities to an object dynamically.
Decorators provide a flexible alternative to subclassing for extending
functionality.

**Modern C++ — decorator chain with ``unique_ptr`` composition:**

.. code-block:: cpp

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

**Functional alternative:** For stateless decorators, ``std::function`` chaining
is simpler and avoids heap allocation:

.. code-block:: cpp

  using Transform = std::function<std::string(std::string)>;

  auto upper  = [](std::string s){ std::ranges::transform(s, s.begin(), ::toupper); return s; };
  auto trim   = [](std::string s){ /* trim */ return s; };

  // Compose transforms
  Transform pipeline = [=](std::string s){ return trim(upper(std::move(s))); };
  std::puts(pipeline("  hello  ").c_str());

Command
--------

**Intent:** Encapsulate a request as an object, allowing parameterisation of
clients with different requests, queuing, logging, and undo.

**Modern C++ — command as a callable (``std::function``) with undo support:**

.. code-block:: cpp

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

**Tradeoff vs classic GoF:** No ``ICommand`` hierarchy, no virtual methods, no
concrete command subclasses. The lambda pair is concise but the undo lambda
captures state by reference — ensure the referenced objects outlive the command.

Pattern Comparison and When to Use Each
-----------------------------------------

+--------------------+--------------------------------+---------------------------+
| Pattern            | Use when                       | Avoid when                |
+====================+================================+===========================+
| Factory Method     | Creation logic must vary or    | Only one type ever, or    |
|                    | be decoupled from usage        | ``new T()`` is fine       |
+--------------------+--------------------------------+---------------------------+
| Observer           | Multiple parties react to      | One listener and no plans |
|                    | events in a decoupled way      | to add more               |
+--------------------+--------------------------------+---------------------------+
| Strategy           | Algorithm must be swappable    | Only one algorithm; a     |
|                    | at runtime or per-instance     | simple ``if`` suffices    |
+--------------------+--------------------------------+---------------------------+
| Decorator          | Combine behaviours dynamically | Inheritance is simpler    |
|                    | without class explosion        | and the combination set   |
|                    |                                | is fixed and small        |
+--------------------+--------------------------------+---------------------------+
| Command            | Need undo, queuing, or         | Simple one-shot call;     |
|                    | transactional operations       | no undo/replay required   |
+--------------------+--------------------------------+---------------------------+

Self-Check Questions
---------------------

**Q1. How does the modern C++ Factory with a registry map satisfy OCP?**

New product types register themselves without modifying the factory class.
Adding a ``NetworkLogger`` means writing its registration call; the
``LoggerFactory`` class itself is never touched.

**Q2. Why prefer ``std::function``-based Observer over a virtual ``IObserver``?**

``std::function`` accepts any callable (lambda, member function, free
function) without requiring the observer to inherit from a base class. This
reduces coupling and allows inline handlers. The cost is a small allocation per
handler; if that matters, use a typed callback array.

**Q3. When is the compile-time Strategy (template parameter) better than the
runtime Strategy (``std::function``)?**

When the strategy is known at compile time (e.g., chosen at the call site or
by a type alias), the template version is zero-overhead: the compiler inlines
the strategy body and avoids indirect calls. Use ``std::function`` only when
the strategy must be selected at runtime (e.g., read from configuration).

**Q4. What is the key difference between Decorator and Inheritance for adding
behaviour?**

Inheritance adds behaviour at compile time and applies it to all instances of a
subtype. Decorator adds behaviour at runtime, per-object, and allows arbitrary
combinations without a subclass for every combination. Ten boolean flags that
could be on/off independently would require 1024 subclasses via inheritance but
only 10 decorator classes plus composition.

**Q5. What risk exists with the lambda-pair Command pattern and how is it
mitigated?**

The lambdas typically capture references to state in the calling context. If
the referenced objects are destroyed before ``undo()`` is called the program has
undefined behaviour. Mitigate by capturing by value for small state, using
``shared_ptr`` for heap-allocated state, or limiting command lifetime to a
well-defined scope (e.g., a transaction object).
