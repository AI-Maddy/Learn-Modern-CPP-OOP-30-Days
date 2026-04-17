---
title: "04 — Pitfalls · Day 05"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-alert: 04 — Pitfalls: Smart Pointers Ownership

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls — Day 05: Smart Pointers and Ownership

??? danger "⚠️ Pitfall 1: Shared Pointer Cycles Causing Memory Leaks"
    **Description:** Two or more objects holding `shared_ptr` references to each other in a cycle. The reference count of each never reaches zero, so neither object is ever destroyed.

    **BAD code:**

    ``` cpp
    #include <memory>
    #include <iostream>

    struct Node {
        int value;
        std::shared_ptr<Node> next;   // strong reference

        ~Node() { std::cout << "Node " << value << " destroyed\n"; }
    };

    int main() {
        auto a = std::make_shared<Node>(Node{1, nullptr});
        auto b = std::make_shared<Node>(Node{2, nullptr});
        a->next = b;    // a holds b
        b->next = a;    // b holds a — CYCLE

        // At scope exit: a use_count=1 (b holds it), b use_count=1 (a holds it)
        // Neither count reaches 0 — neither destructor runs — both leak
    }
    // Output: (nothing) — destructors never called
    ```

    **Why it fails:** `a` keeps `b` alive; `b` keeps `a` alive. The external `shared_ptr` variables go out of scope, but the internal cross-references maintain a count of 1 on each. The heap memory is orphaned — leaked. AddressSanitizer (leak detector) will report this.

    **GOOD code:**

    ``` cpp
    #include <memory>
    #include <iostream>

    struct Node {
        int value;
        std::weak_ptr<Node> next;   // non-owning — does not extend lifetime

        ~Node() { std::cout << "Node " << value << " destroyed\n"; }
    };

    int main() {
        auto a = std::make_shared<Node>(Node{1});
        auto b = std::make_shared<Node>(Node{2});
        a->next = b;   // weak reference
        b->next = a;   // weak reference — no cycle in ownership graph

        // At scope exit: a and b both reach use_count=0 — both destroyed
    }
    // Output:
    // Node 2 destroyed
    // Node 1 destroyed
    ```

    **Detection tip:** Draw the ownership graph for any object graph using `shared_ptr`. If any cycle exists in the ownership edges (ignoring `weak_ptr` edges), you have a leak. Use `ASAN_OPTIONS=detect_leaks=1` with AddressSanitizer.

??? pitfall-lobe "⚠️ Pitfall 2: Using `shared_ptr` by Default (Overuse)"
    **Description:** Reaching for `shared_ptr` for every heap-allocated object regardless of whether shared ownership is actually needed. `shared_ptr` has measurable overhead: atomic reference count increments/decrements, a second indirection, and potential cache thrashing.

    **BAD code:**

    ``` cpp
    #include <memory>
    #include <vector>
    #include <string>

    // A function that processes an object it creates locally
    // No one else ever owns this Widget
    void process() {
        auto w = std::make_shared<Widget>(42);   // shared_ptr: unnecessary overhead
        w->render();
        // w goes out of scope — only one owner ever existed
    }

    // A container that exclusively owns its elements
    std::vector<std::shared_ptr<Sprite>> sprites;   // each Sprite has one owner
    ```

    **Why it fails:** Atomic operations for reference counting prevent compiler optimisations and add cache pressure. A `unique_ptr` or stack variable serves the same purpose with zero overhead. Reading code with `shared_ptr` implies shared ownership — misleading reviewers.

    **GOOD code:**

    ``` cpp
    #include <memory>
    #include <vector>

    void process() {
        // Stack allocation: zero overhead, same RAII guarantee
        Widget w{42};
        w.render();
    }

    // Or unique_ptr when heap allocation is necessary
    void process_heap() {
        auto w = std::make_unique<Widget>(42);
        w->render();
    }

    // Container with exclusive ownership
    std::vector<std::unique_ptr<Sprite>> sprites;
    ```

    **Decision rule:**

    - Is this object only ever owned by one entity? → `unique_ptr` or stack variable
    - Do multiple independent entities need to keep it alive? → `shared_ptr`

    **Detection tip:** Every `shared_ptr` in your code should have an obvious reason for shared ownership. If you cannot name two independent owners, replace with `unique_ptr`.

??? pitfall-lobe "⚠️ Pitfall 3: Storing `this` in a `shared_ptr` Without `enable_shared_from_this`"
    **Description:** Creating a second `shared_ptr` from a raw `this` pointer inside a member function when the object is already managed by a `shared_ptr`. This creates two independent control blocks for the same object — double-free at destruction.

    **BAD code:**

    ``` cpp
    #include <memory>
    #include <vector>

    class Task {
    public:
        void schedule() {
            // Creates a NEW shared_ptr from this — independent control block!
            pending_tasks.push_back(std::shared_ptr<Task>(this));
        }

        static std::vector<std::shared_ptr<Task>> pending_tasks;
    };

    int main() {
        auto t = std::make_shared<Task>();   // control block #1, use_count=1
        t->schedule();     // control block #2 created — use_count of #2 = 1

        // When t goes out of scope: block #1 reaches 0 -> Task destroyed
        // pending_tasks still holds block #2 -> when IT expires: double-free -> crash
    }
    ```

    **Why it fails:** There are now two independent reference counts for the same object. When the first reaches zero, the object is destroyed. The second control block then tries to destroy the same memory — undefined behaviour (likely a crash).

    **GOOD code:**

    ``` cpp
    #include <memory>
    #include <vector>

    // Inherit from enable_shared_from_this to safely get a shared_ptr to *this
    class Task : public std::enable_shared_from_this<Task> {
    public:
        void schedule() {
            // shared_from_this() returns a shared_ptr sharing the existing control block
            pending_tasks.push_back(shared_from_this());
        }

        static std::vector<std::shared_ptr<Task>> pending_tasks;
    };

    int main() {
        auto t = std::make_shared<Task>();
        t->schedule();   // adds to the same control block — use_count=2
        // safe: both owners share one control block
    }
    ```

    **Detection tip:** Search for `shared_ptr<X>(this)` or `shared_ptr<X>(raw_ptr)` where `raw_ptr` is a member `T*` or `this`. Both require `enable_shared_from_this` or a complete ownership redesign.

??? pitfall-lobe "⚠️ Pitfall 4: Calling `get()` and Storing the Raw Pointer Longer Than the Smart Pointer"
    **Description:** Extracting a raw pointer from a smart pointer via `get()` and storing it in a variable or data structure that outlives the smart pointer. The raw pointer becomes dangling.

    **BAD code:**

    ``` cpp
    #include <memory>
    #include <vector>

    std::vector<Widget*> raw_registry;  // stores raw pointers

    void register_widget() {
        auto w = std::make_unique<Widget>(1);
        raw_registry.push_back(w.get());   // raw pointer stored
    }   // w is destroyed here; raw_registry holds a dangling pointer

    void use_widgets() {
        for (Widget* w : raw_registry) {
            w->render();   // UB: w points to destroyed Widget
        }
    }
    ```

    **Why it fails:** `unique_ptr` destroys the object at the end of `register_widget`. The raw pointer in `raw_registry` now points to freed memory. `w->render()` is undefined behaviour — it may crash, produce garbage output, or silently corrupt other data.

    **GOOD code:**

    ``` cpp
    #include <memory>
    #include <vector>

    // Store the smart pointer in the registry — it owns the lifetime
    std::vector<std::unique_ptr<Widget>> owned_registry;

    void register_widget() {
        owned_registry.push_back(std::make_unique<Widget>(1));
        // Widget lives as long as owned_registry holds the unique_ptr
    }

    void use_widgets() {
        for (const auto& w : owned_registry) {
            w->render();   // safe: unique_ptr in owned_registry owns the Widget
        }
    }

    // If you need non-owning pointers, use raw pointers AS BORROWS only:
    // Widget* borrow = owned_registry[0].get();
    // Valid as long as you do not let owned_registry shrink while holding borrow
    ```

    **Detection tip:** Treat every `.get()` call as a flag for review. Raw pointers from `get()` must not outlive the smart pointer. Consider using `weak_ptr` for registered observers if lifetime management is complex.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 05:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
