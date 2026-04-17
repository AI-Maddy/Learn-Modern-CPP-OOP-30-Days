---
title: "03 — Code Example · Day 06"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-code-braces: 03 — Code Example: Inheritance Polymorphism

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Inheritance lets you express "is-a" relationships and share behaviour across a type hierarchy. Polymorphism lets you write code that works on the base class and automatically handles any derived class correctly. Together, they are the foundation of extensible OOP design.


```cpp linenums="1"
#include <iostream>  # (1)
#include <memory>  # (2)
#include <vector>  # (3)

class Shape {
  public:
    virtual ~Shape() = default;  # (4)
    virtual double area() const = 0;  # (5)
};

class Rectangle : public Shape {
  public:
    Rectangle(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }  # (6)

  private:
    double w_;
    double h_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;  # (7)
    shapes.push_back(std::make_unique<Rectangle>(3.0, 4.0));  # (8)

    std::cout << "Day 06 - Inheritance and Polymorphism\n";
    std::cout << "First area: " << shapes.front()->area() << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Virtual dispatch — runtime polymorphism
    5. Virtual dispatch — runtime polymorphism
    6. Ensures virtual override is correct
    7. Smart pointer — RAII ownership
    8. Preferred factory — exception safe



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
./build/day_06
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_06_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
