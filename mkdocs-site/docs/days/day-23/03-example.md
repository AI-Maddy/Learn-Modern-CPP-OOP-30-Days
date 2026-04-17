---
title: "03 — Code Example · Day 23"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-code-braces: 03 — Code Example: Modern Features Preview C++26

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    - **Experimental** — available in Clang/GCC trunk under `-std=c++26` or feature flags, but not yet in all compiler releases as of early 2025.


```cpp linenums="1"
#include <iostream>  # (1)

consteval int cube(int x) {
    return x * x * x;
}

int main() {
    constexpr int value = cube(4);  # (2)
    std::cout << "Day 23 - Modern Features Preview\n";
    std::cout << "consteval cube(4)=" << value << "\n";
    return 0;
}
```

    1. Standard library header
    2. Compile-time constant / function





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_23
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_23_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
