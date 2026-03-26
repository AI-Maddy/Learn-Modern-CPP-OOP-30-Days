RAII and Smart Pointers
=======================

Ownership models, unique_ptr / shared_ptr / weak_ptr mechanics, non-owning
views, ownership transfer patterns, and memory bugs RAII prevents.

.. contents:: Sections
   :local:
   :depth: 2

----

Ownership Vocabulary
---------------------

+-------------------------+---------------------------------------------+
| Type                    | Ownership semantics                         |
+=========================+=============================================+
| ``std::unique_ptr<T>``  | Exclusive ownership; non-copyable           |
+-------------------------+---------------------------------------------+
| ``std::shared_ptr<T>``  | Shared ownership via reference count        |
+-------------------------+---------------------------------------------+
| ``std::weak_ptr<T>``    | Non-owning observer of shared_ptr           |
+-------------------------+---------------------------------------------+
| Raw pointer ``T*``      | Non-owning; caller must ensure lifetime     |
+-------------------------+---------------------------------------------+
| Reference ``T&``        | Non-owning; always valid (by contract)      |
+-------------------------+---------------------------------------------+
| ``std::span<T>``        | Non-owning view of contiguous data          |
+-------------------------+---------------------------------------------+

**Rule:** every resource has exactly one owner at a time. Non-owners must
not outlive the owner.

----

unique_ptr — Exclusive Ownership
----------------------------------

.. code-block:: cpp

    #include <memory>

    // Creation — always prefer make_unique (exception-safe, no raw new)
    auto p = std::make_unique<Widget>(arg1, arg2);

    // Creation of array
    auto buf = std::make_unique<uint8_t[]>(1024);
    buf[0] = 0xFF;

    // Accessing
    p->method();         // arrow dereference
    (*p).value;          // explicit dereference
    Widget* raw = p.get(); // raw pointer — does NOT transfer ownership

    // Release — gives up ownership, caller responsible
    Widget* raw2 = p.release();  // p is now null; you own raw2
    delete raw2;                  // must delete manually!

    // Reset — destroys current object, optionally takes new one
    p.reset();                    // p is null, Widget destroyed
    p.reset(new Widget{});        // p owns new Widget

    // Transfer ownership — move, not copy
    auto q = std::move(p);  // q owns; p is null
    // auto r = p;          // ERROR: unique_ptr is not copyable

    // Returning from factory — natural ownership transfer
    std::unique_ptr<Shape> make_shape(ShapeType t) {
        switch (t) {
            case ShapeType::Circle:    return std::make_unique<Circle>();
            case ShapeType::Rectangle: return std::make_unique<Rectangle>();
        }
        return nullptr;
    }

Custom deleter:

.. code-block:: cpp

    // Custom deleter as function pointer
    auto file_del = [](FILE* f){ if (f) std::fclose(f); };
    std::unique_ptr<FILE, decltype(file_del)> fp{
        std::fopen("data.txt", "r"), file_del
    };

    // Custom deleter for C-style resource
    struct FreeDeleter { void operator()(void* p) { std::free(p); } };
    std::unique_ptr<int, FreeDeleter> cbuf{
        static_cast<int*>(std::malloc(sizeof(int) * 100))
    };

----

shared_ptr — Shared Ownership
--------------------------------

.. code-block:: cpp

    // make_shared — single allocation for control block + object (preferred)
    auto sp = std::make_shared<Widget>(args...);

    // Copying — increments reference count
    auto sp2 = sp;      // ref count = 2
    { auto sp3 = sp; }  // ref count = 3, then back to 2 when sp3 dies

    // use_count — for diagnostics only, not for logic
    std::cout << sp.use_count();  // 2

    // From unique_ptr — transfer to shared ownership
    auto up = std::make_unique<Widget>();
    std::shared_ptr<Widget> sp4 = std::move(up);  // up is null

make_shared vs separate new:

.. code-block:: cpp

    // PREFER: single allocation, more cache-friendly
    auto a = std::make_shared<Foo>(1, 2);

    // AVOID: two allocations (one for Foo, one for control block)
    std::shared_ptr<Foo> b{new Foo{1, 2}};

    // Must use separate new when: custom deleter, private constructor,
    // or you need weak_ptr to NOT keep object memory alive

Aliasing constructor (advanced):

.. code-block:: cpp

    struct Node { int data; Node* next; };
    auto sp_node = std::make_shared<Node>();

    // shared_ptr to a member — shares ownership with sp_node
    std::shared_ptr<int> sp_data{sp_node, &sp_node->data};
    // sp_data keeps Node alive even if sp_node is gone
    // sp_data.get() points to Node::data

shared_ptr performance cost:

* Control block allocation (unless make_shared).
* Atomic reference count increment/decrement (thread-safe but not free).
* Two-pointer object size (vs one for unique_ptr).
* Prefer ``unique_ptr`` + explicit transfer over reflexive use of ``shared_ptr``.

----

weak_ptr — Non-Owning Observer
--------------------------------

Breaks ownership cycles. Must be converted to ``shared_ptr`` before use.

.. code-block:: cpp

    std::shared_ptr<Widget> sp = std::make_shared<Widget>();
    std::weak_ptr<Widget>   wp = sp;   // does NOT increment ref count

    // lock() returns shared_ptr; null if object already destroyed
    if (auto locked = wp.lock()) {
        locked->use();   // safe — object alive for duration of locked
    } else {
        std::cout << "Widget was destroyed\n";
    }

    // expired() — quick alive check (but racy without lock)
    if (!wp.expired()) { /* object *might* still be alive */ }

Breaking a reference cycle:

.. code-block:: cpp

    // BAD — circular shared_ptr: neither A nor B ever destroyed
    struct A { std::shared_ptr<B> b; };
    struct B { std::shared_ptr<A> a; };  // cycle!

    auto a = std::make_shared<A>();
    auto b = std::make_shared<B>();
    a->b = b;
    b->a = a;  // ref count never reaches zero

    // GOOD — one direction uses weak_ptr
    struct B2 { std::weak_ptr<A> a; };  // observer, no ownership
    a->b = b;
    b->a = a;  // weak — no cycle, both destroyed correctly

----

Non-Owning Types
-----------------

.. code-block:: cpp

    // Raw pointer — use for non-owning access when unique_ptr/reference not possible
    void inspect(const Widget* w);  // caller guarantees w outlives call
    // Prefer references when null is not a valid input:
    void inspect(const Widget& w);

    // std::span — non-owning view of contiguous data (C++20)
    #include <span>
    void process(std::span<int> data) {
        for (int& x : data) x *= 2;
    }

    std::vector<int> v{1, 2, 3, 4};
    process(v);              // implicit span from vector
    process({v.data(), 2});  // first 2 elements only

    // string_view — non-owning string reference
    void log(std::string_view msg);  // accepts string, char*, string_view — no copy

    // Returning non-owning reference — caller must ensure lifetime
    const Widget& get_widget() const { return widget_; }  // OK — member outlives call
    const Widget& bad_get() { Widget w; return w; }       // UB — dangling reference!

----

Ownership Transfer Patterns
-----------------------------

.. code-block:: cpp

    // 1. Sink parameter — function takes ownership
    void register_handler(std::unique_ptr<Handler> h) {
        handlers_.push_back(std::move(h));
    }
    register_handler(std::make_unique<MyHandler>());

    // 2. Factory — returns new ownership
    std::unique_ptr<Connection> connect(std::string_view url);
    auto conn = connect("tcp://host:1234");

    // 3. Transfer to shared ownership
    std::unique_ptr<Resource> up = make_resource();
    std::shared_ptr<Resource> sp = std::move(up);  // shared can receive unique

    // 4. Passing non-owning to observer
    class EventBus {
        std::vector<Observer*> observers_;  // non-owning; must outlive EventBus
    public:
        void subscribe(Observer* obs) { observers_.push_back(obs); }
        void publish(Event e) { for (auto* o : observers_) o->on_event(e); }
    };

    // 5. enable_shared_from_this — get shared_ptr to *this inside a method
    class Node : public std::enable_shared_from_this<Node> {
    public:
        std::shared_ptr<Node> get_self() { return shared_from_this(); }
        // NOT: return std::shared_ptr<Node>(this);  -- creates second control block!
    };

----

Memory Bugs RAII Prevents
--------------------------

+-----------------------------+------------------------------------+----------------------+
| Bug                         | Manual code                        | RAII equivalent      |
+=============================+====================================+======================+
| Memory leak                 | ``new X; /* forget delete */``     | ``unique_ptr<X>``    |
+-----------------------------+------------------------------------+----------------------+
| Double delete               | ``delete p; delete p;``            | unique_ptr dtor once |
+-----------------------------+------------------------------------+----------------------+
| Use after free              | ``delete p; p->x;``                | ptr set to null      |
+-----------------------------+------------------------------------+----------------------+
| Exception leak              | throw before ``delete``            | dtor always runs     |
+-----------------------------+------------------------------------+----------------------+
| Dangling raw pointer        | pointer outlives object            | weak_ptr + lock()    |
+-----------------------------+------------------------------------+----------------------+
| Ownership ambiguity         | who deletes? unclear               | explicit owner type  |
+-----------------------------+------------------------------------+----------------------+

.. code-block:: cpp

    // ALL of these are prevented by using smart pointers correctly:

    // 1. Memory leak on exception
    void bad() {
        Widget* w = new Widget{};
        risky_operation();   // throws — w is leaked
        delete w;
    }
    void good() {
        auto w = std::make_unique<Widget>();
        risky_operation();   // throws — w destroyed in dtor automatically
    }

    // 2. Double delete
    Widget* p = new Widget{};
    delete p;
    delete p;  // UB!
    // unique_ptr dtor: sets internal pointer to null after delete — safe

    // 3. Ownership ambiguity
    Widget* get();  // caller owns? borrowed? unclear
    std::unique_ptr<Widget> get_owned();   // caller owns
    Widget& get_ref();                     // caller borrows — no ownership
    Widget* get_non_owning();              // caller borrows — convention

----

Review Checklist
-----------------

* Is every ``new`` paired with a ``unique_ptr`` or ``shared_ptr`` at the allocation site?
* Are ``make_unique`` and ``make_shared`` used instead of ``new`` directly?
* Are ``shared_ptr`` cycles broken with ``weak_ptr``?
* Is ``weak_ptr::lock()`` used (not ``expired()``) before accessing the pointed-to object?
* Are raw pointers used only for non-owning access with documented lifetime guarantees?
* Is ``std::span`` used instead of raw pointer + size pairs?
* Does any class using ``enable_shared_from_this`` always live in a ``shared_ptr`` (never on stack)?
* Are custom deleters implemented for resources that are not freed with ``delete``?
* Is ``unique_ptr`` preferred over ``shared_ptr`` until sharing is genuinely required?
* Do sink functions take ``unique_ptr`` by value (not by const-ref) to express ownership transfer?

Related Concepts
-----------------

* ``cheatsheets/classes-constructors-raii.rst`` — custom RAII classes
* ``cheatsheets/rule-of-5-cheat.rst`` — copy/move semantics of owning types
* ``cheatsheets/move-semantics-gotchas.rst`` — moving unique_ptr correctly
* ``cheatsheets/inheritance-polymorphism.rst`` — polymorphic ownership with unique_ptr
* ``cheatsheets/advanced-oop-patterns.rst`` — factory methods returning unique_ptr
