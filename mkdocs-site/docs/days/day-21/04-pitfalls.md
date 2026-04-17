---
title: "04 — Pitfalls · Day 21"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-alert: 04 — Pitfalls: PIMPL Idiom Type Erasure

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls — Day 21: pImpl Idiom and Type Erasure

??? pitfall-lobe "⚠️ Pitfall 1 — Defaulting the Destructor in the Header"
    **Problem:** The most common pImpl mistake: `~Widget() = default;` in the header, where `Impl` is incomplete, causes a hard compile error about deleting an incomplete type.

    **BAD:**

    ``` cpp
    // widget.hpp
    class Widget {
    public:
        Widget();
        ~Widget() = default;  // WRONG — unique_ptr<Impl> destructor needs complete Impl
    private:
        struct Impl;
        std::unique_ptr<Impl> pImpl_;
    };
    ```

    **Why it fails:** When the compiler generates `~Widget()`, it must generate the destructor for `unique_ptr<Impl>`, which calls `delete pImpl_.get()`. This requires the full definition of `Impl` to call its destructor — but the header only has a forward declaration. Compile error: "cannot delete pointer to incomplete type."

    **GOOD — declare the destructor in the header, define in the \`\`.cpp\`\`:**

    ``` cpp
    // widget.hpp
    class Widget {
    public:
        Widget();
        ~Widget();   // declared, not defined here
    private:
        struct Impl;
        std::unique_ptr<Impl> pImpl_;
    };

    // widget.cpp
    #include "widget.hpp"
    struct Widget::Impl { /* full definition */ };
    Widget::~Widget() = default;  // correct — Impl is complete here
    ```

    **Detection tip:** If you see `unique_ptr<Incomplete>` as a member with `~T() = default` in the header, it will fail. The fix is always to move the destructor definition to the `.cpp`.

??? pitfall-lobe "⚠️ Pitfall 2 — pImpl Without Move Operations (Accidentally Deleted)"
    **Problem:** Declaring a custom destructor suppresses the compiler-generated move constructor and move assignment operator, making the class accidentally non-movable.

    **BAD:**

    ``` cpp
    // widget.hpp
    class Widget {
    public:
        Widget();
        ~Widget();       // declared — suppresses generated move operations
        // No move constructor declared — Widget is now non-movable!
    private:
        struct Impl;
        std::unique_ptr<Impl> pImpl_;
    };

    std::vector<Widget> widgets;
    widgets.push_back(Widget{});   // COMPILE ERROR: no move constructor
    ```

    **Why it fails:** The Rule of 5 says: if you declare a destructor, the compiler does not auto-generate move operations. Since `unique_ptr` is move-only, `Widget` becomes immovable without explicit move declarations.

    **GOOD — explicitly declare and default move operations in the header:**

    ``` cpp
    // widget.hpp
    class Widget {
    public:
        Widget();
        ~Widget();
        Widget(Widget&&) noexcept;
        Widget& operator=(Widget&&) noexcept;
        // Copy: explicitly deleted or defined:
        Widget(const Widget&);
        Widget& operator=(const Widget&);
    private:
        struct Impl;
        std::unique_ptr<Impl> pImpl_;
    };

    // widget.cpp — all definitions where Impl is complete
    Widget::Widget(Widget&&) noexcept = default;
    Widget& Widget::operator=(Widget&&) noexcept = default;
    ```

    **Detection tip:** After writing a pImpl class, immediately try `std::vector<Widget> v; v.push_back(Widget{});` in a test. If it doesn't compile, move operations are missing.

??? pitfall-lobe "⚠️ Pitfall 3 — `std::any_cast` Without Checking First"
    **Problem:** Casting `std::any` directly to the wrong type throws `std::bad_any_cast`, which if uncaught terminates the program.

    **BAD:**

    ``` cpp
    std::any value = std::string("hello");

    // Assuming it holds int — will throw!
    int i = std::any_cast<int>(value);   // std::bad_any_cast — uncaught → terminate
    ```

    **Why it fails:** `std::any_cast<T>(any_value)` throws `std::bad_any_cast` if the held type is not exactly `T` (cv-qualifications and reference wrappers aside). No inheritance relationship can satisfy the check.

    **GOOD — use pointer-form \`\`any_cast\`\` which returns \`\`nullptr\`\` on mismatch:**

    ``` cpp
    std::any value = std::string("hello");

    if (auto* s = std::any_cast<std::string>(&value)) {
        std::cout << "String: " << *s << '\n';
    } else if (auto* i = std::any_cast<int>(&value)) {
        std::cout << "Int: " << *i << '\n';
    } else {
        std::cout << "Unknown type: " << value.type().name() << '\n';
    }
    ```

    **Detection tip:** Search for `std::any_cast<` that is not inside a `try`/`catch` or not using the pointer form. Both are acceptable; the pointer form is cleaner for type-dispatching logic.

??? pitfall-lobe "⚠️ Pitfall 4 — Custom Type Erasure Wrapper With Shared Ownership When Unique Is Needed"
    **Problem:** Using `std::shared_ptr<Concept>` inside a type-erasing wrapper when the wrapper is supposed to behave as a value type with independent ownership.

    **BAD:**

    ``` cpp
    class AnyDrawable {
        std::shared_ptr<Concept> self_;  // shared — copies share the same object!
    public:
        template<typename T>
        AnyDrawable(T obj) : self_{std::make_shared<Model<T>>(std::move(obj))} {}
        void draw() const { self_->draw_impl(); }
    };

    AnyDrawable a{Circle{}};
    AnyDrawable b = a;          // b shares the same Circle with a
    // Mutating a's circle also mutates b's circle — surprising value semantics!
    ```

    **Why it fails:** Copying a `shared_ptr`-based wrapper gives two objects that silently share state. For a type that looks like a value type (no `*` or `&` in the API), users expect independent copies.

    **GOOD — use \`\`unique_ptr\`\` with a virtual \`\`clone()\`\` method for value semantics:**

    ``` cpp
    struct Concept {
        virtual ~Concept() = default;
        virtual void draw_impl() const = 0;
        virtual std::unique_ptr<Concept> clone() const = 0;  // deep copy
    };

    template<typename T>
    struct Model : Concept {
        T value;
        explicit Model(T v) : value{std::move(v)} {}
        void draw_impl() const override { value.draw(); }
        std::unique_ptr<Concept> clone() const override {
            return std::make_unique<Model<T>>(value);
        }
    };

    class AnyDrawable {
        std::unique_ptr<Concept> self_;
    public:
        template<typename T>
        AnyDrawable(T obj) : self_{std::make_unique<Model<T>>(std::move(obj))} {}

        AnyDrawable(const AnyDrawable& o) : self_{o.self_->clone()} {}
        AnyDrawable& operator=(const AnyDrawable& o) {
            if (this != &o) self_ = o.self_->clone();
            return *this;
        }
        AnyDrawable(AnyDrawable&&) noexcept = default;
        AnyDrawable& operator=(AnyDrawable&&) noexcept = default;

        void draw() const { self_->draw_impl(); }
    };
    ```

    **Detection tip:** If a type-erasing wrapper is copyable and uses `shared_ptr<Concept>` internally, copies alias the same state — test this by modifying through one copy and observing the other.

??? pitfall-lobe "⚠️ Pitfall 5 — pImpl Disabling the Header-Only Benefit"
    **Problem:** Using pImpl on a class that is primarily used as a small, frequently-copied value type (e.g., `Point`, `Color`, `Duration`), where the heap allocation and pointer indirection hurt more than they help.

    **BAD:**

    ``` cpp
    class Point {       // Two doubles — 16 bytes total
        struct Impl;
        std::unique_ptr<Impl> pImpl_;  // 8 byte pointer + heap alloc for 16 bytes
    public:
        Point(double x, double y);
        double x() const;
        double y() const;
    };
    // Each Point construction allocates on the heap — terrible for a tiny value
    ```

    **Why it fails:** The heap overhead (allocation, indirection, cache miss) for a 16-byte value type is enormous relative to the value. No ABI or compilation speed benefit justifies the cost for a type used in tight loops.

    **GOOD — pImpl is for types with complex, changing, or large private state:**

    ``` cpp
    struct Point { double x, y; };   // value type — keep it simple

    // Reserve pImpl for types like:
    class NetworkConnection {   // large, platform-specific, changing internals
        struct Impl;
        std::unique_ptr<Impl> pImpl_;
    };
    ```

    **Detection tip:** If `sizeof(Impl)` is small (under ~64 bytes) and the type is frequently copied or stored by value, reconsider pImpl. The benefit only justifies the cost for complex or ABI-sensitive classes.

??? pitfall-lobe "⚠️ Pitfall 6 — `std::variant` Visitor Missing a Type Arm"
    **Problem:** A `std::visit` visitor doesn't handle one of the variant alternatives, causing a compile error — but the error message is often cryptic.

    **BAD:**

    ``` cpp
    using Shape = std::variant<Circle, Square, Triangle>;

    double area(const Shape& s) {
        return std::visit([](const Circle& c)  { return 3.14 * c.r * c.r; },
                          s);  // COMPILE ERROR: lambda doesn't handle Square or Triangle
    }
    ```

    **Why it fails:** `std::visit` requires the visitor to be callable with every type in the variant. A single-type lambda is not a valid visitor for a multi-type variant.

    **GOOD — use the \`\`overloaded\`\` pattern or a struct visitor:**

    ``` cpp
    template<typename... Ts>
    struct overloaded : Ts... { using Ts::operator()...; };
    template<typename... Ts> overloaded(Ts...) -> overloaded<Ts...>;

    double area(const Shape& s) {
        return std::visit(overloaded{
            [](const Circle&   c){ return 3.14159 * c.r * c.r; },
            [](const Square&   sq){ return sq.s * sq.s; },
            [](const Triangle& t){ return 0.5 * t.b * t.h; }
        }, s);
    }
    ```

    **Detection tip:** The compile error for a missing visitor arm typically mentions "no matching overloaded function call." Count the lambda arms; there must be one for every type in the variant (or a generic `auto` catch-all).


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 21:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
