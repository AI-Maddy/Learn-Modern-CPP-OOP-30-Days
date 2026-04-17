---
title: "03 — Code Example · Day 00"
---

<div class="brain-cluster-banner" data-cluster="foundations">
  🔵 &nbsp; **Foundations** &nbsp;·&nbsp; Frontal Lobe
</div>



# :material-code-braces: 03 — Code Example: Setup And Basics

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Before writing a single meaningful line of C++, you need a reliable foundation: a working toolchain, a build system you understand, and automated quality gates that catch problems before they reach review. Skipping this setup leads to "works on my machine" bugs, silent undefined behaviour from missing warning flags, and style drift that makes code reviews painful.


```cpp linenums="1"
#include <iostream>  # (1)
#include <numeric>  # (2)
#include <vector>  # (3)

int main() {
    std::vector<int> values{1, 2, 3, 4, 5};
    int sum = std::accumulate(values.begin(), values.end(), 0);
    std::cout << "Day 00 - Setup and Basics\n";
    std::cout << "Values count: " << values.size() << "\n";
    std::cout << "Sum: " << sum << "\n";
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
./build/day_00
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_00_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
