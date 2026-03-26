Pitfalls — Day 13: Move Semantics and Rvalue References
=========================================================

Pitfall 1: Using a Moved-From Object
--------------------------------------

**Description**: After calling ``std::move`` on a variable and passing it to a
function, the variable's value is indeterminate.  Reading from it is a logical
error (and may be UB for some types).

**BAD**

.. code-block:: cpp

    #include <string>
    #include <vector>
    #include <iostream>

    std::string name = "Alice";
    std::vector<std::string> names;
    names.push_back(std::move(name));   // name is now valid but empty (or unspecified)

    std::cout << name.size() << '\n';   // BAD: reads moved-from object
    if (name == "Alice")                // BAD: comparing moved-from — likely false
        do_something();

**Why it fails**: After a move, the object is in a "valid but unspecified" state.
The standard guarantees only that the object can be destroyed and reassigned, not
that its value is any particular thing.  Reading it is logically meaningless.

**GOOD**

.. code-block:: cpp

    std::string name = "Alice";
    names.push_back(std::move(name));
    // name is now "spent" — either reassign it or let it go out of scope
    name = "Bob";                       // safe: reassignment restores a known state
    std::cout << name << '\n';          // "Bob" — now well-defined

**Detection tip**: Clang-tidy check ``bugprone-use-after-move`` flags reads of
moved-from variables.

Pitfall 2: ``return std::move(local)`` — Defeating NRVO
--------------------------------------------------------

**Description**: Wrapping the return value in ``std::move`` seems like an
optimisation but actually prevents the compiler from applying NRVO, which would
eliminate the move entirely.

**BAD**

.. code-block:: cpp

    std::vector<int> build_data() {
        std::vector<int> result;
        result.reserve(1000);
        for (int i = 0; i < 1000; ++i) result.push_back(i);
        return std::move(result);  // BAD: prevents NRVO, forces a move
    }

**Why it fails**: NRVO constructs ``result`` directly in the caller's return-value
slot — zero copy, zero move.  ``std::move`` converts ``result`` to an rvalue, which
the compiler must honour by calling the move constructor.  The "optimisation" is
actually *slower* than letting the compiler do it.

**GOOD**

.. code-block:: cpp

    std::vector<int> build_data() {
        std::vector<int> result;
        result.reserve(1000);
        for (int i = 0; i < 1000; ++i) result.push_back(i);
        return result;   // GOOD: NRVO applies; zero copies, zero moves
    }

**Detection tip**: Clang-tidy ``performance-move-const-arg`` and
``performance-no-automatic-move`` warn about redundant ``std::move`` in return
statements.

Pitfall 3: Move Constructor Not Marked ``noexcept`` — Silent Performance Loss
------------------------------------------------------------------------------

**Description**: Forgetting ``noexcept`` on a move constructor causes ``std::vector``
(and other standard containers) to use the copy constructor instead of the move
constructor during reallocation.

**BAD**

.. code-block:: cpp

    class BigData {
        std::vector<double> payload_;
    public:
        BigData(std::vector<double> p) : payload_(std::move(p)) {}

        // Move constructor WITHOUT noexcept
        BigData(BigData&& other)   // missing noexcept!
            : payload_(std::move(other.payload_)) {}
    };

    std::vector<BigData> v;
    v.reserve(1);
    v.push_back(BigData{std::vector<double>(1000)});  // move used (capacity not exceeded)
    v.push_back(BigData{std::vector<double>(1000)});  // reallocation: COPY not MOVE!
    // 1000 doubles copied unnecessarily because move is not noexcept

**Why it fails**: ``std::vector`` provides the strong exception guarantee during
reallocation.  It can only use the move constructor if it is ``noexcept``; otherwise
it falls back to copy to allow rollback on exception.

**GOOD**

.. code-block:: cpp

    BigData(BigData&& other) noexcept
        : payload_(std::move(other.payload_)) {}

    // Verify at compile time:
    static_assert(std::is_nothrow_move_constructible_v<BigData>);

**Detection tip**: Always ``static_assert(std::is_nothrow_move_constructible_v<T>)``
for types stored in standard containers.  Use ``= default`` for move operations when
possible — the compiler marks them ``noexcept`` automatically when all members are.

Pitfall 4: Moving a ``const`` Object — Silent Copy
---------------------------------------------------

**Description**: Calling ``std::move`` on a ``const`` object has no effect — the move
constructor cannot bind to a ``const&&``, so the copy constructor is silently selected.

**BAD**

.. code-block:: cpp

    const std::string s = "large string data";
    std::string t = std::move(s);  // looks like a move...
    // std::move casts s to const std::string&&
    // Move constructor expects std::string&&  (non-const)
    // The const&& does NOT match; copy constructor is called instead!
    // s is unchanged; t is a copy.

**Why it fails**: ``std::move`` returns ``const T&&``.  The move constructor signature
is ``T(T&&)``.  ``const T&&`` does not bind to ``T&&`` (adding const to non-const).
The copy constructor ``T(const T&)`` is a better match.

**GOOD**

.. code-block:: cpp

    // If you need to move, the source must be non-const
    std::string s = "large string data";   // not const
    std::string t = std::move(s);          // genuine move — s is emptied

    // If you genuinely have a const and want to "move", you must copy:
    const std::string source = get_value();
    std::string copy = source;             // explicit copy — honest about the cost

**Detection tip**: Clang-tidy ``performance-move-const-arg`` warns when ``std::move``
is applied to a const variable, since it will always produce a copy.

Pitfall 5: Rvalue Reference Parameter Is an Lvalue Inside the Function
----------------------------------------------------------------------

**Description**: Inside a function that takes an rvalue reference parameter, the
parameter itself is an lvalue (it has a name and an address).  Forgetting to
``std::move`` it when passing it further results in a copy.

**BAD**

.. code-block:: cpp

    void store(std::string&& data) {
        database_.push_back(data);  // BAD: data is an lvalue here — COPY!
    }

    store(std::string{"expensive large string"});  // caller moves, function copies

**Why it fails**: Named rvalue references are lvalues.  ``data`` has a name and an
address; ``push_back(data)`` calls the copy overload.  The move was wasted.

**GOOD**

.. code-block:: cpp

    void store(std::string&& data) {
        database_.push_back(std::move(data));  // explicit re-move into push_back
    }

    // Even better: take by value (caller decides move vs copy at the call site)
    void store_v2(std::string data) {
        database_.push_back(std::move(data));
    }

    store_v2(std::string{"expensive"});  // move into parameter, then move into vector
    store_v2(existing_string);           // copy into parameter, then move into vector

**Detection tip**: When you see a ``&&`` parameter and no ``std::move`` inside the
body, it is almost certainly missing.  Exception: ``std::forward`` for forwarding
references.
