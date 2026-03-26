Structured Bindings
===================

.. contents:: Sections
   :local:
   :depth: 2

Basic Syntax
-------------

Structured bindings (C++17) unpack arrays, pairs, tuples, and aggregates
into named variables in a single declaration.

.. code-block:: cpp

   // Array
   int arr[3] = {1, 2, 3};
   auto [a, b, c] = arr;   // a=1, b=2, c=3 (copies)

   // std::pair
   std::pair<std::string, int> kv{"answer", 42};
   auto [key, val] = kv;

   // std::tuple
   std::tuple<int, double, std::string> t{1, 2.0, "three"};
   auto [i, d, s] = t;

   // Struct aggregate (all non-static data members, in declaration order)
   struct Point { int x, y, z; };
   Point p{1, 2, 3};
   auto [px, py, pz] = p;

Binding Qualifiers
-------------------

The qualifiers on ``auto`` apply to the hidden underlying object, not to
the individual bindings.

.. code-block:: cpp

   // By value (copy of the source)
   auto [x, y] = p;

   // By const reference (read-only, no copy)
   const auto& [rx, ry] = p;
   // rx++; // ERROR: rx is const

   // By mutable reference (modifies source)
   auto& [mx, my] = p;
   mx = 10;   // modifies p.x

   // By forwarding reference (keeps original value category)
   auto&& [fx, fy] = p;   // for lvalue p: same as auto&

   // Example: map iteration without copying
   std::map<std::string, int> m{{"a",1},{"b",2}};
   for (const auto& [key, value] : m) {
       std::cout << key << ':' << value << '\n';
   }

   // Mutate map values:
   for (auto& [key, value] : m) { value *= 2; }

Structured Bindings with if / while
-------------------------------------

.. code-block:: cpp

   // if with initializer (C++17)
   if (auto [it, inserted] = myMap.insert({"key", 99}); inserted) {
       std::cout << "New element at " << it->second;
   }

   // Structured binding in while loop
   while (auto [ok, line] = read_line(stream); ok) {
       process(line);
   }

   // for with structured binding and index simulation
   std::vector<std::string> words{"alpha","beta","gamma"};
   for (auto [i, w] : words | std::views::enumerate) {
       std::cout << i << ": " << w << '\n';
   }

Customising Bindings: tuple_size / get
-----------------------------------------

Any type can support structured bindings by specialising ``std::tuple_size``
and ``std::tuple_element``, and providing ``get<I>``.

.. code-block:: cpp

   struct RGB {
       uint8_t r, g, b;
   };

   // Step 1: tuple_size tells the compiler how many bindings
   template <> struct std::tuple_size<RGB> : std::integral_constant<std::size_t, 3> {};

   // Step 2: tuple_element tells the type of each binding
   template <std::size_t I> struct std::tuple_element<I, RGB> { using type = uint8_t; };

   // Step 3: provide get<I> as free function or member
   template <std::size_t I>
   uint8_t& get(RGB& c) {
       if constexpr (I == 0) return c.r;
       else if constexpr (I == 1) return c.g;
       else return c.b;
   }
   template <std::size_t I>
   uint8_t get(const RGB& c) {
       if constexpr (I == 0) return c.r;
       else if constexpr (I == 1) return c.g;
       else return c.b;
   }

   RGB pixel{255, 128, 0};
   auto [red, green, blue] = pixel;   // uses our get<> specialisations

Lambda Capture of Structured Bindings (C++20)
----------------------------------------------

Before C++20, bindings could not be captured by name in lambdas.

.. code-block:: cpp

   // C++17: compilation error — cannot capture structured binding by name
   auto [x, y] = p;
   // auto lam = [x]{ return x * 2; };   // ERROR in C++17

   // C++20: capture is allowed
   auto [a, b] = p;
   auto lam = [a, b]{ return a + b; };   // OK in C++20
   auto lam2 = [&a]{ return a * 2; };    // capture by reference

   // Workaround for C++17:
   auto [a17, b17] = p;
   auto a_copy = a17;   // copy to named variable first
   auto lam17 = [a_copy]{ return a_copy * 2; };

Common Patterns
----------------

**Pattern 1: Insert-or-check with std::map**

.. code-block:: cpp

   std::map<int,int> cache;
   if (auto [it, ok] = cache.emplace(key, compute(key)); !ok) {
       std::cout << "cache hit: " << it->second;
   }

**Pattern 2: Unpack a function returning a struct**

.. code-block:: cpp

   struct BBox { float xmin, ymin, xmax, ymax; };
   BBox compute_bbox(const Polygon&);

   auto [x0, y0, x1, y1] = compute_bbox(poly);

**Pattern 3: Swap via structured binding**

.. code-block:: cpp

   // Not idiomatic for swap, but illustrates binding flexibility:
   auto pair = std::make_pair(10, 20);
   auto& [p1, p2] = pair;
   std::swap(p1, p2);   // pair is now {20, 10}

**Pattern 4: Error-code pair**

.. code-block:: cpp

   auto [ec, bytes_read] = socket.read(buf, 1024);
   if (ec) { handle_error(ec); return; }

Pitfalls
---------

**Pitfall 1: Binding to a temporary rvalue — dangling reference**

.. code-block:: cpp

   // BAD: binding by reference to a temporary
   auto& [x, y] = make_point();   // make_point() returns rvalue
   // x and y dangle immediately — UB

   // GOOD: bind by value or keep the object alive
   auto [x2, y2] = make_point();          // copy: safe
   auto pt = make_point();
   auto& [x3, y3] = pt;                   // reference to named object: safe

**Pitfall 2: Binding copies instead of references in hot loops**

.. code-block:: cpp

   // BAD: copies each string on every iteration
   for (auto [k, v] : big_map_of_strings) { /* ... */ }

   // GOOD: const reference
   for (const auto& [k, v] : big_map_of_strings) { /* ... */ }

**Pitfall 3: Structured binding to base class members**

.. code-block:: cpp

   struct Base { int a; };
   struct Derived : Base { int b; };

   Derived d{1, 2};
   // auto [x, y] = d;   // ERROR: bindings only cover Derived's own members?
   // Actually: structured binding on non-aggregate or multi-level inheritance
   // may not compile; use explicit member access instead.

**Pitfall 4: Mutating a binding doesn't change a value-captured source**

.. code-block:: cpp

   auto [x, y] = p;   // value copy
   x = 99;            // modifies the copy, NOT p.x
   // p.x is unchanged — use auto& [x,y] = p if mutation of source is intended

Cross-References
-----------------

* ``ranges-and-views.rst`` — views::enumerate and views::zip use bindings
* ``optional-variant-any.rst`` — destructuring pair/tuple results
* ``uniform-initialization.rst`` — aggregate initialization context
* ``modern-cpp20-23-cheat.rst`` — C++20 lambda capture of bindings
