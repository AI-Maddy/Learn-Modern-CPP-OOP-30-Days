---
title: "03 — Code Example · Day 03"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-code-braces: 03 — Code Example: Classes Encapsulation

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    A class is more than a bundle of data and functions. A well-designed class establishes an **invariant** — a guarantee about its internal state that holds at all observable points. Every member function enforces or relies on that invariant. Encapsulation is the mechanism that prevents external code from violating the invariant by accident.


```cpp linenums="1"
#include <iostream>  # (1)
#include "bank_account.hpp"

int main() {
    BankAccount account{"Madhavan", 1000.0};
    account.deposit(250.0);
    account.withdraw(80.0);
    std::cout << "Day 03 - Classes and Encapsulation\n";
    std::cout << account.owner() << " balance: " << account.balance() << "\n";
    return 0;
}
```

    1. Standard library header





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_03
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_03_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
