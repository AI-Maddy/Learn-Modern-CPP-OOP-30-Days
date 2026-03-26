Templates Basics
================

Motivation
----------

Imagine writing ``max()`` once for ``int``, then again for ``double``, then again for
``std::string``.  Duplicated logic, duplicated bugs, duplicated maintenance.  C++
templates let you write code once and instantiate it for any type that supports the
required operations — fully type-safe, zero runtime overhead.

Templates are the foundation of the C++ Standard Library.  ``std::vector``,
``std::sort``, ``std::pair``, ``std::optional`` — all templates.  Mastering them
unlocks library-quality reusable code.

Function Templates
------------------

A function template is a blueprint.  The compiler stamps out a concrete function for
each combination of template arguments it encounters.

.. code-block:: cpp

    #include <string>
    #include <iostream>

    // Template parameter T is deduced from the call arguments
    template <typename T>
    T max_of(T a, T b) {
        return (a > b) ? a : b;
    }

    int    i = max_of(3, 7);          // T = int
    double d = max_of(1.5, 2.7);      // T = double
    // explicit template argument when deduction would be ambiguous
    auto x = max_of<long>(42, 100L);

**Multiple template parameters**

.. code-block:: cpp

    // Trailing return type deduced from the expression type
    template <typename T, typename U>
    auto add(T a, U b) -> decltype(a + b) {
        return a + b;
    }

    // C++14: auto return type (compiler deduces from the return statement)
    template <typename T, typename U>
    auto multiply(T a, U b) { return a * b; }

    auto r1 = add(1, 2.5);     // double
    auto r2 = multiply(3, 4L); // long

Class Templates
---------------

Class templates parametrise entire classes.  Every member function is itself a
template function of the class template parameters.

.. code-block:: cpp

    #include <cassert>
    #include <stdexcept>

    // A fixed-capacity stack; Capacity has a default value
    template <typename T, std::size_t Capacity = 16>
    class FixedStack {
        T           data_[Capacity];
        std::size_t size_{0};
    public:
        void push(const T& v) {
            if (size_ == Capacity) throw std::overflow_error{"stack full"};
            data_[size_++] = v;
        }
        T pop() {
            if (size_ == 0) throw std::underflow_error{"stack empty"};
            return data_[--size_];
        }
        bool        empty() const { return size_ == 0; }
        std::size_t size()  const { return size_; }
    };

    FixedStack<int, 8> int_stack;    // explicit capacity
    FixedStack<double> dbl_stack;    // default capacity = 16

    int_stack.push(1);
    int_stack.push(2);
    assert(int_stack.pop() == 2);

**Out-of-class member function definition**

.. code-block:: cpp

    template <typename T, std::size_t Capacity>
    void FixedStack<T, Capacity>::push(const T& v) {
        if (size_ == Capacity) throw std::overflow_error{"stack full"};
        data_[size_++] = v;
    }
    // Both template parameters must be repeated on every out-of-class definition.

Template Type Deduction
-----------------------

The compiler infers template arguments from the function call arguments.  The rules
closely mirror the rules for ``auto`` deduction.

.. code-block:: cpp

    template <typename T>
    void inspect(T x) {}    // T is a copy — top-level cv qualifiers stripped

    int n = 42;
    const int cn = 42;
    inspect(n);    // T = int
    inspect(cn);   // T = int   (const stripped for pass-by-value)
    inspect(3.14); // T = double

    template <typename T>
    void inspect_ref(T& x) {}   // T deduced without ref; x binds lvalue

    inspect_ref(n);    // T = int,       x is int&
    // inspect_ref(42); // ERROR: cannot bind lvalue ref to rvalue

    template <typename T>
    void inspect_cref(const T& x) {}  // binds to anything

    inspect_cref(42);  // T = int, x is const int&

    // C++17: class template argument deduction (CTAD)
    std::pair  p{1, 2.5};   // deduced as pair<int, double>
    std::vector v{1, 2, 3}; // deduced as vector<int>

Non-Type Template Parameters
-----------------------------

Template parameters can be compile-time values, not just types.  Common examples:
integer constants, enum values, and (C++20) floating-point values.

.. code-block:: cpp

    #include <array>
    #include <numeric>

    // N is a compile-time constant baked into the type
    template <typename T, std::size_t N>
    T sum_array(const std::array<T, N>& arr) {
        return std::accumulate(arr.begin(), arr.end(), T{});
    }

    std::array<int, 4>    a4{1, 2, 3, 4};
    std::array<double, 3> a3{1.1, 2.2, 3.3};
    int    s1 = sum_array(a4);   // N deduced as 4
    double s2 = sum_array(a3);   // N deduced as 3

    // Compile-time dimension type: the size IS the type
    template <std::size_t Rows, std::size_t Cols>
    struct Matrix {
        double data[Rows][Cols]{};
        static constexpr std::size_t rows = Rows;
        static constexpr std::size_t cols = Cols;
    };

    Matrix<3, 4> m34;
    // Matrix<3,4> and Matrix<4,3> are different types — the compiler enforces this

Full and Partial Template Specialisation
-----------------------------------------

A **full specialisation** provides a completely different implementation for one exact
set of template arguments.  A **partial specialisation** handles a family of
argument combinations.

.. code-block:: cpp

    #include <string>

    // Primary template — works for arithmetic types
    template <typename T>
    struct Serialise {
        static std::string to_json(const T& v) {
            return std::to_string(v);
        }
    };

    // Full specialisation for bool
    template <>
    struct Serialise<bool> {
        static std::string to_json(bool v) {
            return v ? "true" : "false";
        }
    };

    // Full specialisation for std::string
    template <>
    struct Serialise<std::string> {
        static std::string to_json(const std::string& v) {
            return '"' + v + '"';
        }
    };

    // Partial specialisation — any pointer type T*
    template <typename T>
    struct Serialise<T*> {
        static std::string to_json(const T* p) {
            return p ? Serialise<T>::to_json(*p) : "null";
        }
    };

    auto j1 = Serialise<int>::to_json(42);           // "42"
    auto j2 = Serialise<bool>::to_json(true);        // "true"
    auto j3 = Serialise<std::string>::to_json("hi"); // "\"hi\""
    int n = 7;
    auto j4 = Serialise<int*>::to_json(&n);          // "7"

Variadic Templates
------------------

Variadic templates accept any number of template arguments.  They underpin
``std::tuple``, ``std::variant``, and perfect forwarding.

.. code-block:: cpp

    #include <iostream>

    // Base case: empty pack
    void print_all() { std::cout << '\n'; }

    // Recursive case: peel off the first argument
    template <typename First, typename... Rest>
    void print_all(First&& first, Rest&&... rest) {
        std::cout << first;
        if constexpr (sizeof...(rest) > 0)
            std::cout << ", ";
        print_all(std::forward<Rest>(rest)...);  // pack expansion
    }

    print_all(1, 2.5, "hello", true);
    // Output: 1, 2.5, hello, 1

    // C++17 fold expressions — cleaner than recursion for simple operations
    template <typename... Args>
    auto sum_all(Args... args) {
        return (... + args);    // left fold: ((args[0]+args[1])+args[2])...
    }

    auto total = sum_all(1, 2, 3, 4, 5);  // 15

    // Compile-time argument count
    template <typename... T>
    constexpr std::size_t count() { return sizeof...(T); }
    static_assert(count<int, double, char>() == 3);

ASCII diagram — fold expression expansion::

    sum_all(1, 2, 3, 4)
    ─────────────────────────────────────
    (... + args)  left fold expands to:

      ((1 + 2) + 3) + 4
       ───────
         3   + 3) + 4
         ──────────
              6   + 4  =  10

Template Instantiation Cost
----------------------------

Every unique set of template arguments produces a separate compiled entity.
This has implications for compile time and binary size.

.. code-block:: cpp

    template <typename T>
    T identity(T v) { return v; }

    identity(1);    // instantiates identity<int>
    identity(1.0);  // instantiates identity<double>
    identity('a');  // instantiates identity<char>
    // Three separate functions in the binary.

**Explicit instantiation** — declare in a header, define in one .cpp

.. code-block:: cpp

    // stack.h
    extern template class FixedStack<int, 16>;    // suppress implicit instantiation

    // stack.cpp
    template class FixedStack<int, 16>;           // one explicit instantiation

**Non-template base class** — factor out type-independent logic

.. code-block:: cpp

    class VectorBase {
    protected:
        void*       data_;
        std::size_t size_, capacity_;
        void grow();   // shared machine code — NOT duplicated per T
    };

    template <typename T>
    class Vector : private VectorBase {
    public:
        void push_back(const T& v) {
            if (size_ == capacity_) grow();   // calls shared code
            new (static_cast<T*>(data_) + size_++) T(v);
        }
    };

Self-Check Questions
---------------------

#. **What does "template type deduction" mean, and how does it differ from a cast?**

   Deduction is the compiler inferring ``T`` from call-site argument types at compile
   time.  A cast is an explicit programmer-written conversion that may execute at
   runtime and can change the value representation.

#. **What is the difference between full and partial specialisation?**

   Full specialisation handles one exact set of arguments.  Partial specialisation
   handles a family (e.g., all ``T*``).  Partial specialisation is only available
   for class/struct templates.

#. **Why do variadic templates use** ``...`` **in pack expansions?**

   The ``...`` unpacks a parameter pack into a comma-separated list in the context
   where it appears.  Without it the compiler cannot access the individual elements.

#. **What is a fold expression and what C++ version introduced it?**

   A fold expression collapses a parameter pack using a binary operator.
   ``(... + args)`` is a left fold that chains ``+``.  Introduced in C++17.

#. **How can explicit instantiation declarations reduce compile time?**

   They tell the compiler not to instantiate the template in each translation unit;
   one explicit definition in a .cpp file handles it, avoiding redundant work.
