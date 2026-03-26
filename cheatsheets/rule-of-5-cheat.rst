Rule of 0, 3, and 5
====================

When the compiler auto-generates special members, when it suppresses them,
each function signature, copy-and-swap, noexcept on move, and a final
decision checklist.

.. contents:: Sections
   :local:
   :depth: 2

----

The Three Rules in One Table
------------------------------

+---------------+--------------------------------------------------+-------------------+
| Rule          | When to apply                                    | Preferred?        |
+===============+==================================================+===================+
| Rule of Zero  | Class owns no raw resource (uses RAII wrappers)  | YES — default     |
+---------------+--------------------------------------------------+-------------------+
| Rule of Three | Destructor needed; no move desired (legacy code) | Legacy only       |
+---------------+--------------------------------------------------+-------------------+
| Rule of Five  | Destructor needed AND move semantics desired     | When Rule 0 fails |
+---------------+--------------------------------------------------+-------------------+

----

Rule of Zero — The Preferred Rule
-----------------------------------

If your class composes only well-behaved members (RAII wrappers, value types),
declare **none** of the five special members. The compiler generates correct
defaults automatically.

.. code-block:: cpp

    // Rule of Zero — no special members needed
    class Widget {
        std::string              name_;
        std::vector<int>         data_;
        std::unique_ptr<Backend> backend_;  // owns via unique_ptr
    public:
        explicit Widget(std::string name, std::unique_ptr<Backend> b)
            : name_(std::move(name))
            , backend_(std::move(b))
        {}
        // Compiler generates:
        //   ~Widget()                  — calls destructors in reverse order
        //   Widget(Widget&&)           — moves all members
        //   Widget& operator=(Widget&&)— moves all members
        //   Widget(const Widget&)      = deleted (unique_ptr non-copyable)
        //   Widget& operator=(const Widget&) = deleted
    };

If you need copyability, ensure all members are copyable (replace unique_ptr
with shared_ptr or provide a deep-copy clone).

----

Rule of Five — Five Special Member Signatures
-----------------------------------------------

Provide all five when you manage a raw resource and need both copy and move.

.. code-block:: cpp

    class RawBuffer {
        uint8_t*    data_;
        std::size_t size_;
    public:
        // (1) Constructor
        explicit RawBuffer(std::size_t n)
            : data_(new uint8_t[n]), size_(n) {}

        // (2) Destructor
        ~RawBuffer() { delete[] data_; }

        // (3) Copy constructor — deep copy
        RawBuffer(const RawBuffer& other)
            : data_(new uint8_t[other.size_])
            , size_(other.size_)
        {
            std::memcpy(data_, other.data_, size_);
        }

        // (4) Copy assignment — copy-and-swap idiom (see below)
        RawBuffer& operator=(RawBuffer other) noexcept {  // pass by value = copy
            swap(*this, other);
            return *this;
        }

        // (5) Move constructor — steal, then null source
        RawBuffer(RawBuffer&& other) noexcept
            : data_(other.data_), size_(other.size_)
        {
            other.data_ = nullptr;
            other.size_ = 0;
        }

        // (6) Move assignment — swap with movable rvalue
        RawBuffer& operator=(RawBuffer&& other) noexcept {
            if (this != &other) {
                delete[] data_;
                data_       = other.data_;
                size_       = other.size_;
                other.data_ = nullptr;
                other.size_ = 0;
            }
            return *this;
        }

        friend void swap(RawBuffer& a, RawBuffer& b) noexcept {
            using std::swap;
            swap(a.data_, b.data_);
            swap(a.size_, b.size_);
        }
    };

----

Compiler Auto-Generation Rules
--------------------------------

+-----------------------------+-----------+-----------+-----------+-----------+-----------+
| What you declare            | Dtor      | Copy ctor | Copy asgn | Move ctor | Move asgn |
+=============================+===========+===========+===========+===========+===========+
| Nothing                     | gen       | gen       | gen       | gen       | gen       |
+-----------------------------+-----------+-----------+-----------+-----------+-----------+
| Destructor                  | user      | gen*      | gen*      | **del**   | **del**   |
+-----------------------------+-----------+-----------+-----------+-----------+-----------+
| Copy constructor            | gen       | user      | gen*      | **del**   | **del**   |
+-----------------------------+-----------+-----------+-----------+-----------+-----------+
| Copy assignment             | gen       | gen*      | user      | **del**   | **del**   |
+-----------------------------+-----------+-----------+-----------+-----------+-----------+
| Move constructor            | gen       | **del**   | **del**   | user      | **del**   |
+-----------------------------+-----------+-----------+-----------+-----------+-----------+
| Move assignment             | gen       | **del**   | **del**   | **del**   | user      |
+-----------------------------+-----------+-----------+-----------+-----------+-----------+
| Move ctor + move asgn       | gen       | **del**   | **del**   | user      | user      |
+-----------------------------+-----------+-----------+-----------+-----------+-----------+

``gen`` = compiler generates. ``del`` = compiler deletes (suppresses).
``gen*`` = generated but deprecated (if you declared a destructor, implicit
copy is generated for backwards-compatibility but is flagged by tools).

Key insight: **declaring any of the copy/move/destructor suppresses the
implicit move members.** Declaring a move member suppresses implicit copy.

.. code-block:: cpp

    // COMMON PITFALL — adding a destructor suppresses move generation
    class Logger {
    public:
        ~Logger() { close_file(); }  // user destructor
        // Move ctor and move assignment are now DELETED
        // std::vector<Logger> will use COPY (slow), or fail if non-copyable
    };

    // FIX — explicitly default the move members
    class Logger {
    public:
        ~Logger() { close_file(); }
        Logger(Logger&&)            noexcept = default;  // re-enable move
        Logger& operator=(Logger&&) noexcept = default;
    };

----

Copy-and-Swap Idiom — Strong Exception Safety
----------------------------------------------

Unifies copy assignment and provides strong exception guarantee.

.. code-block:: cpp

    class Buffer {
        int*        data_;
        std::size_t size_;
    public:
        // Step 1: Free swap (swaps all members)
        friend void swap(Buffer& a, Buffer& b) noexcept {
            using std::swap;
            swap(a.data_, b.data_);
            swap(a.size_, b.size_);
        }

        // Step 2: Copy constructor (must exist)
        Buffer(const Buffer& other)
            : data_(new int[other.size_]), size_(other.size_)
        { std::copy(other.data_, other.data_ + size_, data_); }

        // Step 3: Copy assignment — take by value (invokes copy ctor)
        //         then swap with the temporary
        Buffer& operator=(Buffer other) noexcept {
            swap(*this, other);   // swap contents
            return *this;
            // 'other' (old contents) destroyed here — exception-safe
        }
    };

    // What happens on assignment:
    //   buf1 = buf2;
    //   1. 'other' is copy-constructed from buf2 (may throw — fine, no change to buf1)
    //   2. swap(*this, other) — noexcept, swaps pointers
    //   3. old buf1 data destroyed in 'other' dtor — always happens

----

noexcept on Move Operations
-----------------------------

Move constructors and move assignment MUST be ``noexcept`` for standard
containers to use them during reallocation.

.. code-block:: cpp

    #include <vector>
    #include <type_traits>

    class Efficient {
    public:
        Efficient(Efficient&&) noexcept;            // marked noexcept
        Efficient& operator=(Efficient&&) noexcept;
    };

    // std::vector uses this trait to decide copy vs move on realloc
    static_assert(std::is_nothrow_move_constructible_v<Efficient>);

    class Slow {
    public:
        Slow(Slow&&);  // NOT noexcept
    };
    // std::vector<Slow> reallocation uses COPY ctor — O(n) instead of O(n/2)

    // defaulted operations inherit noexcept from members
    class Composed {
        std::string s_;
        std::vector<int> v_;
    public:
        Composed(Composed&&) noexcept = default;  // noexcept if string and vector moves are noexcept
    };

----

=default vs Hand-Written
-------------------------

+----------------------+---------------------+-----------------------------------+
| Situation            | Use ``= default``   | Hand-write                        |
+======================+=====================+===================================+
| All members are RAII | Yes                 | No                                |
+----------------------+---------------------+-----------------------------------+
| Raw pointer member   | No                  | Yes (deep copy / null on move)    |
+----------------------+---------------------+-----------------------------------+
| Need noexcept move   | ``= default``       | Or manual with noexcept           |
+----------------------+---------------------+-----------------------------------+
| Compiler suppressed  | ``= default``       | Or manual if custom logic needed  |
| (re-enable move)     |                     |                                   |
+----------------------+---------------------+-----------------------------------+
| Custom invariants    | No                  | Yes                               |
+----------------------+---------------------+-----------------------------------+

.. code-block:: cpp

    class Base {
    public:
        virtual ~Base() = default;          // virtual, but defaulted body

        // Re-enable moves suppressed by virtual destructor declaration
        Base(Base&&)            noexcept = default;
        Base& operator=(Base&&) noexcept = default;

        // Explicitly forbid copy (non-copyable base)
        Base(const Base&)            = delete;
        Base& operator=(const Base&) = delete;
    };

----

Rule of Five Decision Checklist
---------------------------------

Work through these questions top-to-bottom:

1. **Do all data members manage resources via RAII types?**
   Yes: use Rule of Zero — declare nothing. Done.

2. **Is there a raw pointer, file handle, mutex, or other manual resource?**
   Yes: you need at least a destructor. Continue.

3. **Do you need copy semantics?**
   Yes: write copy constructor + copy assignment (deep copy).
   No: ``= delete`` both to prevent accidental copies.

4. **Do you need move semantics?**
   Yes: write move constructor + move assignment (marked ``noexcept``).
   No: ``= delete`` move or accept fallback-to-copy.

5. **Is the destructor non-trivial?**
   Yes: explicitly ``= default`` the move members (they're suppressed otherwise).

6. **Is the class a polymorphic base?**
   Yes: virtual destructor is required. Re-enable move with ``= default``.
   Disable copy if slicing would be a problem.

7. **Does assignment need strong exception safety?**
   Yes: use copy-and-swap idiom.

.. code-block:: cpp

    // Final checklist in code form
    class Resource {
        Handle* h_;
    public:
        explicit Resource(Handle* h) : h_(h) {}
        ~Resource()                              { release(h_); }     // (2)
        Resource(const Resource& o)              : h_(clone(o.h_)) {} // (3)
        Resource& operator=(Resource o) noexcept { swap(h_, o.h_); return *this; } // (3) copy-and-swap
        Resource(Resource&& o)          noexcept : h_(o.h_) { o.h_ = nullptr; }    // (4)
        Resource& operator=(Resource&& o) noexcept {                                // (4)
            if (this != &o) { release(h_); h_ = o.h_; o.h_ = nullptr; }
            return *this;
        }
    };

----

Review Checklist
-----------------

* Does every class with a non-trivial destructor explicitly re-enable (or delete) its move members?
* Are all move constructors and move assignments marked ``noexcept``?
* Is copy-and-swap used for copy assignment to achieve strong exception safety?
* Is Rule of Zero applied wherever all members are RAII-managed?
* Are the copy members explicitly ``= delete`` if the class should be move-only?
* Is the virtual destructor in polymorphic bases re-enabling the defaulted move?
* Are ``=default`` implementations verified to be ``noexcept`` via static_assert?
* Is the moved-from state a valid, destructible state for all custom types?

Related Concepts
-----------------

* ``cheatsheets/move-semantics-gotchas.rst`` — std::move, NRVO, moved-from state
* ``cheatsheets/raii-smart-pointers.rst`` — unique_ptr as Rule-of-Zero enabler
* ``cheatsheets/classes-constructors-raii.rst`` — constructor mechanics
* ``cheatsheets/inheritance-polymorphism.rst`` — virtual destructor interaction
