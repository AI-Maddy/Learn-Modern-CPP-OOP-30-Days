---
title: "03 — Code Example · Day 02"
---

<div class="brain-cluster-banner" data-cluster="foundations">
  🔵 &nbsp; **Foundations** &nbsp;·&nbsp; Frontal Lobe
</div>



# :material-code-braces: 03 — Code Example: Functions Lambdas

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Functions are the primary unit of abstraction in C++. Getting their signatures right — parameter passing conventions, return types, overloading rules — determines whether your code is safe, efficient, and easy to reason about. Lambdas bring closures and local higher-order functions to C++, enabling expressive algorithm use without the boilerplate of named function objects.


```cpp linenums="1"
#include <algorithm>  # (1)
#include <iostream>  # (2)
#include <vector>  # (3)

int main() {
    std::vector<int> nums{1, 2, 3, 4, 5, 6};
    int factor = 3;
    std::transform(nums.begin(), nums.end(), nums.begin(), [factor](int x) { return x * factor; });

    std::cout << "Day 02 - Functions and Lambdas\n";
    for (int value : nums) {
        std::cout << value << ' ';
    }
    std::cout << "\n";
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
./build/day_02
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_02_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
