---
title: "03 — Code Example · Day 09"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-code-braces: 03 — Code Example: Templates Basics

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Imagine writing `max()` once for `int`, then again for `double`, then again for `std::string`. Duplicated logic, duplicated bugs, duplicated maintenance. C++ templates let you write code once and instantiate it for any type that supports the required operations — fully type-safe, zero runtime overhead.


```cpp linenums="1"
#include <iostream>  # (1)
#include <string>  # (2)

template <typename T>
T max_of(T a, T b) {
    return (a < b) ? b : a;
}

int main() {
    std::cout << "Day 09 - Templates Basics\n";
    std::cout << "max(4,9)=" << max_of(4, 9) << "\n";
    std::cout << "max(cat,dog)=" << max_of(std::string{"cat"}, std::string{"dog"}) << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_09
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_09_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
