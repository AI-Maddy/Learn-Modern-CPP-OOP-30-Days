---
title: "03 — Code Example · Day 08"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-code-braces: 03 — Code Example: Advanced OOP Patterns

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Classic object-oriented design teaches inheritance as the primary tool for code reuse. In practice, deep inheritance hierarchies become brittle: every change to a base class ripples through dozens of derived classes, and adding cross-cutting behaviour (logging, serialisation, thread-safety) forces awkward multiple-inheritance gymnastics.


```cpp linenums="1"
#include <iostream>  # (1)
#include <memory>  # (2)

class PricingStrategy {
  public:
    virtual ~PricingStrategy() = default;  # (3)
    virtual double apply(double basePrice) const = 0;  # (4)
};

class PercentageDiscount : public PricingStrategy {
  public:
    explicit PercentageDiscount(double ratio) : ratio_(ratio) {}
    double apply(double basePrice) const override { return basePrice * (1.0 - ratio_); }  # (5)

  private:
    double ratio_;
};

class Checkout {
  public:
    explicit Checkout(std::unique_ptr<PricingStrategy> strategy) : strategy_(std::move(strategy)) {}  # (6)
    double total(double basePrice) const { return strategy_->apply(basePrice); }

  private:
    std::unique_ptr<PricingStrategy> strategy_;  # (7)
};

int main() {
    Checkout checkout{std::make_unique<PercentageDiscount>(0.15)};  # (8)
    std::cout << "Day 08 - Advanced OOP Patterns\n";
    std::cout << "Total: " << checkout.total(200.0) << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Virtual dispatch — runtime polymorphism
    4. Virtual dispatch — runtime polymorphism
    5. Ensures virtual override is correct
    6. Smart pointer — RAII ownership
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
./build/day_08
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_08_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
