---
title: "03 — Code Example · Day 17"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-code-braces: 03 — Code Example: Design Patterns OOP

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    **Tradeoff:** The registry approach is open for extension (new types can register without touching existing code — OCP), but it uses runtime `std::string` lookup. If performance matters and the set of types is fixed, prefer a `switch` on an enum or a template factory.


```cpp linenums="1"
#include <iostream>  # (1)
#include <memory>  # (2)
#include <string>  # (3)

class Logger {
  public:
    virtual ~Logger() = default;  # (4)
    virtual void log(const std::string& message) const = 0;  # (5)
};

class ConsoleLogger : public Logger {
  public:
    void log(const std::string& message) const override { std::cout << "[console] " << message << "\n"; }  # (6)
};

std::unique_ptr<Logger> make_logger() {  # (7)
    return std::make_unique<ConsoleLogger>();  # (8)
}

int main() {
    auto logger = make_logger();  # (9)
    std::cout << "Day 17 - Design Patterns OOP\n";
    logger->log("factory-created logger");
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
    9. Type deduction — compiler infers type



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
./build/day_17
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_17_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
