---
title: "03 — Code Example · Day 27"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-code-braces: 03 — Code Example: Refactoring Legacy Code

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Day 27 – Refactoring Legacy Code


```cpp linenums="1"
#include <iostream>  # (1)
#include <numeric>  # (2)
#include <vector>  # (3)

double average(const std::vector<int>& values) {
    if (values.empty()) {
        return 0.0;
    }
    int total = std::accumulate(values.begin(), values.end(), 0);
    return static_cast<double>(total) / values.size();
}

int main() {
    std::vector<int> scores{70, 80, 90};
    std::cout << "Day 27 - Refactoring Legacy Code\n";
    std::cout << "Average=" << average(scores) << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_27
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_27_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
