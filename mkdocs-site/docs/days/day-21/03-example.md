---
title: "03 — Code Example · Day 21"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-code-braces: 03 — Code Example: PIMPL Idiom Type Erasure

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    **Problem 1 — Compilation Firewall:** A header file for a class exposes all private members to every consumer because C++ class layout must be fully known at the point of use. Changing a private member (e.g., adding a new internal `std::string`) forces a recompilation of every translation unit that includes the header — even though the public API didn't change. On large codebases this cascades into minutes or hours of unnecessary rebuilding.


```cpp linenums="1"
#include <functional>  # (1)
#include <iostream>  # (2)
#include <memory>  # (3)

class Counter {
  public:
    Counter();
    ~Counter();
    void increment();
    int value() const;

  private:
    struct Impl;
    std::unique_ptr<Impl> impl_;  # (4)
};

struct Counter::Impl {
    int n{0};
};

Counter::Counter() : impl_(std::make_unique<Impl>()) {}  # (5)
Counter::~Counter() = default;  # (6)
void Counter::increment() { ++impl_->n; }
int Counter::value() const { return impl_->n; }

int main() {
    std::function<int(int, int)> op = [](int a, int b) { return a + b; };
    Counter counter;
    counter.increment();
    std::cout << "Day 21 - PIMPL and Type Erasure\n";
    std::cout << "counter=" << counter.value() << ", op(2,3)=" << op(2, 3) << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Smart pointer — RAII ownership
    5. Preferred factory — exception safe
    6. Compiler-generated default implementation



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
./build/day_21
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_21_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
