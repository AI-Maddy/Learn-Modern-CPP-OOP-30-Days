---
title: "03 — Code Example · Day 05"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-code-braces: 03 — Code Example: Smart Pointers Ownership

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Raw pointers do not convey ownership. When you see a raw pointer in a function signature, you cannot tell: does this function own the pointed-to object? Is it borrowing it? Does it need to delete it? Smart pointers make ownership explicit in the type system, enabling the compiler to enforce the rules automatically.


```cpp linenums="1"
#include <iostream>  # (1)
#include <memory>  # (2)
#include <vector>  # (3)

struct Node {
    explicit Node(int v) : value(v) {}
    int value;
};

int main() {
    std::cout << "Day 05 - Smart Pointers and Ownership\n";

    auto root = std::make_unique<Node>(42);  # (4)
    auto shared = std::make_shared<Node>(7);  # (5)
    std::vector<std::shared_ptr<Node>> cache{shared};  # (6)

    std::cout << "root=" << root->value << ", shared use_count=" << shared.use_count() << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Type deduction — compiler infers type
    5. Type deduction — compiler infers type
    6. Smart pointer — RAII ownership



## :material-code-braces: Modern vs Legacy (COLOR: Green=Good, Red=Avoid)

=== "🟢 Modern C++ (Recommended)"

    ```cpp
    // RAII — resource managed automatically
    auto ptr = std::make_unique<MyClass>(args);
    ptr->doWork();
    // ptr auto-destroyed at scope exit — no leak possible
    ```

=== "🔴 C-Style (Avoid)"

    ```cpp
    // Manual memory — error prone
    MyClass* ptr = new MyClass(args);
    ptr->doWork();
    delete ptr;  // Easy to forget — or double-delete
    ```




## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_05
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_05_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
