---
title: "03 — Code Example · Day 04"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-code-braces: 03 — Code Example: Constructors Destructors RAII

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Resource management is the hardest problem in systems programming. C++ solves it elegantly with one principle: **Resource Acquisition Is Initialization (RAII)**. Tie a resource's lifetime to an object's lifetime, and the language guarantees cleanup — even when exceptions are thrown, even when early returns happen, even when the code path is convoluted.


```cpp linenums="1"
#include <chrono>  # (1)
#include <iostream>  # (2)
#include <string>  # (3)

class ScopedTimer {
  public:
    explicit ScopedTimer(std::string label)
        : label_(std::move(label)), start_(std::chrono::steady_clock::now()) {}  # (4)

    ~ScopedTimer() {
        const auto end = std::chrono::steady_clock::now();  # (5)
        const auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start_).count();  # (6)
        std::cout << label_ << " took " << ms << " ms\n";
    }

  private:
    std::string label_;
    std::chrono::steady_clock::time_point start_;
};

int main() {
    std::cout << "Day 04 - Constructors, Destructors, RAII\n";
    ScopedTimer timer{"Loop"};
    volatile long long sink = 0;
    for (int i = 0; i < 100000; ++i) {
        sink += i;
    }
    return static_cast<int>(sink % 2);
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Transfers ownership (move semantics)
    5. Type deduction — compiler infers type
    6. Type deduction — compiler infers type





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_04
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_04_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
