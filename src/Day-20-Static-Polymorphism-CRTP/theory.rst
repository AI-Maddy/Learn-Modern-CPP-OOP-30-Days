Static Polymorphism and CRTP
==============================

Motivation — The Cost of Virtual Dispatch
------------------------------------------

Virtual dispatch is essential for runtime polymorphism but carries costs:

* **Indirect call** — every virtual method call goes through a vtable pointer;
  the CPU must load the vtable, load the function pointer, then call it. On a
  modern CPU this is 3–5 extra memory accesses if the vtable is cold.
* **No inlining** — compilers generally cannot inline a virtual call through a
  pointer-to-base because the target is unknown at compile time.
* **Object overhead** — every polymorphic object carries a hidden ``vptr``
  (typically 8 bytes on 64-bit systems) pointing to its vtable.
* **Non-value semantics** — polymorphic objects must be passed by pointer or
  reference, complicating containers and ownership.

When the set of types is known at compile time, **Curiously Recurring Template
Pattern (CRTP)** provides compile-time polymorphism with zero runtime overhead.

CRTP Mechanics
---------------

CRTP is the idiom where a base class template takes the derived class as its
template argument:

.. code-block:: cpp

  template<typename Derived>
  struct Base {
      void interface() {
          // Downcast to Derived — safe because Base<Derived> is only
          // ever instantiated as a base of Derived
          static_cast<Derived*>(this)->implementation();
      }
  };

  struct ConcreteA : Base<ConcreteA> {
      void implementation() { std::puts("ConcreteA"); }
  };

  struct ConcreteB : Base<ConcreteB> {
      void implementation() { std::puts("ConcreteB"); }
  };

::

  Class hierarchy (CRTP)
  ──────────────────────
  Base<ConcreteA>          Base<ConcreteB>
       ▲                        ▲
  ConcreteA                ConcreteB

  No common base class — these are distinct types.
  interface() in Base<D> is resolved at compile time via static_cast<D*>(this).

The call ``Base<ConcreteA>::interface()`` expands to
``static_cast<ConcreteA*>(this)->implementation()`` — the compiler sees the
concrete type statically and can inline the call.

Static Interface Enforcement
------------------------------

CRTP enforces that a derived class implements required methods. If ``ConcreteA``
forgets ``implementation()``, the program fails to compile when
``base.interface()`` is instantiated — not at runtime.

.. code-block:: cpp

  template<typename Derived>
  struct Serialisable {
      std::string serialise() const {
          return static_cast<const Derived*>(this)->to_string();
      }
      // Optionally add a static_assert for a cleaner error message:
      static void check() {
          static_assert(
              requires(const Derived& d){ d.to_string(); },
              "Derived must implement to_string() const");
      }
  };

  struct Point : Serialisable<Point> {
      double x, y;
      std::string to_string() const {
          return std::format("({},{})", x, y);
      }
  };

  struct Missing : Serialisable<Missing> {
      // no to_string() — compile error when serialise() is called
  };

With C++20 Concepts, static interface enforcement is even cleaner (see Day 10),
but CRTP remains useful for **providing default implementations** that call
customisation points.

CRTP for Default Implementations (Mixin Pattern)
-------------------------------------------------

The base class provides default behaviour by calling the derived class's
customisation hook. The derived class only overrides what it needs.

.. code-block:: cpp

  // Provides !=, >, <=, >= from operator== and operator<
  template<typename Derived>
  struct Comparable {
      bool operator!=(const Derived& o) const {
          return !(*static_cast<const Derived*>(this) == o);
      }
      bool operator>(const Derived& o) const { return o < *static_cast<const Derived*>(this); }
      bool operator<=(const Derived& o) const { return !(o < *static_cast<const Derived*>(this)); }
      bool operator>=(const Derived& o) const { return !(*static_cast<const Derived*>(this) < o); }
  };

  struct Weight : Comparable<Weight> {
      double kg;
      bool operator==(const Weight& o) const { return kg == o.kg; }
      bool operator< (const Weight& o) const { return kg <  o.kg; }
  };

  Weight w1{70.0}, w2{80.0};
  bool heavier = w1 > w2;   // calls Comparable<Weight>::operator> — zero overhead

Note: C++20 ``<=>`` (spaceship operator) makes this specific use case
unnecessary, but the pattern applies to many other mixins (``Printable``,
``Hashable``, ``Clonable``, etc.).

Mixin Accumulation — Stacking Multiple CRTP Bases
--------------------------------------------------

CRTP bases compose cleanly because each is a distinct template instantiation:

.. code-block:: cpp

  template<typename D> struct Printable {
      void print() const { std::cout << static_cast<const D*>(this)->to_string() << '\n'; }
  };

  template<typename D> struct Serialisable {
      std::string serialise() const {
          return static_cast<const D*>(this)->to_string();
      }
  };

  template<typename D> struct Cloneable {
      D clone() const { return *static_cast<const D*>(this); }
  };

  struct Config
      : Printable<Config>
      , Serialisable<Config>
      , Cloneable<Config> {

      std::string name;
      int         value;

      std::string to_string() const {
          return std::format("{}={}", name, value);
      }
  };

  Config c{"timeout", 30};
  c.print();                       // "timeout=30"
  auto s = c.serialise();          // "timeout=30"
  Config c2 = c.clone();           // copy

::

  Config object layout (CRTP mixins add NO data, only methods)
  ─────────────────────────────────────────────────────────────
  ┌─────────────────────┐
  │  name  (std::string)│
  │  value (int)        │
  │  [no vptr!]         │
  └─────────────────────┘

  Methods available: print(), serialise(), clone(), to_string()
  All resolved at compile time — inlined by optimiser.

CRTP vs Virtual — Performance Comparison
-----------------------------------------

+----------------------------+------------------+-------------------+
| Property                   | Virtual dispatch | CRTP              |
+============================+==================+===================+
| Call overhead              | Indirect (vtable)| Direct / inlined  |
+----------------------------+------------------+-------------------+
| Inlining possible          | Rarely           | Always            |
+----------------------------+------------------+-------------------+
| Object size overhead       | +8 bytes (vptr)  | Zero              |
+----------------------------+------------------+-------------------+
| Heterogeneous container    | Yes              | No (same type)    |
+----------------------------+------------------+-------------------+
| Runtime type selection     | Yes              | No                |
+----------------------------+------------------+-------------------+
| Error reporting            | Runtime crash    | Compile error     |
+----------------------------+------------------+-------------------+
| Code bloat                 | One vtable entry | One template inst.|
+----------------------------+------------------+-------------------+

CRTP is the right choice when:

* All concrete types are known at compile time.
* Performance is critical (tight loops, game entities, DSP processing).
* You want compile-time enforcement of an interface.

Virtual dispatch is the right choice when:

* Types are loaded at runtime (plugins, configuration-driven factories).
* You need a heterogeneous collection (``std::vector<IShape*>``).
* The call frequency is low and clarity outweighs the small overhead.

``std::span`` as a CRTP-Free Alternative for Read-Only Ranges
--------------------------------------------------------------

``std::span<T>`` (C++20) provides a non-owning view over any contiguous range
without inheritance. It is a form of **concept-based** static polymorphism for
sequences:

.. code-block:: cpp

  #include <span>

  // Works with any contiguous range — no CRTP, no inheritance
  double sum(std::span<const double> values) {
      double total = 0;
      for (double v : values) total += v;
      return total;
  }

  std::vector<double> vec{1.0, 2.0, 3.0};
  std::array<double, 3> arr{4.0, 5.0, 6.0};
  double raw[] = {7.0, 8.0, 9.0};

  sum(vec);   // 6.0
  sum(arr);   // 15.0
  sum(raw);   // 24.0

No template required at the call site; ``std::span`` erases the concrete
container type while keeping performance (no heap, no virtual dispatch).

CRTP with C++20 Concepts for Better Error Messages
---------------------------------------------------

.. code-block:: cpp

  template<typename T>
  concept HasToString = requires(const T& t) {
      { t.to_string() } -> std::convertible_to<std::string>;
  };

  template<HasToString Derived>
  struct Printable {
      void print() const {
          std::cout << static_cast<const Derived*>(this)->to_string() << '\n';
      }
  };

  // If Derived doesn't satisfy HasToString, the error message
  // says "constraint not satisfied" — far clearer than a 40-line
  // template instantiation stack.

Self-Check Questions
---------------------

**Q1. What makes CRTP "Curiously Recurring"?**

The derived class passes itself as the template argument to its own base class:
``struct Derived : Base<Derived>``. The base class therefore has complete type
information about its derived class at compile time, enabling the static
downcast without a virtual table.

**Q2. How does CRTP enforce an interface at compile time?**

The base class calls ``static_cast<Derived*>(this)->required_method()`` inside
one of its methods. If ``Derived`` does not define ``required_method()``, the
compiler reports a substitution failure when that base method is instantiated —
typically when the call site is compiled. Adding a ``static_assert`` with a
``requires`` expression produces a much clearer error at the class definition.

**Q3. When should you NOT use CRTP and prefer virtual dispatch instead?**

Use virtual dispatch when the concrete type is not known at compile time (e.g.,
loaded from a plugin, chosen by configuration at startup), when you need to
store mixed types in a single ``std::vector``, or when the code is not
performance-critical and the extra clarity of virtual dispatch is worth more
than the small runtime cost.

**Q4. How does mixin accumulation via multiple CRTP bases differ from multiple
inheritance of concrete classes?**

CRTP mixins add methods but no data. Each mixin is a stateless template
instantiation parameterised on the leaf type. Multiple concrete inheritance
risks data duplication, diamond inheritance, and ambiguous member lookups.
CRTP mixins are unambiguous because each is a distinct template instantiation
(``Printable<Config>`` vs ``Serialisable<Config>`` are different types).

**Q5. What does ``std::span`` have in common with CRTP from a design perspective?**

Both provide compile-time polymorphism without virtual dispatch. ``std::span``
achieves this by erasing the container type at the boundary (implicitly
constructing from any contiguous range) while keeping the element type fixed.
CRTP achieves it by making the concrete derived type a template parameter of
the base. Both eliminate heap allocation and virtual call overhead for their
respective use cases.
