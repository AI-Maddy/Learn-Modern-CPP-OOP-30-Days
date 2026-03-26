Concepts and Constraints (C++20)
=================================

Motivation
----------

Before C++20, template error messages were infamous.  Pass the wrong type to
``std::sort`` and the compiler might emit forty lines of nested template errors
pointing deep into library internals — far from the actual mistake.

C++20 **concepts** fix this.  A concept is a named compile-time predicate that
constrains template parameters.  When a constraint is violated:

* The compiler reports a clear, one-line error at the call site.
* Overload resolution picks the *most constrained* matching overload automatically.
* Code communicates intent — ``Sortable T`` is self-documenting.

Concepts are not a runtime mechanism.  They have zero overhead; they exist only
during compilation.

The ``requires`` Clause
-----------------------

A ``requires`` clause attaches a constraint to a template or function.  The
constraint is a compile-time Boolean expression.

.. code-block:: cpp

    #include <concepts>
    #include <string>
    #include <iostream>

    // Constrain with a standard library concept
    template <typename T>
    requires std::integral<T>
    T factorial(T n) {
        return (n <= 1) ? T{1} : n * factorial(n - 1);
    }

    // factorial(5)   -- OK, int satisfies std::integral
    // factorial(5.0) -- ERROR: double does not satisfy std::integral
    //                   Compiler says: "constraints not satisfied" at the call site

    // requires clause with a compound predicate
    template <typename T>
    requires std::integral<T> || std::floating_point<T>
    T square(T v) { return v * v; }

    // Inline requires — after the template parameter list
    template <typename T>
    T cube(T v) requires std::is_arithmetic_v<T> {
        return v * v * v;
    }

Defining Your Own Concepts
--------------------------

A concept is defined with the ``concept`` keyword.  The body is a ``requires``
expression that tests whether the type satisfies certain syntactic and semantic
requirements.

.. code-block:: cpp

    #include <concepts>
    #include <string>
    #include <sstream>

    // Concept: T must support operator<< to std::ostream
    template <typename T>
    concept Printable = requires(T v, std::ostream& os) {
        { os << v } -> std::same_as<std::ostream&>;
    };

    // Concept: T must have .size() returning something convertible to size_t
    template <typename T>
    concept Sizeable = requires(T t) {
        { t.size() } -> std::convertible_to<std::size_t>;
    };

    // Concept: T is a container — has begin(), end(), and size()
    template <typename T>
    concept Container = requires(T t) {
        { t.begin()  } -> std::input_or_output_iterator;
        { t.end()    } -> std::sentinel_for<decltype(t.begin())>;
        { t.size()   } -> std::convertible_to<std::size_t>;
        requires std::copy_constructible<T>;
    };

    // Use the concept
    template <Printable T>
    void print(const T& v) {
        std::cout << v << '\n';
    }

    template <Container C>
    void print_all(const C& c) {
        for (const auto& elem : c)
            std::cout << elem << ' ';
        std::cout << '\n';
    }

    // print("hello");           // OK: string literals support <<
    // print(std::vector<int>{}); // ERROR: vector<int> does not satisfy Printable

Abbreviated Function Templates
-------------------------------

C++20 adds abbreviated syntax: using ``auto`` as a parameter type creates a
function template, and a concept name before ``auto`` constrains it.

.. code-block:: cpp

    #include <concepts>

    // Abbreviated: equivalent to template <typename T> T add(T a, T b)
    auto add(auto a, auto b) { return a + b; }

    // Constrained abbreviated syntax
    std::integral auto add_ints(std::integral auto a, std::integral auto b) {
        return a + b;
    }

    // Return type constraint: the result must satisfy std::integral
    std::integral auto double_it(std::integral auto n) {
        return n * 2;
    }

    add_ints(1, 2);       // OK
    // add_ints(1.0, 2.0); // ERROR: double does not satisfy std::integral

Concept Composition: ``&&`` and ``||``
---------------------------------------

Concepts compose naturally using ``&&`` (conjunction) and ``||`` (disjunction).

.. code-block:: cpp

    #include <concepts>
    #include <iterator>

    // Conjunction: T must be both integral and signed
    template <typename T>
    concept SignedIntegral = std::integral<T> && std::is_signed_v<T>;

    // Disjunction: T is either integral or floating-point
    template <typename T>
    concept Arithmetic = std::integral<T> || std::floating_point<T>;

    // Negation: T is not a pointer
    template <typename T>
    concept NotPointer = !std::is_pointer_v<T>;

    // Complex composition
    template <typename T>
    concept SortableRange = std::ranges::random_access_range<T>
                         && std::sortable<std::ranges::iterator_t<T>>;

    template <SortableRange R>
    void my_sort(R& r) {
        std::ranges::sort(r);
    }

    // std::vector<int> v{3,1,2}; my_sort(v);  -- OK
    // std::list<int>   l{3,1,2}; my_sort(l);  -- ERROR: list is not random-access

Standard Library Concepts
--------------------------

The ``<concepts>`` and ``<iterator>`` headers provide a rich vocabulary.

.. list-table::
   :header-rows: 1
   :widths: 35 65

   * - Concept
     - Meaning
   * - ``std::same_as<T, U>``
     - T and U are the same type
   * - ``std::derived_from<D, B>``
     - D is publicly derived from B
   * - ``std::convertible_to<From, To>``
     - From converts implicitly to To
   * - ``std::integral<T>``
     - T is an integral type
   * - ``std::floating_point<T>``
     - T is a floating-point type
   * - ``std::copy_constructible<T>``
     - T can be copy-constructed
   * - ``std::move_constructible<T>``
     - T can be move-constructed
   * - ``std::invocable<F, Args...>``
     - F is callable with Args
   * - ``std::regular<T>``
     - T is copyable, movable, default-constructible, and equality-comparable
   * - ``std::ranges::range<T>``
     - T has begin() and end()
   * - ``std::ranges::sized_range<T>``
     - range with O(1) size()

.. code-block:: cpp

    #include <concepts>
    #include <ranges>
    #include <vector>

    // Accept any range whose elements are printable
    template <std::ranges::range R>
    requires Printable<std::ranges::range_value_t<R>>
    void dump(const R& r) {
        for (const auto& elem : r) std::cout << elem << ' ';
        std::cout << '\n';
    }

    std::vector<int> v{1, 2, 3};
    dump(v);  // OK

SFINAE vs Concepts — Why Concepts Win
---------------------------------------

**SFINAE** (Substitution Failure Is Not An Error) was the pre-C++20 technique for
constraining templates.  It works by exploiting the fact that template substitution
failure is not an error — it just removes the candidate.

.. code-block:: cpp

    #include <type_traits>

    // SFINAE approach — cryptic and error-prone
    template <typename T,
              typename = std::enable_if_t<std::is_integral_v<T>>>
    T old_factorial(T n) {
        return (n <= 1) ? T{1} : n * old_factorial(n - 1);
    }

    // Concepts approach — clear, readable, better errors
    template <std::integral T>
    T factorial(T n) {
        return (n <= 1) ? T{1} : n * factorial(n - 1);
    }

Comparison::

    SFINAE                                Concepts
    ────────────────────────────────────  ────────────────────────────────────
    enable_if_t<..., void*> = nullptr     requires std::integral<T>
    50+ line error messages               "constraints not satisfied" — 1 line
    No overload ordering                  Most-constrained wins automatically
    Cannot be named / reused easily       Named, composable, self-documenting
    Works in C++11                        Requires C++20

**Subsumption**: when two overloads satisfy a call, the compiler picks the one whose
constraints *subsume* (are a stricter version of) the other's.

.. code-block:: cpp

    template <std::integral T>
    void process(T v) { std::cout << "integral\n"; }

    template <std::signed_integral T>  // signed_integral subsumes integral
    void process(T v) { std::cout << "signed integral\n"; }

    process(42);   // "signed integral" — more constrained wins
    process(42u);  // "integral"        — unsigned not signed, less constrained wins

Self-Check Questions
---------------------

#. **What is a concept in C++20 and how does it improve template error messages?**

   A concept is a named compile-time Boolean predicate that constrains template
   parameters.  When a constraint is violated, the compiler reports "constraints not
   satisfied" at the call site, not deep inside library instantiation chains.

#. **What is the difference between a requires clause and a requires expression?**

   A requires *clause* attaches a constraint to a template: ``template <typename T>
   requires Integral<T>``.  A requires *expression* tests whether operations compile:
   ``requires(T t) { { t.size() } -> convertible_to<size_t>; }``.

#. **How does concept subsumption determine which overload wins?**

   If one overload's constraint logically implies another's (it subsumes it), the more
   constrained overload is preferred.  E.g., ``std::signed_integral`` subsumes
   ``std::integral``, so the signed version wins for signed types.

#. **What does the abbreviated function template syntax** ``void f(Concept auto x)``
   **mean?**

   It declares a function template where the unnamed type parameter must satisfy
   ``Concept``.  It is shorthand for ``template <Concept T> void f(T x)``.

#. **Why is** ``std::regular<T>`` **considered the baseline concept for generic
   algorithms?**

   Regular types support copy, move, default construction, and equality comparison —
   the minimum operations that most algorithms require to work correctly.
