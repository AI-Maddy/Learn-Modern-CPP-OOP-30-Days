---
title: "03 — Code Example · Day 25"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-code-braces: 03 — Code Example: Mini Project 2 Shape Editor

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    The shape editor is the classic OOP teaching example — but this day goes beyond the introductory version. You will see four progressively modern approaches to the same problem:


```cpp linenums="1"
#include <cmath>  # (1)
#include <iostream>  # (2)
#include <memory>  # (3)
#include <vector>  # (4)

class Shape {
  public:
    virtual ~Shape() = default;  # (5)
    virtual double area() const = 0;  # (6)
};

class Circle : public Shape {
  public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.1415926535 * r_ * r_; }  # (7)

  private:
    double r_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> canvas;  # (8)
    canvas.push_back(std::make_unique<Circle>(2.0));  # (9)
    std::cout << "Day 25 - Mini Project Shape Editor\n";
    std::cout << "Area: " << canvas.front()->area() << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Standard library header
    5. Virtual dispatch — runtime polymorphism
    6. Virtual dispatch — runtime polymorphism
    7. Ensures virtual override is correct
    8. Smart pointer — RAII ownership
    9. Preferred factory — exception safe



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
./build/day_25
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_25_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
