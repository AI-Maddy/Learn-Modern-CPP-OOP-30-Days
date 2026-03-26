Move Semantics and Rvalue References
=====================================

Motivation
----------

Before C++11, returning a ``std::vector<int>`` from a function meant a deep copy:
allocate new memory, copy every element, deallocate the old.  For a vector with a
million elements, that is expensive.

Move semantics allow the ownership of resources to be *transferred* instead of
*copied*.  A moved-from object is left in a valid but unspecified state; the
receiving object acquires the resources without any allocation.

C++11 achieves this through **rvalue references** — a new reference category that
binds only to temporaries and explicitly moved-from objects.

Value Categories — lvalue, rvalue, xvalue
------------------------------------------

Every expression in C++ has a **type** and a **value category**.

* **lvalue** (locator value) — an expression that refers to a persistent object in
  memory.  You can take its address.  Examples: named variables, dereferenced
  pointers, subscript expressions on arrays.

* **rvalue** (right-hand-side value) — an expression that does not refer to a
  persistent object.  It is a temporary or a computed value.  You cannot take its
  address in the usual sense.  Examples: literals (``42``, ``3.14``), function calls
  returning by value.

* **xvalue** (expiring value) — an rvalue that names an object whose resources can
  be moved.  Produced by ``std::move()``, ``std::forward()``, or a function returning
  ``T&&``.

.. code-block:: cpp

    int x = 42;
    int& lref   = x;       // lvalue reference — binds to x (an lvalue)
    int&& rref  = 42;      // rvalue reference — binds to the temporary 42
    int&& rref2 = std::move(x);  // xvalue — x is about to be moved from

    // &x is valid (lvalue has an address)
    // &42 is NOT valid (rvalue does not)

ASCII diagram — value categories::

    Expressions
    ├── glvalue (has identity — can be referred to)
    │     ├── lvalue  (persistent object: named variable, *ptr, a[i])
    │     └── xvalue  (expiring: std::move(x), function returning T&&)
    └── rvalue  (no persistent identity)
          ├── prvalue (pure rvalue: 42, true, "hi", f() returning T)
          └── xvalue  (shared with glvalue — "moved-from" objects)

Rvalue References
-----------------

An rvalue reference ``T&&`` binds to rvalues (including xvalues) but not to lvalues.
It signals "this object can be pillaged — it won't be needed again."

.. code-block:: cpp

    void sink(std::string&&  s) { /* can steal s's buffer */ }
    void keep(const std::string& s) { /* read-only, binds to anything */ }

    std::string name = "Alice";
    keep(name);            // OK: lvalue binds to const&
    sink(std::move(name)); // OK: xvalue binds to &&; name is now valid but empty
    // sink(name);         // ERROR: lvalue does NOT bind to &&

Move Constructor and Move Assignment
--------------------------------------

The **move constructor** transfers resources from a source object, leaving the source
valid but empty.  The **move assignment operator** does the same for assignment.

.. code-block:: cpp

    #include <cstring>
    #include <algorithm>
    #include <utility>
    #include <iostream>

    class Buffer {
        char*       data_{nullptr};
        std::size_t size_{0};
    public:
        // Regular constructor
        explicit Buffer(std::size_t n)
            : data_(new char[n]()), size_(n) {}

        // Copy constructor — deep copy
        Buffer(const Buffer& other)
            : data_(new char[other.size_]), size_(other.size_) {
            std::copy_n(other.data_, size_, data_);
            std::cout << "copy\n";
        }

        // Move constructor — steal resources; O(1)
        Buffer(Buffer&& other) noexcept
            : data_(std::exchange(other.data_, nullptr))
            , size_(std::exchange(other.size_, 0)) {
            std::cout << "move\n";
        }

        // Move assignment operator
        Buffer& operator=(Buffer&& other) noexcept {
            if (this != &other) {
                delete[] data_;
                data_ = std::exchange(other.data_, nullptr);
                size_ = std::exchange(other.size_, 0);
            }
            return *this;
        }

        ~Buffer() { delete[] data_; }

        std::size_t size() const { return size_; }
    };

    Buffer a{1024};
    Buffer b = std::move(a);   // move constructor called — "move" printed
    // a.data_ is now nullptr; b.data_ owns the 1024-byte allocation

**Key invariants**:

* After a move, the moved-from object must be in a *valid but unspecified* state.
* Destructors must work on moved-from objects.
* Mark move operations ``noexcept`` — the standard library uses them only when
  ``noexcept``.

``std::move`` Semantics
------------------------

``std::move`` does **not** move anything.  It is a cast that converts an lvalue to
an xvalue, allowing move operations to be selected.

.. code-block:: cpp

    #include <utility>

    // std::move is essentially:
    template <typename T>
    constexpr std::remove_reference_t<T>&& move(T&& t) noexcept {
        return static_cast<std::remove_reference_t<T>&&>(t);
    }

    std::string s = "hello";
    std::string t = std::move(s);  // move constructor called
    // After: t == "hello", s is valid but empty (or unspecified content)

    // After std::move, do not use s for its value!
    // It is safe to assign to s or destroy it.

**When to use** ``std::move``:

* When passing a local variable to a function/constructor for the last time.
* When returning a named local from a function (though NRVO may handle this).
* When inserting into a container: ``v.push_back(std::move(local_string))``.

Perfect Forwarding — Preview
-----------------------------

A **forwarding reference** (also called a universal reference) ``T&&`` in a template
context binds to both lvalues and rvalues.  Combined with ``std::forward<T>``, it
forwards the argument with its original value category preserved.

.. code-block:: cpp

    #include <utility>
    #include <memory>

    // factory: forwards all arguments to T's constructor
    template <typename T, typename... Args>
    std::unique_ptr<T> make(Args&&... args) {
        return std::unique_ptr<T>(new T(std::forward<Args>(args)...));
    }

    // std::forward preserves value category:
    // - lvalue argument → forwarded as lvalue (copy)
    // - rvalue argument → forwarded as rvalue (move)

    auto p = make<std::string>(5, 'x');  // constructs std::string(5, 'x')

Covered in depth on Day 14.

NRVO and RVO — Named and Unnamed Return Value Optimisation
-----------------------------------------------------------

The compiler is allowed (and in C++17, sometimes required) to construct a returned
object directly in the caller's stack frame, eliding the copy or move entirely.

.. code-block:: cpp

    std::string make_greeting(const std::string& name) {
        std::string result = "Hello, " + name;
        return result;  // NRVO: result is constructed in-place in caller's frame
        // No copy or move — the Buffer example above would print nothing here
    }

    std::string greet = make_greeting("Alice");  // Zero copies

**RVO** (unnamed): returning a temporary.
**NRVO** (named): returning a named local variable.

* In C++17, RVO (``return T{...}``) is *guaranteed* copy elision (mandatory).
* NRVO is a permitted but not guaranteed optimisation.
* Do **not** write ``return std::move(local)`` — it defeats NRVO.

.. code-block:: cpp

    std::string bad_return(const std::string& s) {
        std::string result = s + " world";
        return std::move(result);  // BAD: prevents NRVO; forces a move instead
    }

    std::string good_return(const std::string& s) {
        std::string result = s + " world";
        return result;  // GOOD: NRVO can kick in; compiler chooses best strategy
    }

Self-Check Questions
---------------------

#. **What is the difference between an lvalue and an rvalue?**

   An lvalue refers to an object with a stable address that persists beyond the
   current expression.  An rvalue is a temporary or computed value with no persistent
   address; it is "about to expire."

#. **What does** ``std::move`` **actually do to an object?**

   Nothing at runtime.  It is a compile-time cast from lvalue to xvalue, which allows
   the move constructor or move assignment operator to be selected.  The actual
   transfer of resources happens in those operators.

#. **Why should move operations be marked** ``noexcept``?

   The standard library (e.g., ``std::vector::push_back``) only uses the move
   constructor during reallocation if it is ``noexcept``.  If the move can throw,
   ``push_back`` falls back to a copy to maintain the strong exception guarantee.

#. **What is NRVO and why does** ``return std::move(local)`` **defeat it?**

   NRVO (Named Return Value Optimisation) allows the compiler to construct a named
   local variable directly in the caller's return-value slot, eliminating the
   copy/move.  ``std::move`` casts the local to an rvalue, which prevents the
   compiler from applying NRVO; a move is forced instead.

#. **What is an xvalue?**

   An xvalue ("expiring value") is an rvalue that names a specific object whose
   resources are about to be transferred.  It has an address (it is a glvalue) but
   can be moved from.  Produced by ``std::move()``, ``std::forward()``, or a function
   returning ``T&&``.
