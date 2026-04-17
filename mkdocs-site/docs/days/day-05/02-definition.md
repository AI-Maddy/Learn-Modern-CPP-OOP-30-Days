---
title: "02 — Definition · Day 05"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-book: 02 — Definition: Smart Pointers Ownership

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)

!!! info "🔵 Blue = Theory — Precise, formal, complete"
    Read this section carefully. Every word matters.
    After reading, close the page and explain it back in your own words.

---


## :material-book: Why This Day Matters

Raw pointers do not convey ownership. When you see a raw pointer in a function signature, you cannot tell: does this function own the pointed-to object? Is it borrowing it? Does it need to delete it? Smart pointers make ownership explicit in the type system, enabling the compiler to enforce the rules automatically.

The modern C++ rule: **never use \`\`new\`\` or \`\`delete\`\` directly** in application code. Use `std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`, and their factory functions instead. This day covers all three, with ownership semantics, custom deleters, and how to avoid cycles.

## :material-book: Ownership Vocabulary

Before examining each smart pointer, establish the vocabulary:

- **Owner**: the entity responsible for destroying the resource.
- **Non-owning reference**: borrows access without taking ownership; the resource must outlive the reference.
- **Unique ownership**: exactly one owner at a time; ownership can be transferred but not shared.
- **Shared ownership**: multiple owners; the resource lives as long as at least one owner exists.

<!-- -->

    Ownership model summary:

    unique_ptr<T>    —  one owner, move-only, no overhead
    shared_ptr<T>    —  N owners, reference-counted, atomic ops overhead
    weak_ptr<T>      —  non-owning observer of a shared_ptr-managed object
    T* (raw)         —  non-owning borrow (by convention in modern C++)
    T& (reference)   —  non-owning borrow (preferred over raw pointer when non-null)

## :material-book: `std::unique_ptr` — Exclusive Ownership

`unique_ptr<T>` is a non-copyable, movable RAII wrapper. It destroys the owned object when it goes out of scope. Zero runtime overhead compared to a raw pointer.

``` cpp
#include <memory>
#include <iostream>

class Widget {
public:
    explicit Widget(int id) : id_{id} {
        std::cout << "Widget " << id_ << " created\n";
    }
    ~Widget() { std::cout << "Widget " << id_ << " destroyed\n"; }
private:
    int id_;
};

int main() {
    // Always use make_unique — never call new directly
    auto w1 = std::make_unique<Widget>(1);

    // unique_ptr cannot be copied
    // auto w2 = w1;   // ERROR: copy constructor is deleted

    // Transfer ownership with move
    auto w2 = std::move(w1);
    // w1 is now null; w2 owns Widget 1

    if (!w1) std::cout << "w1 is null after move\n";

    // Scope exit: w2 destructor runs, Widget 1 is destroyed
}

// Output:
// Widget 1 created
// w1 is null after move
// Widget 1 destroyed
```

### Passing `unique_ptr`

``` cpp
// Sink function: takes ownership
void take_ownership(std::unique_ptr<Widget> w) {
    // w is destroyed at end of this function
}

// Borrow function: does not take ownership; uses raw pointer or reference
void borrow(const Widget& w) { /* read or use w, no ownership change */ }
void borrow_ptr(const Widget* w) { if (w) { /* optional */ } }

auto w = std::make_unique<Widget>(42);
borrow(*w);                       // dereference: pass reference
take_ownership(std::move(w));     // transfer: w is null after this
// w is now null — accessing it is UB
```

### Returning `unique_ptr`

``` cpp
// Factory function: returns unique_ptr — clean ownership transfer
std::unique_ptr<Widget> create_widget(int id) {
    return std::make_unique<Widget>(id);  // NRVO or move
}

auto w = create_widget(10);   // w owns the Widget
```


---

## :material-vector-polyline: Knowledge Map (SPATIAL MEMORY — Feature 7)

```mermaid
graph TD
    ROOT["Smart Pointers Ownership"] --> A["class"]
    Smart_Pointers_Ownership --> class["class"]
    Smart_Pointers_Ownership --> RAII["RAII"]
    Smart_Pointers_Ownership --> virtual["virtual"]
    Smart_Pointers_Ownership --> override["override"]
    style ROOT fill:#8b5cf6,color:#fff
    style A    fill:#3b82f6,color:#fff
```


---

## :material-memory: Quick Definitions Table

| Term | Meaning |
|------|---------|
| `class` | _class — key concept for Smart Pointers Ownership_ |
| `RAII` | _RAII — key concept for Smart Pointers Ownership_ |
| `virtual` | _virtual — key concept for Smart Pointers Ownership_ |
| `override` | _override — key concept for Smart Pointers Ownership_ |
| `unique_ptr` | _unique_ptr — key concept for Smart Pointers Ownership_ |


---

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)
