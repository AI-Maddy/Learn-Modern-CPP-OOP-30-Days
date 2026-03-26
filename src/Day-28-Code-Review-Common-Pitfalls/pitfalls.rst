Pitfalls – Day 28: Code Review and Common C++ Pitfalls
=======================================================

Pitfall 1: Approving a PR Without Reading the Logic
----------------------------------------------------

**Description**
  A reviewer leaves an "LGTM" based on a quick scan of formatting and naming
  without verifying that the algorithm is correct. The wrong logic ships.

**BAD review comment**

.. code-block:: text

    "Looks good, style is clean, approved."
    — on a function containing unsigned subtraction underflow

**Why it fails**
  Automated tools check formatting. Code review exists precisely to catch
  what automation misses: wrong algorithms, missing edge cases, and
  architectural problems.

**GOOD approach**

.. code-block:: text

    Review checklist (mental):
    1. Trace the happy path through the logic manually.
    2. Identify every boundary condition and check how it is handled.
    3. Search for unsigned arithmetic used with potential negative values.
    4. Check that all resources are acquired via RAII.
    5. Verify exception paths do not leave objects in inconsistent state.
    Only then approve.

**Detection tip**
  Add a mandatory checklist to your PR template. Reviewers must check
  each box before submitting approval.

Pitfall 2: Missing ``const`` Cascades
--------------------------------------

**Description**
  A single function missing ``const`` forces every caller to be non-const,
  which propagates through the codebase and blocks safe const references.

**BAD code**

.. code-block:: cpp

    class Account {
    public:
        double balance() { return balance_; }  // missing const
    private:
        double balance_;
    };

    // Now this is a compile error — balance() is not const-qualified
    void print_summary(const Account& acc) {
        std::cout << acc.balance() << '\n';  // error
    }

    // Developer "fixes" by removing const from the parameter — wrong!
    void print_summary(Account& acc) {  // now cannot accept rvalue or const object
        std::cout << acc.balance() << '\n';
    }

**Why it fails**
  The "fix" removes a safety guarantee. The function now must accept a
  mutable reference, preventing callers from passing temporary or const
  objects. The problem propagates upward.

**GOOD code**

.. code-block:: cpp

    class Account {
    public:
        double balance() const { return balance_; }  // const correct from the start
    };

**Detection tip**
  ``clang-tidy`` check ``readability-make-member-function-const`` flags
  member functions that do not modify any member and are not yet const.

Pitfall 3: Raw Owning Pointer Returned From a Factory
------------------------------------------------------

**Description**
  A factory function returns a raw pointer to a heap-allocated object.
  If the caller forgets to delete it, or an exception is thrown before
  ``delete``, the memory is leaked.

**BAD code**

.. code-block:: cpp

    // Factory returns raw pointer — ownership is ambiguous
    Widget* create_widget(const Config& cfg) {
        return new Widget(cfg);  // who deletes this?
    }

    void use_widget(const Config& cfg) {
        Widget* w = create_widget(cfg);
        w->do_work();   // if do_work() throws, w is leaked
        delete w;
    }

**Why it fails**
  The ownership contract is not expressed in the type. Any code path
  that does not reach ``delete w`` causes a memory leak.

**GOOD code**

.. code-block:: cpp

    // unique_ptr expresses single ownership — caller automatically cleans up
    std::unique_ptr<Widget> create_widget(const Config& cfg) {
        return std::make_unique<Widget>(cfg);
    }

    void use_widget(const Config& cfg) {
        auto w = create_widget(cfg);
        w->do_work();   // even if this throws, ~unique_ptr runs
    }

**Detection tip**
  ``clang-tidy`` check ``cppcoreguidelines-owning-memory`` warns when a
  raw pointer is returned from a function that allocates with ``new``.

Pitfall 4: Signed/Unsigned Comparison in Loop Bounds
-----------------------------------------------------

**Description**
  Comparing a signed loop counter to an unsigned ``size()`` promotes the
  signed value to unsigned. A negative value wraps to a huge positive,
  causing an out-of-bounds access or an infinite loop.

**BAD code**

.. code-block:: cpp

    int n = compute_count();  // might return -1 on error
    std::vector<Item> items = load_items();

    for (int i = 0; i < items.size(); ++i) {  // warning: signed/unsigned mismatch
        process(items[i]);
    }

    // Worse: if compute_count() returns -1:
    for (int i = 0; i < n; ++i) {  // -1 < n: false immediately — loop skipped?
        // Or: if n is used as unsigned index somewhere downstream...
    }

**Why it fails**
  The implicit conversion of ``int`` to ``size_t`` in the comparison is
  legal but surprising. Negative values become enormous unsigned numbers.

**GOOD code**

.. code-block:: cpp

    // Option 1: use size_t for the loop variable
    for (std::size_t i = 0; i < items.size(); ++i) {
        process(items[i]);
    }

    // Option 2: range-for (always correct)
    for (const auto& item : items) {
        process(item);
    }

    // Option 3: validate n before using it
    if (n < 0) return;
    for (std::size_t i = 0; i < static_cast<std::size_t>(n); ++i) { ... }

**Detection tip**
  ``-Wsign-compare`` (included in ``-Wall``) flags signed/unsigned
  comparisons. Fix all such warnings — do not suppress them.

Pitfall 5: Implicit Conversion Hiding a Type Mismatch
------------------------------------------------------

**Description**
  Passing a ``double`` where an ``int`` is expected, or vice versa, compiles
  silently with C-style initialisation. The value is silently truncated
  or widened with possible precision loss.

**BAD code**

.. code-block:: cpp

    void apply_discount(int percentage, double price) {
        double discount = price * percentage / 100;
        // ...
    }

    apply_discount(3.5, 100.0);   // 3.5 silently truncated to 3 — bug!

**Why it fails**
  The compiler converts ``3.5`` to ``3`` without a diagnostic under the
  default warning settings. The discount is wrong without any indication.

**GOOD code**

.. code-block:: cpp

    // Strong typing prevents the confusion
    void apply_discount(double percentage_rate, double price) {
        double discount = price * percentage_rate;
    }
    apply_discount(0.035, 100.0);  // explicit: 3.5% rate

    // OR enforce at call site with brace-init in a wrapper
    struct DiscountRate { explicit DiscountRate(double r) : rate{r} {} double rate; };
    void apply_discount(DiscountRate rate, double price);
    apply_discount(DiscountRate{0.035}, 100.0);  // self-documenting

**Detection tip**
  Enable ``-Wconversion`` and ``-Wdouble-promotion``. Use brace-init
  wherever a narrowing conversion would be a bug.

Pitfall 6: ``std::endl`` in Performance-Critical Output
--------------------------------------------------------

**Description**
  ``std::endl`` outputs ``'\n'`` *and* calls ``flush()``. In loops that
  output thousands of lines, this can be 10–50x slower than using ``'\n'``.

**BAD code**

.. code-block:: cpp

    void dump_log(const std::vector<LogEntry>& entries) {
        for (const auto& e : entries)
            std::cout << e.message << std::endl;  // flush on every line
    }

**Why it fails**
  For 10,000 entries, this calls ``fflush`` 10,000 times. The buffer
  would flush automatically at program exit or when full, making the
  per-line flush pointless and expensive.

**GOOD code**

.. code-block:: cpp

    void dump_log(const std::vector<LogEntry>& entries) {
        for (const auto& e : entries)
            std::cout << e.message << '\n';  // buffers output efficiently
        // std::cout.flush() if you need guaranteed flush at the end
    }

**Detection tip**
  ``clang-tidy`` check ``performance-avoid-endl`` flags ``std::endl`` usage
  and suggests ``'\n'``. Enable it in your ``.clang-tidy`` configuration.
