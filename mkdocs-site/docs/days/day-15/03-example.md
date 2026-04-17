---
title: "03 — Code Example · Day 15"
---

<div class="brain-cluster-banner" data-cluster="memory">
  🔴 &nbsp; **Memory & Error Handling** &nbsp;·&nbsp; Limbic System
</div>



# :material-code-braces: 03 — Code Example: Error Handling Expected C++23

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)

!!! success "🟢 Green = Intuition — Read, predict, then verify"
    **Before scrolling to annotations**, look at each annotated line ①②③
    and predict what it does. Then check. This is *active learning*.

---

## :material-code-braces: main.cpp


!!! note "Context"
    - **Error codes** — explicit, cheap, forces callers to check; but easy to ignore, clutters call sites, and cannot carry rich context.


```cpp linenums="1"
#include <iostream>  # (1)
#include <string>  # (2)
#include <variant>  # (3)

struct ParseError {
    std::string message;
};

using ParseResult = std::variant<int, ParseError>;

ParseResult parse_positive(const std::string& text) {
    try {
        int value = std::stoi(text);
        if (value < 0) {
            return ParseError{"value must be non-negative"};
        }
        return value;
    } catch (...) {
        return ParseError{"invalid integer"};
    }
}

int main() {
    std::cout << "Day 15 - Error Handling\n";
    ParseResult result = parse_positive("42");
    if (auto p = std::get_if<int>(&result)) {  # (4)
        std::cout << "Parsed: " << *p << "\n";
    } else {
        std::cout << "Error: " << std::get<ParseError>(result).message << "\n";
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
./build/day_15
```

## 🧪 Run Tests (Catch2 TDD)

```bash title="Test Runner"
cmake -B build -DENABLE_TESTS=ON
cmake --build build
./build/tests/day_15_test --reporter console --colour-mode ansi
```


---

[← Definition](02-definition.md) · [Pitfalls →](04-pitfalls.md)
