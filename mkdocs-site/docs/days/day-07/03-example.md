---
title: "03 — Code Example · Day 07"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-code-braces: 03 — Code Example: Virtual Override Final Abstract

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    When the compiler can prove that a class is final (no subclasses can exist), it can devirtualise virtual calls — turning them into direct calls and enabling inlining. This is one of the few cases where `final` provides a measurable performance benefit.


```cpp linenums="1"
#include <iostream>  # (1)
#include <memory>  # (2)

class Renderer {
  public:
    virtual ~Renderer() = default;  # (3)
    virtual void draw() const = 0;  # (4)
};

class TextRenderer final : public Renderer {
  public:
    void draw() const override { std::cout << "Rendering text\n"; }  # (5)
};

int main() {
    std::unique_ptr<Renderer> renderer = std::make_unique<TextRenderer>();  # (6)
    std::cout << "Day 07 - Virtual, Override, Final, Abstract\n";
    renderer->draw();
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Virtual dispatch — runtime polymorphism
    4. Virtual dispatch — runtime polymorphism
    5. Ensures virtual override is correct
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
./build/day_07
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_07_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
