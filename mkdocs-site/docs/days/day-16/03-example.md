---
title: "03 — Code Example · Day 16"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-code-braces: 03 — Code Example: Modules Basics C++20

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    - **Macro pollution** — any `#define` in any included file leaks into all subsequent code in that translation unit.


```cpp linenums="1"
#include <iostream>  # (1)
#include <string>  # (2)

namespace inventory_api {
class Item {
  public:
    Item(std::string name, int qty) : name_(std::move(name)), qty_(qty) {}  # (3)
    std::string summary() const { return name_ + ":" + std::to_string(qty_); }

  private:
    std::string name_;
    int qty_{};
};
}

int main() {
    inventory_api::Item item{"sensor", 8};
    std::cout << "Day 16 - Modules Basics (API boundary mindset)\n";
    std::cout << item.summary() << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Transfers ownership (move semantics)





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_16
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_16_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
