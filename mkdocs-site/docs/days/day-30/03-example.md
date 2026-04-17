---
title: "03 — Code Example · Day 30"
---

<div class="brain-cluster-banner" data-cluster="review">
  ⚪ &nbsp; **Review & Mastery** &nbsp;·&nbsp; Brain Stem
</div>



# :material-code-braces: 03 — Code Example: Review Cert Prep Next Steps

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    - Recommended books, online resources, and certification routes.


```cpp linenums="1"
#include <iostream>  # (1)
#include <map>  # (2)
#include <string>  # (3)

int main() {
    std::map<std::string, int> confidence{{"OOP", 8}, {"Templates", 7}, {"Ranges", 6}};
    std::cout << "Day 30 - Review and Next Steps\n";
    for (const auto& [topic, score] : confidence) {  # (4)
        std::cout << topic << " confidence=" << score << "/10\n";
    }
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
./build/day_30
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_30_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
