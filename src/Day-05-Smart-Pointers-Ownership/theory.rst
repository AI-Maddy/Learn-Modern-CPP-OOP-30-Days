Day 05 — Smart Pointers and Ownership
======================================

Why This Day Matters
--------------------

Raw pointers do not convey ownership. When you see a raw pointer in a function signature, you
cannot tell: does this function own the pointed-to object? Is it borrowing it? Does it need to
delete it? Smart pointers make ownership explicit in the type system, enabling the compiler to
enforce the rules automatically.

The modern C++ rule: **never use ``new`` or ``delete`` directly** in application code. Use
``std::unique_ptr``, ``std::shared_ptr``, ``std::weak_ptr``, and their factory functions instead.
This day covers all three, with ownership semantics, custom deleters, and how to avoid cycles.


Ownership Vocabulary
--------------------

Before examining each smart pointer, establish the vocabulary:

* **Owner**: the entity responsible for destroying the resource.
* **Non-owning reference**: borrows access without taking ownership; the resource must outlive
  the reference.
* **Unique ownership**: exactly one owner at a time; ownership can be transferred but not shared.
* **Shared ownership**: multiple owners; the resource lives as long as at least one owner exists.

::

    Ownership model summary:

    unique_ptr<T>    —  one owner, move-only, no overhead
    shared_ptr<T>    —  N owners, reference-counted, atomic ops overhead
    weak_ptr<T>      —  non-owning observer of a shared_ptr-managed object
    T* (raw)         —  non-owning borrow (by convention in modern C++)
    T& (reference)   —  non-owning borrow (preferred over raw pointer when non-null)


``std::unique_ptr`` — Exclusive Ownership
-----------------------------------------

``unique_ptr<T>`` is a non-copyable, movable RAII wrapper. It destroys the owned object when it
goes out of scope. Zero runtime overhead compared to a raw pointer.

.. code-block:: cpp

    #include <memory>
    #include <iostream>

    class Widget {
    public:
        explicit Widget(int id) : id_{id} {
            std::cout << "Widget " << id_ << " created\n";
        }
        ~Widget() { std::cout << "Widget " << id_ << " destroyed\n"; }
    private:
        int id_;
    };

    int main() {
        // Always use make_unique — never call new directly
        auto w1 = std::make_unique<Widget>(1);

        // unique_ptr cannot be copied
        // auto w2 = w1;   // ERROR: copy constructor is deleted

        // Transfer ownership with move
        auto w2 = std::move(w1);
        // w1 is now null; w2 owns Widget 1

        if (!w1) std::cout << "w1 is null after move\n";

        // Scope exit: w2 destructor runs, Widget 1 is destroyed
    }

    // Output:
    // Widget 1 created
    // w1 is null after move
    // Widget 1 destroyed

Passing ``unique_ptr``
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    // Sink function: takes ownership
    void take_ownership(std::unique_ptr<Widget> w) {
        // w is destroyed at end of this function
    }

    // Borrow function: does not take ownership; uses raw pointer or reference
    void borrow(const Widget& w) { /* read or use w, no ownership change */ }
    void borrow_ptr(const Widget* w) { if (w) { /* optional */ } }

    auto w = std::make_unique<Widget>(42);
    borrow(*w);                       // dereference: pass reference
    take_ownership(std::move(w));     // transfer: w is null after this
    // w is now null — accessing it is UB

Returning ``unique_ptr``
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    // Factory function: returns unique_ptr — clean ownership transfer
    std::unique_ptr<Widget> create_widget(int id) {
        return std::make_unique<Widget>(id);  // NRVO or move
    }

    auto w = create_widget(10);   // w owns the Widget


``std::shared_ptr`` — Shared Ownership
---------------------------------------

``shared_ptr<T>`` maintains a reference count. The object is destroyed when the last
``shared_ptr`` pointing to it is destroyed. Use when multiple independent owners need the object
to remain alive as long as any of them need it.

.. code-block:: cpp

    #include <memory>

    auto s1 = std::make_shared<Widget>(1);  // ref count = 1
    {
        auto s2 = s1;    // copy: ref count = 2
        auto s3 = s1;    // copy: ref count = 3
        std::cout << s1.use_count() << '\n';  // 3
    }   // s2 and s3 destroyed: ref count drops to 1
    // Widget 1 still alive (s1 still holds it)
    // When s1 goes out of scope, ref count -> 0, Widget 1 destroyed

**When to prefer ``shared_ptr``:**

* Multiple owners with independent lifetimes (e.g., a graph node referenced by multiple edges)
* When object lifetime depends on which of several asynchronous tasks finishes last
* Caches that must keep objects alive as long as a client holds a handle

**When to avoid ``shared_ptr``:**

* When ownership is clearly single — use ``unique_ptr``
* When the object is used in a hot path — reference counting uses atomic operations
* When it creates cycles — use ``weak_ptr`` for back-pointers

make_unique vs make_shared
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: cpp

    // Always prefer make_unique/make_shared over new

    // BAD: two separate heap allocations
    std::shared_ptr<Widget> p{new Widget{5}};

    // GOOD: make_shared allocates control block and object together (one allocation)
    auto p = std::make_shared<Widget>(5);

    // Also exception-safe: if Widget constructor throws, there is no leak
    // With 'new': process(shared_ptr<Widget>(new Widget), other_func()) — potential leak


``std::weak_ptr`` — Non-Owning Observer
----------------------------------------

``weak_ptr<T>`` holds a non-owning reference to a ``shared_ptr``-managed object. It does not
prevent the object from being destroyed. Before accessing the object, you must lock the
``weak_ptr`` into a ``shared_ptr``; if the object has already been destroyed, you get null.

.. code-block:: cpp

    #include <memory>
    #include <iostream>

    auto shared = std::make_shared<Widget>(10);
    std::weak_ptr<Widget> weak = shared;

    // Access via lock()
    if (auto locked = weak.lock()) {       // returns shared_ptr<Widget> or nullptr
        std::cout << "Widget is alive\n";
    }

    shared.reset();   // destroy the widget; weak_ptr now expired

    if (weak.expired()) {
        std::cout << "Widget has been destroyed\n";
    }

    if (!weak.lock()) {
        std::cout << "Lock returned null\n";
    }

Breaking Cycles with ``weak_ptr``
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

A cycle of ``shared_ptr`` objects never reaches a reference count of zero — they leak.

.. code-block:: cpp

    // BAD: shared_ptr cycle — both objects leak
    struct Node {
        std::shared_ptr<Node> next;   // BAD: creates cycle
    };

    auto a = std::make_shared<Node>();
    auto b = std::make_shared<Node>();
    a->next = b;
    b->next = a;   // cycle: a -> b -> a
    // When a and b go out of scope, each still has use_count = 1 — neither is destroyed

    // GOOD: back-pointer is weak — cycle broken
    struct TreeNode {
        std::shared_ptr<TreeNode>  left;
        std::shared_ptr<TreeNode>  right;
        std::weak_ptr<TreeNode>    parent;   // observer: does not extend lifetime
    };


Custom Deleters
---------------

Both ``unique_ptr`` and ``shared_ptr`` accept a custom deleter — a callable invoked instead of
``delete`` when the object is released.

.. code-block:: cpp

    #include <cstdio>
    #include <memory>

    // unique_ptr with a lambda deleter
    auto file_deleter = [](FILE* f) { if (f) std::fclose(f); };
    std::unique_ptr<FILE, decltype(file_deleter)>
        f{std::fopen("data.txt", "r"), file_deleter};

    // Simpler: use a function pointer as the deleter type
    using FilePtr = std::unique_ptr<FILE, decltype(&std::fclose)>;
    FilePtr fp{std::fopen("data.txt", "r"), &std::fclose};

    // shared_ptr with a custom deleter (deleter stored in the control block)
    auto sdl_deleter = [](SDL_Window* w) { SDL_DestroyWindow(w); };
    std::shared_ptr<SDL_Window> win{
        SDL_CreateWindow("App", 0, 0, 800, 600, 0),
        sdl_deleter
    };


Observer Pattern Without Cycles
---------------------------------

A classic use of ``weak_ptr``: an event system where observers register interest but should not
keep the publisher alive.

.. code-block:: cpp

    #include <memory>
    #include <vector>
    #include <functional>

    class EventBus {
    public:
        using Handler = std::function<void(int)>;

        void subscribe(std::weak_ptr<void> owner, Handler handler) {
            subscribers_.push_back({owner, std::move(handler)});
        }

        void publish(int event) {
            // Remove expired subscribers and notify live ones
            subscribers_.erase(
                std::remove_if(subscribers_.begin(), subscribers_.end(),
                    [](const auto& s) { return s.owner.expired(); }),
                subscribers_.end());
            for (auto& s : subscribers_) s.handler(event);
        }

    private:
        struct Subscription {
            std::weak_ptr<void> owner;
            Handler             handler;
        };
        std::vector<Subscription> subscribers_;
    };


Raw Pointers — The Non-Owning Convention
-----------------------------------------

In modern C++, a raw pointer (``T*``) in a function signature means "non-owning borrow".
The caller retains ownership. The function must not ``delete`` the pointer.

.. code-block:: cpp

    // Raw pointer: "I borrow this; I do not own it"
    void render(const Widget* w);   // may be null

    // Reference: "I borrow this; it is guaranteed non-null"
    void render(const Widget& w);   // cannot be null — preferred

    // Prefer references over raw pointers for non-optional borrows
    // Use raw pointers only when null is a meaningful state

**The guideline:** Use a reference when the argument is always present. Use a raw pointer when
the argument is optional (can be null). Use a smart pointer only when transferring or sharing
ownership.


Self-Check Questions
--------------------

**Q1: When should you use ``unique_ptr`` vs ``shared_ptr``?**

Use ``unique_ptr`` when there is a single clear owner of the resource. It has zero overhead and
makes the ownership story obvious. Use ``shared_ptr`` when multiple independent entities need
the object to remain alive as long as any of them need it — for example, a cache entry shared
between a lookup table and an active user session. Default to ``unique_ptr``; upgrade to
``shared_ptr`` only when shared ownership is genuinely required.

**Q2: How does ``make_shared`` improve on ``shared_ptr<T>(new T{...})``?**

``make_shared`` allocates the object and the reference-count control block in a single memory
allocation, improving cache locality and reducing allocator overhead. The ``new T{}`` form
requires two separate allocations. Additionally, ``make_shared`` is exception-safe in all call
contexts; with ``new`` it is possible (before C++17 evaluation order guarantees) to leak if a
second argument to a function throws between the ``new`` and the ``shared_ptr`` constructor.

**Q3: What is a ``weak_ptr`` and how do you use it safely?**

A ``weak_ptr`` holds a non-owning reference to a ``shared_ptr``-managed object. It does not
increment the reference count, so the object can be destroyed while ``weak_ptr``s exist. To
access the object, call ``weak_ptr::lock()``, which returns a ``shared_ptr`` (live) or null
(expired). Always check the result before using it: if the ``shared_ptr`` is null, the object
no longer exists.

**Q4: Why does using a raw owning pointer (``T* p = new T``) make exception safety hard?**

With a raw owning pointer, cleanup depends on reaching the ``delete`` statement. Any exception
or early return between ``new`` and ``delete`` leaks the resource. RAII (via ``unique_ptr``)
solves this: the destructor of the smart pointer is invoked on any exit path, ensuring the
object is always deleted.
