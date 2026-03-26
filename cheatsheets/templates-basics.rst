Templates Basics
================

.. contents:: Sections
   :local:
   :depth: 2

Function Template Deduction
----------------------------

The compiler infers template arguments from call-site argument types.
Deduction never considers the return type.

.. code-block:: cpp

   template <typename T>
   T add(T a, T b) { return a + b; }

   add(1, 2);         // T = int   (deduced)
   add(1.0, 2.0);     // T = double
   add(1, 2.0);       // ERROR: T ambiguous (int vs double)
   add<double>(1, 2); // OK: explicit override forces T = double

Deduction with references and const stripping:

.. code-block:: cpp

   template <typename T>
   void show(T& x) {}    // T deduced as non-reference

   int n = 5;
   const int cn = 5;
   show(n);   // T = int,       param = int&
   show(cn);  // T = const int, param = const int&

   // Forwarding references (T&&) apply special deduction rules:
   template <typename T>
   void sink(T&& x) {}

   sink(5);   // T = int,  param = int&&   (rvalue)
   sink(n);   // T = int&, param = int&    (ref-collapse)

Class Template Deduction Guides (C++17)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   template <typename T>
   struct Box {
       T value;
       Box(T v) : value(v) {}
   };

   Box b{42};       // T deduced as int  (C++17 CTAD)
   Box c{"hello"};  // T deduced as const char*

   // Explicit deduction guide (overrides implicit):
   template <typename T>
   Box(T*) -> Box<T>;   // Box(int*) -> Box<int>, not Box<int*>

Class Templates
---------------

.. code-block:: cpp

   template <typename Key, typename Value>
   class HashMap {
   public:
       void insert(const Key& k, const Value& v);
       Value*       find(const Key& k);
       const Value* find(const Key& k) const;

   private:
       struct Bucket { Key k; Value v; Bucket* next = nullptr; };
       Bucket* table_[256] = {};
   };

   HashMap<std::string, int> word_count;
   HashMap<int, std::vector<double>> lookup;

Member functions defined outside the class body:

.. code-block:: cpp

   template <typename Key, typename Value>
   void HashMap<Key, Value>::insert(const Key& k, const Value& v) {
       std::size_t slot = std::hash<Key>{}(k) % 256;
       table_[slot] = new Bucket{k, v, table_[slot]};
   }

Non-Type Template Parameters (NTTPs)
-------------------------------------

.. code-block:: cpp

   template <typename T, std::size_t N>
   struct FixedArray {
       T data[N];
       constexpr std::size_t size() const noexcept { return N; }
       T& operator[](std::size_t i) { return data[i]; }
   };

   FixedArray<int, 5>   a;    // 5 ints on the stack, zero overhead
   FixedArray<char, 256> buf;

   // Floating-point NTTPs allowed in C++20:
   template <double Threshold>
   bool exceeds(double v) { return v > Threshold; }

   // auto NTTP (C++17): type deduced from argument
   template <auto Value>
   void print_val() { std::cout << Value << '\n'; }
   print_val<42>();
   print_val<3.14>();
   print_val<'Z'>();

Full Specialization
-------------------

Replaces the entire template body for one specific argument set.

.. code-block:: cpp

   // Primary template
   template <typename T>
   struct JsonSerializer {
       static std::string serialize(const T& v) { return std::to_string(v); }
   };

   // Full specialization for bool
   template <>
   struct JsonSerializer<bool> {
       static std::string serialize(bool v) { return v ? "true" : "false"; }
   };

   // Full specialization for std::string
   template <>
   struct JsonSerializer<std::string> {
       static std::string serialize(const std::string& v) {
           return '"' + v + '"';
       }
   };

   // Function template full specialization:
   template <typename T> T zero()           { return T{}; }
   template <>           std::string zero() { return ""; }

Partial Specialization
-----------------------

Only **class** templates (not function templates) support partial specialization.

.. code-block:: cpp

   // Primary: T is not a pointer
   template <typename T>
   struct Storage { T value; };

   // Partial: T is a pointer — store the pointee, not the pointer
   template <typename T>
   struct Storage<T*> { T value; };   // note: T here is the pointee

   // Partial: pairs where both types are the same
   template <typename A, typename B>
   struct Pair { A first; B second; };

   template <typename T>
   struct Pair<T, T> {
       T first, second;
       T sum() const { return first + second; }
   };

   // Partial: const version
   template <typename T>
   struct Storage<const T> { const T value; };

Explicit Instantiation
-----------------------

Force the compiler to emit a specific instantiation in one translation unit,
preventing redundant instantiation in every TU that includes the header.

.. code-block:: cpp

   // --- algo.h ---
   template <typename T>
   void sort_vec(std::vector<T>& v);

   extern template void sort_vec<int>(std::vector<int>&);     // don't instantiate here
   extern template void sort_vec<double>(std::vector<double>&);

   // --- algo.cpp ---
   #include "algo.h"
   template <typename T>
   void sort_vec(std::vector<T>& v) { std::sort(v.begin(), v.end()); }

   template void sort_vec<int>(std::vector<int>&);      // instantiate here
   template void sort_vec<double>(std::vector<double>&);

+----------------------------------+------------------------------------------+
| Without explicit instantiation   | With explicit instantiation              |
+==================================+==========================================+
| Every TU re-instantiates         | One TU owns each instantiation           |
+----------------------------------+------------------------------------------+
| Larger .o files, slower link     | Smaller objects, faster link             |
+----------------------------------+------------------------------------------+
| Duplicate symbols merged by      | Cleaner build graph, easier             |
| linker (wastes time)             | to reason about                          |
+----------------------------------+------------------------------------------+

Template Instantiation Bloat
-----------------------------

Every distinct argument combination creates a **separate** machine-code copy.

.. code-block:: cpp

   // BAD: unique instantiation per pointer type
   template <typename T>
   void sort_range(T* begin, T* end) {
       // ... 500 bytes of code each time ...
   }
   sort_range(int_arr,    int_arr+10);   // instantiation 1
   sort_range(double_arr, double_arr+5); // instantiation 2
   sort_range(char_arr,   char_arr+100); // instantiation 3

   // GOOD: type-erased core + thin forwarding wrapper
   void sort_core(void* begin, void* end, std::size_t elem,
                  bool(*less)(const void*, const void*));

   template <typename T>
   void sort_range(T* b, T* e) {
       sort_core(b, e, sizeof(T), [](const void* a, const void* b){
           return *static_cast<const T*>(a) < *static_cast<const T*>(b);
       });
   }
   // sort_core body compiled once; wrapper is tiny inline

Variadic Templates and Pack Expansion
--------------------------------------

.. code-block:: cpp

   // Recursive variadic: peel off one argument per call
   void log() {}   // base case

   template <typename Head, typename... Tail>
   void log(Head h, Tail... tail) {
       std::cout << h << ' ';
       log(tail...);   // pack expanded: tail... -> t1, t2, ...
   }
   log(1, "hello", 3.14);   // prints: 1 hello 3.14

   // sizeof... — count elements at compile time
   template <typename... Ts>
   constexpr std::size_t count() { return sizeof...(Ts); }
   static_assert(count<int, double, char>() == 3);

   // Inherit from all bases simultaneously
   template <typename... Policies>
   struct Engine : Policies... {
       using Policies::process...;   // bring all overloads into scope
   };

Pack Expansion Patterns
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

   // Expand types AND arguments in parallel
   template <typename... Ts>
   auto refs(Ts&... args) { return std::tuple<Ts&...>(args...); }

   // Expand into initializer_list for side effects
   template <typename... Ts>
   void print_all(Ts&&... args) {
       (void)std::initializer_list<int>{
           (std::cout << std::forward<Ts>(args) << '\n', 0)...
       };
   }

   // std::apply pattern
   template <typename F, typename Tuple, std::size_t... I>
   auto apply_impl(F&& f, Tuple&& t, std::index_sequence<I...>) {
       return f(std::get<I>(std::forward<Tuple>(t))...);
   }

Fold Expressions (C++17)
-------------------------

.. code-block:: cpp

   template <typename... Ts> auto sum(Ts... v)     { return (v + ...);       }
   template <typename... Ts> auto product(Ts... v) { return (... * v);       }
   template <typename... Ts> auto sum0(Ts... v)    { return (v + ... + 0);   }
   template <typename... Ts> void print(Ts... v)   { (std::cout << ... << v);}

   template <typename... Ts>
   bool all_positive(Ts... v) { return (... && (v > 0)); }

   template <typename T, typename... Ts>
   bool any_eq(T t, Ts... v) { return ((v == t) || ...); }

+----------------+-------------------+-----------------------------------+
| Fold form      | Syntax            | Expansion (a,b,c)                 |
+================+===================+===================================+
| Unary right    | ``(e op ...)``    | a op (b op c)                     |
+----------------+-------------------+-----------------------------------+
| Unary left     | ``(... op e)``    | (a op b) op c                     |
+----------------+-------------------+-----------------------------------+
| Binary right   | ``(e op ... op I)``| a op (b op (c op I))             |
+----------------+-------------------+-----------------------------------+
| Binary left    | ``(I op ... op e)``| ((I op a) op b) op c             |
+----------------+-------------------+-----------------------------------+

if constexpr (C++17)
---------------------

Discards the non-taken branch **at instantiation time** — eliminates
spurious type errors from code paths that don't apply:

.. code-block:: cpp

   template <typename T>
   std::string stringify(const T& v) {
       if constexpr (std::is_same_v<T, bool>)
           return v ? "true" : "false";
       else if constexpr (std::is_arithmetic_v<T>)
           return std::to_string(v);
       else
           return std::string(v);   // only compiled for string-constructible T
   }

Pitfalls
---------

**Pitfall 1: Two-phase name lookup in template bases**

.. code-block:: cpp

   // BAD: non-dependent name not found in base
   template <typename T>
   struct Derived : Base<T> {
       void foo() { bar(); }   // ERROR: bar not found at definition time
   };

   // GOOD: make name dependent
   template <typename T>
   struct Derived : Base<T> {
       void foo() { this->bar(); }    // OK: looked up at instantiation
   };

**Pitfall 2: Missing typename for dependent type names**

.. code-block:: cpp

   template <typename C>
   void process(C& container) {
       C::iterator it;            // ERROR: is iterator a type or a value?
       typename C::iterator it;   // GOOD
   }

**Pitfall 3: Negative NTTP causes UB or hard error**

.. code-block:: cpp

   template <std::size_t N>       // GOOD: size_t can't be negative
   struct Buffer {
       static_assert(N > 0, "Buffer size must be positive");
       char data[N];
   };

**Pitfall 4: ODR violations with explicit specializations**

.. code-block:: cpp

   // file_a.cpp: template<> void f<int>() { /* version A */ }
   // file_b.cpp: template<> void f<int>() { /* version B */ }
   // Undefined behaviour! Declare specialization in header; define in ONE .cpp

Cross-References
-----------------

* ``templates-concepts.rst`` — constrained templates with C++20 concepts
* ``crtp-static-polymorphism.rst`` — CRTP builds on class templates
* ``modern-cpp20-23-cheat.rst`` — abbreviated templates (``auto`` params)
* ``performance-tips-oop.rst`` — instantiation cost and code-size tradeoffs
