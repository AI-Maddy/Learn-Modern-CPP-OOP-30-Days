---
title: "03 — Code Example · Day 28"
---

<div class="brain-cluster-banner" data-cluster="review">
  ⚪ &nbsp; **Review & Mastery** &nbsp;·&nbsp; Brain Stem
</div>



# :material-code-braces: 03 — Code Example: Code Review Common Pitfalls

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Day 28 – Code Review and Common C++ Pitfalls


```cpp linenums="1"
#include <iostream>  # (1)
#include <optional>  # (2)
#include <vector>  # (3)

std::optional<int> at_or_none(const std::vector<int>& values, std::size_t index) {
    if (index >= values.size()) {
        return std::nullopt;
    }
    return values[index];
}

int main() {
    std::vector<int> values{5, 10, 15};
    std::cout << "Day 28 - Code Review and Pitfalls\n";
    auto item = at_or_none(values, 2);  # (4)
    std::cout << (item ? std::to_string(*item) : std::string{"none"}) << "\n";
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
./build/day_28
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_28_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
