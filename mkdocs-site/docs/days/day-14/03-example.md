---
title: "03 — Code Example · Day 14"
---

<div class="brain-cluster-banner" data-cluster="memory">
  🔴 &nbsp; **Memory & Error Handling** &nbsp;·&nbsp; Limbic System
</div>



# :material-code-braces: 03 — Code Example: Rule of 5 Copy Move

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    Every class that manages a resource — raw memory, a file handle, a network socket, a mutex — must answer six questions about object lifetime:


```cpp linenums="1"
#include <cstring>  # (1)
#include <iostream>  # (2)
#include <utility>  # (3)

class Text {
  public:
    Text() : data_(new char[1]{'\0'}) {}

    explicit Text(const char* s) {
        std::size_t n = std::strlen(s);
        data_ = new char[n + 1];
        std::memcpy(data_, s, n + 1);
    }

    ~Text() { delete[] data_; }

    Text(const Text& other) : Text(other.data_) {}

    Text& operator=(const Text& other) {
        if (this != &other) {
            Text tmp(other);
            swap(tmp);
        }
        return *this;
    }

    Text(Text&& other) noexcept : data_(other.data_) { other.data_ = nullptr; }  # (4)

    Text& operator=(Text&& other) noexcept {  # (5)
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            other.data_ = nullptr;
        }
        return *this;
    }

    void swap(Text& other) noexcept { std::swap(data_, other.data_); }  # (6)
    const char* c_str() const { return data_ ? data_ : ""; }

  private:
    char* data_{};
};

int main() {
    Text a{"rule-of-five"};
    Text b = a;
    Text c = std::move(b);  # (7)
    std::cout << "Day 14 - Rule of 5\n";
    std::cout << c.c_str() << "\n";
    return 0;
}
```

    1. Standard library header
    2. Standard library header
    3. Standard library header
    4. Guarantees no exception is thrown
    5. Guarantees no exception is thrown
    6. Guarantees no exception is thrown
    7. Transfers ownership (move semantics)





## :material-code-braces: Build & Run

```bash title="Terminal"
# From repo root
cmake -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/day_14
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_14_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
