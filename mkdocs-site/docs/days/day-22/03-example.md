---
title: "03 — Code Example · Day 22"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-code-braces: 03 — Code Example: Performance Tips OOP

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    This day introduces the conceptual models and C++ techniques that most commonly yield measurable improvements in OOP code.


```cpp linenums="1"
#include <iostream>  # (1)
#include <string>  # (2)
#include <vector>  # (3)

struct Record {
    std::string name;
    int score;
};

int main() {
    std::vector<Record> records;
    records.reserve(3);
    records.emplace_back(Record{"alpha", 90});
    records.emplace_back(Record{"beta", 95});
    records.emplace_back(Record{"gamma", 88});

    std::cout << "Day 22 - Performance Tips OOP\n";
    for (const auto& record : records) {  # (4)
        std::cout << record.name << ':' << record.score << "\n";
    }
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Type deduction — compiler infers type





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_22
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_22_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
