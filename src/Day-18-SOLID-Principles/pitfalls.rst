Pitfalls — Day 18: SOLID Principles
=====================================

Pitfall 1 — God Class Violating SRP
-------------------------------------

**Problem:** A single class accumulates responsibilities over time until it
becomes a central hub that every other class depends on.

**BAD:**

.. code-block:: cpp

  class Application {
  public:
      void load_config(const std::string& path);   // config management
      void connect_database();                      // persistence
      void start_http_server(int port);             // networking
      void render_dashboard();                      // UI
      void log(const std::string& msg);             // logging
      void send_alert_email(const std::string& to); // email
  };

**Why it fails:** Six unrelated actors (DevOps, DBA, frontend, backend,
sysadmin) all force changes to ``Application``. Every change recompiles code
for all six concerns. Testing any single concern requires the entire ``Application``
to be constructed.

**GOOD — extract into single-responsibility components:**

.. code-block:: cpp

  class ConfigLoader   { public: Config  load(const std::string& path); };
  class DatabasePool   { public: Conn    connect(const Config&); };
  class HttpServer     { public: void    start(int port, RequestHandler&); };
  class Dashboard      { public: void    render(const AppState&); };
  class Logger         { public: void    log(std::string_view msg); };
  class AlertMailer    { public: void    send(std::string_view to, std::string_view body); };

**Detection tip:** Count public methods. More than 7–10 methods doing
unrelated things is a strong SRP smell. Also look for ``and`` in the class
name: ``UserManagerAndFormatter``.

Pitfall 2 — Using ``dynamic_cast`` as a Workaround for LSP Violations
----------------------------------------------------------------------

**Problem:** Code that ``dynamic_cast``s a base pointer to a specific derived
type to call methods that should be on the base interface.

**BAD:**

.. code-block:: cpp

  struct Animal {
      virtual void move() = 0;
      virtual ~Animal() = default;
  };

  struct Bird  : Animal { void move() override { /* fly */ } void sing() {} };
  struct Fish  : Animal { void move() override { /* swim */ } };

  void process(Animal& a) {
      a.move();
      // Special-case Bird — this is an LSP warning sign
      if (auto* b = dynamic_cast<Bird*>(&a))
          b->sing();
  }

**Why it fails:** ``process`` now depends on the concrete type ``Bird``, not
just the ``Animal`` abstraction. Adding a new singing type (``Parrot``) means
editing ``process``. This pattern grows into an if-chain of ``dynamic_cast``s.

**GOOD — put the discriminating behaviour on the interface:**

.. code-block:: cpp

  struct Animal {
      virtual void move() = 0;
      virtual void make_sound() {}   // default: silent — override if applicable
      virtual ~Animal() = default;
  };

  struct Bird : Animal {
      void move()        override { /* fly */ }
      void make_sound()  override { /* sing */ }
  };

  void process(Animal& a) {
      a.move();
      a.make_sound();   // polymorphic — no cast needed
  }

**Detection tip:** Any ``dynamic_cast`` inside a function that takes a base
reference is worth questioning. Most can be replaced by virtual dispatch.

Pitfall 3 — Violating OCP by Editing a Switch on Type Tags
----------------------------------------------------------

**Problem:** Using an enum or integer type tag to dispatch behaviour, forcing
modification of multiple switch statements every time a new type is added.

**BAD:**

.. code-block:: cpp

  enum class PaymentType { CreditCard, PayPal, Bitcoin };

  double calculate_fee(PaymentType t, double amount) {
      switch (t) {
          case PaymentType::CreditCard: return amount * 0.02;
          case PaymentType::PayPal:     return amount * 0.025 + 0.30;
          case PaymentType::Bitcoin:    return amount * 0.01;
      }
      return 0;  // Adding a new payment type means editing this switch
  }

**Why it fails:** There may be five other switch statements (``process()``,
``validate()``, ``format_receipt()``…) all requiring the same edit when
``Stripe`` is added. Each site is a potential miss.

**GOOD — each payment type owns its behaviour:**

.. code-block:: cpp

  struct IPaymentMethod {
      virtual double fee(double amount) const = 0;
      virtual ~IPaymentMethod() = default;
  };

  struct CreditCard : IPaymentMethod {
      double fee(double amount) const override { return amount * 0.02; }
  };

  struct PayPal : IPaymentMethod {
      double fee(double amount) const override { return amount * 0.025 + 0.30; }
  };

  // Adding Stripe requires NO change to existing classes
  struct Stripe : IPaymentMethod {
      double fee(double amount) const override { return amount * 0.015 + 0.25; }
  };

  double calculate_fee(const IPaymentMethod& m, double amount) {
      return m.fee(amount);   // closed for modification, open for extension
  }

**Detection tip:** Search for ``switch`` on an enum type. If the enum grows
over time, OCP is being violated.

Pitfall 4 — ISP: Implementing Interface Methods with ``throw`` or Empty Stubs
-----------------------------------------------------------------------------

**Problem:** An interface is too broad, so implementors are forced to stub out
irrelevant methods, often by throwing or silently doing nothing.

**BAD:**

.. code-block:: cpp

  struct IWorker {
      virtual void work()   = 0;
      virtual void eat()    = 0;
      virtual void sleep()  = 0;
      virtual ~IWorker() = default;
  };

  struct Robot : IWorker {
      void work()  override { /* do work */ }
      void eat()   override { throw std::logic_error("robots don't eat"); } // stub!
      void sleep() override { /* noop */ }  // silent stub
  };

**Why it fails:** A caller that calls ``eat()`` on an ``IWorker`` and gets an
exception or a silent no-op has no way of knowing this at compile time. The
interface lies about what all implementors support.

**GOOD — segregate the interface:**

.. code-block:: cpp

  struct IWorkable { virtual void work()  = 0; virtual ~IWorkable()  = default; };
  struct IFeedable  { virtual void eat()   = 0; virtual ~IFeedable()   = default; };
  struct ISleepable { virtual void sleep() = 0; virtual ~ISleepable() = default; };

  struct Human : IWorkable, IFeedable, ISleepable {
      void work()  override {}
      void eat()   override {}
      void sleep() override {}
  };

  struct Robot : IWorkable {
      void work()  override {}
      // Robot doesn't implement IFeedable or ISleepable — clean absence
  };

**Detection tip:** Review every virtual method override that is either empty
or immediately throws. These are ISP violations waiting to cause bugs.

Pitfall 5 — DIP Violation: Constructing Dependencies Inside the Class
--------------------------------------------------------------------

**Problem:** A high-level class creates its own low-level dependencies with
``new`` or by calling a concrete constructor, making it impossible to substitute
for testing or configuration.

**BAD:**

.. code-block:: cpp

  class EmailNotifier {
      SmtpClient client_{"smtp.example.com", 587};   // hardcoded concrete
  public:
      void notify(const std::string& msg) {
          client_.send("alerts@example.com", msg);
      }
  };

**Why it fails:** ``EmailNotifier`` cannot be tested without a live SMTP
server. The hostname and port are baked in. Switching to SendGrid requires
modifying ``EmailNotifier``.

**GOOD — inject the transport abstraction:**

.. code-block:: cpp

  struct IMailTransport {
      virtual void send(std::string_view to, std::string_view body) = 0;
      virtual ~IMailTransport() = default;
  };

  class EmailNotifier {
      IMailTransport& transport_;   // injected — no concrete dependency
  public:
      explicit EmailNotifier(IMailTransport& t) : transport_{t} {}
      void notify(const std::string& msg) {
          transport_.send("alerts@example.com", msg);
      }
  };

  // Test:
  struct NullTransport : IMailTransport {
      void send(std::string_view, std::string_view) override {}
  };

  NullTransport null;
  EmailNotifier notifier{null};   // testable without network

**Detection tip:** Look for ``new SomeConcreteClass`` or
``SomeConcreteClass concrete{...}`` as member initialisers in high-level
classes. Every such construction is a DIP violation candidate.

Pitfall 6 — Applying SOLID Prematurely to Simple Code
-----------------------------------------------------

**Problem:** Wrapping a simple function in four layers of interface and
abstraction "because SOLID", adding accidental complexity for no changeability
benefit.

**BAD over-engineering:**

.. code-block:: cpp

  struct IGreeter { virtual std::string greet(const std::string&) = 0; };
  struct FormalGreeter : IGreeter {
      std::string greet(const std::string& n) override { return "Good day, " + n; }
  };
  struct GreeterFactory {
      static std::unique_ptr<IGreeter> create() {
          return std::make_unique<FormalGreeter>();
      }
  };
  // All of this for a single greeting that never changes

**Why it fails:** The complexity budget is wasted. Teammates spend time
navigating three files and four classes to understand ``"Good day, " + name``.

**GOOD — keep it simple until variability is real:**

.. code-block:: cpp

  std::string greet(std::string_view name) {
      return std::string("Good day, ") + std::string(name);
  }

  // If multiple greetings become real: then introduce an abstraction
  using Greeter = std::function<std::string(std::string_view)>;

**Detection tip:** Before introducing an interface, ask: "What are the two or
more concrete implementations I have today?" If the answer is "just one",
wait until the second real implementation arrives.
