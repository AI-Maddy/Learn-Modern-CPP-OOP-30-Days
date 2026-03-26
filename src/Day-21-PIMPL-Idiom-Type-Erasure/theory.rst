pImpl Idiom and Type Erasure
==============================

Motivation — Hiding Implementation Details
-------------------------------------------

Two recurring problems in C++ library design:

**Problem 1 — Compilation Firewall:** A header file for a class exposes all
private members to every consumer because C++ class layout must be fully known
at the point of use. Changing a private member (e.g., adding a new internal
``std::string``) forces a recompilation of every translation unit that includes
the header — even though the public API didn't change. On large codebases this
cascades into minutes or hours of unnecessary rebuilding.

**Problem 2 — ABI Stability:** Shared libraries (.so / .dll) are compiled
once and loaded at runtime. If the library's private members change (a private
``int`` becomes ``long``, a ``std::vector`` is added), the binary layout of
the class changes. Applications compiled against the old header become binary
incompatible — a crash waiting to happen. This is the **Fragile Base Class
problem** at the ABI level.

Both problems are solved by the **pImpl idiom** (Pointer to Implementation),
which hides all private state behind an opaque pointer.

The pImpl Idiom
----------------

.. code-block:: cpp

  // widget.hpp  (public header — stable, ABI-safe)
  #pragma once
  #include <memory>
  #include <string>

  class Widget {
  public:
      explicit Widget(std::string title);
      ~Widget();                    // defined in .cpp — not inline

      Widget(Widget&&) noexcept;
      Widget& operator=(Widget&&) noexcept;

      // Copy is optional — only if Impl is copyable
      Widget(const Widget&);
      Widget& operator=(const Widget&);

      void show();
      void hide();
      std::string title() const;

  private:
      struct Impl;                         // forward declaration only
      std::unique_ptr<Impl> pImpl_;        // opaque pointer
  };

.. code-block:: cpp

  // widget.cpp  (implementation — not part of the public ABI)
  #include "widget.hpp"
  #include <vector>      // consumers never see these
  #include <map>
  #include <some_heavy_internal_library.hpp>

  struct Widget::Impl {
      std::string         title;
      std::vector<int>    children;   // can change freely — no ABI impact
      bool                visible{false};
  };

  Widget::Widget(std::string title)
      : pImpl_{std::make_unique<Impl>()} {
      pImpl_->title = std::move(title);
  }

  Widget::~Widget() = default;   // MUST be defined here, not in the header
                                  // (incomplete Impl type at header inclusion)

  Widget::Widget(Widget&&) noexcept = default;
  Widget& Widget::operator=(Widget&&) noexcept = default;

  Widget::Widget(const Widget& o)
      : pImpl_{std::make_unique<Impl>(*o.pImpl_)} {}

  Widget& Widget::operator=(const Widget& o) {
      if (this != &o) *pImpl_ = *o.pImpl_;
      return *this;
  }

  void Widget::show()  { pImpl_->visible = true; }
  void Widget::hide()  { pImpl_->visible = false; }
  std::string Widget::title() const { return pImpl_->title; }

**Why ``~Widget()`` must be in the ``.cpp``:**

``std::unique_ptr<Impl>``'s destructor calls ``delete Impl``. At the point
where the destructor is generated (wherever ``~Widget()`` is defined), ``Impl``
must be a complete type. If ``~Widget()`` is defaulted in the header, the
compiler tries to generate it there — but ``Impl`` is only forward-declared.
Defining ``~Widget() = default;`` in the ``.cpp`` where ``Impl`` is complete
solves this.

::

  pImpl layout
  ─────────────
  ┌──────────────────────┐
  │  Widget (public API) │         ← consumers only see this
  │  ┌──────────────────┐│
  │  │  pImpl_ ──────────┼────────► Impl (heap)
  │  └──────────────────┘│         │  title: string
  └──────────────────────┘         │  children: vector
                                    │  visible: bool
                                    └──────────────────

**ABI stability:** Adding a new member to ``Impl`` does not change the layout
of ``Widget`` (still just one pointer). Recompiling only the library ``.cpp``
is sufficient; applications need not be recompiled.

Type Erasure — Duck Typing at Runtime
--------------------------------------

**Type erasure** allows code to work with values of any type that satisfies a
conceptual interface, without that type inheriting from a base class.
``std::function``, ``std::any``, and ``std::shared_ptr<void>`` are all
type-erasing vocabulary types in the standard library.

**``std::function`` — type-erasing a callable:**

.. code-block:: cpp

  #include <functional>

  // Accepts any callable matching (int) -> int
  std::function<int(int)> double_fn = [](int x){ return x * 2; };
  std::function<int(int)> square_fn = [](int x){ return x * x; };

  // Also works with member function pointers:
  struct Multiplier {
      int factor;
      int apply(int x) const { return x * factor; }
  };

  Multiplier m{3};
  std::function<int(int)> triple_fn =
      std::bind(&Multiplier::apply, &m, std::placeholders::_1);

  // Or a capturing lambda:
  int factor = 5;
  std::function<int(int)> times5 = [factor](int x){ return x * factor; };

The concrete type (lambda, function pointer, ``Multiplier``) is erased — the
caller only sees ``std::function<int(int)>``.

**``std::any`` — type-erasing a value:**

.. code-block:: cpp

  #include <any>

  std::any value = 42;              // holds int
  value = std::string("hello");     // now holds string — no inheritance needed
  value = std::vector<int>{1,2,3};  // now holds vector<int>

  // Access with type check:
  if (auto* s = std::any_cast<std::string>(&value))
      std::cout << *s << '\n';

  // Throws std::bad_any_cast on type mismatch:
  try {
      int i = std::any_cast<int>(value);   // value holds string — throws
  } catch (const std::bad_any_cast& e) {
      std::cerr << e.what() << '\n';
  }

Custom Type Erasure — The ``AnyDrawable`` Pattern
--------------------------------------------------

The most powerful pattern: type-erase a whole *interface* without inheritance.

.. code-block:: cpp

  class AnyDrawable {
  public:
      template<typename T>
      AnyDrawable(T obj)
          : self_{std::make_shared<Model<T>>(std::move(obj))} {}

      void draw() const { self_->draw_impl(); }

  private:
      struct Concept {
          virtual ~Concept() = default;
          virtual void draw_impl() const = 0;
      };

      template<typename T>
      struct Model : Concept {
          T value;
          explicit Model(T v) : value{std::move(v)} {}
          void draw_impl() const override { value.draw(); }  // T::draw() called here
      };

      std::shared_ptr<Concept> self_;
  };

  // Any type with a draw() method works — no inheritance required
  struct Circle     { void draw() const { std::puts("Circle"); } };
  struct Triangle   { void draw() const { std::puts("Triangle"); } };

  std::vector<AnyDrawable> shapes;
  shapes.emplace_back(Circle{});
  shapes.emplace_back(Triangle{});

  for (auto& d : shapes) d.draw();

::

  AnyDrawable layout
  ──────────────────
  ┌──────────────────────┐
  │  AnyDrawable         │
  │  shared_ptr<Concept> ├─────► Concept (vtable)
  └──────────────────────┘         ▲           ▲
                              Model<Circle>  Model<Triangle>
                              (holds Circle) (holds Triangle)

This achieves the same goal as a virtual ``IDrawable`` base, but ``Circle``
and ``Triangle`` do not inherit from anything — they are value types.

``std::variant`` as Closed-Set Type Erasure
--------------------------------------------

When the set of types is known and fixed at compile time:

.. code-block:: cpp

  #include <variant>

  struct Circle   { double r; };
  struct Square   { double s; };
  struct Triangle { double b, h; };

  using Shape = std::variant<Circle, Square, Triangle>;

  double area(const Shape& sh) {
      return std::visit(overloaded{
          [](const Circle&   c){ return 3.14159 * c.r * c.r; },
          [](const Square&   s){ return s.s * s.s; },
          [](const Triangle& t){ return 0.5 * t.b * t.h; }
      }, sh);
  }

  // Helper to build an overloaded visitor from multiple lambdas (C++17):
  template<typename... Ts> struct overloaded : Ts... { using Ts::operator()...; };
  template<typename... Ts> overloaded(Ts...) -> overloaded<Ts...>;

``std::variant`` is stack-allocated (no heap, no pointer indirection) and the
visitor is dispatched through a jump table — faster than virtual dispatch for
small type sets.

Type Erasure Technique Comparison
-----------------------------------

+---------------------+--------------+---------------+--------------------+
| Technique           | Heap alloc   | Type set      | Use case           |
+=====================+==============+===============+====================+
| Virtual base class  | Yes (new)    | Open          | Classic OOP        |
+---------------------+--------------+---------------+--------------------+
| ``std::function``   | Sometimes*   | Open (callable| Callbacks, Strategy|
+---------------------+--------------+---------------+--------------------+
| ``std::any``        | Sometimes*   | Open (any)    | Property bags,     |
|                     |              |               | scripting bindings |
+---------------------+--------------+---------------+--------------------+
| Custom type erasure | Yes          | Open (concept)| Value semantics    |
|                     |              |               | containers         |
+---------------------+--------------+---------------+--------------------+
| ``std::variant``    | No           | Closed        | Sum types, FSMs    |
+---------------------+--------------+---------------+--------------------+

\* SBO (Small Buffer Optimisation) avoids heap for small callables/values.

Self-Check Questions
---------------------

**Q1. Why must ``Widget::~Widget()`` be defined in the ``.cpp`` file when using
pImpl with ``unique_ptr<Impl>``?**

``unique_ptr``'s destructor calls ``delete`` on its managed pointer, which
requires ``Impl`` to be a complete type (so the compiler can call its
destructor). If ``~Widget()`` is inlined in the header, the compiler generates
the destructor there where only a forward declaration of ``Impl`` exists,
causing an "incomplete type" error.

**Q2. How does pImpl achieve ABI stability?**

The size and layout of the public ``Widget`` class never changes — it is always
``sizeof(void*)`` regardless of what is added to ``Impl``. Libraries can add
or change private members in ``Impl`` without changing ``Widget``'s binary
layout. Applications compiled against the old header continue to work when
linked against the new library binary.

**Q3. What is the difference between ``std::function`` and the custom
``AnyDrawable`` type erasure pattern?**

``std::function`` erases a single callable signature. ``AnyDrawable`` erases
an entire multi-method interface. The custom pattern wraps any type ``T``
(without requiring it to inherit from anything) in an internal
``Model<T> : Concept`` — each method of the interface is one virtual override
in ``Model``. ``std::function`` is simpler; custom type erasure is necessary
when the erased interface has multiple methods.

**Q4. When should you choose ``std::variant`` over virtual dispatch for a
type-safe sum type?**

Use ``std::variant`` when the full set of types is known and closed at compile
time and you want stack allocation with no virtual call overhead. Use virtual
dispatch when the set of types is open (new types can be added by external
code, e.g., plugins) or when you need a homogeneous container of abstract
objects with heap-allocated, possibly heterogeneous sizes.

**Q5. What is the Small Buffer Optimisation (SBO) in ``std::function``?**

SBO is an implementation technique where ``std::function`` stores small
callables (typically those fitting in a 16–32 byte inline buffer) directly
inside the ``std::function`` object on the stack, avoiding a heap allocation.
Large callables (large captures, fat function objects) still allocate on the
heap. SBO makes ``std::function`` much cheaper for the common case of small
lambdas.
