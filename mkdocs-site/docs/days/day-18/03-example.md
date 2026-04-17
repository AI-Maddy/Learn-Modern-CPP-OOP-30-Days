---
title: "03 — Code Example · Day 18"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-code-braces: 03 — Code Example: SOLID Principles

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    - OCP — code that requires modification for every extension is fragile.


```cpp linenums="1"
#include <iostream>  # (1)
#include <memory>  # (2)

class Notifier {
  public:
    virtual ~Notifier() = default;  # (3)
    virtual void send(const std::string& text) = 0;  # (4)
};

class EmailNotifier : public Notifier {
  public:
    void send(const std::string& text) override { std::cout << "email: " << text << "\n"; }  # (5)
};

class ReportService {
  public:
    explicit ReportService(std::unique_ptr<Notifier> notifier) : notifier_(std::move(notifier)) {}  # (6)
    void publish() { notifier_->send("weekly report ready"); }

  private:
    std::unique_ptr<Notifier> notifier_;  # (7)
};

int main() {
    ReportService service{std::make_unique<EmailNotifier>()};  # (8)
    std::cout << "Day 18 - SOLID Principles\n";
    service.publish();
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
./build/day_18
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_18_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
