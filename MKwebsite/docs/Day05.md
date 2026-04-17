# Day 05: Smart Pointers and Ownership

## Why This Day Matters

Raw pointers are ambiguous: they carry no ownership information and provide no safety guarantees.
Smart pointers make ownership a first-class language construct. After this day, your code will
communicate who owns every heap-allocated object, and the compiler will enforce those rules.

## Learning Outcomes

By the end of this day you will be able to:

* Choose between `unique_ptr`, `shared_ptr`, and `weak_ptr` given a description of the
  ownership requirements.
* Use `make_unique` and `make_shared` instead of `new`; explain the performance and safety
  advantages.
* Break a `shared_ptr` cycle using `weak_ptr` and verify with the leak sanitiser.
* Attach a custom deleter to `unique_ptr` for non-memory resources (file handles, C library
  objects).
* Implement the `enable_shared_from_this` pattern to safely obtain a `shared_ptr` to
  `*this`.
* Explain when a raw pointer is the correct choice (non-owning borrow).

## Key Concepts

* **`unique_ptr`** — exclusive ownership, move-only, zero runtime overhead; the default choice
  for heap-allocated objects.
* **`shared_ptr`** — shared ownership via atomic reference counting; use only when multiple
  independent owners genuinely exist.
* **`weak_ptr`** — non-owning observer; must be locked to access the object; used to break
  cycles and implement cache-friendly observer patterns.
* **`make_unique` / `make_shared`** — preferred factory functions; exception-safe and (for
  `make_shared`) allocate object + control block in one call.
* **Custom deleters** — allow smart pointers to manage non-memory resources using any cleanup
  callable.
* **`enable_shared_from_this`** — safe way to obtain a `shared_ptr` to `*this` from
  inside a member function, avoiding double-free.

## Theory

### Why This Day Matters

Raw pointers do not convey ownership. When you see a raw pointer in a function signature, you
cannot tell: does this function own the pointed-to object? Is it borrowing it? Does it need to
delete it? Smart pointers make ownership explicit in the type system, enabling the compiler to
enforce the rules automatically.

The modern C++ rule: **never use `new` or `delete` directly** in application code. Use
`std::unique_ptr`, `std::shared_ptr`, `std::weak_ptr`, and their factory functions instead.
This day covers all three, with ownership semantics, custom deleters, and how to avoid cycles.

### Ownership Vocabulary

Before examining each smart pointer, establish the vocabulary:

* **Owner**: the entity responsible for destroying the resource.
* **Non-owning reference**: borrows access without taking ownership; the resource must outlive
  the reference.
* **Unique ownership**: exactly one owner at a time; ownership can be transferred but not shared.
* **Shared ownership**: multiple owners; the resource lives as long as at least one owner exists.

```
Ownership model summary:

unique_ptr<T>    —  one owner, move-only, no overhead
shared_ptr<T>    —  N owners, reference-counted, atomic ops overhead
weak_ptr<T>      —  non-owning observer of a shared_ptr-managed object
T* (raw)         —  non-owning borrow (by convention in modern C++)
T& (reference)   —  non-owning borrow (preferred over raw pointer when non-null)
```

### `std::unique_ptr` — Exclusive Ownership

`unique_ptr<T>` is a non-copyable, movable RAII wrapper. It destroys the owned object when it
goes out of scope. Zero runtime overhead compared to a raw pointer.

```cpp
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

#### Passing `unique_ptr`

```cpp
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

#### Returning `unique_ptr`

```cpp
// Factory function: returns unique_ptr — clean ownership transfer
std::unique_ptr<Widget> create_widget(int id) {
    return std::make_unique<Widget>(id);  // NRVO or move
}

auto w = create_widget(10);   // w owns the Widget
```

### `std::shared_ptr` — Shared Ownership

`shared_ptr<T>` maintains a reference count. The object is destroyed when the last
`shared_ptr` pointing to it is destroyed. Use when multiple independent owners need the object
to remain alive as long as any of them need it.

```cpp
#include <memory>

auto s1 = std::make_shared<Widget>(1);  // ref count = 1
{
    auto s2 = s1;    // copy: ref count = 2
    auto s3 = s1;    // copy: ref count = 3
    std::cout << s1.use_count() << '\n';  // 3
}   // s2 and s3 destroyed: ref count drops to 1
// Widget 1 still alive (s1 still holds it)
// When s1 goes out of scope, ref count -> 0, Widget 1 destroyed
```

**When to prefer `shared_ptr`:**

* Multiple owners with independent lifetimes (e.g., a graph node referenced by multiple edges)
* When object lifetime depends on which of several asynchronous tasks finishes last
* Caches that must keep objects alive as long as a client holds a handle

**When to avoid `shared_ptr`:**

* When ownership is clearly single — use `unique_ptr`
* When the object is used in a hot path — reference counting uses atomic operations
* When it creates cycles — use `weak_ptr` for back-pointers

#### make_unique vs make_shared

```cpp
// Always prefer make_unique/make_shared over new

// BAD: two separate heap allocations
std::shared_ptr<Widget> p{new Widget{5}};

// GOOD: make_shared allocates control block and object together (one allocation)
auto p = std::make_shared<Widget>(5);

// Also exception-safe: if Widget constructor throws, there is no leak
// With 'new': process(shared_ptr<Widget>(new Widget), other_func()) — potential leak
```

### `std::weak_ptr` — Non-Owning Observer

`weak_ptr<T>` holds a non-owning reference to a `shared_ptr`-managed object. It does not
prevent the object from being destroyed. Before accessing the object, you must lock the
`weak_ptr` into a `shared_ptr`; if the object has already been destroyed, you get null.

```cpp
#include <memory>
#include <iostream>

auto shared = std::make_shared<Widget>(10);
std::weak_ptr<Widget> weak = shared;

// Access via lock()
if (auto locked = weak.lock()) {       // returns shared_ptr<Widget> or nullptr
    std::cout << "Widget is alive\n";
}

shared.reset();   // destroy the widget; weak_ptr now expired

if (weak.expired()) {
    std::cout << "Widget has been destroyed\n";
}

if (!weak.lock()) {
    std::cout << "Lock returned null\n";
}
```

#### Breaking Cycles with `weak_ptr`

A cycle of `shared_ptr` objects never reaches a reference count of zero — they leak.

```cpp
// BAD: shared_ptr cycle — both objects leak
struct Node {
    std::shared_ptr<Node> next;   // BAD: creates cycle
};

auto a = std::make_shared<Node>();
auto b = std::make_shared<Node>();
a->next = b;
b->next = a;   // cycle: a -> b -> a
// When a and b go out of scope, each still has use_count = 1 — neither is destroyed

// GOOD: back-pointer is weak — cycle broken
struct TreeNode {
    std::shared_ptr<TreeNode>  left;
    std::shared_ptr<TreeNode>  right;
    std::weak_ptr<TreeNode>    parent;   // observer: does not extend lifetime
};
```

### Custom Deleters

Both `unique_ptr` and `shared_ptr` accept a custom deleter — a callable invoked instead of
`delete` when the object is released.

```cpp
#include <cstdio>
#include <memory>

// unique_ptr with a lambda deleter
auto file_deleter = [](FILE* f) { if (f) std::fclose(f); };
std::unique_ptr<FILE, decltype(file_deleter)>
    f{std::fopen("data.txt", "r"), file_deleter};

// Simpler: use a function pointer as the deleter type
using FilePtr = std::unique_ptr<FILE, decltype(&std::fclose)>;
FilePtr fp{std::fopen("data.txt", "r"), &std::fclose};
```

### Observer Pattern Without Cycles

A classic use of `weak_ptr`: an event system where observers register interest but should not
keep the publisher alive.

```cpp
#include <memory>
#include <vector>
#include <functional>

class EventBus {
public:
    using Handler = std::function<void(int)>;

    void subscribe(std::weak_ptr<void> owner, Handler handler) {
        subscribers_.push_back({owner, std::move(handler)});
    }

    void publish(int event) {
        // Remove expired subscribers and notify live ones
        subscribers_.erase(
            std::remove_if(subscribers_.begin(), subscribers_.end(),
                [](const auto& s) { return s.owner.expired(); }),
            subscribers_.end());
        for (auto& s : subscribers_) s.handler(event);
    }

private:
    struct Subscription {
        std::weak_ptr<void> owner;
        Handler             handler;
    };
    std::vector<Subscription> subscribers_;
};
```

### Raw Pointers — The Non-Owning Convention

In modern C++, a raw pointer (`T*`) in a function signature means "non-owning borrow".
The caller retains ownership. The function must not `delete` the pointer.

```cpp
// Raw pointer: "I borrow this; I do not own it"
void render(const Widget* w);   // may be null

// Reference: "I borrow this; it is guaranteed non-null"
void render(const Widget& w);   // cannot be null — preferred

// Prefer references over raw pointers for non-optional borrows
// Use raw pointers only when null is a meaningful state
```

**The guideline:** Use a reference when the argument is always present. Use a raw pointer when
the argument is optional (can be null). Use a smart pointer only when transferring or sharing
ownership.

## Pitfalls

### Pitfall 1: Shared Pointer Cycles Causing Memory Leaks

**Description:** Two or more objects holding `shared_ptr` references to each other in a cycle.
The reference count of each never reaches zero, so neither object is ever destroyed.

**BAD code:**

```cpp
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

**Why it fails:** `a` keeps `b` alive; `b` keeps `a` alive. The external `shared_ptr`
variables go out of scope, but the internal cross-references maintain a count of 1 on each.
The heap memory is orphaned — leaked. AddressSanitizer (leak detector) will report this.

**GOOD code:**

```cpp
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

**Detection tip:** Draw the ownership graph for any object graph using `shared_ptr`. If any
cycle exists in the ownership edges (ignoring `weak_ptr` edges), you have a leak. Use
`ASAN_OPTIONS=detect_leaks=1` with AddressSanitizer.

### Pitfall 2: Using `shared_ptr` by Default (Overuse)

**Description:** Reaching for `shared_ptr` for every heap-allocated object regardless of
whether shared ownership is actually needed. `shared_ptr` has measurable overhead: atomic
reference count increments/decrements, a second indirection, and potential cache thrashing.

**BAD code:**

```cpp
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

**Why it fails:** Atomic operations for reference counting prevent compiler optimisations and
add cache pressure. A `unique_ptr` or stack variable serves the same purpose with zero overhead.
Reading code with `shared_ptr` implies shared ownership — misleading reviewers.

**GOOD code:**

```cpp
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

* Is this object only ever owned by one entity? → `unique_ptr` or stack variable
* Do multiple independent entities need to keep it alive? → `shared_ptr`

**Detection tip:** Every `shared_ptr` in your code should have an obvious reason for shared
ownership. If you cannot name two independent owners, replace with `unique_ptr`.

### Pitfall 3: Storing `this` in a `shared_ptr` Without `enable_shared_from_this`

**Description:** Creating a second `shared_ptr` from a raw `this` pointer inside a member
function when the object is already managed by a `shared_ptr`. This creates two independent
control blocks for the same object — double-free at destruction.

**BAD code:**

```cpp
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

**Why it fails:** There are now two independent reference counts for the same object. When the
first reaches zero, the object is destroyed. The second control block then tries to destroy the
same memory — undefined behaviour (likely a crash).

**GOOD code:**

```cpp
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

**Detection tip:** Search for `shared_ptr<X>(this)` or `shared_ptr<X>(raw_ptr)` where
`raw_ptr` is a member `T*` or `this`. Both require `enable_shared_from_this` or a
complete ownership redesign.

### Pitfall 4: Calling `get()` and Storing the Raw Pointer Longer Than the Smart Pointer

**Description:** Extracting a raw pointer from a smart pointer via `get()` and storing it
in a variable or data structure that outlives the smart pointer. The raw pointer becomes dangling.

**BAD code:**

```cpp
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

**Why it fails:** `unique_ptr` destroys the object at the end of `register_widget`. The raw
pointer in `raw_registry` now points to freed memory. `w->render()` is undefined behaviour
— it may crash, produce garbage output, or silently corrupt other data.

**GOOD code:**

```cpp
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

**Detection tip:** Treat every `.get()` call as a flag for review. Raw pointers from
`get()` must not outlive the smart pointer. Consider using `weak_ptr` for registered
observers if lifetime management is complex.

## Code Example

```cpp
#include <iostream>
#include <memory>
#include <vector>

struct Node {
    explicit Node(int v) : value(v) {}
    int value;
};

int main() {
    std::cout << "Day 05 - Smart Pointers and Ownership\n";

    auto root = std::make_unique<Node>(42);
    auto shared = std::make_shared<Node>(7);
    std::vector<std::shared_ptr<Node>> cache{shared};

    std::cout << "root=" << root->value << ", shared use_count=" << shared.use_count() << "\n";
    return 0;
}
```
