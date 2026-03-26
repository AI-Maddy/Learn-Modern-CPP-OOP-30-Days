Optional, Variant, Any
======================

.. contents:: Sections
   :local:
   :depth: 2

std::optional
--------------

Models a value that may or may not be present.  Better than returning a
sentinel value (``-1``, ``nullptr``, ``""``), because absence is explicit in the type.

Creation and Access
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   #include <optional>

   std::optional<int>         empty;          // disengaged (no value)
   std::optional<int>         present = 42;
   auto                       from_fn = std::make_optional<std::string>("hello");

   // Check before access:
   if (present.has_value()) { std::cout << *present; }
   if (present)             { std::cout << present.value(); }

   // Safe default:
   int val = empty.value_or(-1);   // -1 if empty, otherwise the value

   // Unsafe (throws std::bad_optional_access if empty):
   int bad = empty.value();   // throws!

   // In-place construction (avoids copy):
   std::optional<std::vector<int>> ov;
   ov.emplace(10, 0);   // constructs vector(10, 0) in-place

Returning optional from Functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   std::optional<int> parse_int(std::string_view s) {
       try { return std::stoi(std::string(s)); }
       catch (...) { return std::nullopt; }
   }

   auto n = parse_int("42");    // optional<int>{42}
   auto m = parse_int("abc");   // nullopt

Monadic Operations (C++23)
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   // and_then: chain optional-returning functions
   auto result = parse_int("42")
       .and_then([](int n) -> std::optional<int> {
           return n > 0 ? std::optional{n} : std::nullopt;
       })
       .and_then([](int n) -> std::optional<std::string> {
           return std::to_string(n);
       });
   // result is optional<string>{"42"} or nullopt if any step failed

   // transform: apply a function if engaged (returns optional<U>)
   auto doubled = parse_int("21").transform([](int n){ return n * 2; });

   // or_else: provide a fallback optional if empty (C++23)
   auto fallback = parse_int("bad").or_else([]{ return std::optional{0}; });

Pitfall: optional<bool>
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   std::optional<bool> flag = false;

   if (flag) {
       // This branch IS entered! optional<bool> with value false is ENGAGED.
       // "if (flag)" tests engagement, not the bool value.
   }

   // GOOD: always use has_value() or explicit *flag comparison
   if (flag.has_value() && *flag) { /* true case */ }
   if (flag == true)  { /* value is true  */ }
   if (flag == false) { /* value is false */ }

std::variant
-------------

A type-safe discriminated union.  Holds exactly one of a finite set of
types at a time.

Basic Usage
~~~~~~~~~~~

.. code-block:: cpp

   #include <variant>

   using Result = std::variant<int, std::string, std::vector<double>>;

   Result r1 = 42;
   Result r2 = std::string{"error message"};
   Result r3 = std::vector<double>{1.0, 2.0};

   // Query active type:
   if (std::holds_alternative<int>(r1)) { /* r1 holds int */ }

   // Access — throws std::bad_variant_access on mismatch:
   int n = std::get<int>(r1);

   // Safe non-throwing access:
   if (auto* p = std::get_if<int>(&r1)) { std::cout << *p; }

   // Index-based access:
   std::cout << std::get<0>(r1);   // same as get<int>

std::visit
~~~~~~~~~~

.. code-block:: cpp

   // Visitor struct
   struct Printer {
       void operator()(int v)                      { std::cout << "int:" << v; }
       void operator()(const std::string& s)       { std::cout << "str:" << s; }
       void operator()(const std::vector<double>&) { std::cout << "vec"; }
   };
   std::visit(Printer{}, r1);

   // Generic lambda (handles all alternatives)
   std::visit([](const auto& v){ std::cout << v; }, r1);

   // Overloaded pattern (C++17 helper):
   template <typename... Fs> struct overloaded : Fs... { using Fs::operator()...; };
   template <typename... Fs> overloaded(Fs...) -> overloaded<Fs...>;

   std::visit(overloaded{
       [](int v)               { std::cout << "int " << v; },
       [](const std::string& s){ std::cout << "str " << s; },
       [](const auto&)         { std::cout << "other"; }
   }, r1);

   // Multi-variant visit (C++20 — visit with multiple variants):
   std::visit([](auto a, auto b){ std::cout << a << ' ' << b; }, r1, r2);

std::monostate — Default-Constructible Variant
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   // variant<Circle,Rectangle> is not default-constructible if Circle isn't.
   // monostate provides an empty state as the first alternative:
   using Shape = std::variant<std::monostate, Circle, Rectangle>;

   Shape s;              // default-constructed: holds monostate
   s = Circle{5.0};
   if (std::holds_alternative<std::monostate>(s)) { /* unset */ }

std::any
---------

Stores a value of **any** copyable type.  Unlike ``variant``, the type set is open.

.. code-block:: cpp

   #include <any>

   std::any a = 42;
   a = std::string{"hello"};           // replace with different type
   a = std::vector<int>{1, 2, 3};

   // Type query:
   std::cout << a.type().name();       // implementation-defined mangled name
   if (a.type() == typeid(std::vector<int>)) { /* ... */ }

   // Throwing cast:
   auto& v = std::any_cast<std::vector<int>&>(a);    // throws bad_any_cast

   // Non-throwing cast (returns nullptr on mismatch):
   if (auto* p = std::any_cast<std::vector<int>>(&a)) { /* safe */ }

   // Reset:
   a.reset();
   std::cout << a.has_value();   // false

   // In-place construction:
   std::any b = std::make_any<std::pair<int,int>>(1, 2);

When to Use Which
-----------------

+--------------------+----------------------------------+------------------------------------+
| Type               | Use when…                        | Avoid when…                        |
+====================+==================================+====================================+
| ``optional<T>``    | Value may legitimately be        | Using as error channel (use        |
|                    | absent; single type; no error    | expected instead); storing bool    |
|                    | reason needed                    | and testing engagement             |
+--------------------+----------------------------------+------------------------------------+
| ``variant<Ts...>`` | Finite, known set of alternative | Type set can grow; need open       |
|                    | types; want exhaustiveness       | extensibility                      |
|                    | checking at compile time         |                                    |
+--------------------+----------------------------------+------------------------------------+
| ``any``            | Open type set; configuration     | Performance-critical code;         |
|                    | bags; scripting bridge;          | type-safe access guaranteed        |
|                    | heterogeneous property maps      |                                    |
+--------------------+----------------------------------+------------------------------------+
| ``expected<T,E>``  | May fail with typed error;       | Exceptions preferred; simple       |
| (C++23)            | functional chaining needed       | absence (use optional)             |
+--------------------+----------------------------------+------------------------------------+

Comparison Table
-----------------

+--------------------+-----------+-----------+-----------+-----------+
| Feature            | optional  | variant   | any       | expected  |
+====================+===========+===========+===========+===========+
| Stack-allocated    | Yes       | Yes       | SBO only  | Yes       |
+--------------------+-----------+-----------+-----------+-----------+
| Type-safe          | Yes       | Yes       | No (cast) | Yes       |
+--------------------+-----------+-----------+-----------+-----------+
| Multiple types     | No (1)    | Yes (N)   | Yes (any) | 2 (T,E)   |
+--------------------+-----------+-----------+-----------+-----------+
| Compile-time       | Full      | Full      | None      | Full      |
| exhaustiveness     |           |           |           |           |
+--------------------+-----------+-----------+-----------+-----------+
| Monadic chaining   | C++23     | No        | No        | C++23     |
+--------------------+-----------+-----------+-----------+-----------+
| RTTI required      | No        | No        | Yes       | No        |
+--------------------+-----------+-----------+-----------+-----------+

Pitfalls
---------

**Pitfall 1: Dereferencing empty optional**

.. code-block:: cpp

   std::optional<int> o;
   int x = *o;   // UB: no value present — no exception, undefined behavior!
   // GOOD: always check first
   if (o) { int x = *o; }

**Pitfall 2: Unchecked get on variant**

.. code-block:: cpp

   std::variant<int, std::string> v = 42;
   auto s = std::get<std::string>(v);   // throws bad_variant_access
   // GOOD: use get_if or visit

**Pitfall 3: any requires CopyConstructible**

.. code-block:: cpp

   std::any a = std::make_unique<int>(5);   // ERROR: unique_ptr not copyable

**Pitfall 4: variant with same type twice**

.. code-block:: cpp

   std::variant<int, int> v = 42;   // ambiguous: which int?
   // GOOD: use strong typedefs or index-based access
   std::variant<int, int> v2;
   v2.emplace<0>(42);   // explicitly the first int

Cross-References
-----------------

* ``error-handling-expected.rst`` — std::expected as optional + error type
* ``type-erasure-pimpl.rst`` — variant/any in type erasure patterns
* ``structured-bindings.rst`` — destructuring variant/optional values
* ``modern-cpp20-23-cheat.rst`` — C++23 monadic optional/expected
