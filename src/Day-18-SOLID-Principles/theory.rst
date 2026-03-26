SOLID Principles in Modern C++
================================

Motivation — Why SOLID?
------------------------

SOLID is an acronym for five object-oriented design principles articulated by
Robert C. Martin. They answer the question: "How do I structure my classes so
the system stays easy to change, test, and extend over its lifetime?"

Each principle names a distinct failure mode:

* SRP — classes that do too many things break for too many reasons.
* OCP — code that requires modification for every extension is fragile.
* LSP — subtypes that behave unexpectedly break polymorphic code silently.
* ISP — fat interfaces force clients to depend on methods they don't use.
* DIP — classes that reach up to concrete details are hard to test.

These principles are not rules to follow blindly. Applying them costs
abstraction complexity. The right time to apply them is when the failure mode
they prevent has already appeared, or when you are designing for a known axis of
change.

Single Responsibility Principle (SRP)
---------------------------------------

**A class should have only one reason to change.**

"Reason to change" maps to "actor" — the stakeholder who owns that
responsibility. If two unrelated stakeholders can both force a change to the
same class, it has multiple responsibilities.

**BAD — ``User`` class does user data, persistence, and formatting:**

.. code-block:: cpp

  class User {
  public:
      std::string name;
      std::string email;

      // Responsibility 1: business logic
      bool is_valid() const { return !name.empty() && email.contains('@'); }

      // Responsibility 2: persistence — knows about SQL
      void save_to_db(DbConnection& db) {
          db.execute("INSERT INTO users (name,email) VALUES (?,?)", name, email);
      }

      // Responsibility 3: presentation — knows about HTML
      std::string to_html() const {
          return "<p>" + name + " &lt;" + email + "&gt;</p>";
      }
  };

If the HTML layout changes, the DBA changes the schema, OR the validation rule
changes — all three force ``User`` to be recompiled.

**GOOD — split by responsibility:**

.. code-block:: cpp

  struct User {
      std::string name;
      std::string email;
      bool is_valid() const { return !name.empty() && email.contains('@'); }
  };

  class UserRepository {
  public:
      void save(DbConnection& db, const User& u) {
          db.execute("INSERT INTO users (name,email) VALUES (?,?)", u.name, u.email);
      }
  };

  class UserPresenter {
  public:
      std::string to_html(const User& u) const {
          return "<p>" + u.name + " &lt;" + u.email + "&gt;</p>";
      }
  };

Each class now has a single owner and a single reason to change.

Open/Closed Principle (OCP)
-----------------------------

**Software entities should be open for extension but closed for modification.**

New behaviour should be addable without touching existing, tested code.

**BAD — adding a new shape requires editing ``area()``:**

.. code-block:: cpp

  struct Shape { enum Type { Circle, Square } type; };

  double area(const Shape& s) {
      if (s.type == Shape::Circle) return 3.14 * s.r * s.r;
      if (s.type == Shape::Square) return s.side * s.side;
      // Must modify this function every time a new shape is added!
      return 0;
  }

**GOOD — extension via polymorphism or ``std::variant``:**

.. code-block:: cpp

  // Polymorphic OCP
  struct Shape {
      virtual double area() const = 0;
      virtual ~Shape() = default;
  };

  struct Circle : Shape {
      double r;
      double area() const override { return 3.14159 * r * r; }
  };

  struct Square : Shape {
      double side;
      double area() const override { return side * side; }
  };

  // Adding Triangle requires no change to Circle or Square
  struct Triangle : Shape {
      double base, height;
      double area() const override { return 0.5 * base * height; }
  };

  // OCP with std::variant (C++17) — closed via visitor, open by adding variants
  using ShapeV = std::variant<Circle, Square, Triangle>;

  struct AreaVisitor {
      double operator()(const Circle&   c) const { return 3.14159 * c.r * c.r; }
      double operator()(const Square&   s) const { return s.side * s.side; }
      double operator()(const Triangle& t) const { return 0.5 * t.base * t.height; }
  };

  double area(const ShapeV& sv) { return std::visit(AreaVisitor{}, sv); }

Liskov Substitution Principle (LSP)
-------------------------------------

**Subtypes must be behaviourally substitutable for their base types.**

A derived class must honour every postcondition the base class establishes.
It may weaken preconditions but must not strengthen them.

**BAD — Rectangle/Square violation:**

.. code-block:: cpp

  class Rectangle {
  public:
      virtual void set_width(double w)  { width_  = w; }
      virtual void set_height(double h) { height_ = h; }
      double area() const { return width_ * height_; }
  protected:
      double width_{}, height_{};
  };

  class Square : public Rectangle {
  public:
      // Square maintains width == height invariant
      void set_width(double w)  override { width_ = height_ = w; }
      void set_height(double h) override { width_ = height_ = h; }
  };

  // This code breaks with Square:
  void scale(Rectangle& r) {
      r.set_width(4);
      r.set_height(3);
      assert(r.area() == 12);  // fails for Square — area() == 9
  }

**GOOD — don't force the IS-A relationship; prefer composition:**

.. code-block:: cpp

  struct Rectangle {
      double width, height;
      double area() const { return width * height; }
  };

  struct Square {
      double side;
      double area() const { return side * side; }
  };

  // Or use std::variant and a visitor — no inheritance hierarchy needed
  using Shape = std::variant<Rectangle, Square>;

**Practical rule:** If you find yourself writing ``if (dynamic_cast<Square*>)``
inside code that takes a ``Rectangle*``, LSP is violated.

Interface Segregation Principle (ISP)
---------------------------------------

**Clients should not be forced to depend on interfaces they do not use.**

Fat interfaces force implementors to stub out methods they don't support and
force callers to link against unrelated code.

**BAD — monolithic ``IAnimal`` interface:**

.. code-block:: cpp

  struct IAnimal {
      virtual void eat()   = 0;
      virtual void fly()   = 0;  // dogs can't fly!
      virtual void swim()  = 0;  // eagles can't swim well!
      virtual void bark()  = 0;  // fish don't bark!
      virtual ~IAnimal() = default;
  };

  class Dog : public IAnimal {
  public:
      void eat()  override {}
      void fly()  override { /* throw? stub? */ }  // forced to implement
      void swim() override {}
      void bark() override {}
  };

**GOOD — segregated, role-based interfaces:**

.. code-block:: cpp

  struct IFeedable { virtual void eat()  = 0; virtual ~IFeedable() = default; };
  struct IFlyable  { virtual void fly()  = 0; virtual ~IFlyable()  = default; };
  struct ISwimmable{ virtual void swim() = 0; virtual ~ISwimmable()= default; };
  struct IBarkable { virtual void bark() = 0; virtual ~IBarkable() = default; };

  class Dog : public IFeedable, public ISwimmable, public IBarkable {
  public:
      void eat()  override {}
      void swim() override {}
      void bark() override {}
      // No fly() — Dog doesn't even know fly() exists
  };

  class Duck : public IFeedable, public IFlyable, public ISwimmable {
  public:
      void eat()  override {}
      void fly()  override {}
      void swim() override {}
  };

  // A feeder function only depends on IFeedable — not on the whole animal
  void feed_animal(IFeedable& a) { a.eat(); }

Dependency Inversion Principle (DIP)
--------------------------------------

**High-level modules should not depend on low-level modules. Both should
depend on abstractions. Abstractions should not depend on details.**

**BAD — high-level ``OrderService`` depends directly on ``MySQLDatabase``:**

.. code-block:: cpp

  class MySQLDatabase {
  public:
      void insert(const std::string& sql) { /* MySQL-specific */ }
  };

  class OrderService {
      MySQLDatabase db_;   // concrete dependency — can't test without MySQL
  public:
      void place_order(Order o) {
          // ... business logic ...
          db_.insert("INSERT INTO orders ...");
      }
  };

**GOOD — depend on an abstraction; inject the concrete at the composition root:**

.. code-block:: cpp

  // Abstraction (interface)
  struct IDatabase {
      virtual void insert(const std::string& sql) = 0;
      virtual ~IDatabase() = default;
  };

  // Low-level detail
  class MySQLDatabase : public IDatabase {
  public:
      void insert(const std::string& sql) override { /* MySQL */ }
  };

  // In-memory fake for tests
  class FakeDatabase : public IDatabase {
  public:
      void insert(const std::string& sql) override { log_.push_back(sql); }
      const std::vector<std::string>& log() const { return log_; }
  private:
      std::vector<std::string> log_;
  };

  // High-level module — depends only on IDatabase
  class OrderService {
      IDatabase& db_;   // reference to abstraction
  public:
      explicit OrderService(IDatabase& db) : db_{db} {}

      void place_order(const Order& o) {
          // ... business logic ...
          db_.insert("INSERT INTO orders ...");
      }
  };

  // Composition root (main or test setup)
  MySQLDatabase real_db;
  OrderService  service{real_db};

  FakeDatabase  fake_db;
  OrderService  test_service{fake_db};  // fully testable without MySQL

Dependency Injection via Constructor
--------------------------------------

Constructor injection is the preferred DI style in C++ because:

* Dependencies are explicit in the constructor signature.
* The object is always fully initialised after construction.
* No ``set_dependency()`` methods needed — no partially-constructed state.
* Works with ``const`` references and ``unique_ptr`` ownership transfer.

.. code-block:: cpp

  class ReportGenerator {
      IDatabase&    db_;
      ILogger&      logger_;
      IEmailSender& mailer_;
  public:
      ReportGenerator(IDatabase& db, ILogger& log, IEmailSender& mail)
          : db_{db}, logger_{log}, mailer_{mail} {}

      void generate(const ReportConfig& cfg) {
          logger_.log("Generating report...");
          auto data = db_.query(cfg.query);
          mailer_.send(cfg.recipient, render(data));
      }
  };

All three dependencies are substitutable in tests. The constructor makes the
dependency graph visible without any DI framework.

SOLID Summary Table
---------------------

+-------+--------------------------------------+----------------------------------+
| Code  | Principle                            | Key question to ask              |
+=======+======================================+==================================+
| SRP   | Single Responsibility                | Does this class change for more  |
|       |                                      | than one actor?                  |
+-------+--------------------------------------+----------------------------------+
| OCP   | Open/Closed                          | Must I modify existing code to   |
|       |                                      | add new behaviour?               |
+-------+--------------------------------------+----------------------------------+
| LSP   | Liskov Substitution                  | Can I use a Derived wherever     |
|       |                                      | Base is expected, safely?        |
+-------+--------------------------------------+----------------------------------+
| ISP   | Interface Segregation                | Are clients forced to depend on  |
|       |                                      | methods they never call?         |
+-------+--------------------------------------+----------------------------------+
| DIP   | Dependency Inversion                 | Does my high-level policy know   |
|       |                                      | about low-level details?         |
+-------+--------------------------------------+----------------------------------+

Self-Check Questions
---------------------

**Q1. How do you identify an SRP violation in an existing class?**

Count the "reasons to change": if the class would need modification because
of a UI change, AND because of a database schema change, AND because of a
business rule change — it has at least three responsibilities and should be
split along those boundaries.

**Q2. How does ``std::variant`` + visitor achieve OCP?**

The visitor struct is the "closed" part (existing visitors don't change), and
adding a new variant type requires adding a new overload to visitors — which
is explicit and localised. Contrast with the ``if/else if`` approach where
every type addition requires editing every function.

**Q3. State the LSP rectangle/square fix and explain why it works.**

Remove the inheritance. ``Square`` is not a ``Rectangle`` behaviourally because
independently-settable width and height are an invariant of ``Rectangle`` that
``Square`` cannot honour. Use ``std::variant<Rectangle, Square>`` or a common
``IShape`` interface with only an ``area()`` method — one that both can
implement without violating each other's invariants.

**Q4. What is the cost of following ISP aggressively?**

Many small interfaces increase the number of types in the system. When most
consumers need most of the methods, a single interface is simpler. Apply ISP
when real clients demonstrably don't use significant portions of the interface.

**Q5. Why is constructor injection preferred over setter injection in C++?**

Constructor injection guarantees the object is fully and consistently
initialised. Setter injection allows a window of partially-constructed state
between construction and the first setter call, which can lead to crashes or
incorrect behaviour if the object is used before all setters are called. It
also makes the dependency graph less visible in code.
