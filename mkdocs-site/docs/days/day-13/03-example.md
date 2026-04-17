---
title: "03 — Code Example · Day 13"
---

<div class="brain-cluster-banner" data-cluster="memory">
  🔴 &nbsp; **Memory & Error Handling** &nbsp;·&nbsp; Limbic System
</div>



# :material-code-braces: 03 — Code Example: Move Semantics Rvalue Refs

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Move semantics allow the ownership of resources to be *transferred* instead of *copied*. A moved-from object is left in a valid but unspecified state; the receiving object acquires the resources without any allocation.


```cpp linenums="1"
#include <iostream>  # (1)
#include <utility>  # (2)
#include <vector>  # (3)

class Buffer {
  public:
    explicit Buffer(std::size_t n) : data_(n, 0) {}
    Buffer(Buffer&& other) noexcept : data_(std::move(other.data_)) {}  # (4)
    Buffer& operator=(Buffer&& other) noexcept {  # (5)
        data_ = std::move(other.data_);  # (6)
        return *this;
    }

    std::size_t size() const { return data_.size(); }

  private:
    std::vector<int> data_;
};

int main() {
    Buffer a{1024};
    Buffer b{1};
    b = std::move(a);  # (7)
    std::cout << "Day 13 - Move Semantics and Rvalue Refs\n";
    std::cout << "Moved buffer size: " << b.size() << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Guarantees no exception is thrown
    5. Guarantees no exception is thrown
    6. Transfers ownership (move semantics)
    7. Transfers ownership (move semantics)





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_13
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_13_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
