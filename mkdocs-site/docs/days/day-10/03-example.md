---
title: "03 — Code Example · Day 10"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-code-braces: 03 — Code Example: Concepts Constraints C++20

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Before C++20, template error messages were infamous. Pass the wrong type to `std::sort` and the compiler might emit forty lines of nested template errors pointing deep into library internals — far from the actual mistake.


```cpp linenums="1"
#include <concepts>  # (1)
#include <iostream>  # (2)

template <typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

template <Addable T>
T combine(T a, T b) {
    return a + b;
}

int main() {
    std::cout << "Day 10 - Concepts and Constraints\n";
    std::cout << combine(10, 20) << "\n";
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
./build/day_10
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_10_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
