Ranges and Views
================

.. contents:: Sections
   :local:
   :depth: 2

Core Idea: Pipelines
---------------------

The ``|`` operator chains view adaptors.  Each adaptor wraps the previous
range lazily — no intermediate containers are allocated.

.. code-block:: cpp

   #include <ranges>
   #include <vector>
   namespace views = std::views;

   std::vector<int> nums{1, -2, 3, -4, 5, 6};

   // Pipeline: filter negatives, square, take first 3
   auto result = nums
       | views::filter([](int x){ return x > 0; })
       | views::transform([](int x){ return x * x; })
       | views::take(3);

   for (int v : result) std::cout << v << ' ';   // 1 9 25

   // Materialize into a vector (C++23 ranges::to):
   auto vec = result | std::ranges::to<std::vector>();

Lazy vs Eager Evaluation
-------------------------

+----------------------------+---------------------------------+------------------------------+
| Lazy (views)               | Eager (algorithms)              | When to use which            |
+============================+=================================+==============================+
| No work until iterated     | Computes everything immediately | Lazy: streaming, large data, |
|                            |                                 | short-circuit needed         |
+----------------------------+---------------------------------+------------------------------+
| No intermediate allocation | Returns new container           | Eager: need random access,   |
|                            |                                 | result used multiple times   |
+----------------------------+---------------------------------+------------------------------+
| ``views::filter``          | ``std::ranges::copy_if``        |                              |
| ``views::transform``       | ``std::ranges::transform``      |                              |
+----------------------------+---------------------------------+------------------------------+
| Can compose indefinitely   | Each step allocates             |                              |
+----------------------------+---------------------------------+------------------------------+

Key View Adaptors
------------------

``views::filter``
~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   auto evens = nums | views::filter([](int x){ return x % 2 == 0; });
   // Skips odd elements lazily on each dereference

``views::transform``
~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   auto doubled = nums | views::transform([](int x){ return x * 2; });
   // Applies function on each element access

``views::take`` and ``views::drop``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   auto first5 = nums | views::take(5);    // at most 5 elements
   auto skip3  = nums | views::drop(3);    // skip first 3

   // Conditional variants:
   auto until_neg = nums | views::take_while([](int x){ return x >= 0; });
   auto from_pos  = nums | views::drop_while([](int x){ return x < 0; });

``views::reverse`` and ``views::keys`` / ``views::values``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   auto rev = nums | views::reverse;

   std::map<std::string, int> m{{"a",1},{"b",2},{"c",3}};
   for (auto& k : m | views::keys)   std::cout << k << ' ';
   for (auto& v : m | views::values) std::cout << v << ' ';

``views::zip`` (C++23)
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   std::vector<int>         ids{1, 2, 3};
   std::vector<std::string> names{"Alice","Bob","Carol"};

   for (auto [id, name] : views::zip(ids, names)) {
       std::cout << id << ": " << name << '\n';
   }

``views::enumerate`` (C++23)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   std::vector<std::string> words{"hello","world","cpp"};
   for (auto [i, w] : words | views::enumerate) {
       std::cout << i << ": " << w << '\n';   // 0: hello, 1: world, ...
   }

``views::chunk`` (C++23)
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   std::vector<int> data{1,2,3,4,5,6,7};
   for (auto chunk : data | views::chunk(3)) {
       // chunk is a view over {1,2,3}, then {4,5,6}, then {7}
       for (int v : chunk) std::cout << v << ' ';
       std::cout << '\n';
   }

``views::stride`` (C++23)
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   for (int v : data | views::stride(2))
       std::cout << v << ' ';   // 1 3 5 7

``views::iota`` — generated ranges
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   for (int i : views::iota(0, 10))         // [0, 10)
       std::cout << i << ' ';

   for (int i : views::iota(1) | views::take(5))  // infinite iota, bounded by take
       std::cout << i << ' ';   // 1 2 3 4 5

Range Algorithms vs Classic Algorithms
----------------------------------------

.. code-block:: cpp

   std::vector<int> v{5, 2, 8, 1, 9, 3};

   // Classic: iterator pairs
   std::sort(v.begin(), v.end());
   auto it = std::find(v.begin(), v.end(), 8);

   // Ranges: whole-range overloads (C++20)
   std::ranges::sort(v);
   auto it2 = std::ranges::find(v, 8);

   // Ranges support projections (no need for transform first):
   struct Person { std::string name; int age; };
   std::vector<Person> people{{"Alice",30},{"Bob",25},{"Carol",35}};

   std::ranges::sort(people, {}, &Person::age);   // sort by .age
   auto youngest = std::ranges::min_element(people, {}, &Person::age);

   // Count with projection:
   auto adults = std::ranges::count_if(people, [](int a){ return a >= 18; },
                                       &Person::age);

Writing a Custom View
----------------------

Implement a view that generates the Fibonacci sequence:

.. code-block:: cpp

   struct FibView : std::ranges::view_interface<FibView> {
       struct Iterator {
           using value_type        = long long;
           using difference_type   = std::ptrdiff_t;
           using iterator_category = std::input_iterator_tag;

           long long a = 0, b = 1;
           bool done = false;

           long long operator*()  const { return a; }
           Iterator& operator++() { auto c = a + b; a = b; b = c; return *this; }
           Iterator  operator++(int) { auto tmp = *this; ++(*this); return tmp; }
           bool operator==(std::default_sentinel_t) const { return done; }
       };

       Iterator begin() const { return {}; }
       std::default_sentinel_t end() const { return {}; }
   };

   for (long long f : FibView{} | views::take(10))
       std::cout << f << ' ';   // 0 1 1 2 3 5 8 13 21 34

Owning vs Borrowed Ranges
--------------------------

A **borrowed range** is one whose iterators remain valid after the range
object is destroyed (e.g., ``std::string_view``, ``std::span``).

.. code-block:: cpp

   // DANGER: temporary range — iterators dangle after line ends
   auto bad = std::string{"hello world"}
                  | views::split(' ');  // string temporary destroyed!

   // SAFE: keep the string alive
   std::string s = "hello world";
   auto good = s | views::split(' ');
   for (auto word : good) { /* ... */ }

   // std::span is always a borrowed range:
   void process(std::span<int> data) {
       auto positives = data | views::filter([](int x){ return x > 0; });
       // safe: span is borrowed; positives doesn't own data
   }

Common Compilation Errors
--------------------------

**Error 1: Range not a forward_range — can't use size()**

.. code-block:: cpp

   auto v = nums | views::filter([](int){ return true; });
   // auto n = std::ranges::size(v);   // ERROR: filtered range is not sized
   // Fix: std::ranges::distance(v) or materialize first

**Error 2: View from temporary rvalue container**

.. code-block:: cpp

   auto view = get_vector() | views::transform([](int x){ return x*2; });
   // get_vector() returns by value — the vector is destroyed!
   // view's iterators are dangling.

**Error 3: Mutating through a const view**

.. code-block:: cpp

   const std::vector<int> cv{1,2,3};
   auto t = cv | views::transform([](int x){ return x * 2; });
   // *t.begin() = 99;   // ERROR: result of transform is an rvalue

**Error 4: zip requires same-length ranges (C++23)**

.. code-block:: cpp

   // zip stops at the shorter range — no error, but may silently skip data
   // Use zip_transform or check sizes before zipping if they must match

Cross-References
-----------------

* ``templates-concepts.rst`` — ``std::ranges::range`` concept
* ``modern-cpp20-23-cheat.rst`` — ranges as a C++20 feature overview
* ``performance-tips-oop.rst`` — laziness and cache efficiency
* ``structured-bindings.rst`` — auto [i, v] pattern with enumerate/zip
