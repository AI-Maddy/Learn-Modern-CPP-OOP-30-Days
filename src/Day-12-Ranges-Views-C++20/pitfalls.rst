Pitfalls — Day 12: Ranges and Views (C++20)
============================================

Pitfall 1: View Over a Temporary — Dangling Iterator
-----------------------------------------------------

**Description**: Piping a temporary container into a view and then using the view
after the temporary has been destroyed causes undefined behaviour.

**BAD**

.. code-block:: cpp

    #include <ranges>
    #include <vector>

    namespace rv = std::ranges::views;

    // get_data() returns a temporary vector
    std::vector<int> get_data() { return {1, 2, 3, 4, 5}; }

    // BAD: the temporary vector is destroyed after the semicolon
    auto view = get_data() | rv::filter([](int x){ return x > 2; });

    // At this point, the temporary vector no longer exists.
    for (int x : view)  // UB: iterating through dangling iterators
        std::cout << x;

**Why it fails**: A view stores iterators into its source range.  Temporaries are
destroyed at the end of the full expression that creates them.  The view's iterators
point to freed memory.

**GOOD**

.. code-block:: cpp

    // Option A: give the container a name (extend its lifetime)
    auto data = get_data();
    auto view = data | rv::filter([](int x){ return x > 2; });
    for (int x : view) std::cout << x;  // safe: data outlives view

    // Option B: materialise immediately using a range algorithm
    namespace rg = std::ranges;
    std::vector<int> result;
    rg::copy(get_data() | rv::filter([](int x){ return x > 2; }),
             std::back_inserter(result));  // safe: copy happens before temp dies

**Detection tip**: Clang's ``-Wdangling`` and AddressSanitizer will often catch
dangling view bugs at runtime.  The rule: if a view is used after the statement that
creates it, its source must be a named variable.

Pitfall 2: Modifying a Container While Iterating a View
--------------------------------------------------------

**Description**: Adding or removing elements from a container that an active view
refers to invalidates the view's iterators.

**BAD**

.. code-block:: cpp

    std::vector<int> v{1, 2, 3, 4, 5};
    auto even_view = v | rv::filter([](int x){ return x % 2 == 0; });

    for (int x : even_view) {
        v.push_back(x * 2);   // BAD: push_back may reallocate v
                               // even_view's iterators are now dangling
    }

**Why it fails**: ``push_back`` may trigger a reallocation of ``v``'s internal buffer,
invalidating all iterators, including those stored inside ``even_view``.

**GOOD**

.. code-block:: cpp

    std::vector<int> v{1, 2, 3, 4, 5};

    // Materialise the view results before modifying the container
    std::vector<int> evens;
    std::ranges::copy(v | rv::filter([](int x){ return x % 2 == 0; }),
                      std::back_inserter(evens));

    // Now safe to append to v
    for (int x : evens)
        v.push_back(x * 2);

**Detection tip**: Any time you write to a container inside a loop that reads from a
view of that container, pause and check whether the write can trigger reallocation.
``reserve`` before the loop if the container size is known.

Pitfall 3: Infinite Range Without ``take`` — Hanging Program
------------------------------------------------------------

**Description**: Materialising or iterating an infinite range without a stopping
condition causes the program to loop forever.

**BAD**

.. code-block:: cpp

    namespace rv = std::ranges::views;

    // iota(0) generates 0, 1, 2, 3, ... forever
    std::vector<int> all_naturals;
    std::ranges::copy(rv::iota(0),
                      std::back_inserter(all_naturals));  // INFINITE LOOP

**Why it fails**: ``iota(0)`` is an infinite range.  ``copy`` will keep pulling
elements until the sentinel is reached — which it never is.

**GOOD**

.. code-block:: cpp

    // Always bound infinite ranges before materialising
    std::vector<int> first_100;
    std::ranges::copy(rv::iota(0) | rv::take(100),
                      std::back_inserter(first_100));

    // Or iterate lazily with an explicit stop condition
    for (int n : rv::iota(0) | rv::take_while([](int n){ return n < 100; }))
        std::cout << n << ' ';

**Detection tip**: Treat ``rv::iota`` with a single argument like an unbounded
generator.  Any use of it must be combined with ``take``, ``take_while``, or another
finite bounding adaptor before materialisation or full iteration.

Pitfall 4: Assuming a View Is Free to Copy
------------------------------------------

**Description**: Some views (notably ``filter_view``) cache the iterator to ``begin``
internally and are not cheap to copy.  Passing them by value can cause subtle issues.

**BAD**

.. code-block:: cpp

    namespace rv = std::ranges::views;

    auto expensive_filter = some_vector
        | rv::filter(expensive_predicate);  // caches begin internally

    // Copying the view copies the cache state — may cause O(n) work on copy
    auto copy1 = expensive_filter;
    auto copy2 = expensive_filter;

    for (int x : copy1) { /* ... */ }
    for (int x : copy2) { /* ... */ }   // predicate evaluated again from scratch

**Why it fails**: ``filter_view`` caches its ``begin()`` result for O(1) access.
Copying the view copies the cache, but iterator advances are not shared, so each
copy walks through the predicate independently.

**GOOD**

.. code-block:: cpp

    // Pass views by const reference when sharing across multiple consumers
    auto filtered = some_vector | rv::filter(expensive_predicate);

    auto consume = [](const auto& view) {
        for (auto x : view) { /* ... */ }
    };

    consume(filtered);   // no copy — uses the same cached begin()

**Detection tip**: Prefer passing views as template parameters (``auto&&``) or
``const auto&`` to avoid unnecessary copies.  Materialise to a container if you
need truly independent iteration.

Pitfall 5: ``rv::transform`` with Mutating Lambdas — Unexpected State
---------------------------------------------------------------------

**Description**: A transform lambda that captures a mutable counter can be called
multiple times per element if the view is iterated more than once, because views
are lazy and re-evaluate on each traversal.

**BAD**

.. code-block:: cpp

    namespace rv = std::ranges::views;

    int count = 0;
    std::vector<int> v{1, 2, 3};

    auto indexed = v | rv::transform([&count](int x) {
        return std::make_pair(count++, x);  // count incremented each time!
    });

    for (auto [i, x] : indexed) std::cout << i << ':' << x << '\n';
    // count is now 3
    for (auto [i, x] : indexed) std::cout << i << ':' << x << '\n';
    // count is now 6 — indices are 3,4,5 not 0,1,2!

**Why it fails**: Iterating the view a second time re-runs the lambda with the
current (already incremented) value of ``count``.  Each traversal mutates state.

**GOOD**

.. code-block:: cpp

    // Option A: materialise to a vector on the first pass
    std::vector<std::pair<int, int>> indexed_data;
    int count = 0;
    for (int x : v)
        indexed_data.emplace_back(count++, x);

    // Option B: use rv::enumerate (C++23) for index + value
    for (auto [i, x] : v | rv::enumerate)
        std::cout << i << ':' << x << '\n';

**Detection tip**: Lambdas captured by reference inside views should be stateless or
idempotent.  Mutable captured state in a view transform is almost always a bug.
