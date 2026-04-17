---
title: "04 — Pitfalls · Day 20"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-alert: 04 — Pitfalls: Static Polymorphism CRTP

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls — Day 20: Static Polymorphism and CRTP

??? pitfall-lobe "⚠️ Pitfall 1 — Incorrect `static_cast` Direction in CRTP"
    **Problem:** Casting `this` to the derived type in the wrong direction, or casting to an unrelated type, producing undefined behaviour.

    **BAD:**

    ``` cpp
    template<typename Derived>
    struct Base {
        void interface() {
            // WRONG: reinterpret_cast bypasses type checking
            reinterpret_cast<Derived*>(this)->implementation();
        }
    };

    // Also WRONG: casting base pointer to unrelated type
    template<typename Derived>
    struct BadBase {
        void interface() {
            Derived* d = (Derived*)this;  // C-style cast — no type safety
            d->implementation();
        }
    };
    ```

    **Why it fails:** `reinterpret_cast` and C-style casts bypass the type system. If `Derived` has virtual bases or a layout that differs from `Base` (unusual but possible with complex hierarchies), the pointer arithmetic is wrong. In practice, with simple single-inheritance CRTP, `static_cast` is both safe and the conventional choice.

    **GOOD — always use \`\`static_cast\`\` in CRTP:**

    ``` cpp
    template<typename Derived>
    struct Base {
        void interface() {
            static_cast<Derived*>(this)->implementation();
        }
        void const_interface() const {
            static_cast<const Derived*>(this)->implementation();
        }
    };
    ```

    **Detection tip:** Review every `reinterpret_cast` or C-style cast from `this` inside a CRTP base. Replace with `static_cast<Derived*>(this)` and `static_cast<const Derived*>(this)` for const methods.

??? pitfall-lobe "⚠️ Pitfall 2 — Forgetting `const` Overloads in the CRTP Base"
    **Problem:** The CRTP base provides only a non-`const` `interface()` method, so `const` instances of the derived class cannot call it.

    **BAD:**

    ``` cpp
    template<typename Derived>
    struct Printable {
        void print() {   // non-const only
            static_cast<Derived*>(this)->to_string();
        }
    };

    struct Point : Printable<Point> {
        double x, y;
        std::string to_string() const { return std::format("({},{})", x, y); }
    };

    const Point p{1.0, 2.0};
    p.print();   // compile error: cannot call non-const print() on const object
    ```

    **Why it fails:** `const Point` can only call `const` member functions. `print()` is not `const`, so the call is rejected.

    **GOOD — provide \`\`const\`\` overload:**

    ``` cpp
    template<typename Derived>
    struct Printable {
        void print() const {   // const method — works on const and non-const objects
            std::cout << static_cast<const Derived*>(this)->to_string() << '\n';
        }
    };
    ```

    **Detection tip:** For every CRTP base method that only reads state, mark it `const`. Test by declaring a `const` derived object and calling all interface methods.

??? pitfall-lobe "⚠️ Pitfall 3 — CRTP Base Has Virtual Destructor (Unintended vtable)"
    **Problem:** Adding a `virtual` destructor to a CRTP base defeats the purpose by introducing a vtable and a `vptr` in every derived object.

    **BAD:**

    ``` cpp
    template<typename Derived>
    struct Comparable {
        virtual ~Comparable() = default;   // WRONG for CRTP — creates vtable!

        bool operator!=(const Derived& o) const { ... }
    };

    struct Weight : Comparable<Weight> { double kg; };
    // sizeof(Weight) = sizeof(double) + sizeof(vptr) = 16 bytes instead of 8
    ```

    **Why it fails:** A `virtual` destructor forces a vtable on every instantiation of `Comparable<D>`. Each `Weight` object now carries a hidden 8-byte `vptr`, negating the zero-overhead goal.

    **GOOD — non-virtual, protected destructor prevents misuse without overhead:**

    ``` cpp
    template<typename Derived>
    struct Comparable {
        ~Comparable() = default;   // non-virtual — no vtable
    protected:
        // Making destructor protected prevents deletion via Base* pointer,
        // catching the misuse at compile time
    };
    ```

    **Detection tip:** Check every CRTP base for `virtual` members. Unless you specifically need polymorphic deletion through the base pointer, keep CRTP bases free of virtual functions.

??? pitfall-lobe "⚠️ Pitfall 4 — Using CRTP Where `std::variant` Is Simpler"
    **Problem:** Applying CRTP to a small closed set of types when `std::variant` + visitor would be cleaner and more maintainable.

    **BAD (over-engineered CRTP for two shapes):**

    ``` cpp
    template<typename D>
    struct Shape {
        double area() const { return static_cast<const D*>(this)->area_impl(); }
    };

    struct Circle   : Shape<Circle>   { double r; double area_impl() const { return 3.14*r*r; } };
    struct Square   : Shape<Square>   { double s; double area_impl() const { return s*s; } };

    // Can't store in a single container without another layer of type erasure
    template<typename... Shapes>
    double total_area(const std::vector<???>&);  // problem: heterogeneous collection
    ```

    **Why it fails:** CRTP produces distinct types. You cannot put `Circle` and `Square` in the same `std::vector` without additional type erasure. The complexity is not justified for two types.

    **GOOD — \`\`std::variant\`\` for a small closed set:**

    ``` cpp
    struct Circle { double r; };
    struct Square { double s; };
    using Shape = std::variant<Circle, Square>;

    double area(const Shape& sh) {
        return std::visit([](auto& s) {
            if constexpr (std::is_same_v<std::decay_t<decltype(s)>, Circle>)
                return 3.14159 * s.r * s.r;
            else
                return s.s * s.s;
        }, sh);
    }

    std::vector<Shape> shapes{Circle{1.0}, Square{2.0}, Circle{3.0}};
    double total = 0;
    for (auto& sh : shapes) total += area(sh);
    ```

    **Detection tip:** If you find yourself writing another layer of type erasure on top of CRTP just to get a heterogeneous container, switch to `std::variant`.

??? pitfall-lobe "⚠️ Pitfall 5 — Accidentally Instantiating Two `Base<Derived>` Chains"
    **Problem:** A derived class inherits from two CRTP bases that each inherit from a common third CRTP base, creating ambiguous member access (the diamond problem).

    **BAD:**

    ``` cpp
    template<typename D> struct Logger  { void log() { static_cast<D*>(this)->log_impl(); } };
    template<typename D> struct Auditor : Logger<D> { /* adds audit trail */ };
    template<typename D> struct Monitor : Logger<D> { /* adds monitoring */ };

    struct Service : Auditor<Service>, Monitor<Service> {
        void log_impl() {}
    };

    Service s;
    s.log();   // ambiguous: Auditor<Service>::log() or Monitor<Service>::log()?
    ```

    **Why it fails:** Both `Auditor<Service>` and `Monitor<Service>` inherit from `Logger<Service>`, so `Service` has two copies of `Logger<Service>` — a classic diamond. The call is ambiguous.

    **GOOD — use virtual inheritance for the shared base, or restructure:**

    ``` cpp
    // Option A: flatten — Auditor and Monitor both directly use Logger independently
    template<typename D> struct Logger  { void log() { static_cast<D*>(this)->log_impl(); } };
    template<typename D> struct Auditor { void audit() { static_cast<D*>(this)->log_impl(); } };
    template<typename D> struct Monitor { void monitor(){static_cast<D*>(this)->log_impl(); } };

    struct Service : Logger<Service>, Auditor<Service>, Monitor<Service> {
        void log_impl() {}
    };
    // Now log(), audit(), monitor() are all unambiguous
    ```

    **Detection tip:** Draw the CRTP inheritance graph. Any diamond (a node reachable via two distinct paths) requires restructuring or virtual inheritance.

??? pitfall-lobe "⚠️ Pitfall 6 — Excessively Deep CRTP Chains Hiding Code Paths"
    **Problem:** Stacking five or more CRTP mixins makes it very hard to trace which base class provides a given method.

    **BAD:**

    ``` cpp
    struct Config
        : Printable<Config>
        , Serialisable<Config>
        , Cloneable<Config>
        , Hashable<Config>
        , Comparable<Config>
        , Validatable<Config>
        , Diffable<Config> {
        // ...
    };
    // Navigating to the implementation of Config::diff() requires
    // hunting through seven base templates
    ```

    **Why it fails:** IDE navigation degrades; a `go to definition` on `config.diff()` may require multiple jumps. Compilation errors inside deep mixin chains produce confusing, multi-level template traces.

    **GOOD — compose via helpers or use concepts directly for small interfaces:**

    ``` cpp
    // Use free functions constrained by concepts instead of mixin bases
    template<typename T>
    concept Stringifiable = requires(const T& t) {
        { t.to_string() } -> std::convertible_to<std::string>;
    };

    void print_any(const Stringifiable auto& obj) {
        std::cout << obj.to_string() << '\n';
    }

    // Config only inherits what genuinely needs shared implementation
    struct Config : Comparable<Config> {
        std::string name; int value;
        bool operator==(const Config&) const = default;
        bool operator< (const Config& o) const { return name < o.name; }
        std::string to_string() const { return name + "=" + std::to_string(value); }
    };

    print_any(Config{"x", 1});   // works via concept constraint — no extra base
    ```

    **Detection tip:** If a class inherits from more than three CRTP bases, question whether each mixin provides reusable implementation or merely a method signature. The latter is better expressed as a concept.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 20:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
