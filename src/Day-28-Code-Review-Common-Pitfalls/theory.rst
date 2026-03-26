Day 28 – Code Review and Common C++ Pitfalls
=============================================

Motivation
----------

Code review is where knowledge transfers between engineers and where
accumulated bugs are caught before they reach users. A reviewer who does
not know the common C++ anti-patterns will miss the most dangerous issues.
A reviewee who cannot defend their choices wastes everyone's time.

This day gives you a structured mental checklist for every C++ review, a
catalogue of the most impactful anti-patterns, and practical guidance on
how to integrate automated tools so humans focus on what machines cannot
check.

How to Give a Code Review
--------------------------

Effective code reviews are structured. Work through these layers in order:

**Layer 1 — Correctness**
  Does the code do what the ticket/spec says? Are edge cases handled? Can
  it panic, deadlock, or produce undefined behaviour? This is the most
  important layer — style is irrelevant if the code is wrong.

**Layer 2 — Safety and Resource Management**
  Are all resources (memory, files, locks) acquired via RAII? Is ownership
  clear (``unique_ptr`` vs raw pointer)? Is exception safety considered?

**Layer 3 — Interface Design**
  Is the API minimal and expressive? Do parameter names, types, and ``const``
  qualifiers communicate intent? Could the interface be misused by accident?

**Layer 4 — Performance**
  Are there unnecessary copies? Is the wrong container chosen for the access
  pattern? Are ``std::string`` temporaries being created in tight loops?

**Layer 5 — Style and Readability**
  Naming, formatting, comment quality. These are important but should not
  dominate the review if layers 1–4 are clean.

How to Receive a Code Review
------------------------------

* Treat every comment as a question, not an attack.
* Respond to every comment — either fix it, explain why you disagree, or
  ask for clarification. "Done" and "Good point, will fix in a follow-up"
  are both acceptable. Silent ignoring is not.
* Do not rewrite unrelated code in response to review feedback — that
  creates noise and is harder to review.
* If a reviewer's suggestion makes the code worse, explain why calmly with
  reference to the C++ Core Guidelines or the style guide.

The C++ Anti-Pattern Checklist
--------------------------------

Use this checklist mentally on every PR:

**1. Raw ``new`` / ``delete``**

.. code-block:: cpp

    // BAD: manual memory management
    Foo* p = new Foo(args);
    // ... something throws here ...
    delete p;  // NEVER REACHED

    // GOOD: RAII — destructor guaranteed
    auto p = std::make_unique<Foo>(args);

**2. Unsigned Subtraction Underflow**

.. code-block:: cpp

    // BAD: size_t is unsigned — wraps to huge number when b > a
    std::size_t a = 3, b = 5;
    std::size_t diff = a - b;   // wraps to ~18 quintillion
    for (std::size_t i = 0; i < diff; ++i) { /* billions of iterations */ }

    // GOOD: use signed comparison or check before subtracting
    if (a >= b) {
        std::size_t diff = a - b;
    }
    // OR: cast to signed for arithmetic
    auto diff = static_cast<std::ptrdiff_t>(a) - static_cast<std::ptrdiff_t>(b);

**3. Implicit Narrowing Conversion**

.. code-block:: cpp

    // BAD: double silently truncated to int
    double precise = 3.99;
    int rounded = precise;    // int{3} — no warning by default with C-style init

    // GOOD: use brace-initialisation — narrowing is a compile error
    int rounded{precise};     // error: narrowing conversion from double to int
    int rounded = static_cast<int>(precise);  // intentional, documented

**4. Missing ``const`` on Query Methods**

.. code-block:: cpp

    // BAD: method does not modify state but lacks const
    class Circle {
    public:
        double area() { return 3.14 * r_ * r_; }   // should be const
    private:
        double r_;
    };

    void print_info(const Circle& c) {
        std::cout << c.area();  // COMPILE ERROR: non-const method on const ref
    }

    // GOOD:
    double area() const { return std::numbers::pi * r_ * r_; }

**5. Returning a Reference to a Local Variable**

.. code-block:: cpp

    // BAD: local string is destroyed on return; reference dangles
    const std::string& get_name() {
        std::string name = "Alice";  // local
        return name;                 // returns reference to dead object — UB
    }

    // GOOD: return by value (NRVO makes this cheap)
    std::string get_name() {
        return "Alice";
    }

**6. Comparing Signed and Unsigned Integers**

.. code-block:: cpp

    // BAD: -1 as signed int compares as huge number when widened to size_t
    int index = get_index();  // may return -1 on error
    if (index < vec.size()) { // comparison signed/unsigned — -1 always "passes"
        return vec[index];    // UB: negative index
    }

    // GOOD:
    if (index >= 0 && static_cast<std::size_t>(index) < vec.size()) {
        return vec[static_cast<std::size_t>(index)];
    }

**7. Forgetting ``override``**

.. code-block:: cpp

    // BAD: typo in the signature means this is a NEW function, not an override
    class Derived : public Base {
    public:
        virtual void procces() { }  // typo: 'procces' vs 'process' — no error!
    };

    // GOOD: override makes the compiler enforce the signature match
    class Derived : public Base {
    public:
        void process() override { }  // compile error if Base has no matching virtual
    };

**8. std::endl vs '\n'**

.. code-block:: cpp

    // BAD: std::endl flushes the buffer on every call — 10x slower in loops
    for (int i = 0; i < 10000; ++i)
        std::cout << i << std::endl;  // flush 10,000 times

    // GOOD: '\n' outputs newline without flushing
    for (int i = 0; i < 10000; ++i)
        std::cout << i << '\n';

**9. Exception Specification ``noexcept`` Misuse**

.. code-block:: cpp

    // BAD: marking a function noexcept when it can throw causes std::terminate
    void process(std::vector<int>& v) noexcept {
        v.at(100);  // throws std::out_of_range — calls std::terminate!
    }

    // GOOD: only mark noexcept when you have verified it truly cannot throw
    // OR catch internally and handle:
    void process(std::vector<int>& v) noexcept {
        if (v.size() > 100)
            v[100];  // no-throw once we have checked bounds
    }

Integrating Static Analysis into CI
-------------------------------------

.. code-block:: yaml

    # .github/workflows/static_analysis.yml (example)
    name: Static Analysis
    on: [push, pull_request]
    jobs:
      clang-tidy:
        runs-on: ubuntu-22.04
        steps:
          - uses: actions/checkout@v4
          - name: Install tools
            run: sudo apt-get install -y clang-tidy
          - name: Configure
            run: cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
          - name: Run clang-tidy
            run: |
              run-clang-tidy -p build/ \
                -header-filter='.*' \
                -checks='cppcoreguidelines-*,modernize-*,readability-*' \
                src/

Automated Formatters
----------------------

``clang-format`` enforces style mechanically so code review can focus on
substance. A ``.clang-format`` file checked into the repository ensures
every contributor gets the same style:

.. code-block:: yaml

    # .clang-format
    BasedOnStyle: Google
    IndentWidth: 4
    ColumnLimit: 100
    AllowShortFunctionsOnASingleLine: None
    SortIncludes: true

Run before every commit::

    clang-format -i src/**/*.cpp src/**/*.hpp

Or add a pre-commit hook::

    # .git/hooks/pre-commit
    git diff --cached --name-only | grep -E '\.(cpp|hpp|h)$' | \
        xargs clang-format --dry-run --Werror

ASCII: Review Severity Levels
------------------------------

.. code-block:: text

    ┌──────────────┬──────────────────────────────────────────┐
    │ Severity     │ Example                                  │
    ├──────────────┼──────────────────────────────────────────┤
    │ BLOCKER      │ UB, data race, memory leak on error path │
    │ CRITICAL     │ Wrong algorithm, missing input validation │
    │ MAJOR        │ Missing const, raw pointer for ownership  │
    │ MINOR        │ Poor naming, missing [[nodiscard]]        │
    │ NIT          │ Style preference, formatting              │
    └──────────────┴──────────────────────────────────────────┘

Always start from BLOCKER and work downward. Do not leave BLOCKER issues
for a follow-up PR.

Design Tradeoffs
-----------------

* **Automated vs manual review**: automated tools catch consistent,
  mechanical issues (formatting, obvious UB patterns). Manual review
  catches design problems, missing business-logic edge cases, and
  architectural concerns that tools cannot reason about.

* **How many reviewers**: one thorough reviewer is better than three
  hurried ones. Two reviewers are ideal for critical paths. Requiring
  five approvals slows delivery without proportional quality benefit.

* **Nitpick culture**: a review full of nitpicks (style, naming) with no
  substantive comments discourages authors and normalises superficial
  review. Save nitpicks for mentoring contexts.

Self-Check Questions
--------------------

#. **Why should you check correctness before style in a code review?**

   A stylistically perfect function with an off-by-one error in a loop
   ships a bug. Style is important for long-term maintainability but
   never as urgent as functional correctness or undefined behaviour.

#. **What is the risk of unsigned subtraction in C++?**

   ``unsigned a - unsigned b`` where ``b > a`` wraps around to a very large
   positive number (modular arithmetic). Using this in a loop bound or
   array index causes out-of-bounds access or an essentially infinite loop.

#. **Why does brace-initialisation prevent narrowing?**

   The C++11 standard explicitly prohibits narrowing conversions in brace-
   initialisers and mandates a diagnostic. This catches ``int{3.5}`` as a
   compile error, whereas ``int x = 3.5`` compiles silently.

#. **What is the difference between clang-tidy and clang-format?**

   ``clang-format`` enforces source code *formatting* (indentation, brace
   placement, line length). ``clang-tidy`` is a linter that checks for
   *semantic* issues (anti-patterns, UB, style guide violations at the
   API level).

#. **When is ``noexcept`` harmful?**

   When it is applied to a function that can actually throw. If the function
   throws at runtime, ``std::terminate()`` is called immediately with no
   stack unwinding. Mark ``noexcept`` only when you have verified the entire
   call tree cannot throw, or when you explicitly catch and suppress.
