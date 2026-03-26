C++26 Modern Features Preview
================================

Motivation — The Evolving Language
------------------------------------

C++ has a three-year release cycle. C++20 delivered modules, concepts, ranges,
coroutines, and ``std::format``. C++23 delivered ``std::expected``, ``import
std;``, ``std::mdspan``, and ``std::print``. C++26, finalised in 2026, brings
transformative features that change how C++ programmers think about reflection,
control flow, correctness, and concurrency.

This day surveys the five most significant C++26 features. Status legend:

* **Merged** — formally voted into the C++26 working draft.
* **Experimental** — available in Clang/GCC trunk under ``-std=c++26`` or
  feature flags, but not yet in all compiler releases as of early 2025.

Understanding these features now lets you:

* Evaluate experimental compilers (Clang trunk, EDG) for early adoption.
* Design abstractions today that will migrate cleanly to C++26 idioms.
* Understand the direction of the language for architectural decisions.

Static Reflection — P2996 (Merged into C++26)
----------------------------------------------

Static reflection allows querying properties of types at compile time as
first-class language values, without macros or code generation.

The core construct is ``^^T`` (the reflection operator) which produces a
``std::meta::info`` constant, and ``[:r:]`` (the splicer) which turns a
``meta::info`` back into a syntactic element.

.. code-block:: cpp

  // requires: clang trunk with -freflection or EDG compiler
  #include <meta>

  struct Point { int x; int y; };

  // Iterate over all non-static data members at compile time:
  constexpr void print_member_names() {
      // ^^Point reflects the type as a compile-time value
      constexpr auto members = std::meta::nonstatic_data_members_of(^^Point);
      // members is a range of std::meta::info values
      template for (constexpr auto m : members) {
          std::println("member: {}", std::meta::name_of(m));
      }
  }
  // Output: member: x
  //         member: y

**Serialisation without macros:**

.. code-block:: cpp

  template<typename T>
  std::string to_json(const T& obj) {
      std::string result = "{";
      bool first = true;
      template for (constexpr auto m : std::meta::nonstatic_data_members_of(^^T)) {
          if (!first) result += ",";
          result += "\"";
          result += std::meta::name_of(m);
          result += "\":";
          result += std::to_string(obj.[:m:]);   // splicer accesses the member
          first = false;
      }
      return result + "}";
  }

  Point p{3, 7};
  std::println("{}", to_json(p));   // {"x":3,"y":7}

This pattern — which previously required Boost.Hana, a macro + code generator,
or manual boilerplate — is now expressed directly in the language.

**Enum-to-string without macros:**

.. code-block:: cpp

  enum class Colour { Red, Green, Blue };

  std::string_view colour_name(Colour c) {
      template for (constexpr auto e : std::meta::enumerators_of(^^Colour)) {
          if ([:e:] == c) return std::meta::name_of(e);
      }
      return "<unknown>";
  }

  std::println("{}", colour_name(Colour::Green));   // "Green"

Pattern Matching — P2688 (Targeted for C++26)
----------------------------------------------

Pattern matching provides a structured multi-way dispatch over values and
types, extending ``switch`` to work with arbitrary types including
``std::variant``, ``std::optional``, structs, and ranges.

.. code-block:: cpp

  // Current C++23 baseline (for comparison)
  std::variant<int, double, std::string> v = 42;
  std::visit([](auto&& x){
      using T = std::decay_t<decltype(x)>;
      if constexpr (std::is_same_v<T, int>)    std::println("int: {}", x);
      else if constexpr (std::is_same_v<T, double>) std::println("double: {}", x);
      else std::println("string: {}", x);
  }, v);

  // C++26 pattern matching (P2688 syntax — experimental):
  inspect (v) {
      <int>    i => std::println("int: {}", i);
      <double> d => std::println("double: {}", d);
      <std::string> s => std::println("string: {}", s);
  };

**Structural patterns:**

.. code-block:: cpp

  struct Point { int x, y; };

  Point p{3, 0};
  inspect (p) {
      [0, 0]     => std::println("origin");
      [x, 0]     => std::println("on x-axis at {}", x);
      [0, y]     => std::println("on y-axis at {}", y);
      [x, y]     => std::println("({}, {})", x, y);
  };
  // prints: "on x-axis at 3"

**``std::optional`` pattern:**

.. code-block:: cpp

  std::optional<int> opt = 42;
  inspect (opt) {
      none    => std::println("empty");
      some(v) => std::println("has value: {}", v);
  };

Pattern matching eliminates deep ``if``/``else`` chains, ``dynamic_cast``
cascades, and the ``overloaded`` boilerplate currently needed for
``std::visit``.

Contracts — P2900 (Merged into C++26)
--------------------------------------

Contracts provide a language-level mechanism to specify preconditions,
postconditions, and invariants. They are distinct from ``assert()`` in that
they are part of the function declaration and can be verified, disabled, or
audited by the build system.

.. code-block:: cpp

  // Precondition: caller must ensure n >= 0 and n < size
  double get_element(const std::vector<double>& v, std::size_t n)
      pre(n < v.size())
  {
      return v[n];
  }

  // Postcondition: the function guarantees the returned value is positive
  double sqrt_positive(double x)
      pre(x >= 0.0)
      post(result: result >= 0.0)   // 'result' names the return value
  {
      return std::sqrt(x);
  }

  // Class invariant (proposed syntax):
  struct BankAccount {
      double balance;
      void deposit(double amount)
          pre(amount > 0)
          post(balance == balance + amount) {}
  };

Contracts differ from ``assert()`` in several ways:

* They are checked at function boundaries (call/return), not inside the body.
* The violation handler is customisable globally (``contract_violation_handler``).
* Contracts can be disabled per-build (``off``), audit-only (``audit``), or
  enforced (``default``).
* Postconditions can reference the return value by name.

.. code-block:: cpp

  // Build modes:
  // -fcontracts=default  → preconditions enforced at runtime
  // -fcontracts=audit    → all contracts enforced (includes expensive checks)
  // -fcontracts=off      → contracts compiled away, zero overhead

``std::execution`` — P2300 Senders/Receivers (Merged into C++26)
-----------------------------------------------------------------

``std::execution`` provides a composable, asynchronous programming model based
on **senders** (descriptions of async work) and **receivers** (continuations).

Key concepts:

* A **sender** is a lazy description of work. It does nothing until connected
  to a receiver and started.
* A **receiver** has three channels: ``set_value`` (success), ``set_error``
  (failure), and ``set_stopped`` (cancellation).
* **Algorithms** like ``then``, ``when_all``, ``on``, and ``schedule`` compose
  senders into pipelines.

.. code-block:: cpp

  #include <execution>
  namespace ex = std::execution;

  // Basic async pipeline
  auto work = ex::schedule(thread_pool.get_scheduler())    // schedule on thread pool
            | ex::then([]{ return compute_heavy_thing(); }) // transform value
            | ex::then([](auto result){ return format(result); });

  // Synchronously block waiting for result (in tests or main):
  auto [text] = ex::sync_wait(std::move(work)).value();
  std::println("{}", text);

  // Composing parallel work:
  auto parallel =
      ex::when_all(
          ex::schedule(pool.get_scheduler()) | ex::then([]{ return fetch_db(); }),
          ex::schedule(pool.get_scheduler()) | ex::then([]{ return fetch_api(); })
      )
      | ex::then([](auto db, auto api){ return merge(db, api); });

Senders/receivers compose without shared state (no ``std::future`` polling),
support structured concurrency (child tasks are always joined before parent
scope exits), and work on any executor (thread pool, CUDA, serial, coroutine).

``std::inplace_vector`` — P0843 (Merged into C++26)
----------------------------------------------------

A fixed-capacity vector stored entirely on the stack (or inside the parent
object) — no heap allocation, no indirection, same interface as
``std::vector``.

.. code-block:: cpp

  #include <inplace_vector>

  std::inplace_vector<int, 16> v;   // capacity fixed at 16; stored inline
  v.push_back(1);
  v.push_back(2);
  v.push_back(3);

  // Same as std::vector:
  std::ranges::sort(v);
  for (int x : v) std::print("{} ", x);

  // Adding beyond capacity throws std::bad_alloc (or can use try_push_back):
  v.resize(16);
  auto ok = v.try_push_back(99);   // returns std::nullopt if full — no exception
  assert(!ok.has_value());         // capacity exceeded

  // Zero heap allocation — perfect for:
  // - Embedded / real-time systems where malloc is forbidden
  // - Small collections where capacity is known at compile time
  // - Hot paths where allocation latency matters

Comparison of ``inplace_vector`` with alternatives:

+-----------------------------+--------+----------+-------+---------------+
| Container                   | Heap   | Capacity | Size  | Use case      |
+=============================+========+==========+=======+===============+
| ``std::vector``             | Yes    | Dynamic  | 24 B  | General       |
+-----------------------------+--------+----------+-------+---------------+
| ``std::array``              | No     | Fixed    | N×E   | Fixed, no push|
+-----------------------------+--------+----------+-------+---------------+
| ``std::inplace_vector<T,N>``| No     | Fixed    | N×E+1 | Fixed, push OK|
+-----------------------------+--------+----------+-------+---------------+
| ``boost::static_vector``    | No     | Fixed    | N×E+1 | Boost required|
+-----------------------------+--------+----------+-------+---------------+

What Is Stable vs Experimental (Early 2025)
--------------------------------------------

+-----------------------------+---------------+---------------------------+
| Feature                     | Status        | Try with                  |
+=============================+===============+===========================+
| Static Reflection (P2996)   | Merged C++26  | Clang trunk ``-freflection``|
+-----------------------------+---------------+---------------------------+
| Pattern Matching (P2688)    | Targeted C++26| Clang/EDG experimental    |
+-----------------------------+---------------+---------------------------+
| Contracts (P2900)           | Merged C++26  | GCC 14+ ``-fcontracts``   |
+-----------------------------+---------------+---------------------------+
| ``std::execution`` (P2300)  | Merged C++26  | stdexec library (GitHub)  |
+-----------------------------+---------------+---------------------------+
| ``std::inplace_vector``     | Merged C++26  | GCC 15+ / Clang 18+       |
+-----------------------------+---------------+---------------------------+

Using them today:

* ``stdexec`` (NVIDIA's reference P2300 implementation) is available on GitHub
  and works on C++20 compilers.
* ``boost::static_vector`` provides ``inplace_vector`` semantics today.
* Contracts are available under ``-fcontracts`` in GCC 14+ and Clang 17+.
* Reflection requires Clang trunk or EDG (only for exploration, not production).

Modern C++ Trajectory
----------------------

::

  C++11/14  C++17      C++20        C++23         C++26
  ────────  ───────    ──────────   ──────────    ──────────────────
  move sem  structured modules      expected      reflection
  lambdas   bindings   concepts     print/println pattern matching
  smart ptr if-init    ranges       import std    contracts
            variant    coroutines   mdspan        std::execution
            optional   format       flat_map      inplace_vector

Each release builds on the previous. C++26's reflection will unlock code
generation patterns that previously required external tools (protobuf, IDL
compilers, Qt moc) to be expressed directly in C++.

Self-Check Questions
---------------------

**Q1. What does the reflection operator ``^^T`` produce and how is it used?**

``^^T`` produces a ``std::meta::info`` — a compile-time constant value that
represents the type ``T`` in the reflection system. It can be passed to
``std::meta`` functions like ``nonstatic_data_members_of``, ``name_of``, and
``enumerators_of`` to query the type's properties at compile time. The splicer
``[:r:]`` converts a ``meta::info`` back into a usable entity (a member access
expression, an enumerator value, etc.).

**Q2. How does pattern matching with ``inspect`` improve on ``std::visit``?**

``std::visit`` with a visitor struct or ``overloaded`` lambda requires
boilerplate (the ``overloaded`` deduction guide), and the visitor must be a
single callable. ``inspect`` is a direct language construct that reads
left-to-right like a table of cases, supports structural decomposition
(matching struct fields by position), and works on ``std::optional``,
``std::variant``, integers, and custom types that opt in.

**Q3. How do C++26 Contracts differ from ``assert()``?**

``assert()`` is a macro that tests an expression inside a function body and
calls ``abort()`` on failure. It has no postcondition support, no way to
express caller responsibilities vs implementer responsibilities, and is
typically disabled in release builds (``NDEBUG``). Contracts are part of the
function declaration, apply at call and return boundaries, support pre/post
conditions separately, have configurable violation handlers, and can be
independently enabled/disabled/audited per build target.

**Q4. What is the fundamental advantage of senders/receivers over
``std::future``/``std::async``?**

``std::future`` forces eager evaluation (work starts immediately on
``std::async`` call), makes composition awkward (no standard pipe operator),
and does not support cancellation or structured scope. Senders are lazy (work
described, not started), composable via ``|`` pipe syntax, support three
channels (value/error/stopped), and enable structured concurrency where
lifetimes are guaranteed by the composition structure.

**Q5. When should you prefer ``std::inplace_vector`` over ``std::vector``?**

Use ``std::inplace_vector`` when the maximum number of elements is known at
compile time and is reasonably small, when heap allocation is unacceptable
(real-time systems, tight loops), or when the number of elements is typically
small but can grow up to a predictable maximum. For unbounded collections or
collections that may need to grow beyond a reasonable static bound,
``std::vector`` remains the correct choice.
