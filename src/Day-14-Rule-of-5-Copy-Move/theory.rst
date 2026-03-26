Rule of Five, Copy and Move
============================

Motivation
----------

Every class that manages a resource — raw memory, a file handle, a network socket,
a mutex — must answer six questions about object lifetime:

#. How is the resource created? (constructor)
#. How is the resource released? (destructor)
#. What happens when the object is copied? (copy constructor)
#. What happens when the object is copy-assigned? (copy assignment operator)
#. What happens when the object is moved? (move constructor)
#. What happens when the object is move-assigned? (move assignment operator)

Answering these questions correctly and consistently is what the **Rule of Five**
(and its modern companion the **Rule of Zero**) is about.

Rule of Zero
------------

The best rule: **if a class does not directly manage a resource, define none of
the five special members**.  Let the compiler generate them all.

.. code-block:: cpp

    #include <string>
    #include <vector>

    // No raw pointers, no handles — all members are themselves Rule-of-Zero types
    class Person {
        std::string           name_;
        int                   age_{0};
        std::vector<std::string> hobbies_;
    public:
        explicit Person(std::string name, int age)
            : name_(std::move(name)), age_(age) {}

        // No destructor, no copy ctor, no copy assign, no move ctor, no move assign
        // The compiler generates all five correctly from the members' operations.
    };

    Person a{"Alice", 30};
    Person b = a;             // deep copy of string and vector — correct
    Person c = std::move(a);  // move of string and vector — correct, no allocation

Rule of Five
------------

**If you define (or ``=delete``) any one of the five special members, you must
explicitly handle all five** — because the compiler's implicit generation rules
become unreliable once you intervene.

The five special members:

#. Destructor
#. Copy constructor
#. Copy assignment operator
#. Move constructor
#. Move assignment operator

.. code-block:: cpp

    #include <cstring>
    #include <stdexcept>
    #include <utility>

    class String {
        char*       data_{nullptr};
        std::size_t len_{0};

        static char* allocate_copy(const char* src, std::size_t n) {
            char* p = new char[n + 1];
            std::memcpy(p, src, n + 1);
            return p;
        }

    public:
        // 1. Constructor
        explicit String(const char* s = "")
            : data_(allocate_copy(s, std::strlen(s)))
            , len_(std::strlen(s)) {}

        // 2. Destructor
        ~String() { delete[] data_; }

        // 3. Copy constructor — deep copy
        String(const String& other)
            : data_(allocate_copy(other.data_, other.len_))
            , len_(other.len_) {}

        // 4. Copy assignment operator — copy-and-swap idiom
        String& operator=(String other) {   // pass by value = copy already made
            swap(*this, other);
            return *this;
        }

        // 5. Move constructor — steal resources, O(1)
        String(String&& other) noexcept
            : data_(std::exchange(other.data_, nullptr))
            , len_(std::exchange(other.len_, 0)) {}

        // 6. Move assignment — handled by copy assignment above (pass-by-value)
        //    or explicitly:
        String& operator=(String&& other) noexcept {
            if (this != &other) {
                delete[] data_;
                data_ = std::exchange(other.data_, nullptr);
                len_  = std::exchange(other.len_,  0);
            }
            return *this;
        }

        friend void swap(String& a, String& b) noexcept {
            std::swap(a.data_, b.data_);
            std::swap(a.len_,  b.len_);
        }

        std::size_t length() const { return len_; }
        const char* c_str()  const { return data_ ? data_ : ""; }
    };

``=default`` and ``=delete``
------------------------------

``= default`` asks the compiler to generate an operation explicitly.
``= delete`` prevents the operation entirely.

.. code-block:: cpp

    class MoveOnly {
        std::unique_ptr<int> resource_;
    public:
        explicit MoveOnly(int v) : resource_(std::make_unique<int>(v)) {}

        // Allow moves
        MoveOnly(MoveOnly&&)            noexcept = default;
        MoveOnly& operator=(MoveOnly&&) noexcept = default;

        // Forbid copies — unique_ptr is not copyable anyway, but explicit is clearer
        MoveOnly(const MoveOnly&)            = delete;
        MoveOnly& operator=(const MoveOnly&) = delete;

        ~MoveOnly() = default;

        int value() const { return *resource_; }
    };

    MoveOnly a{42};
    MoveOnly b = std::move(a);  // OK: move constructor
    // MoveOnly c = a;           // Error: copy constructor deleted

**When to use** ``= default``:

* After suppressing an operation, to re-enable another that was implicitly deleted.
* To make intent explicit in the source code.
* The generated version is correct — prefer it over a hand-written identical body.

The Copy-and-Swap Idiom
------------------------

Copy-and-swap implements copy assignment in terms of the copy constructor and
``swap``.  It provides the **strong exception guarantee**: if an exception is thrown
during the copy, the original object is unchanged.

.. code-block:: cpp

    String& operator=(String other) noexcept {  // 'other' is a copy (may throw)
        swap(*this, other);                     // swap is noexcept
        return *this;                           // old data destroyed with 'other'
    }

ASCII diagram::

    a = b   (copy-and-swap)
    ───────────────────────
    Step 1: construct 'other' as a copy of b  ← may throw here; a is untouched
    Step 2: swap a and other                  ← noexcept; a now has b's data
    Step 3: other destroyed                   ← a's old data freed here

Exception Safety Guarantees
-----------------------------

Every function provides one of four levels:

* **nothrow**: guaranteed not to throw.  Must be marked ``noexcept``.
* **strong**: if an exception is thrown, state is as-if the operation never happened.
* **basic**: if an exception is thrown, the object is in a valid (but unspecified) state.
* **no-guarantee**: state is undefined after an exception — to be avoided.

.. code-block:: cpp

    // nothrow: swap, move constructor, move assignment
    void swap(String& a, String& b) noexcept { /* exchanges raw pointers */ }

    // strong: copy-and-swap assignment
    String& operator=(String other) noexcept {
        swap(*this, other);
        return *this;
    }

    // strong: copy constructor (exception during allocation leaves *this unchanged)
    String(const String& other) {
        data_ = allocate_copy(other.data_, other.len_);  // may throw
        len_  = other.len_;
        // If allocate_copy throws, data_ is nullptr, destructor is safe
    }

    // basic: push_back in std::vector (if realloc throws, vector is still valid)
    v.push_back(expensive_object);

Self-Check Questions
---------------------

#. **What is the Rule of Zero and when does it apply?**

   If a class uses only members that are themselves correct RAII types (smart pointers,
   standard containers, value types), define none of the five special members.  The
   compiler's generated versions compose the members' operations correctly.

#. **Why does defining a destructor implicitly suppress the move constructor?**

   The standard's rule: if the user declares any of {destructor, copy constructor,
   copy assignment}, the compiler does not implicitly generate the move operations.
   This prevents silently generating a move that the user presumably did not intend.

#. **What is the strong exception guarantee?**

   If the operation throws, the object is in exactly the same state as before the
   operation was called.  The copy-and-swap idiom achieves this for assignment.

#. **Why is** ``= delete`` **preferred over making a constructor private?**

   ``= delete`` gives a clear compile error at the call site: "call to deleted
   function."  A private constructor gives an "access violation" error — less clear.
   Also, ``= delete`` applies to all access contexts; private only prevents external
   calls.

#. **When should you prefer** ``= default`` **over a hand-written special member?**

   Always, when the generated version is correct.  A defaulted move constructor
   is automatically ``noexcept`` if all member moves are ``noexcept``; a hand-written
   one must declare ``noexcept`` explicitly.  Defaulted versions also enable
   trivial-copy optimisations the compiler cannot apply to user-defined bodies.
