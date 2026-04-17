---
title: "03 — Code Example · Day 20"
---

<div class="brain-cluster-banner" data-cluster="modern-cpp">
  🟠 &nbsp; **Modern C++** &nbsp;·&nbsp; Occipital Lobe
</div>



# :material-code-braces: 03 — Code Example: Static Polymorphism CRTP

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    - **No inlining** — compilers generally cannot inline a virtual call through a pointer-to-base because the target is unknown at compile time.


```cpp linenums="1"
#include <iostream>  # (1)

template <typename Derived>
class AnimalBase {
  public:
    void speak() const { static_cast<const Derived*>(this)->speak_impl(); }
};

class Dog : public AnimalBase<Dog> {
  public:
    void speak_impl() const { std::cout << "woof\n"; }
};

int main() {
    Dog dog;
    std::cout << "Day 20 - Static Polymorphism and CRTP\n";
    dog.speak();
    return 0;
}
```

    1. Standard library header





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_20
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_20_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
