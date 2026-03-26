Day 07 — Virtual, Override, Final, and Abstract Classes
=========================================================

Why This Day Matters
--------------------

Day 06 introduced virtual functions for polymorphism. Day 07 goes deeper: pure virtual functions
to mandate derived class behaviour, abstract base classes as pure interface contracts,
``final`` to seal classes and optimise virtual calls, covariant return types, and the
Non-Virtual Interface idiom that separates interface from implementation. This day also addresses
the question of when virtual dispatch is too expensive and what the alternatives are.


Pure Virtual Functions and Abstract Classes
--------------------------------------------

A **pure virtual function** has no implementation in the base class; any derived class must
provide one. A class with at least one pure virtual function is **abstract** — you cannot
instantiate it directly.

.. code-block:: cpp

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

**When to use abstract classes:**

* To define a protocol that all implementations must follow (interfaces)
* To enforce that a class is never used as a concrete type — only as a base
* As "role" types in design patterns (Strategy, Observer, Command)

Providing a Default Implementation for Pure Virtual Functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Pure virtual functions *can* have a body, but derived classes must still override them. This is
useful for providing a fallback callable by explicit scope.

.. code-block:: cpp

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


Interface Design Principles
----------------------------

An interface in C++ is an abstract class with only pure virtual functions and a virtual
destructor — no data members, no non-pure virtual functions.

.. code-block:: cpp

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

**Guideline:** Keep interfaces narrow. An interface with 20 pure virtual functions is hard to
mock and hard to implement. Prefer several small interfaces (Interface Segregation Principle).


``final`` — Sealing Classes and Methods
-----------------------------------------

``final`` on a class prevents further inheritance. ``final`` on a virtual method prevents
further overriding in derived classes.

.. code-block:: cpp

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

**Performance benefit of ``final``:**

When the compiler can prove that a class is final (no subclasses can exist), it can devirtualise
virtual calls — turning them into direct calls and enabling inlining. This is one of the few
cases where ``final`` provides a measurable performance benefit.

.. code-block:: cpp

    // Devirtualisation: the compiler knows no subclass of ConcreteLogger exists,
    // so this call can be turned into a direct call to ConcreteLogger::log.
    void use(ConcreteLogger& logger) {
        logger.log("hello");  // devirtualised — direct call, inlineable
    }

Virtual Destructor Requirement
--------------------------------

A class used as a polymorphic base must have a virtual destructor. This ensures the correct
destructor chain is called when deleting through a base pointer.

.. code-block:: cpp

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

**Rule:** If a class has any virtual function, give it a ``virtual ~ClassName() = default``
destructor. No exception.


Covariant Return Types
-----------------------

A derived class override may return a pointer or reference to a class that is derived from the
return type of the base class function. This allows factory methods to return the most-derived
type without forcing the caller to use ``dynamic_cast``.

.. code-block:: cpp

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

Covariant return types only work with pointers and references, not value types.


The Non-Virtual Interface (NVI) Idiom
--------------------------------------

NVI separates the interface (public, non-virtual) from the implementation hooks (protected or
private, virtual). The public non-virtual function performs pre/post-processing and calls the
virtual hook.

.. code-block:: cpp

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

**Benefits of NVI:**

* The base class can enforce pre/post conditions that derived classes cannot bypass.
* The public interface is stable — you can add pre/post behaviour in the base without touching
  any derived class.
* Derived classes focus only on the customisation point, not boilerplate.


Avoiding Virtual in Hot Paths
-------------------------------

Virtual dispatch has two costs: an indirect call (one pointer dereference) and inhibited
inlining. For hot loops (millions of calls per second), this matters.

Alternatives:
* **``final`` + devirtualisation** — if the object type is statically known and the class is
  final, the compiler devirtualises automatically.
* **CRTP (Day 20)** — Curiously Recurring Template Pattern: compile-time polymorphism with
  zero dispatch overhead.
* **``std::variant`` + ``std::visit``** — closed set of types; compile-time dispatch;
  cache-friendly value semantics.
* **Function pointers in a struct** — manual vtable for C-compatible APIs.

.. code-block:: cpp

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


Summary: virtual keywords at a glance
---------------------------------------

+------------------+-----------------------------------------------+
| Keyword          | Effect                                        |
+==================+===============================================+
| ``virtual``      | Enables runtime dispatch via vtable           |
+------------------+-----------------------------------------------+
| ``= 0``          | Makes function pure virtual; class abstract   |
+------------------+-----------------------------------------------+
| ``override``     | Verifies signature matches a base virtual     |
+------------------+-----------------------------------------------+
| ``final`` (class)| Prevents further derivation                   |
+------------------+-----------------------------------------------+
| ``final`` (func) | Prevents further override in derived classes  |
+------------------+-----------------------------------------------+


Self-Check Questions
--------------------

**Q1: What happens if you forget to provide an implementation for a pure virtual function in a
derived class?**

The derived class itself becomes abstract. You cannot instantiate it. Any attempt to create an
object of the derived class produces a compile error: "cannot instantiate abstract class". The
missing implementation must be provided, or the class must be further sub-classed.

**Q2: What is the NVI idiom and what problem does it solve?**

NVI (Non-Virtual Interface) makes the public interface non-virtual. Customisation is done through
protected or private virtual functions that the public non-virtual function calls. This lets the
base class enforce invariants (validation, logging, locking) around every call to the virtual
hook, even if the derived class is written by someone else. Without NVI, a derived class could
override the public virtual function and bypass all base class bookkeeping.

**Q3: When does ``final`` on a class enable performance optimisations?**

When a class is marked ``final``, the compiler knows that no subclass can exist. Therefore,
a virtual call through a reference or pointer to a ``final`` class can be devirtualised —
converted to a direct function call. Direct calls can be inlined by the compiler, which
eliminates function call overhead and enables further constant propagation. This is particularly
valuable in tight loops.

**Q4: What is a covariant return type and when is it useful?**

A covariant return type allows a derived class override to return a pointer or reference to a
more-derived type than the base class return type. It is useful in clone/factory methods: the
caller of ``circle.clone()`` gets a ``Circle*`` directly instead of a ``Shape*``, eliminating
the need for a ``dynamic_cast`` at the call site. The type system enforces that the returned
type is a valid subtype of the base return type.
