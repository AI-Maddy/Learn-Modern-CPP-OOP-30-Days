---
title: "03 — Code Example · Day 29"
---

<div class="brain-cluster-banner" data-cluster="review">
  ⚪ &nbsp; **Review & Mastery** &nbsp;·&nbsp; Brain Stem
</div>



# :material-code-braces: 03 — Code Example: Advanced Topics Deep Dive

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    C++20 introduced several features that change the way high-performance and systems-level code is written. This day covers five topics that reward the effort to understand them deeply:


```cpp linenums="1"
#include <iostream>  # (1)
#include <string>  # (2)
#include <variant>  # (3)

using Value = std::variant<int, double, std::string>;

int main() {
    Value v = std::string{"deep-dive"};
    std::cout << "Day 29 - Advanced Topics Deep Dive\n";
    std::visit([](const auto& item) { std::cout << item << "\n"; }, v);  # (4)
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Type deduction — compiler infers type





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_29
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_29_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
