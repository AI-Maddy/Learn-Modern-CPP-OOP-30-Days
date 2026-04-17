---
title: "03 — Code Example · Day 26"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-code-braces: 03 — Code Example: Mini Project 3 Game Entities

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    CRTP (Curiously Recurring Template Pattern) gives compile-time polymorphism with no vtable overhead. Useful for performance-critical entity bases.


```cpp linenums="1"
#include <iostream>  # (1)
#include <string>  # (2)
#include <vector>  # (3)

struct Entity {
    std::string name;
    int hp;
    void tick() { hp -= 1; }
};

int main() {
    std::vector<Entity> entities{{"Player", 10}, {"NPC", 6}};
    for (auto& entity : entities) {  # (4)
        entity.tick();
    }

    std::cout << "Day 26 - Mini Project Game Entities\n";
    for (const auto& entity : entities) {  # (5)
        std::cout << entity.name << " hp=" << entity.hp << "\n";
    }
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Type deduction — compiler infers type
    5. Type deduction — compiler infers type





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_26
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_26_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
