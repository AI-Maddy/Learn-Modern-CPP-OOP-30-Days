---
title: "03 — Code Example · Day 11"
---

<div class="brain-cluster-banner" data-cluster="templates">
  🟣 &nbsp; **Templates** &nbsp;·&nbsp; Parietal Lobe
</div>



# :material-code-braces: 03 — Code Example: Generic OOP Design

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Generic (compile-time) OOP offers the same flexibility without those costs. The idea: express variation through **template parameters** rather than virtual dispatch.


```cpp linenums="1"
#include <iostream>  # (1)
#include <string>  # (2)

template <typename T>
class Box {
  public:
    explicit Box(T value) : value_(std::move(value)) {}  # (3)
    const T& get() const { return value_; }

  private:
    T value_;
};

int main() {
    Box<std::string> name{"Modern C++"};
    std::cout << "Day 11 - Generic OOP Design\n";
    std::cout << "Box holds: " << name.get() << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Transfers ownership (move semantics)





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_11
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_11_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
