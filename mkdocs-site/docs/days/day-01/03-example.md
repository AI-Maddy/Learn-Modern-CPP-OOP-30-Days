---
title: "03 — Code Example · Day 01"
---

<div class="brain-cluster-banner" data-cluster="foundations">
  🔵 &nbsp; **Foundations** &nbsp;·&nbsp; Frontal Lobe
</div>



# :material-code-braces: 03 — Code Example: Variables Types Constexpr

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Types are the backbone of C++. The type system lets the compiler prove correctness, enable optimisations, and catch entire classes of bugs before the program ever runs. Choosing the right type, initialising it correctly, and understanding when a value is known at compile time versus runtime determines the quality of code you write for the rest of the course.


```cpp linenums="1"
#include <array>  # (1)
#include <iostream>  # (2)

constexpr int square(int x) { return x * x; }  # (3)

int main() {
    constexpr int side = 6;  # (4)
    constexpr int area = square(side);  # (5)
    std::array<int, 3> dims{2, 3, 4};

    std::cout << "Day 01 - Variables, Types, Constexpr\n";
    std::cout << "Compile-time area: " << area << "\n";
    std::cout << "Dims: " << dims[0] << ", " << dims[1] << ", " << dims[2] << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Compile-time constant / function
    4. Compile-time constant / function
    5. Compile-time constant / function





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_01
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_01_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
