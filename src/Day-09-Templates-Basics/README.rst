Day 09: Templates Basics
=========================

Learning Outcomes
-----------------

After completing this day you will be able to:

* Write function and class templates with multiple type and non-type parameters.
* Explain what template type deduction is and predict the deduced type for common
  argument categories (value, lvalue reference, const reference).
* Implement full and partial template specialisations for a class template.
* Write a variadic template using both the recursive pattern and C++17 fold
  expressions.
* Explain the instantiation cost model and apply explicit instantiation declarations
  to reduce compilation time.

Key Concepts
------------

* **Function template** — a blueprint for a family of functions; the compiler
  generates a concrete overload for each set of deduced argument types.
* **Class template** — a blueprint for a family of classes; both type and non-type
  parameters are supported.
* **Template type deduction** — the compiler infers ``T`` from call-site argument
  types; mirrors ``auto`` deduction rules.
* **Non-type template parameter** — a compile-time value (integer, pointer, enum)
  that becomes part of the type identity.
* **Full specialisation** — a hand-written implementation for one exact set of
  template arguments, overriding the primary template.
* **Partial specialisation** — a hand-written implementation for a family of
  argument patterns; available for class templates only.
* **Variadic template** — a template accepting any number of parameters; expanded
  using ``...`` and simplified in C++17 with fold expressions.
* **Instantiation cost** — each unique template argument set produces separate
  compiled code; explicit instantiation declarations limit duplication.

Hands-On Task
-------------

Build a **type-safe heterogeneous tuple printer**:

#. Write a class template ``Pair<T, U>`` with ``first`` and ``second`` members,
   a deduction guide, and a ``to_string()`` member that formats both values.
#. Specialise ``Pair<bool, bool>`` to print ``"true/false"`` notation.
#. Write a variadic function template ``print_tuple(Args... args)`` that prints
   each argument on a new line using a C++17 fold expression.
#. Add a non-type parameter ``Precision`` (``int``) to a ``FixedPoint<T, Precision>``
   class template so that ``FixedPoint<double, 2>`` always displays two decimal places.

What You Will Build
-------------------

A header-only mini-library that demonstrates all template features: a pair type
with CTAD and specialisation, a variadic printer using fold expressions, and a
fixed-precision numeric wrapper — all usable without any runtime type information.

Suggested Study Order
---------------------

#. Read ``theory.rst`` sections 1–2 (function templates, class templates) — *20 min*
#. Read ``theory.rst`` sections 3–4 (deduction, non-type parameters) — *15 min*
#. Read ``theory.rst`` sections 5–6 (specialisation, variadic) — *20 min*
#. Read ``theory.rst`` section 7 (instantiation cost) — *10 min*
#. Read ``pitfalls.rst`` — *15 min*
#. Implement the hands-on task in ``main.cpp`` — *45 min*
#. Answer self-check questions in ``theory.rst`` — *10 min*

Build and Run
-------------

.. code-block:: bash

    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Debug
    cmake --build . --target day09
    ./day09

Related Days
------------

* **Day 08** — Advanced OOP Patterns (CRTP uses templates; prerequisite)
* **Day 10** — Concepts and Constraints C++20 (constrains template parameters)
* **Day 11** — Generic OOP Design (policy-based design builds on class templates)
* **Day 20** — Static Polymorphism and CRTP (advanced template patterns)
