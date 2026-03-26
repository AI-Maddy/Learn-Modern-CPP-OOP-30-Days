Ranges and Views (C++20)
========================

Motivation
----------

The classic STL algorithm model is powerful but verbose.  Composing three steps —
filter, transform, take — requires three separate passes, three temporary containers,
and three pairs of begin/end iterators.

.. code-block:: cpp

    // Pre-ranges: three allocations, three loops
    std::vector<int> evens, doubled, first5;
    std::copy_if(data.begin(), data.end(), std::back_inserter(evens),
                 [](int x){ return x % 2 == 0; });
    std::transform(evens.begin(), evens.end(), std::back_inserter(doubled),
                   [](int x){ return x * 2; });
    first5.assign(doubled.begin(),
                  doubled.begin() + std::min<int>(5, doubled.size()));

C++20 **ranges** and **views** turn this into a single lazy pipeline:

.. code-block:: cpp

    namespace rv = std::ranges::views;
    auto result = data
        | rv::filter([](int x){ return x % 2 == 0; })
        | rv::transform([](int x){ return x * 2; })
        | rv::take(5);
    // No temporary containers.  Elements are produced on demand.

The ``std::ranges::views`` Pipeline
------------------------------------

The pipe operator ``|`` chains range adaptors.  Each adaptor returns a **view** — a
lightweight object that describes *how* to iterate, without storing any elements.

.. code-block:: cpp

    #include <ranges>
    #include <vector>
    #include <iostream>
    #include <algorithm>

    namespace rv = std::ranges::views;
    namespace rg = std::ranges;

    std::vector<int> nums{1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Pipeline: keep even numbers, double them, take first 3
    auto pipeline = nums
        | rv::filter([](int n){ return n % 2 == 0; })
        | rv::transform([](int n){ return n * 2; })
        | rv::take(3);

    for (int v : pipeline)
        std::cout << v << ' ';   // 4 8 12
    // nums was never modified; no temporaries were created

    // Materialise into a vector when you need ownership
    std::vector<int> results;
    rg::copy(pipeline, std::back_inserter(results));

Lazy Evaluation
---------------

A view does no work when it is created.  Work happens only when the view is iterated.
This means:

* Unused elements cost nothing.
* You can build arbitrarily long pipelines with zero intermediate memory.
* Pipelines can operate on infinite ranges.

.. code-block:: cpp

    // Infinite range of natural numbers
    auto naturals = rv::iota(1);  // 1, 2, 3, 4, ...

    // Take first 5 primes — computed lazily
    auto is_prime = [](int n) {
        if (n < 2) return false;
        for (int i = 2; i * i <= n; ++i)
            if (n % i == 0) return false;
        return true;
    };

    auto first_5_primes = naturals
        | rv::filter(is_prime)
        | rv::take(5);

    for (int p : first_5_primes)
        std::cout << p << ' ';  // 2 3 5 7 11
    // rv::iota(1) is infinite; rv::take(5) stops after 5 elements

ASCII diagram — lazy pipeline execution::

    nums:  1  2  3  4  5  6  7  8  9 10
           │
      filter(even)
           │  2     4     6     8    10
           │
      transform(×2)
           │  4     8    12    16    20
           │
      take(3)
           │  4     8    12
           │
      for loop pulls → iterator advances only 3 elements

Core Range Adaptors
--------------------

**filter** — yield only elements matching a predicate

.. code-block:: cpp

    auto positives = data | rv::filter([](int x){ return x > 0; });

**transform** — apply a function to each element

.. code-block:: cpp

    auto squares = data | rv::transform([](int x){ return x * x; });

**take** / **drop** — first/after-first N elements

.. code-block:: cpp

    auto first10 = data | rv::take(10);
    auto after10 = data | rv::drop(10);

**take_while** / **drop_while** — conditional take/drop

.. code-block:: cpp

    auto head = data | rv::take_while([](int x){ return x < 100; });

**reverse** — iterate backwards

.. code-block:: cpp

    auto rev = data | rv::reverse;   // requires bidirectional range

**keys** / **values** — extract first/second from pair ranges

.. code-block:: cpp

    std::map<std::string, int> scores{{"Alice", 90}, {"Bob", 75}};
    for (const auto& name : scores | rv::keys)
        std::cout << name << '\n';

**zip** (C++23) — iterate two ranges in lockstep

.. code-block:: cpp

    // C++23
    std::vector<int>         ids{1, 2, 3};
    std::vector<std::string> names{"a", "b", "c"};
    for (auto [id, name] : rv::zip(ids, names))
        std::cout << id << ':' << name << '\n';

**iota** — integer sequence (possibly infinite)

.. code-block:: cpp

    auto squares_to_10 = rv::iota(1, 11)
        | rv::transform([](int x){ return x * x; });

Owning vs Non-Owning Ranges
----------------------------

A **view** does not own its elements — it borrows them from a range.  This is
critical for lifetime management.

.. code-block:: cpp

    // SAFE: view borrows from a named vector whose lifetime exceeds the view's
    std::vector<int> v{1, 2, 3, 4, 5};
    auto view = v | rv::filter([](int x){ return x > 2; });
    for (int x : view) std::cout << x;  // OK

    // DANGER: view borrows from a temporary — the temporary is destroyed
    auto bad_view = std::vector<int>{1,2,3} | rv::filter([](int x){ return x>0; });
    // bad_view's underlying data is already destroyed at the semicolon!
    // Using bad_view is undefined behaviour.

    // SAFE: use rv::all on a temporary via std::ranges::owning_view (C++23)
    // or materialise immediately
    auto safe = std::vector<int>{1,2,3}
        | rv::filter([](int x){ return x > 0; })
        | rg::to<std::vector>();   // C++23 materialise

Writing a Custom Range Adaptor
-------------------------------

A range adaptor is an object that, when piped a range, returns a view.  The minimal
approach for C++20 is to write a view class and a range closure object.

.. code-block:: cpp

    #include <ranges>

    // Custom view: stride — yield every Nth element
    template <std::ranges::input_range R>
    class stride_view : public std::ranges::view_interface<stride_view<R>> {
        R           base_;
        std::size_t stride_;

        struct iterator {
            std::ranges::iterator_t<R> current_;
            std::ranges::sentinel_t<R> end_;
            std::size_t                stride_;

            using value_type      = std::ranges::range_value_t<R>;
            using difference_type = std::ptrdiff_t;
            using iterator_concept = std::input_iterator_tag;

            iterator& operator++() {
                for (std::size_t i = 0; i < stride_ && current_ != end_; ++i)
                    ++current_;
                return *this;
            }
            value_type operator*() const { return *current_; }
            bool operator==(std::default_sentinel_t) const {
                return current_ == end_;
            }
        };

    public:
        stride_view(R r, std::size_t s) : base_(std::move(r)), stride_(s) {}
        auto begin() {
            return iterator{std::ranges::begin(base_),
                            std::ranges::end(base_), stride_};
        }
        auto end() { return std::default_sentinel; }
    };

    // Helper closure for pipe syntax
    struct stride_fn {
        std::size_t n_;
        template <std::ranges::input_range R>
        auto operator()(R&& r) const {
            return stride_view<std::views::all_t<R>>{
                std::views::all(std::forward<R>(r)), n_};
        }
    };

    auto stride(std::size_t n) { return stride_fn{n}; }

    template <std::ranges::input_range R>
    auto operator|(R&& r, stride_fn fn) {
        return fn(std::forward<R>(r));
    }

    // Usage:
    // std::vector<int> v{0,1,2,3,4,5,6};
    // for (int x : v | stride(2)) ...  // 0, 2, 4, 6

Self-Check Questions
---------------------

#. **What is the key difference between a range and a view?**

   A range owns or references elements and can be iterated.  A view is a lightweight,
   non-owning, lazily-computed window over a range.  Views are cheap to copy and
   compose but must not outlive their underlying range.

#. **Why does piping a temporary into a view cause undefined behaviour?**

   The view stores an iterator into the temporary.  The temporary is destroyed at the
   end of the full expression; the stored iterator is then dangling.

#. **Explain lazy evaluation in the context of ranges.**

   Each adaptor in the pipeline records what to do; it does not do it yet.  When the
   user iterates (via a range-for or an algorithm), the adaptors cooperate to produce
   one element at a time, on demand.  Elements that are never requested are never
   computed.

#. **How does** ``rv::iota(1)`` **work without consuming infinite memory?**

   ``iota`` is a view whose iterator generates the next integer on ``operator++``.
   No elements are stored; each is computed when the iterator is dereferenced.
   ``take(N)`` stops the iteration after N elements.

#. **What must a custom range adaptor's iterator type provide to work with
   range-based for?**

   At minimum: ``operator*`` (dereference), prefix ``operator++`` (advance), and
   an equality comparison with either another iterator or a sentinel type.
