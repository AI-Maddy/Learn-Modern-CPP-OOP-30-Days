Pitfalls — Day 10: Concepts and Constraints (C++20)
====================================================

Pitfall 1: Writing a requires Expression That Always Succeeds
-------------------------------------------------------------

**Description**: A requires expression that only tests whether an expression is
well-formed, without checking the *result type*, may pass for types you did not
intend to accept.

**BAD**

.. code-block:: cpp

    template <typename T>
    concept Addable = requires(T a, T b) {
        a + b;   // Only checks that + compiles — does NOT check the return type!
    };

    struct Weird {
        void operator+(const Weird&) {}  // returns void
    };

    template <Addable T>
    T sum(T a, T b) { return a + b; }  // Will try to return void for Weird!
    // sum(Weird{}, Weird{});  -- compiles despite being nonsense

**Why it fails**: The concept only verifies that ``a + b`` is syntactically valid; it
does not verify that the result is the same type as ``T`` or even that it is usable.

**GOOD**

.. code-block:: cpp

    template <typename T>
    concept Addable = requires(T a, T b) {
        { a + b } -> std::same_as<T>;    // result must be T
    };

    // Or more flexible:
    template <typename T>
    concept Addable2 = requires(T a, T b) {
        { a + b } -> std::convertible_to<T>;
    };

    // Now Weird fails the concept check because void is not convertible to Weird.

**Detection tip**: Always use the ``{ expr } -> ReturnConcept`` form when the return
type matters.  Bare expressions only test compilability.

Pitfall 2: Concept Overload Ambiguity — Not All Constraints Subsume
--------------------------------------------------------------------

**Description**: Two overloads with different but unrelated concepts cause ambiguity
because neither subsumes the other.

**BAD**

.. code-block:: cpp

    #include <concepts>

    template <std::integral T>
    void process(T v) { std::cout << "integral\n"; }

    template <std::is_signed_v<T> T>   // Not a real concept — illustrative
    // Suppose we write it as:
    template <typename T> requires (std::is_signed_v<T>)
    void process(T v) { std::cout << "signed\n"; }

    // process(42);  // AMBIGUOUS: int satisfies both, but neither subsumes the other
    // because (std::is_signed_v<T>) is a raw bool expression, not a named concept.

**Why it fails**: Subsumption only works between atomic concept-id constraints.
A raw ``requires (bool_expression)`` is opaque to the subsumption rules.

**GOOD**

.. code-block:: cpp

    template <typename T>
    concept MySignedIntegral = std::integral<T> && std::is_signed_v<T>;
    // MySignedIntegral subsumes std::integral — named concepts compose properly

    template <std::integral T>
    void process(T v) { std::cout << "integral\n"; }

    template <MySignedIntegral T>
    void process(T v) { std::cout << "signed integral\n"; }

    process(42);    // "signed integral" — MySignedIntegral subsumes std::integral
    process(42u);   // "integral"

**Detection tip**: Ambiguity errors about multiple candidates matching a template
call often mean the constraints are not in a subsumption relationship.  Wrap raw
``is_*`` predicates in named concepts.

Pitfall 3: Confusing Semantic and Syntactic Requirements
--------------------------------------------------------

**Description**: A concept that only checks syntax (operations compile) can be
satisfied by types that meet the syntax but violate the semantic intent.

**BAD**

.. code-block:: cpp

    template <typename T>
    concept Comparable = requires(T a, T b) {
        { a < b } -> std::convertible_to<bool>;
    };

    struct BrokenLess {
        bool operator<(const BrokenLess&) const { return true; }
        // Always returns true — violates strict weak ordering
    };

    template <Comparable T>
    void sort_range(std::vector<T>& v) {
        std::sort(v.begin(), v.end());  // UB: comparator is not a strict weak order
    }

**Why it fails**: The concept checks syntax only.  ``BrokenLess`` passes because
``<`` compiles and returns bool, but ``std::sort`` requires a strict weak ordering,
which ``BrokenLess`` violates.

**GOOD**

.. code-block:: cpp

    // Document the semantic contract clearly in the concept definition
    // (C++ concepts can only check syntax; semantics must be documented)
    template <typename T>
    concept StrictlyComparable = requires(T a, T b) {
        { a < b } -> std::convertible_to<bool>;
        { a == b } -> std::convertible_to<bool>;
        // SEMANTIC CONTRACT (cannot be enforced syntactically):
        // < must be a strict weak ordering
        // == must be an equivalence relation
    };
    // Use std::totally_ordered from <concepts> for the strongest standard concept

    template <std::totally_ordered T>
    void sort_range(std::vector<T>& v) {
        std::sort(v.begin(), v.end());
    }

**Detection tip**: Prefer standard concepts (``std::totally_ordered``, ``std::regular``)
that carry documented semantic requirements over hand-rolled syntax-only checks.

Pitfall 4: Using ``requires requires`` Unnecessarily
-----------------------------------------------------

**Description**: Writing ``requires requires(T t) { ... }`` (double requires) in a
template declaration is verbose and hard to read.  It usually means the constraint
should be a named concept.

**BAD**

.. code-block:: cpp

    template <typename T>
    requires requires(T t) {
        { t.size()   } -> std::convertible_to<std::size_t>;
        { t.begin()  };
        { t.end()    };
    }
    void print_container(const T& c) { /* ... */ }

**Why it fails**: This is syntactically legal but the anonymous requires expression
cannot be reused, composed, or named.  Error messages are harder to read.

**GOOD**

.. code-block:: cpp

    template <typename T>
    concept BasicContainer = requires(T t) {
        { t.size()  } -> std::convertible_to<std::size_t>;
        { t.begin() };
        { t.end()   };
    };

    template <BasicContainer T>
    void print_container(const T& c) { /* ... */ }
    // Error messages now say "T does not satisfy BasicContainer"

**Detection tip**: Every time you write ``requires requires``, ask whether the inner
expression should be extracted into a named concept.

Pitfall 5: Concept Applied to Wrong Template Parameter
------------------------------------------------------

**Description**: Applying a concept constraint to the wrong parameter (e.g., the
return type parameter) causes confusing errors or silently accepts wrong types.

**BAD**

.. code-block:: cpp

    // Intention: constrain the VALUE type of the range
    template <std::ranges::range R>
    void print_ints(const R& range) {
        for (auto v : range)
            std::cout << v;  // Compiles even if v is std::string — no constraint
    }

**Why it fails**: The concept ``std::ranges::range`` only guarantees that ``R``
is iterable.  It says nothing about the element type.

**GOOD**

.. code-block:: cpp

    template <std::ranges::range R>
    requires std::integral<std::ranges::range_value_t<R>>
    void print_ints(const R& range) {
        for (auto v : range)
            std::cout << v << ' ';
    }

    // Or using a composed concept:
    template <typename R>
    concept IntRange = std::ranges::range<R>
                    && std::integral<std::ranges::range_value_t<R>>;

    template <IntRange R>
    void print_ints_v2(const R& range) {
        for (auto v : range) std::cout << v << ' ';
    }

**Detection tip**: When a constrained template still compiles for unexpected types,
check whether the constraint is applied to the parameter you think it is, and whether
you need to constrain the associated types (iterator, value type) as well.
