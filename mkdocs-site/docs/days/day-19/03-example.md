---
title: "03 — Code Example · Day 19"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-code-braces: 03 — Code Example: Testing Catch2 TDD

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    A C++ class that compiles and links may still be broken. Tests prove that the code does what its design intends — not just that it satisfies the type system. In OOP specifically, tests are the best way to:


```cpp linenums="1"
#include <cassert>  # (1)
#include <iostream>  # (2)

int add(int a, int b) { return a + b; }

int main() {
    std::cout << "Day 19 - Testing mindset\n";
    assert(add(2, 3) == 5);
    assert(add(-1, 1) == 0);
    std::cout << "Local assertions passed\n";
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
./build/day_19
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_19_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
