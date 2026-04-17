---
title: "03 — Code Example · Day 12"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-code-braces: 03 — Code Example: Ranges Views C++20

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp



```cpp linenums="1"
#include <iostream>  # (1)
#include <ranges>  # (2)
#include <vector>  # (3)

int main() {
    std::vector<int> nums{1, 2, 3, 4, 5, 6};
    auto pipeline = nums  # (4)
        | std::views::filter([](int x) { return x % 2 == 0; })
        | std::views::transform([](int x) { return x * x; });

    std::cout << "Day 12 - Ranges and Views\n";
    for (int value : pipeline) {
        std::cout << value << ' ';
    }
    std::cout << "\n";
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
./build/day_12
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_12_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
