---
title: "03 — Code Example · Day 24"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-code-braces: 03 — Code Example: Mini Project 1 Bank System

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Design Before Code


```cpp linenums="1"
#include <iostream>  # (1)
#include <string>  # (2)

class Account {
  public:
    Account(std::string id, double balance) : id_(std::move(id)), balance_(balance) {}  # (3)
    bool transfer_to(Account& other, double amount) {
        if (amount <= 0 || amount > balance_) {
            return false;
        }
        balance_ -= amount;
        other.balance_ += amount;
        return true;
    }
    double balance() const { return balance_; }
    const std::string& id() const { return id_; }

  private:
    std::string id_;
    double balance_{};
};

int main() {
    Account a{"A001", 500.0};
    Account b{"B002", 200.0};
    a.transfer_to(b, 150.0);
    std::cout << "Day 24 - Mini Project Bank System\n";
    std::cout << a.id() << ':' << a.balance() << " | " << b.id() << ':' << b.balance() << "\n";
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
./build/day_24
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_24_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
