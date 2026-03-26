Pitfalls — Day 17: Design Patterns OOP
=======================================

Pitfall 1 — Singleton as a Global Variable Disguise
----------------------------------------------------

**Problem:** Implementing Singleton to share global state rather than to
control unique instantiation. The result is a hidden dependency that makes
classes untestable.

**BAD:**

.. code-block:: cpp

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

**Why it fails:** ``OrderProcessor`` cannot be tested without the global
``Config`` being in a specific state. Tests interfere with each other because
they share the same singleton. It is impossible to swap a test stub.

**GOOD — inject the dependency:**

.. code-block:: cpp

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

**Detection tip:** Any class calling ``::instance()`` that is not itself a
factory or registry is probably abusing Singleton as global state.

Pitfall 2 — Observer with Dangling Pointer
------------------------------------------

**Problem:** Registering a raw observer pointer and not unregistering before
the observer is destroyed.

**BAD:**

.. code-block:: cpp

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

**Why it fails:** The pointer outlives the pointed-to object. ``fire()``
invokes a method through an invalid pointer — undefined behaviour.

**GOOD — use ``std::weak_ptr`` or explicit unsubscription:**

.. code-block:: cpp

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

**Detection tip:** Any ``std::vector<SomeBase*>`` used as a subscriber list
is a red flag. Use ``weak_ptr`` or a RAII unsubscription token.

Pitfall 3 — Strategy Stored by Raw Pointer
------------------------------------------

**Problem:** A context class stores its strategy as a raw ``IStrategy*``,
creating unclear ownership semantics.

**BAD:**

.. code-block:: cpp

  struct ISortStrategy { virtual void sort(std::vector<int>&) = 0; };

  class DataPipeline {
  public:
      void set_strategy(ISortStrategy* s) { strategy_ = s; }  // who owns s?
      void run(std::vector<int>& v) { strategy_->sort(v); }
  private:
      ISortStrategy* strategy_ = nullptr;  // raw pointer — UB if strategy destroyed first
  };

**Why it fails:** There is no clear owner. If the strategy is stack-allocated
and the pipeline outlives the scope, calling ``run()`` is undefined behaviour.

**GOOD — use ``std::unique_ptr`` for owned strategies or reference for borrowed:**

.. code-block:: cpp

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

**Detection tip:** Review every raw pointer member that is assigned from
outside the class. The ownership policy should be encoded in the type
(``unique_ptr``, ``shared_ptr``, or a reference with documented lifetime).

Pitfall 4 — Decorator Breaking the Substitution Principle
----------------------------------------------------------

**Problem:** A decorator that adds preconditions (e.g., throws when the inner
component wouldn't) violates the Liskov Substitution Principle and surprises
callers who expect the base behaviour.

**BAD:**

.. code-block:: cpp

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

**Why it fails:** Callers that hold an ``Encoder&`` and never check for
exceptions (because the base never throws) will be surprised. LSP says a
subtype must be usable wherever the base is usable.

**GOOD — the decorator must honour the base contract:**

.. code-block:: cpp

  struct StrictEncoder : Encoder {
      std::string encode(std::string_view input) const override {
          // Weaker precondition or same — handle empty gracefully
          if (input.empty()) return {};
          return std::string(input);
      }
  };

**Detection tip:** Review every ``override`` method for added preconditions
(new ``throw``s, new asserts, new range checks not present in the base).

Pitfall 5 — Command Lambdas Capturing by Reference Incorrectly
--------------------------------------------------------------

**Problem:** A command lambda captures a local variable by reference; the
command outlives the variable.

**BAD:**

.. code-block:: cpp

  std::function<void()> make_command() {
      int value = 42;
      return [&value]{ std::printf("value = %d\n", value); };  // dangling reference!
  }

  auto cmd = make_command();
  cmd();  // undefined behaviour — value is gone

**Why it fails:** ``value`` lives on the stack of ``make_command``. When the
function returns, that stack frame is gone. The lambda's ``&value`` reference
is dangling.

**GOOD — capture by value for command payloads:**

.. code-block:: cpp

  std::function<void()> make_command() {
      int value = 42;
      return [value]{ std::printf("value = %d\n", value); };  // captured by value
  }

  auto cmd = make_command();
  cmd();   // 42 — correct

**Detection tip:** Review command lambdas (those stored in containers or
returned from functions) for ``[&]`` captures. Replace with ``[=]`` or
explicit by-value captures for all state that must persist beyond the current
scope.

Pitfall 6 — Pattern Applied Where a Simple Function Suffices
------------------------------------------------------------

**Problem:** Creating a full Strategy class hierarchy for a single algorithm
that never changes, adding classes with no benefit.

**BAD:**

.. code-block:: cpp

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

**Why it fails:** ``PositiveValidator`` is the only validator and there is no
requirement to swap it. The pattern adds two extra types, a virtual call, and
heap allocation for zero design benefit.

**GOOD — use a plain function or ``std::function`` only when variance is real:**

.. code-block:: cpp

  class Form {
      std::function<bool(int)> validator_;
  public:
      explicit Form(std::function<bool(int)> v = [](int x){ return x > 0; })
          : validator_{std::move(v)} {}

      bool submit(int v) { return validator_(v); }
  };

  // Use the default or inject a test-specific validator:
  Form f([](int x){ return x >= 0; });  // non-negative for tests

**Detection tip:** Before creating a new interface + concrete class, ask: "Is
this algorithm ever going to be different?" If the answer is "maybe someday",
prefer a ``std::function`` member. If "no", use a free function.
